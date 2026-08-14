import secrets
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HealthCheck(Base):
    __tablename__ = "health_checks"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"hc-{secrets.token_hex(10)}",
    )
    owner_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # What to monitor: "endpoint", "calculated", "cloudwatch"
    monitor_type: Mapped[str] = mapped_column(String(32), default="endpoint")

    # Endpoint configuration
    protocol: Mapped[str] = mapped_column(String(10), default="HTTPS")  # HTTP, HTTPS, TCP
    domain_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    port: Mapped[int] = mapped_column(Integer, default=443)
    resource_path: Mapped[str | None] = mapped_column(String(255), nullable=True, default="/")
    search_string: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Timing
    request_interval: Mapped[int] = mapped_column(Integer, default=30)  # 10 or 30 seconds
    failure_threshold: Mapped[int] = mapped_column(Integer, default=3)  # 1–10

    # Feature flags
    measure_latency: Mapped[bool] = mapped_column(Boolean, default=False)
    inverted: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_sni: Mapped[bool] = mapped_column(Boolean, default=True)

    # Simulated status (HEALTHY, UNHEALTHY, UNKNOWN)
    status: Mapped[str] = mapped_column(String(16), default="UNKNOWN")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
