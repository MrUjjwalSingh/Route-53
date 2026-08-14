from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.services.id_generator import new_caller_reference, new_zone_id


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class HostedZone(Base):
    __tablename__ = "hosted_zones"
    __table_args__ = (UniqueConstraint("owner_user_id", "name", "type", name="uq_zone_owner_name_type"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_zone_id)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)  # "Public" | "Private"
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    caller_reference: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, default=new_caller_reference
    )
    created_by: Mapped[str] = mapped_column(String, nullable=False, default="-")
    owner_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="hosted_zones")
    records: Mapped[list["DnsRecord"]] = relationship(
        back_populates="zone", cascade="all, delete-orphan"
    )
    changes: Mapped[list["Change"]] = relationship(
        back_populates="zone", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(back_populates="zone", cascade="all, delete-orphan")
