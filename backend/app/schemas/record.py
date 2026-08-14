from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ChangeInfo


class RecordCreate(BaseModel):
    name: str = Field(min_length=1)
    type: str
    ttl: int | None = None
    values: list[str] = Field(default_factory=list)
    routing_policy: str = "Simple"
    set_identifier: str | None = None
    weight: int | None = None
    alias: bool = False
    alias_target: str | None = None
    evaluate_target_health: bool = False
    health_check_id: str | None = None


class RecordUpdate(BaseModel):
    """Route 53 does not allow changing a record's name or type in place —
    the client must delete and recreate. Only the value-shaped fields here
    are mutable."""

    ttl: int | None = None
    values: list[str] | None = None
    routing_policy: str | None = None
    set_identifier: str | None = None
    weight: int | None = None
    alias: bool | None = None
    alias_target: str | None = None
    evaluate_target_health: bool | None = None
    health_check_id: str | None = None


class RecordResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    ttl: int | None
    values: list[str]
    routing_policy: str
    set_identifier: str | None
    weight: int | None
    alias: bool
    alias_target: str | None
    evaluate_target_health: bool
    health_check_id: str | None
    is_system: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordWithChange(BaseModel):
    record: RecordResponse
    change: ChangeInfo
