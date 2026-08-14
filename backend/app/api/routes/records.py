from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import PaginationParams, get_current_user, get_db
from app.models import User
from app.schemas.common import Paginated
from app.schemas.record import RecordCreate, RecordResponse, RecordUpdate, RecordWithChange
from app.services import change_service, record_service, zone_service

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["records"])


@router.get("", response_model=Paginated[RecordResponse])
def list_records(
    zone_id: str,
    type: str | None = None,
    pagination: PaginationParams = Depends(),
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Paginated[RecordResponse]:
    zone = zone_service.get_zone(db, user.id, zone_id)
    items, total = record_service.list_records(
        db,
        zone,
        search=pagination.search,
        record_type=type,
        sort=pagination.sort,
        order=pagination.order,
        offset=pagination.offset,
        page_size=pagination.page_size,
    )
    return Paginated(
        items=[RecordResponse.model_validate(r) for r in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=max(1, (total + pagination.page_size - 1) // pagination.page_size),
    )


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecordResponse:
    zone = zone_service.get_zone(db, user.id, zone_id)
    record = record_service.get_record(db, zone, record_id)
    return RecordResponse.model_validate(record)


@router.post("", response_model=RecordWithChange, status_code=201)
def create_record(
    zone_id: str,
    payload: RecordCreate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecordWithChange:
    zone = zone_service.get_zone(db, user.id, zone_id)
    record, change = record_service.create_record(db, zone, payload)
    return RecordWithChange(
        record=RecordResponse.model_validate(record), change=change_service.to_info(change)
    )


@router.patch("/{record_id}", response_model=RecordWithChange)
def update_record(
    zone_id: str,
    record_id: str,
    payload: RecordUpdate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecordWithChange:
    zone = zone_service.get_zone(db, user.id, zone_id)
    record, change = record_service.update_record(db, zone, record_id, payload)
    return RecordWithChange(
        record=RecordResponse.model_validate(record), change=change_service.to_info(change)
    )


@router.delete("/{record_id}", response_model=None, status_code=204)
def delete_record(
    zone_id: str,
    record_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    zone = zone_service.get_zone(db, user.id, zone_id)
    record_service.delete_record(db, zone, record_id)
