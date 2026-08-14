from pydantic import BaseModel


class TagItem(BaseModel):
    key: str
    value: str


class TagUpsert(BaseModel):
    tags: list[TagItem]


class TagResponse(BaseModel):
    key: str
    value: str

    model_config = {"from_attributes": True}
