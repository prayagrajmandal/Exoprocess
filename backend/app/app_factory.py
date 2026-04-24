from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg import Error as PsycopgError
from psycopg import connect

from app.config import DATABASE_CONNECT_TIMEOUT, DATABASE_URL
from app.routers.api import router as api_router
from app.routers.clogo import router as clogo_router
from app.services.tms import ensure_bootstrap_data, ensure_custom_tables

logger = logging.getLogger(__name__)


def get_database_status() -> tuple[bool, str | None]:
    try:
        with connect(DATABASE_URL, connect_timeout=DATABASE_CONNECT_TIMEOUT) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        return True, None
    except Exception as exc:  # pragma: no cover - health fallback guard
        logger.warning("Database health check failed: %s", exc)
        return False, str(exc)


def create_app() -> FastAPI:
    app = FastAPI(title="TMS FastAPI Backend")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def warm_backend() -> None:
        # Best-effort warmup: don't keep the API down if the database is temporarily unavailable.
        try:
            ensure_bootstrap_data()
            ensure_custom_tables()
        except Exception as exc:  # pragma: no cover - startup fallback guard
            logger.warning("Backend warmup skipped because startup dependencies are unavailable: %s", exc)

    @app.exception_handler(PsycopgError)
    async def handle_database_error(_: Request, exc: PsycopgError):
        logger.exception("Database request failed", exc_info=exc)
        return JSONResponse(
            status_code=503,
            content={
                "error": "Database is unavailable. Check DATABASE_URL, network access, and database server status.",
                "detail": str(exc),
            },
        )

    @app.get("/")
    def root():
        return {
            "service": "tms-backend",
            "ok": True,
            "docs": "/docs",
            "health": "/health",
            "apiHealth": "/api/health",
        }

    @app.get("/health")
    def health():
        db_ok, db_error = get_database_status()
        return {
            "ok": db_ok,
            "service": "tms-backend",
            "database": {
                "ok": db_ok,
                "error": db_error,
            },
        }

    @app.get("/api")
    def api_root():
        return {
            "service": "tms-backend",
            "ok": True,
            "message": "Use /api/health or any other /api/* endpoint.",
        }

    app.include_router(api_router)
    app.include_router(clogo_router)
    return app
