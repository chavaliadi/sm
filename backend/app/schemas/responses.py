from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel

T = TypeVar("T")


class MetaSchema(BaseModel):
    pass


class SuccessResponse(BaseModel, Generic[T]):
    data: T
    meta: MetaSchema = MetaSchema()


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
