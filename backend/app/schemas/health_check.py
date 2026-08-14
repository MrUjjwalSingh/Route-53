from datetime import datetime

from pydantic import BaseModel, Field


class HealthCheckCreate(BaseModel):
    name: str | None = None
    monitor_type: str = Field(default="endpoint", pattern="^(endpoint|calculated|cloudwatch)$")
    protocol: str = Field(default="HTTPS", pattern="^(HTTP|HTTPS|TCP)$")
    domain_name: str | None = None
    ip_address: str | None = None
    port: int = Field(default=443, ge=1, le=65535)
    resource_path: str | None = Field(default="/", max_length=255)
    search_string: str | None = Field(default=None, max_length=255)
    request_interval: int = Field(default=30, pattern=None)
    failure_threshold: int = Field(default=3, ge=1, le=10)
    measure_latency: bool = False
    inverted: bool = False
    enable_sni: bool = True


class HealthCheckUpdate(BaseModel):
    name: str | None = None
    protocol: str | None = Field(default=None, pattern="^(HTTP|HTTPS|TCP)$")
    domain_name: str | None = None
    ip_address: str | None = None
    port: int | None = Field(default=None, ge=1, le=65535)
    resource_path: str | None = None
    search_string: str | None = None
    request_interval: int | None = None
    failure_threshold: int | None = Field(default=None, ge=1, le=10)
    measure_latency: bool | None = None
    inverted: bool | None = None
    enable_sni: bool | None = None


class HealthCheckResponse(BaseModel):
    id: str
    name: str | None
    monitor_type: str
    protocol: str
    domain_name: str | None
    ip_address: str | None
    port: int
    resource_path: str | None
    search_string: str | None
    request_interval: int
    failure_threshold: int
    measure_latency: bool
    inverted: bool
    enable_sni: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
