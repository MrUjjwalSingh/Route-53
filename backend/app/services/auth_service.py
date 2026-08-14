import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session as OrmSession

from app.errors import NotAuthorizedError
from app.models import Session as SessionModel
from app.models import User

SESSION_LIFETIME = timedelta(days=7)


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    salt_hex, _, digest_hex = stored_hash.partition("$")
    if not salt_hex or not digest_hex:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = hash_password(password, salt)
    return hmac.compare_digest(expected, stored_hash)


def login(db: OrmSession, email: str, password: str) -> tuple[User, SessionModel]:
    user = db.query(User).filter_by(email=email).one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        raise NotAuthorizedError("The email or password you entered is incorrect.")

    session = SessionModel(
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + SESSION_LIFETIME,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return user, session


def logout(db: OrmSession, token: str) -> None:
    session = db.get(SessionModel, token)
    if session is not None:
        db.delete(session)
        db.commit()
