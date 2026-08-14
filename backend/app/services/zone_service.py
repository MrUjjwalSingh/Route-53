from sqlalchemy import func
from sqlalchemy.orm import Session as OrmSession

from app.errors import HostedZoneAlreadyExistsError, HostedZoneNotEmptyError, NoSuchHostedZoneError
from app.models import Change, DnsRecord, HostedZone, Tag
from app.services.change_service import create_change
from app.services.id_generator import new_nameservers


def normalize_zone_name(name: str) -> str:
    name = name.strip().lower()
    return name if name.endswith(".") else name + "."


def _create_system_records(db: OrmSession, zone: HostedZone) -> None:
    nameservers = new_nameservers()
    db.add(
        DnsRecord(
            zone_id=zone.id,
            name=zone.name,
            type="NS",
            ttl=172800,
            values=nameservers,
            is_system=True,
        )
    )
    db.add(
        DnsRecord(
            zone_id=zone.id,
            name=zone.name,
            type="SOA",
            ttl=900,
            values=[
                f"{nameservers[0]} awsdns-hostmaster.amazon.com. "
                "1 7200 900 1209600 86400"
            ],
            is_system=True,
        )
    )


def create_zone(
    db: OrmSession,
    owner_user_id: int,
    name: str,
    zone_type: str,
    comment: str | None,
    tags: list[tuple[str, str]] | None = None,
) -> tuple[HostedZone, Change]:
    normalized_name = normalize_zone_name(name)

    existing = (
        db.query(HostedZone)
        .filter_by(owner_user_id=owner_user_id, name=normalized_name, type=zone_type)
        .one_or_none()
    )
    if existing is not None:
        raise HostedZoneAlreadyExistsError(
            f"A hosted zone named '{normalized_name}' of type '{zone_type}' already exists.",
            field="name",
        )

    zone = HostedZone(
        name=normalized_name,
        type=zone_type,
        comment=comment,
        owner_user_id=owner_user_id,
    )
    db.add(zone)
    db.flush()

    _create_system_records(db, zone)

    for key, value in tags or []:
        db.add(Tag(resource_id=zone.id, key=key, value=value))

    change = create_change(db, zone.id, comment="Created hosted zone")
    db.commit()
    db.refresh(zone)
    return zone, change


def get_zone(db: OrmSession, owner_user_id: int, zone_id: str) -> HostedZone:
    zone = (
        db.query(HostedZone)
        .filter_by(id=zone_id, owner_user_id=owner_user_id)
        .one_or_none()
    )
    if zone is None:
        raise NoSuchHostedZoneError(f"No hosted zone found with id '{zone_id}'.")
    return zone


def record_count(db: OrmSession, zone_id: str) -> int:
    return db.query(func.count(DnsRecord.id)).filter(DnsRecord.zone_id == zone_id).scalar() or 0


def name_servers(db: OrmSession, zone_id: str) -> list[str]:
    ns_record = (
        db.query(DnsRecord).filter_by(zone_id=zone_id, type="NS", is_system=True).one_or_none()
    )
    return ns_record.values if ns_record else []


def list_zones(
    db: OrmSession,
    owner_user_id: int,
    search: str | None,
    zone_type: str | None,
    sort: str | None,
    order: str,
    offset: int,
    page_size: int,
) -> tuple[list[HostedZone], int]:
    query = db.query(HostedZone).filter(HostedZone.owner_user_id == owner_user_id)

    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))
    if zone_type:
        query = query.filter(HostedZone.type == zone_type)

    total = query.count()

    sort_columns = {
        "name": HostedZone.name,
        "type": HostedZone.type,
        "created_at": HostedZone.created_at,
    }
    column = sort_columns.get(sort or "name", HostedZone.name)
    query = query.order_by(column.desc() if order == "desc" else column.asc())

    items = query.offset(offset).limit(page_size).all()
    return items, total


def update_zone(
    db: OrmSession,
    owner_user_id: int,
    zone_id: str,
    name: str | None,
    comment: str | None,
) -> HostedZone:
    zone = get_zone(db, owner_user_id, zone_id)

    if comment is not None:
        zone.comment = comment

    if name is not None:
        new_name = normalize_zone_name(name)
        if new_name != zone.name:
            old_name = zone.name
            zone.name = new_name
            records = db.query(DnsRecord).filter(DnsRecord.zone_id == zone.id).all()
            for record in records:
                if record.name == old_name:
                    record.name = new_name
                elif record.name.endswith("." + old_name):
                    prefix = record.name[: -len(old_name)]
                    record.name = prefix + new_name

    create_change(db, zone.id, comment="Updated hosted zone")
    db.commit()
    db.refresh(zone)
    return zone


def get_tags(db: OrmSession, zone: HostedZone) -> list[Tag]:
    return db.query(Tag).filter(Tag.resource_id == zone.id).order_by(Tag.key).all()


def set_tags(db: OrmSession, zone: HostedZone, tags: list[tuple[str, str]]) -> list[Tag]:
    """Replace-all semantics, matching the PUT contract."""
    db.query(Tag).filter(Tag.resource_id == zone.id).delete()
    for key, value in tags:
        db.add(Tag(resource_id=zone.id, key=key, value=value))
    db.commit()
    return get_tags(db, zone)


def delete_zone(db: OrmSession, owner_user_id: int, zone_id: str) -> None:
    zone = get_zone(db, owner_user_id, zone_id)

    non_system_count = (
        db.query(func.count(DnsRecord.id))
        .filter(DnsRecord.zone_id == zone.id, DnsRecord.is_system.is_(False))
        .scalar()
        or 0
    )
    if non_system_count > 0:
        raise HostedZoneNotEmptyError(
            "The specified hosted zone contains non-required resource record sets "
            "and so cannot be deleted."
        )

    db.delete(zone)
    db.commit()
