from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChangeInfo(BaseModel):
    id: str
    status: str
    submitted_at: datetime


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None
    errors: list[str] | None = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail
