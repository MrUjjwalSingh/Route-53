from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session as OrmSession

from app.api.deps import get_current_user, get_db
from app.errors import InvalidInputError
from app.models import DnsRecord, User
from app.services import bind, zone_service

router = APIRouter(prefix="/hosted-zones/{zone_id}/export", tags=["export"])


@router.get("")
def export_hosted_zone(
    zone_id: str,
    format: str = Query(default="json", pattern="^(json|bind)$"),
    db: OrmSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    zone = zone_service.get_zone(db, user.id, zone_id)
    records = db.query(DnsRecord).filter(DnsRecord.zone_id == zone.id).order_by(DnsRecord.name).all()

    if format == "json":
        payload = bind.export_zone_json(zone, records)
        return JSONResponse(
            content=payload,
            headers={"Content-Disposition": f'attachment; filename="{zone.name}json.json"'},
        )
    if format == "bind":
        text = bind.export_zone_bind(zone, records)
        return PlainTextResponse(
            content=text,
            media_type="text/dns",
            headers={"Content-Disposition": f'attachment; filename="{zone.name}txt"'},
        )
    raise InvalidInputError("format must be 'json' or 'bind'.", field="format")
