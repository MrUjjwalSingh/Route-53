from datetime import datetime, timezone

from fastapi import Depends, Query, Request
from sqlalchemy.orm import Session as OrmSession

from app.database import get_db as get_db
from app.errors import NotAuthorizedError
from app.models import Session as SessionModel
from app.models import User

SESSION_COOKIE_NAME = "session"


class PaginationParams:
    def __init__(
        self,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=10, ge=1, le=100),
        search: str | None = Query(default=None),
        sort: str | None = Query(default=None),
        order: str = Query(default="asc", pattern="^(asc|desc)$"),
    ) -> None:
        self.page = page
        self.page_size = page_size
        self.search = search
        self.sort = sort
        self.order = order

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def get_current_user(request: Request, db: OrmSession = Depends(get_db)) -> User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise NotAuthorizedError("You must be signed in to perform this action.")

    session = db.get(SessionModel, token)
    if session is None:
        raise NotAuthorizedError("Your session has expired. Please sign in again.")

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise NotAuthorizedError("Your session has expired. Please sign in again.")

    user = db.get(User, session.user_id)
    if user is None:
        raise NotAuthorizedError("Your session has expired. Please sign in again.")
    return user
