from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import get_current_user, get_db
from app.models import User
from app.schemas.common import Paginated
from app.schemas.health_check import HealthCheckCreate, HealthCheckResponse, HealthCheckUpdate
from app.services import health_check_service
from app.services.health_check_service import NoSuchHealthCheckError

router = APIRouter(prefix="/health-checks", tags=["health-checks"])


@router.get("", response_model=Paginated[HealthCheckResponse])
def list_health_checks(
    page: int = 1,
    page_size: int = 50,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Paginated[HealthCheckResponse]:
    offset = (page - 1) * page_size
    items, total = health_check_service.list_health_checks(
        db, owner_user_id=user.id, offset=offset, page_size=page_size
    )
    return Paginated(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.post("", response_model=HealthCheckResponse, status_code=201)
def create_health_check(
    payload: HealthCheckCreate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HealthCheckResponse:
    hc = health_check_service.create_health_check(db, owner_user_id=user.id, data=payload)
    return hc


@router.get("/{health_check_id}", response_model=HealthCheckResponse)
def get_health_check(
    health_check_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HealthCheckResponse:
    try:
        return health_check_service.get_health_check(db, user.id, health_check_id)
    except NoSuchHealthCheckError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{health_check_id}", response_model=HealthCheckResponse)
def update_health_check(
    health_check_id: str,
    payload: HealthCheckUpdate,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HealthCheckResponse:
    try:
        return health_check_service.update_health_check(
            db, user.id, health_check_id, payload
        )
    except NoSuchHealthCheckError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{health_check_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_check(
    health_check_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    try:
        health_check_service.delete_health_check(db, user.id, health_check_id)
    except NoSuchHealthCheckError as e:
        raise HTTPException(status_code=404, detail=str(e))
