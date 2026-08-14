from sqlalchemy.orm import Session as OrmSession

from app.errors import (
    InvalidChangeBatchError,
    InvalidInputError,
    NoSuchRecordError,
    RRSetAlreadyExistsError,
)
from app.models import Change, DnsRecord, HostedZone
from app.schemas.record import RecordCreate, RecordUpdate
from app.services.change_service import create_change
from app.validation.record_rules import is_valid_hostname, validate_record_values, validate_ttl


def normalize_record_name(name: str) -> str:
    name = name.strip().lower()
    return name if name.endswith(".") else name + "."


def _assert_name_in_zone(zone: HostedZone, name: str) -> None:
    if name != zone.name and not name.endswith("." + zone.name):
        raise InvalidInputError(
            f"'{name}' is not within the hosted zone '{zone.name}'.", field="name"
        )


def _assert_cname_rules(
    db: OrmSession, zone: HostedZone, name: str, record_type: str, exclude_id: str | None = None
) -> None:
    if record_type == "CNAME" and name == zone.name:
        raise InvalidChangeBatchError(
            "A CNAME record cannot be created at the zone apex.", field="type"
        )

    query = db.query(DnsRecord).filter(DnsRecord.zone_id == zone.id, DnsRecord.name == name)
    if exclude_id:
        query = query.filter(DnsRecord.id != exclude_id)
    siblings = query.all()

    if record_type == "CNAME" and siblings:
        raise InvalidChangeBatchError(
            f"A CNAME record for '{name}' cannot coexist with other records of the same name.",
            field="type",
        )
    if record_type != "CNAME" and any(s.type == "CNAME" for s in siblings):
        raise InvalidChangeBatchError(
            f"'{name}' already has a CNAME record, which cannot coexist with other record types.",
            field="type",
        )


def _assert_routing_policy_rules(routing_policy: str, set_identifier: str | None) -> None:
    if routing_policy != "Simple" and not set_identifier:
        raise InvalidInputError(
            "A record ID (set identifier) is required for non-Simple routing policies.",
            field="set_identifier",
        )


def _assert_no_duplicate(
    db: OrmSession,
    zone: HostedZone,
    name: str,
    record_type: str,
    set_identifier: str | None,
    exclude_id: str | None = None,
) -> None:
    query = db.query(DnsRecord).filter(
        DnsRecord.zone_id == zone.id,
        DnsRecord.name == name,
        DnsRecord.type == record_type,
        DnsRecord.set_identifier == set_identifier,
    )
    if exclude_id:
        query = query.filter(DnsRecord.id != exclude_id)
    if query.first() is not None:
        raise RRSetAlreadyExistsError(
            f"A '{record_type}' record named '{name}' already exists in this hosted zone."
        )


def _resolve_alias_values(alias: bool, alias_target: str | None, values: list[str]) -> tuple[list[str], list[str]]:
    """Alias records route to a target resource, not a literal value list — mirror
    the target into `values` so the records table can display it without a
    special case. Returns (resolved_values, errors)."""
    if not alias:
        return values, []
    if not alias_target or not is_valid_hostname(alias_target):
        return [], ["A valid alias target is required for alias records."]
    return [alias_target], []


def create_record(
    db: OrmSession, zone: HostedZone, data: RecordCreate
) -> tuple[DnsRecord, Change]:
    name = normalize_record_name(data.name)
    _assert_name_in_zone(zone, name)

    resolved_values, alias_errors = _resolve_alias_values(data.alias, data.alias_target, data.values)
    value_errors = alias_errors if data.alias else validate_record_values(data.type, data.values)
    ttl_errors = validate_ttl(data.ttl, data.alias)
    if value_errors or ttl_errors:
        raise InvalidChangeBatchError(
            "One or more record values failed validation.",
            field="values",
            errors=value_errors + ttl_errors,
        )

    _assert_cname_rules(db, zone, name, data.type)
    _assert_routing_policy_rules(data.routing_policy, data.set_identifier)
    _assert_no_duplicate(db, zone, name, data.type, data.set_identifier)

    record = DnsRecord(
        zone_id=zone.id,
        name=name,
        type=data.type,
        ttl=data.ttl,
        values=resolved_values if data.alias else data.values,
        routing_policy=data.routing_policy,
        set_identifier=data.set_identifier,
        weight=data.weight,
        alias=data.alias,
        alias_target=data.alias_target,
        evaluate_target_health=data.evaluate_target_health,
        health_check_id=data.health_check_id,
        is_system=False,
    )
    db.add(record)
    db.flush()

    change = create_change(db, zone.id, comment=f"Created {data.type} record {name}")
    db.commit()
    db.refresh(record)
    return record, change


