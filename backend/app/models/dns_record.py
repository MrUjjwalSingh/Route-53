import json
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, TypeDecorator, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.services.id_generator import new_record_id


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class JSONEncodedList(TypeDecorator):
    """Stores a Python list[str] as a JSON-encoded string column.

    A Route 53 record SET holds multiple values under one name+type (the apex
    NS record holds four nameservers). The console renders them newline-
    separated in one cell, so they are modelled as one row with a value list,
    not one row per value.
    """

    impl = String
    cache_ok = True

    def process_bind_param(self, value: list[str] | None, dialect) -> str:
        return json.dumps(value or [])

    def process_result_value(self, value: str | None, dialect) -> list[str]:
        return json.loads(value) if value else []


class DnsRecord(Base):
    __tablename__ = "dns_records"
    __table_args__ = (
        UniqueConstraint(
            "zone_id", "name", "type", "set_identifier", name="uq_record_zone_name_type_set"
        ),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_record_id)
    zone_id: Mapped[str] = mapped_column(
        String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ttl: Mapped[int | None] = mapped_column(Integer, nullable=True)
    values: Mapped[list[str]] = mapped_column(JSONEncodedList, nullable=False, default=list)
    routing_policy: Mapped[str] = mapped_column(String, nullable=False, default="Simple")
    set_identifier: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alias: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    alias_target: Mapped[str | None] = mapped_column(String, nullable=True)
    evaluate_target_health: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    health_check_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow, nullable=False
    )

    zone: Mapped["HostedZone"] = relationship(back_populates="records")
