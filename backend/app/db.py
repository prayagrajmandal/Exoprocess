from __future__ import annotations

from contextlib import contextmanager
import threading
from typing import Any

from psycopg import connect
from psycopg.rows import dict_row

from app.config import DATABASE_CONNECT_TIMEOUT, DATABASE_URL

_thread_local = threading.local()


def _get_connection():
    connection = getattr(_thread_local, "connection", None)
    if connection is None or connection.closed:
        connection = connect(DATABASE_URL, row_factory=dict_row, connect_timeout=DATABASE_CONNECT_TIMEOUT)
        _thread_local.connection = connection
    return connection


@contextmanager
def db_cursor():
    connection = _get_connection()
    try:
        with connection.cursor() as cursor:
            yield cursor
        connection.commit()
    except Exception:
        connection.rollback()
        if not connection.closed:
            connection.close()
        _thread_local.connection = None
        raise


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchone()


def execute(sql: str, params: tuple[Any, ...] = ()) -> None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
