"""
FastAPI entrypoint.

This is scaffold only — no business logic here yet, per the plan. Module
routers get included under app/api/ as each one is built (RBAC first).
"""
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.dpr import router as dpr_router
from app.api.tasks import router as tasks_router
from app.api.stakeholders import (
    router as stakeholders_router,
    meetings_router,
)
from app.api.notifications import router as notifications_router
from app.api.tender import router as tender_router
from app.api.clearance import router as clearance_router

app = FastAPI(
    title="Sagarmala 2.0 Portal API",
    description="MVP backend — Phase 1 (Appraisal & Sanction) approval workflow.",
    version="0.1.0",
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"

    if isinstance(exc.detail, dict):
        error_data = {
            "code": exc.detail.get("code", code),
            "message": exc.detail.get("message", "An error occurred"),
            "field": exc.detail.get("field"),
        }
    else:
        error_data = {
            "code": code,
            "message": exc.detail,
            "field": None,
        }

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_data}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else None

    message = "Validation error"
    field = None
    if first_error:
        loc = first_error.get("loc", [])
        field = ".".join(str(l) for l in loc[1:]) if len(loc) > 1 else None
        message = first_error.get("msg", "Invalid value")

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "field": field
            }
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(dpr_router)
app.include_router(tasks_router)
app.include_router(stakeholders_router)
app.include_router(meetings_router)
app.include_router(notifications_router)
app.include_router(tender_router)
app.include_router(clearance_router)


@app.get("/")
def read_root():
    return {"message": "Sagarmala 2.0 Portal API — hello world"}


@app.get("/health")
def health_check():
    return {"status": "ok"}