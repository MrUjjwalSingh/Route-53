from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session as OrmSession

from app.errors import ApiError
from app.models import Change
from app.schemas.common import ChangeInfo

PROPAGATION_DELAY = timedelta(seconds=5)


class NoSuchChangeError(ApiError):
    status_code = 404
    code = "NoSuchChange"


def create_change(db: OrmSession, zone_id: str, comment: str | None = None) -> Change:
    change = Change(zone_id=zone_id, status="PENDING", comment=comment)
    db.add(change)
    db.flush()
    return change


def resolved_status(change: Change) -> str:
    """Computed on read: PENDING for the first few seconds, then INSYNC.

    No background worker is needed — the transition is derived from elapsed
    wall-clock time since submission, mirroring Route 53's propagation delay.
    """
    submitted_at = change.submitted_at
    if submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - submitted_at >= PROPAGATION_DELAY:
        return "INSYNC"
    return "PENDING"


def to_info(change: Change) -> ChangeInfo:
    return ChangeInfo(id=change.id, status=resolved_status(change), submitted_at=change.submitted_at)


def get_change(db: OrmSession, change_id: str) -> Change:
    change = db.get(Change, change_id)
    if change is None:
        raise NoSuchChangeError(f"No change found with id '{change_id}'.")
    return change
