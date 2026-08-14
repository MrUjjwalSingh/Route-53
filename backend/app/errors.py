from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    status_code = 400
    code = "InvalidInput"

    def __init__(self, message: str, field: str | None = None, errors: list[str] | None = None) -> None:
        self.message = message
        self.field = field
        self.errors = errors
        super().__init__(message)

    def to_envelope(self) -> dict:
        error: dict = {"code": self.code, "message": self.message}
        if self.field is not None:
            error["field"] = self.field
        if self.errors is not None:
            error["errors"] = self.errors
        return {"error": error}


class InvalidInputError(ApiError):
    status_code = 400
    code = "InvalidInput"


class InvalidChangeBatchError(ApiError):
    status_code = 400
    code = "InvalidChangeBatch"


class HostedZoneAlreadyExistsError(ApiError):
    status_code = 400
    code = "HostedZoneAlreadyExists"


class HostedZoneNotEmptyError(ApiError):
    status_code = 400
    code = "HostedZoneNotEmpty"


class NoSuchHostedZoneError(ApiError):
    status_code = 404
    code = "NoSuchHostedZone"


class NoSuchRecordError(ApiError):
    status_code = 404
    code = "NoSuchRecord"


class RRSetAlreadyExistsError(ApiError):
    status_code = 400
    code = "RRSetAlreadyExists"


class NotAuthorizedError(ApiError):
    status_code = 401
    code = "NotAuthorized"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_envelope())
