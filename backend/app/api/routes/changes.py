from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import get_current_user, get_db
from app.models import User
from app.schemas.common import ChangeInfo
from app.services import change_service, zone_service

router = APIRouter(prefix="/changes", tags=["changes"])


@router.get("/{change_id}", response_model=ChangeInfo)
def get_change(
    change_id: str,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChangeInfo:
    change = change_service.get_change(db, change_id)
    # Scope by ownership so change ids from other accounts can't be probed.
    zone_service.get_zone(db, user.id, change.zone_id)
    return change_service.to_info(change)