def get_record(db: OrmSession, zone: HostedZone, record_id: str) -> DnsRecord:
    record = (
        db.query(DnsRecord).filter_by(id=record_id, zone_id=zone.id).one_or_none()
    )
    if record is None:
        raise NoSuchRecordError(f"No record found with id '{record_id}'.")
    return record


def list_records(
    db: OrmSession,
    zone: HostedZone,
    search: str | None,
    record_type: str | None,
    sort: str | None,
    order: str,
    offset: int,
    page_size: int,
) -> tuple[list[DnsRecord], int]:
    query = db.query(DnsRecord).filter(DnsRecord.zone_id == zone.id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (DnsRecord.name.ilike(like)) | (DnsRecord.values.ilike(like))
        )
    if record_type:
        query = query.filter(DnsRecord.type == record_type)

    total = query.count()

    sort_columns = {"name": DnsRecord.name, "type": DnsRecord.type, "ttl": DnsRecord.ttl}
    column = sort_columns.get(sort or "name", DnsRecord.name)
    query = query.order_by(column.desc() if order == "desc" else column.asc())

    items = query.offset(offset).limit(page_size).all()
    return items, total


def update_record(
    db: OrmSession, zone: HostedZone, record_id: str, data: RecordUpdate
) -> tuple[DnsRecord, Change]:
    record = get_record(db, zone, record_id)

    new_values = data.values if data.values is not None else record.values
    new_alias = data.alias if data.alias is not None else record.alias
    new_ttl = data.ttl if data.ttl is not None else record.ttl
    new_routing_policy = data.routing_policy or record.routing_policy
    new_set_identifier = (
        data.set_identifier if data.set_identifier is not None else record.set_identifier
    )
    new_alias_target = (
        data.alias_target if data.alias_target is not None else record.alias_target
    )

    resolved_values, alias_errors = _resolve_alias_values(new_alias, new_alias_target, new_values)
    value_errors = alias_errors if new_alias else validate_record_values(record.type, new_values)
    ttl_errors = validate_ttl(new_ttl, new_alias)
    if value_errors or ttl_errors:
        raise InvalidChangeBatchError(
            "One or more record values failed validation.",
            field="values",
            errors=value_errors + ttl_errors,
        )

    _assert_routing_policy_rules(new_routing_policy, new_set_identifier)
    if new_set_identifier != record.set_identifier:
        _assert_no_duplicate(
            db, zone, record.name, record.type, new_set_identifier, exclude_id=record.id
        )

    record.values = resolved_values if new_alias else new_values
    record.ttl = new_ttl
    record.routing_policy = new_routing_policy
    record.set_identifier = new_set_identifier
    record.alias = new_alias
    record.alias_target = new_alias_target
    if data.evaluate_target_health is not None:
        record.evaluate_target_health = data.evaluate_target_health
    if data.health_check_id is not None:
        record.health_check_id = data.health_check_id
    if data.weight is not None:
        record.weight = data.weight

    change = create_change(db, zone.id, comment=f"Updated {record.type} record {record.name}")
    db.commit()
    db.refresh(record)
    return record, change


def delete_record(db: OrmSession, zone: HostedZone, record_id: str) -> Change:
    record = get_record(db, zone, record_id)

    if record.is_system:
        raise InvalidChangeBatchError(
            f"The {record.type} record at the apex of a hosted zone cannot be deleted.",
        )

    change = create_change(db, zone.id, comment=f"Deleted {record.type} record {record.name}")
    db.delete(record)
    db.commit()
    return change
