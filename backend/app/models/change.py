from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.services.id_generator import new_change_id
from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Change(Base):
    __tablename__ = "changes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_change_id)
    zone_id: Mapped[str] = mapped_column(
        String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String, nullable=False, default="PENDING")
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    zone: Mapped["HostedZone"] = relationship(back_populates="changes")
