from fastapi import APIRouter

from app.api.routes import account, auth, changes, export, health_checks, hosted_zones, records

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(hosted_zones.router)
api_router.include_router(records.router)
api_router.include_router(changes.router)
api_router.include_router(export.router)
api_router.include_router(account.router)
api_router.include_router(health_checks.router)
