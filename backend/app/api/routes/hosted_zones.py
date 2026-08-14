from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import PaginationParams, get_current_user, get_db
from app.models import HostedZone, User
from app.schemas.common import Paginated
from app.schemas.tag import TagResponse, TagUpsert
from app.schemas.zone import ZoneCreate, ZoneDetail, ZoneResponse, ZoneUpdate, ZoneWithChange
from app.services import change_service, zone_service

router = APIRouter(prefix="/hosted-zones", tags=["hosted-zones"])


def _to_response(db: OrmSession, zone: HostedZone) -> ZoneResponse:
    return ZoneResponse(
        id=zone.id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        created_by=zone.created_by,
        record_count=zone_service.record_count(db, zone.id),
        created_at=zone.created_at,
    )


def _to_detail(db: OrmSession, zone: HostedZone) -> ZoneDetail:
    base = _to_response(db, zone)
    return ZoneDetail(
        **base.model_dump(),
        caller_reference=zone.caller_reference,
        updated_at=zone.updated_at,
        name_servers=zone_service.name_servers(db, zone.id),
    )


@router.get("", response_model=Paginated[ZoneResponse])
def list_hosted_zones(
    type: str | None = None,
    pagination: PaginationParams = Depends(),
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Paginated[ZoneResponse]:
    items, total = zone_service.list_zones(
        db,
        owner_user_id=user.id,
        search=pagination.search,
        zone_type=type,
        sort=pagination.sort,
        order=pagination.order,
        offset=pagination.offset,
        page_size=pagination.page_size,
    )
    return Paginated(
        items=[_to_response(db, z) for z in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=max(1, (total + pagination.page_size - 1) // pagination.page_size),
    )


@router.post("", response_model=ZoneWithChange, status_code=201)
def create_hosted_zone(
    payload: ZoneCreate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ZoneWithChange:
    zone, change = zone_service.create_zone(
        db,
        owner_user_id=user.id,
        name=payload.name,
        zone_type=payload.type,
        comment=payload.comment,
        tags=[(t.key, t.value) for t in payload.tags],
    )
    return ZoneWithChange(zone=_to_detail(db, zone), change=change_service.to_info(change))


@router.get("/{zone_id}", response_model=ZoneDetail)
def get_hosted_zone(
    zone_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ZoneDetail:
    zone = zone_service.get_zone(db, user.id, zone_id)
    return _to_detail(db, zone)


@router.patch("/{zone_id}", response_model=ZoneDetail)
def update_hosted_zone(
    zone_id: str,
    payload: ZoneUpdate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ZoneDetail:
    zone = zone_service.update_zone(
        db, user.id, zone_id, name=payload.name, comment=payload.comment
    )
    return _to_detail(db, zone)


@router.delete("/{zone_id}", status_code=204)
def delete_hosted_zone(
    zone_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    zone_service.delete_zone(db, user.id, zone_id)


@router.get("/{zone_id}/tags", response_model=list[TagResponse])
def get_hosted_zone_tags(
    zone_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TagResponse]:
    zone = zone_service.get_zone(db, user.id, zone_id)
    return zone_service.get_tags(db, zone)


@router.put("/{zone_id}/tags", response_model=list[TagResponse])
def set_hosted_zone_tags(
    zone_id: str,
    payload: TagUpsert,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TagResponse]:
    zone = zone_service.get_zone(db, user.id, zone_id)
    return zone_service.set_tags(db, zone, [(t.key, t.value) for t in payload.tags])
