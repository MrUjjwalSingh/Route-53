from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/account", tags=["account"])


class RegionInfo(BaseModel):
    code: str
    name: str


class AccountResponse(BaseModel):
    account_id: str
    email: str
    default_region: str
    regions: list[RegionInfo]


@router.get("", response_model=AccountResponse)
def get_account(user: User = Depends(get_current_user)) -> AccountResponse:
    formatted_id = f"{user.aws_account_id[:4]}-{user.aws_account_id[4:8]}-{user.aws_account_id[8:]}"
    return AccountResponse(
        account_id=formatted_id,
        email=user.email,
        default_region="us-east-1",
        regions=[
            RegionInfo(code="us-east-1", name="US East (N. Virginia)"),
            RegionInfo(code="us-west-2", name="US West (Oregon)"),
            RegionInfo(code="eu-west-1", name="Europe (Ireland)"),
            RegionInfo(code="ap-south-1", name="Asia Pacific (Mumbai)"),
        ],
    )
