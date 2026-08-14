from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import SESSION_COOKIE_NAME, get_current_user, get_db
from app.config import settings
from app.models import User
from app.schemas.auth import LoginRequest, UserResponse
from app.services import auth_service

router = APIRouter(tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        path="/",
        max_age=7 * 24 * 60 * 60,
    )


@router.post("/auth/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: OrmSession = Depends(get_db)) -> User:
    user, session = auth_service.login(db, payload.email, payload.password)
    _set_session_cookie(response, session.token)
    return user


@router.post("/auth/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        auth_service.logout(db, token)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")


@router.get("/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user
