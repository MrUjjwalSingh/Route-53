from sqlalchemy.orm import Session as OrmSession

from app.errors import NoSuchHostedZoneError
from app.models import HealthCheck
from app.schemas.health_check import HealthCheckCreate, HealthCheckUpdate


class NoSuchHealthCheckError(Exception):
    pass


def create_health_check(
    db: OrmSession,
    owner_user_id: int,
    data: HealthCheckCreate,
) -> HealthCheck:
    hc = HealthCheck(
        owner_user_id=owner_user_id,
        name=data.name,
        monitor_type=data.monitor_type,
        protocol=data.protocol,
        domain_name=data.domain_name,
        ip_address=data.ip_address,
        port=data.port,
        resource_path=data.resource_path,
        search_string=data.search_string,
        request_interval=data.request_interval,
        failure_threshold=data.failure_threshold,
        measure_latency=data.measure_latency,
        inverted=data.inverted,
        enable_sni=data.enable_sni,
        status="HEALTHY",  # Simulated: starts as HEALTHY
    )
    db.add(hc)
    db.commit()
    db.refresh(hc)
    return hc


def get_health_check(
    db: OrmSession, owner_user_id: int, health_check_id: str
) -> HealthCheck:
    hc = (
        db.query(HealthCheck)
        .filter_by(id=health_check_id, owner_user_id=owner_user_id)
        .one_or_none()
    )
    if hc is None:
        raise NoSuchHealthCheckError(
            f"No health check found with id '{health_check_id}'."
        )
    return hc


def list_health_checks(
    db: OrmSession,
    owner_user_id: int,
    offset: int = 0,
    page_size: int = 50,
) -> tuple[list[HealthCheck], int]:
    query = db.query(HealthCheck).filter_by(owner_user_id=owner_user_id)
    total = query.count()
    items = query.order_by(HealthCheck.created_at.desc()).offset(offset).limit(page_size).all()
    return items, total


def update_health_check(
    db: OrmSession,
    owner_user_id: int,
    health_check_id: str,
    data: HealthCheckUpdate,
) -> HealthCheck:
    hc = get_health_check(db, owner_user_id, health_check_id)

    if data.name is not None:
        hc.name = data.name
    if data.protocol is not None:
        hc.protocol = data.protocol
    if data.domain_name is not None:
        hc.domain_name = data.domain_name
    if data.ip_address is not None:
        hc.ip_address = data.ip_address
    if data.port is not None:
        hc.port = data.port
    if data.resource_path is not None:
        hc.resource_path = data.resource_path
    if data.search_string is not None:
        hc.search_string = data.search_string
    if data.request_interval is not None:
        hc.request_interval = data.request_interval
    if data.failure_threshold is not None:
        hc.failure_threshold = data.failure_threshold
    if data.measure_latency is not None:
        hc.measure_latency = data.measure_latency
    if data.inverted is not None:
        hc.inverted = data.inverted
    if data.enable_sni is not None:
        hc.enable_sni = data.enable_sni

    db.commit()
    db.refresh(hc)
    return hc


def delete_health_check(
    db: OrmSession, owner_user_id: int, health_check_id: str
) -> None:
    hc = get_health_check(db, owner_user_id, health_check_id)
    db.delete(hc)
    db.commit()
