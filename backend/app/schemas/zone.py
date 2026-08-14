from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ChangeInfo
from app.schemas.tag import TagItem


class ZoneCreate(BaseModel):
    name: str = Field(min_length=1)
    type: str = Field(pattern="^(Public|Private)$")
    comment: str | None = None
    tags: list[TagItem] = Field(default_factory=list)


class ZoneUpdate(BaseModel):
    name: str | None = None
    comment: str | None = None


class ZoneResponse(BaseModel):
    id: str
    name: str
    type: str
    comment: str | None
    created_by: str
    record_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ZoneDetail(ZoneResponse):
    caller_reference: str
    updated_at: datetime
    name_servers: list[str]


class ZoneWithChange(BaseModel):
    zone: ZoneDetail
    change: ChangeInfo
