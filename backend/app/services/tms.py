from __future__ import annotations

import hashlib
import os
import secrets
import re
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db import db_cursor as shared_db_cursor


BASE_DIR = Path(__file__).resolve().parents[2]


def load_env_file() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

ACCESS_OPTIONS = [
    {"label": "Dashboard", "route": "/dashboard"},
    {"label": "Orders", "route": "/orders"},
    {"label": "Payment", "route": "/payments"},
    {"label": "Order Landing Page", "route": "/orderlanding"},
    {"label": "Planning", "route": "/planning"},
    {"label": "Vehicle Assignment", "route": "/vehicleassignment"},
    {"label": "Trips", "route": "/trips"},
    {"label": "Tracking", "route": "/tracking"},
    {"label": "Route Map", "route": "/routemap"},
    {"label": "Drivers", "route": "/drivers"},
    {"label": "Fleet", "route": "/fleet"},
    {"label": "Employee Transport", "route": "/employee-transport"},
    {"label": "Vehicle", "route": "/vehicledriver"},
    {"label": "Maintenance", "route": "/maintenance"},
    {"label": "Truck Scale", "route": "/trackscale"},
    {"label": "Gate Pass", "route": "/gatepass"},
    {"label": "Billing", "route": "/billing"},
    {"label": "Reports", "route": "/reports"},
]

SYSTEM_ACCESS_OPTIONS = [
    {"label": "Admin", "route": "/admin"},
    {"label": "Settings", "route": "/settings"},
    {"label": "Super Admin", "route": "/superadmin"},
]

ALL_ACCESS_OPTIONS = [*ACCESS_OPTIONS, *SYSTEM_ACCESS_OPTIONS]

ROLE_LABELS = {
    "super-admin": "Super Admin",
    "admin": "Admin",
    "head-office": "Head Office",
    "gate": "Gate Pass",
    "maintenance": "Maintenance",
    "vehicle-assignment": "Vehicle Assignment",
}

ROLE_PERMISSION_MAP = {
    "super-admin": ["/superadmin", "/settings", *[item["route"] for item in ACCESS_OPTIONS]],
    "admin": ["/admin", "/reports"],
    "head-office": [item["route"] for item in ACCESS_OPTIONS],
    "gate": ["/gatepass", "/vehicleassignment"],
    "maintenance": ["/maintenance"],
    "vehicle-assignment": ["/vehicleassignment"],
}

ROLE_EDIT_PERMISSION_MAP = {
    "super-admin": ["/superadmin", "/settings"],
    "admin": ["/admin"],
    "head-office": [],
    "gate": [],
    "maintenance": ["/maintenance"],
    "vehicle-assignment": [],
}

DEFAULT_ORGANIZATIONS = []

DEFAULT_DEMO_USERS = [
    {
        "userId": "supad",
        "password": "1234",
        "name": "Super Administrator",
        "email": "superadmin@platform.local",
        "department": "Platform",
        "roles": ["super-admin"],
        "accessRoutes": ["/superadmin", "/settings", "/reports"],
        "organization": "Platform",
    },
    {
        "userId": "admin",
        "password": "1234",
        "name": "Administrator",
        "email": "admin@pro.local",
        "department": "Administration",
        "roles": ["admin"],
        "accessRoutes": ["/admin", "/reports"],
        "organization": "Pro",
    },
    {
        "userId": "heado",
        "password": "1234",
        "name": "Head Office",
        "email": "headoffice@pro.local",
        "department": "Operations",
        "roles": ["head-office"],
        "accessRoutes": [item["route"] for item in ACCESS_OPTIONS],
        "organization": "Pro",
    },
    {
        "userId": "gate1",
        "password": "1234",
        "name": "Gate Officer",
        "email": "gate@pro.local",
        "department": "Gate",
        "roles": ["gate"],
        "accessRoutes": ["/gatepass", "/vehicleassignment"],
        "organization": "Pro",
    },
    {
        "userId": "maint",
        "password": "1234",
        "name": "Maintenance Officer",
        "email": "maintenance@pro.local",
        "department": "Maintenance",
        "roles": ["maintenance"],
        "accessRoutes": ["/maintenance"],
        "editRoutes": ["/maintenance"],
        "organization": "Pro",
    },
    {
        "userId": "vehas",
        "password": "1234",
        "name": "Vehicle Assignment Officer",
        "email": "vehicle@pro.local",
        "department": "Transport",
        "roles": ["vehicle-assignment"],
        "accessRoutes": ["/vehicleassignment"],
        "organization": "Pro",
    },
]

bootstrap_lock = threading.Lock()
bootstrap_ready = False
custom_table_lock = threading.Lock()
custom_tables_ready = False
ALL_ACCESS_OPTION_ROUTES = {item["route"] for item in ALL_ACCESS_OPTIONS}


@contextmanager
def db_cursor():
    with shared_db_cursor() as cursor:
        yield cursor


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


def route_to_permission_code(route: str) -> str:
    return route.replace("/", "").replace("/", "-") or "root"


def permission_code_to_route(code: str) -> str | None:
    for item in ALL_ACCESS_OPTIONS:
        if route_to_permission_code(item["route"]) == code:
            return item["route"]
    return None


def make_slug(value: str) -> str:
    slug = []
    previous_dash = False
    for char in value.strip().lower():
        if char.isalnum():
            slug.append(char)
            previous_dash = False
        elif not previous_dash:
            slug.append("-")
            previous_dash = True
    return "".join(slug).strip("-")[:24]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    hashed_input = hash_password(password)
    return secrets.compare_digest(hashed_input, password_hash) or secrets.compare_digest(password, password_hash)


def get_default_access_for_roles(roles: list[str]) -> list[str]:
    routes: list[str] = []
    for role in roles:
        routes.extend(ROLE_PERMISSION_MAP.get(role, []))
    return list(dict.fromkeys(routes))


def get_default_edit_for_roles(roles: list[str]) -> list[str]:
    routes: list[str] = []
    for role in roles:
        routes.extend(ROLE_EDIT_PERMISSION_MAP.get(role, []))
    return list(dict.fromkeys(routes))


def capitalize_status(status: str | None, default: str) -> str:
    if not status:
        return default
    lowered = status.lower()
    replacements = {
        "active": "Active",
        "inactive": "In-Active",
        "in-active": "In-Active",
        "on break": "On Break",
        "available": "In-Active",
        "on trip": "Active",
        "in transit": "Active",
    }
    return replacements.get(lowered, lowered[:1].upper() + lowered[1:])


def extract_driver_photo(remarks: str | None) -> str:
    if not remarks:
        return ""

    for line in remarks.splitlines():
        if line.startswith("driver_photo="):
            return line.split("=", 1)[1].strip()

    return ""


def title_case(value: str | None, default: str) -> str:
    if not value:
        return default
    lowered = value.lower()
    return lowered[:1].upper() + lowered[1:]


def decimal_to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def format_ymd(value: Any, default: str = "") -> str:
    if not value:
        return default
    if hasattr(value, "date"):
        try:
            return value.date().isoformat()
        except Exception:
            pass
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def format_timestamp(value: Any, default: str = "N/A") -> str:
    if not value:
        return default
    if hasattr(value, "isoformat"):
        return value.isoformat(timespec="minutes").replace("T", " ")
    return str(value)


def format_trip_datetime(value: Any) -> str:
    if not value:
        return "N/A"
    if hasattr(value, "strftime"):
        try:
            return value.strftime("%b %#d, %H:%M")
        except ValueError:
            return value.strftime("%b %-d, %H:%M")
    return str(value)


def format_number_indian(value: float) -> str:
    rounded = int(round(value))
    text = str(rounded)
    if len(text) <= 3:
        return text
    last_three = text[-3:]
    remaining = text[:-3]
    groups = []
    while len(remaining) > 2:
        groups.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        groups.insert(0, remaining)
    return ",".join(groups + [last_three])


def to_organization_config(row: dict[str, Any]) -> dict[str, Any]:
    address = ", ".join(part for part in [row.get("address_line_1"), row.get("address_line_2")] if part)
    return {
        "name": row["name"],
        "maxUsers": row.get("max_users") or 0,
        "address": address,
        "phone": row.get("phone") or "",
        "country": row.get("country") or "",
        "email": row.get("email") or "",
        "pan": row.get("pan_number") or "",
        "employeeBusCount": int(row.get("employee_bus_count") or 0),
        "employeeCarCount": int(row.get("employee_car_count") or 0),
        "officerCarCount": int(row.get("officer_car_count") or 0),
        "amount": float(row.get("amount") or 0),
        "currency": row.get("currency") or "",
        "truckCount": int(row.get("truck_count") or 0),
        "isBlocked": (row.get("status") or "active").lower() == "blocked",
        "appPermissions": list(dict.fromkeys(row.get("app_permissions") or [item["route"] for item in ACCESS_OPTIONS])),
    }


def get_user_with_relations(db_user_id: str) -> dict[str, Any] | None:
    user = fetch_one(
        """
        SELECT u.id, u.user_id, u.name, u.email, u.password_hash, u.department_id, o.id AS organization_id, o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.id = %s
        LIMIT 1
        """,
        (db_user_id,),
    )
    if not user:
        return None

    roles = fetch_all(
        """
        SELECT r.code
        FROM user_roles ur
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = %s
        """,
        (db_user_id,),
    )
    permissions = fetch_all(
        """
        SELECT p.code
        FROM user_permissions up
        LEFT JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = %s
        """,
        (db_user_id,),
    )
    edit_permissions = fetch_all(
        """
        SELECT p.code
        FROM user_edit_permissions uep
        LEFT JOIN permissions p ON p.id = uep.permission_id
        WHERE uep.user_id = %s
        """,
        (db_user_id,),
    )
    user["roles"] = [item["code"] for item in roles if item.get("code")]
    user["permissions"] = [item["code"] for item in permissions if item.get("code")]
    user["edit_permissions"] = [item["code"] for item in edit_permissions if item.get("code")]
    return user


def get_organization_app_permissions(organization_id: str | None) -> list[str]:
    if not organization_id:
        return [item["route"] for item in ACCESS_OPTIONS]

    ensure_organization_permissions_table()
    rows = fetch_all(
        """
        SELECT p.module
        FROM organization_permissions op
        LEFT JOIN permissions p ON p.id = op.permission_id
        WHERE op.organization_id = %s
        ORDER BY p.module ASC
        """,
        (organization_id,),
    )
    routes = [row.get("module") for row in rows if row.get("module")]
    return list(dict.fromkeys(routes or [item["route"] for item in ACCESS_OPTIONS]))


def get_organization_app_permissions_map(organization_ids: list[str]) -> dict[str, list[str]]:
    valid_ids = [organization_id for organization_id in organization_ids if organization_id]
    if not valid_ids:
        return {}

    ensure_organization_permissions_table()
    rows = fetch_all(
        """
        SELECT op.organization_id, p.module
        FROM organization_permissions op
        LEFT JOIN permissions p ON p.id = op.permission_id
        WHERE op.organization_id = ANY(%s)
        ORDER BY op.organization_id ASC, p.module ASC
        """,
        (valid_ids,),
    )

    permissions_by_org: dict[str, list[str]] = {}
    for row in rows:
        organization_id = row.get("organization_id")
        module = row.get("module")
        if not organization_id or not module:
            continue
        permissions_by_org.setdefault(organization_id, []).append(module)

    default_routes = [item["route"] for item in ACCESS_OPTIONS]
    return {
        organization_id: list(dict.fromkeys(permissions_by_org.get(organization_id) or default_routes))
        for organization_id in dict.fromkeys(valid_ids)
    }


def get_organization_vehicle_counts_map(organization_ids: list[str]) -> dict[str, int]:
    valid_ids = [organization_id for organization_id in organization_ids if organization_id]
    if not valid_ids:
        return {}

    rows = fetch_all(
        """
        SELECT organization_id, COUNT(*) AS truck_count
        FROM vehicles
        WHERE organization_id = ANY(%s)
        GROUP BY organization_id
        """,
        (valid_ids,),
    )

    return {
        row["organization_id"]: int(row.get("truck_count") or 0)
        for row in rows
        if row.get("organization_id")
    }


def to_session(
    user: dict[str, Any],
    organization_app_permissions: set[str] | None = None,
) -> dict[str, Any]:
    custom_routes = [permission_code_to_route(code) for code in user.get("permissions", [])]
    access_routes = [route for route in custom_routes if route]
    custom_edit_routes = [permission_code_to_route(code) for code in user.get("edit_permissions", [])]
    edit_routes = [route for route in custom_edit_routes if route]
    has_explicit_permissions = "permissions" in user
    base_access_routes = list(dict.fromkeys(access_routes)) if has_explicit_permissions else get_default_access_for_roles(user.get("roles", []))
    base_edit_routes = list(dict.fromkeys(get_default_edit_for_roles(user.get("roles", [])) + edit_routes))
    if organization_app_permissions is None:
        organization_app_permissions = set(get_organization_app_permissions(user.get("organization_id")))

    if "super-admin" in user.get("roles", []):
        filtered_access_routes = list(dict.fromkeys(get_default_access_for_roles(user.get("roles", [])) + base_access_routes))
        filtered_edit_routes = list(dict.fromkeys(get_default_edit_for_roles(user.get("roles", [])) + base_edit_routes))
    else:
        filtered_access_routes = [
            route for route in base_access_routes if route not in ALL_ACCESS_OPTION_ROUTES or route in organization_app_permissions
        ]
        filtered_edit_routes = [
            route for route in list(dict.fromkeys(base_edit_routes)) if route not in ALL_ACCESS_OPTION_ROUTES or route in organization_app_permissions
        ]

    return {
        "userId": user.get("user_id") or "",
        "name": user.get("name") or "",
        "roles": user.get("roles", []),
        "accessRoutes": filtered_access_routes,
        "editRoutes": filtered_edit_routes,
        "organization": user.get("organization_name") or "",
    }


def ensure_custom_tables() -> None:
    global custom_tables_ready
    if custom_tables_ready:
        return

    with custom_table_lock:
        if custom_tables_ready:
            return

        statements = [
            """
            CREATE TABLE IF NOT EXISTS app_settings (
              id TEXT PRIMARY KEY,
              company_name TEXT NOT NULL,
              contact_email TEXT NOT NULL,
              google_maps_key TEXT NOT NULL DEFAULT '',
              gps_provider TEXT NOT NULL DEFAULT 'JioGPS',
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider)
            VALUES ('default', 'NextGen Logistics Pvt. Ltd.', 'ops@nextgenlogistics.in', '', 'JioGPS')
            ON CONFLICT (id) DO NOTHING
            """,
            """
            CREATE TABLE IF NOT EXISTS api_setups (
              id TEXT PRIMARY KEY,
              provider TEXT NOT NULL,
              base_url TEXT NOT NULL,
              auth_type TEXT NOT NULL,
              client_id TEXT NOT NULL,
              client_secret TEXT NOT NULL,
              order_endpoint TEXT NOT NULL,
              sync_method TEXT NOT NULL,
              order_id_field TEXT NOT NULL,
              customer_field TEXT NOT NULL,
              source_field TEXT NOT NULL,
              destination_field TEXT NOT NULL,
              weight_field TEXT NOT NULL,
              volume_field TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Draft',
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            INSERT INTO api_setups (
              id, provider, base_url, auth_type, client_id, client_secret, order_endpoint, sync_method,
              order_id_field, customer_field, source_field, destination_field, weight_field, volume_field, status
            )
            VALUES (
              'default', 'SAP S/4HANA', 'https://sap-pro.company.com/api', 'Bearer Token', 'nextgen-tms', '',
              '/orders/open', 'Pull every 15 minutes', 'VBELN', 'KUNNR', 'WERKS_FROM', 'WERKS_TO', 'BRGEW', 'VOLUM', 'Draft'
            )
            ON CONFLICT (id) DO NOTHING
            """,
            """
            CREATE TABLE IF NOT EXISTS maintenance_entries (
              id TEXT PRIMARY KEY,
              vehicle_id TEXT NOT NULL,
              vehicle_number TEXT NOT NULL,
              maintenance_type TEXT NOT NULL,
              service_date DATE NOT NULL,
              next_due_date DATE,
              service_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
              workshop_name TEXT NOT NULL,
              spare_parts TEXT NOT NULL DEFAULT '',
              notes TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS payment_entries (
              id TEXT PRIMARY KEY,
              payee_name TEXT NOT NULL,
              payee_category TEXT NOT NULL,
              amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
              payment_status TEXT NOT NULL DEFAULT 'Pending',
              payment_method TEXT NOT NULL,
              due_date DATE,
              paid_date DATE,
              reference_number TEXT NOT NULL DEFAULT '',
              notes TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transport_routes_custom (
              id TEXT PRIMARY KEY,
              route_name TEXT NOT NULL,
              start_location TEXT NOT NULL,
              end_location TEXT NOT NULL,
              via_points TEXT NOT NULL DEFAULT '',
              vehicle_type TEXT NOT NULL,
              distance_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
              estimated_time TEXT NOT NULL,
              color TEXT NOT NULL DEFAULT '#1A73E8',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS weighments (
              id TEXT PRIMARY KEY,
              vehicle_id TEXT NOT NULL,
              weighment_type TEXT NOT NULL,
              gross_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              tare_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              net_weight NUMERIC(12, 2) NOT NULL DEFAULT 0,
              material TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'Completed',
              recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS vehicle_assignments (
              id TEXT PRIMARY KEY,
              delivery_id TEXT NOT NULL,
              customer TEXT NOT NULL,
              source TEXT NOT NULL,
              destination TEXT NOT NULL,
              quantity_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
              load_type TEXT NOT NULL,
              recommended_truck_size TEXT NOT NULL,
              assigned_vehicle_id TEXT NOT NULL,
              assigned_vehicle_type TEXT NOT NULL,
              assigned_vehicle_capacity TEXT NOT NULL,
              assigned_driver_id TEXT,
              assigned_driver_name TEXT,
              assigned_assistant_id TEXT,
              assigned_assistant_name TEXT,
              gate_pass_id TEXT,
              gate_pass_status TEXT,
              assigned_by TEXT NOT NULL,
              assigned_by_user_id TEXT NOT NULL,
              organization TEXT NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            ALTER TABLE vehicle_assignments
            ADD COLUMN IF NOT EXISTS gate_pass_id TEXT
            """,
            """
            ALTER TABLE vehicle_assignments
            ADD COLUMN IF NOT EXISTS gate_pass_status TEXT
            """,
        ]
        for statement in statements:
            execute(statement)

        execute(
            """
            ALTER TABLE gate_passes
            ADD COLUMN IF NOT EXISTS challan_pdf_url TEXT,
            ADD COLUMN IF NOT EXISTS challan_number TEXT
            """
        )
        execute(
            """
            ALTER TABLE vehicle_assignments
            ADD COLUMN IF NOT EXISTS challan_number TEXT
            """
        )
        execute(
            """
            ALTER TABLE maintenance_entries
            ADD COLUMN IF NOT EXISTS spare_parts TEXT NOT NULL DEFAULT ''
            """
        )
        execute(
            """
            CREATE TABLE IF NOT EXISTS user_edit_permissions (
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
              PRIMARY KEY (user_id, permission_id)
            )
            """
        )
        custom_tables_ready = True


def ensure_organization_transport_columns() -> None:
    execute(
        """
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS employee_bus_count INTEGER NOT NULL DEFAULT 0
        """
    )
    execute(
        """
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS employee_car_count INTEGER NOT NULL DEFAULT 0
        """
    )
    execute(
        """
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS officer_car_count INTEGER NOT NULL DEFAULT 0
        """
    )
    execute(
        """
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2) NOT NULL DEFAULT 0
        """
    )
    execute(
        """
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT ''
        """
    )


def ensure_organization_permissions_table() -> None:
    execute(
        """
        CREATE TABLE IF NOT EXISTS organization_permissions (
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (organization_id, permission_id)
        )
        """
    )


_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
GPS_DATA_TABLES = ("gps_data_m",)
GPS_TRACKING_LIMIT = 250


def is_safe_identifier(value: str) -> bool:
    return bool(_IDENTIFIER_RE.match(value))


def quote_identifier(value: str) -> str:
    if not is_safe_identifier(value):
        raise ValueError(f"Unsafe SQL identifier: {value}")
    return f'"{value}"'


def table_exists(table_name: str) -> bool:
    row = fetch_one(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s
        LIMIT 1
        """,
        (table_name,),
    )
    return bool(row)


def get_table_columns(table_name: str) -> set[str]:
    rows = fetch_all(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table_name,),
    )
    return {str(row.get("column_name") or "") for row in rows if row.get("column_name")}


def pick_first_available_column(columns: set[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


def parse_datetime_value(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float, Decimal)):
        numeric = float(value)
        if numeric >= 1_000_000_000_000:
            return datetime.fromtimestamp(numeric / 1000.0, tz=timezone.utc)
        if numeric >= 1_000_000_000:
            return datetime.fromtimestamp(numeric, tz=timezone.utc)
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.isdigit():
            numeric = float(text)
            if numeric >= 1_000_000_000_000:
                return datetime.fromtimestamp(numeric / 1000.0, tz=timezone.utc)
            if numeric >= 1_000_000_000:
                return datetime.fromtimestamp(numeric, tz=timezone.utc)
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def parse_float_value(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def parse_bool_value(value: Any) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y", "on", "running", "moving"}:
        return True
    if text in {"0", "false", "f", "no", "n", "off", "stopped", "idle"}:
        return False
    return None


def normalize_vehicle_key(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def format_gps_timestamp(value: datetime | None) -> str:
    if not value:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def resolve_gps_table_name() -> str | None:
    for table_name in GPS_DATA_TABLES:
        if table_exists(table_name):
            return table_name
    return None


def fetch_latest_gps_rows(limit: int = GPS_TRACKING_LIMIT) -> tuple[str | None, list[dict[str, Any]]]:
    table_name = resolve_gps_table_name()
    if not table_name:
        return None, []

    if not is_safe_identifier(table_name):
        return None, []

    columns = get_table_columns(table_name)
    if not columns:
        return table_name, []

    timestamp_column = pick_first_available_column(
        columns,
        [
            "captured_at",
            "recorded_at",
            "created_at",
            "updated_at",
            "gps_time",
            "timestamp",
            "event_time",
            "device_time",
            "server_time",
        ],
    )
    order_column = quote_identifier(timestamp_column) if timestamp_column else '"id"'
    query = f"""
        SELECT id, user_id, vehicle_no, latitude, longitude, accuracy, captured_at
        FROM (
            SELECT DISTINCT ON (vehicle_no)
                id, user_id, vehicle_no, latitude, longitude, accuracy, captured_at
            FROM {quote_identifier(table_name)}
            WHERE vehicle_no IS NOT NULL AND BTRIM(vehicle_no) <> ''
            ORDER BY vehicle_no, {order_column} DESC NULLS LAST, id DESC
        ) latest_rows
        ORDER BY captured_at DESC NULLS LAST, id DESC
    """
    rows = fetch_all(query)

    vehicle_columns = [
        "vehicle_id",
        "vehicle_number",
        "vehicle_no",
        "vehicle_no.",
        "vehicle",
        "reg_no",
        "registration_number",
        "registration_no",
        "registration_no.",
        "truck_no",
        "truck_no.",
        "truckno",
        "truck number",
        "truck_number",
        "plate_number",
        "plate_no",
        "device_id",
    ]
    driver_columns = ["driver_name", "driver", "driver_id", "driver_code", "employee_name"]
    route_columns = ["route_name", "route", "trip_name", "trip_number", "delivery_id", "destination"]
    lat_columns = ["latitude", "lat", "gps_latitude", "vehicle_latitude", "y"]
    lng_columns = ["longitude", "lng", "lon", "gps_longitude", "vehicle_longitude", "x"]
    speed_columns = ["speed", "vehicle_speed", "velocity", "spd"]
    planned_speed_columns = ["planned_speed", "target_speed", "expected_speed", "speed_limit"]
    heading_columns = ["heading", "direction", "course", "bearing"]
    zone_columns = ["zone", "area", "region", "geofence", "checkpoint", "address", "location"]
    status_columns = ["status", "movement_status", "tracking_status", "vehicle_status"]
    progress_columns = ["progress", "progress_percent", "trip_progress", "journey_progress"]
    eta_columns = ["eta_minutes", "eta", "estimated_arrival_minutes", "arrival_eta_minutes"]
    halt_columns = ["halt_minutes", "stop_minutes", "idle_minutes"]
    deviation_columns = ["route_deviation_km", "deviation_km", "distance_from_route_km"]
    ignition_columns = ["ignition", "ignition_status", "ignition_on", "engine_status"]

    vehicle_column = pick_first_available_column(columns, vehicle_columns)
    driver_column = pick_first_available_column(columns, driver_columns)
    route_column = pick_first_available_column(columns, route_columns)
    lat_column = pick_first_available_column(columns, lat_columns)
    lng_column = pick_first_available_column(columns, lng_columns)
    speed_column = pick_first_available_column(columns, speed_columns)
    planned_speed_column = pick_first_available_column(columns, planned_speed_columns)
    heading_column = pick_first_available_column(columns, heading_columns)
    zone_column = pick_first_available_column(columns, zone_columns)
    status_column = pick_first_available_column(columns, status_columns)
    progress_column = pick_first_available_column(columns, progress_columns)
    eta_column = pick_first_available_column(columns, eta_columns)
    halt_column = pick_first_available_column(columns, halt_columns)
    deviation_column = pick_first_available_column(columns, deviation_columns)
    ignition_column = pick_first_available_column(columns, ignition_columns)

    latest_by_vehicle: dict[str, dict[str, Any]] = {}
    fallback_rows: list[dict[str, Any]] = []

    for index, row in enumerate(rows):
        vehicle_key = ""
        for candidate_column in vehicle_columns:
            value = row.get(candidate_column)
            if value not in (None, ""):
                vehicle_key = normalize_vehicle_key(value)
                break
        if not vehicle_key:
            vehicle_key = normalize_vehicle_key(row.get("id") or f"GPS-{index + 1}")

        if vehicle_key in latest_by_vehicle:
            continue
        latest_by_vehicle[vehicle_key] = row
        fallback_rows.append(row)

    if not latest_by_vehicle:
        fallback_rows = rows[:]

    now = datetime.now(timezone.utc)
    vehicle_lookup = {
        normalize_vehicle_key(row.get("vehicle_number")): row
        for row in fetch_all(
            """
            SELECT vehicle_number, vehicle_type, status, remarks, organization_id
            FROM vehicles
            """
        )
        if row.get("vehicle_number")
    }
    driver_lookup = {
        normalize_vehicle_key(row.get("driver_code")): row
        for row in fetch_all(
            """
            SELECT driver_code, driver_name
            FROM drivers
            """
        )
        if row.get("driver_code")
    }
    trip_lookup = {}
    for row in fetch_all(
        """
        SELECT
          v.vehicle_number,
          d.driver_name,
          t.start_location,
          t.end_location,
          t.trip_number,
          t.planned_end_time,
          t.trip_status
        FROM trips t
        LEFT JOIN vehicles v ON v.id = t.vehicle_id
        LEFT JOIN drivers d ON d.id = t.driver_id
        ORDER BY t.updated_at DESC
        """
    ):
        vehicle_number = row.get("vehicle_number")
        if vehicle_number:
            normalized_vehicle_number = normalize_vehicle_key(vehicle_number)
            if normalized_vehicle_number not in trip_lookup:
                trip_lookup[normalized_vehicle_number] = row

    vehicles: list[dict[str, Any]] = []
    for index, row in enumerate(fallback_rows):
        vehicle_key = ""
        for candidate_column in vehicle_columns:
            value = row.get(candidate_column)
            if value not in (None, ""):
                vehicle_key = normalize_vehicle_key(value)
                break
        if not vehicle_key:
            vehicle_key = normalize_vehicle_key(row.get("id") or f"GPS-{index + 1}")

        latitude = parse_float_value(row.get(lat_column)) if lat_column else None
        longitude = parse_float_value(row.get(lng_column)) if lng_column else None
        speed = parse_float_value(row.get(speed_column)) if speed_column else None
        planned_speed = parse_float_value(row.get(planned_speed_column)) if planned_speed_column else None
        heading = str(row.get(heading_column) or "").strip() if heading_column else ""
        zone = str(row.get(zone_column) or "").strip() if zone_column else ""
        status_value = str(row.get(status_column) or "").strip() if status_column else ""
        progress_value = parse_float_value(row.get(progress_column)) if progress_column else None
        eta_value = parse_float_value(row.get(eta_column)) if eta_column else None
        halt_value = parse_float_value(row.get(halt_column)) if halt_column else None
        deviation_value = parse_float_value(row.get(deviation_column)) if deviation_column else None
        ignition_value = parse_bool_value(row.get(ignition_column)) if ignition_column else None
        timestamp = parse_datetime_value(row.get(timestamp_column)) if timestamp_column else None
        timestamp_utc = None
        if timestamp:
            timestamp_utc = timestamp.astimezone(timezone.utc) if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)

        trip_row = trip_lookup.get(vehicle_key)
        driver_name = ""
        if driver_column and row.get(driver_column) not in (None, ""):
            driver_name = str(row.get(driver_column))
            driver_match = driver_lookup.get(normalize_vehicle_key(driver_name))
            if driver_match and driver_match.get("driver_name"):
                driver_name = str(driver_match["driver_name"])
        elif trip_row and trip_row.get("driver_name"):
            driver_name = str(trip_row.get("driver_name") or "")
        else:
            driver_name = "Live GPS"

        route = str(row.get(route_column) or "").strip() if route_column else ""
        if not route and trip_row:
            start_location = trip_row.get("start_location") or ""
            end_location = trip_row.get("end_location") or ""
            if start_location or end_location:
                route = f"{start_location or 'Unknown'} - {end_location or 'Unknown'}"
        if not route:
            route = "Live GPS Feed"

        status = status_value.title() if status_value else ""
        if not status:
            if ignition_value is False or (speed is not None and speed <= 1):
                status = "Stopped"
            elif speed is not None and speed > 0:
                status = "Moving"
            else:
                status = "Idle"

        if progress_value is None:
            if speed is not None and speed > 0:
                progress_value = min(98.0, max(5.0, 20.0 + speed))
            elif timestamp_utc:
                minutes_old = max(0.0, (now - timestamp_utc).total_seconds() / 60.0)
                progress_value = max(5.0, min(90.0, 100.0 - minutes_old / 2.0))
            else:
                progress_value = min(95.0, 15.0 + index * 12.0)

        if eta_value is None:
            if speed is not None and speed > 0:
                eta_value = max(15.0, 240.0 - speed * 2.2)
            else:
                eta_value = max(15.0, 180.0 - index * 7.5)

        if planned_speed is None:
            planned_speed = max(40.0, (speed or 0.0) + 5.0)

        if halt_value is None:
            if speed is not None and speed <= 1:
                halt_value = 5.0
            else:
                halt_value = 0.0

        if deviation_value is None:
            deviation_value = 0.0

        last_update_seconds = 0
        if timestamp_utc:
            last_update_seconds = max(0, int((now - timestamp_utc).total_seconds()))

        vehicle_row = vehicle_lookup.get(vehicle_key) or {}
        vehicles.append(
            {
                "id": vehicle_key,
                "vehicleNo": str(row.get(vehicle_column) or vehicle_key),
                "driver": driver_name,
                "route": route,
                "progress": max(0.0, min(100.0, float(progress_value))),
                "speed": float(speed) if speed is not None else 0.0,
                "plannedSpeed": float(planned_speed),
                "etaMinutes": int(round(float(eta_value))),
                "haltMinutes": int(round(float(halt_value))),
                "status": status,
                "heading": heading or "-",
                "zone": zone or route,
                "checkpoint": zone or route,
                "routeDeviationKm": float(deviation_value),
                "lastUpdateSeconds": last_update_seconds,
                "latitude": latitude,
                "longitude": longitude,
                "lastSeen": format_gps_timestamp(timestamp),
                "vehicleType": vehicle_row.get("vehicle_type") if vehicle_row else None,
                "organizationId": vehicle_row.get("organization_id") if vehicle_row else None,
                "raw": row,
            }
        )

    return table_name, vehicles


def get_tracking_feed() -> dict[str, Any]:
    table_name, vehicles = fetch_latest_gps_rows()
    moving = sum(1 for vehicle in vehicles if vehicle.get("status") == "Moving")
    delayed = sum(1 for vehicle in vehicles if vehicle.get("status") == "Delayed")
    stopped = sum(1 for vehicle in vehicles if vehicle.get("status") == "Stopped")
    avg_eta = round(sum(float(vehicle.get("etaMinutes") or 0) for vehicle in vehicles) / len(vehicles)) if vehicles else 0
    latest_update = ""
    if vehicles:
        latest_update = max((vehicle.get("lastSeen") or "" for vehicle in vehicles), default="")

    return {
        "vehicles": vehicles,
        "stats": {
            "total": len(vehicles),
            "moving": moving,
            "delayed": delayed,
            "stopped": stopped,
            "avgEtaMinutes": avg_eta,
            "latestUpdate": latest_update,
        },
        "source": table_name or "gps_data_m",
    }


def ensure_role(role: str) -> dict[str, Any]:
    existing = fetch_one("SELECT id, code FROM roles WHERE code = %s LIMIT 1", (role,))
    if existing:
        execute(
            "UPDATE roles SET name = %s, description = %s, updated_at = NOW() WHERE id = %s",
            (ROLE_LABELS[role], f"{ROLE_LABELS[role]} role", existing["id"]),
        )
        return existing

    created = fetch_one(
        """
        INSERT INTO roles (name, code, description)
        VALUES (%s, %s, %s)
        RETURNING id, code
        """,
        (ROLE_LABELS[role], role, f"{ROLE_LABELS[role]} role"),
    )
    return created or {"id": "", "code": role}


def ensure_permission(permission: dict[str, str]) -> dict[str, Any]:
    existing = fetch_one("SELECT id, code FROM permissions WHERE code = %s LIMIT 1", (permission["code"],))
    if existing:
        execute(
            "UPDATE permissions SET name = %s, module = %s WHERE id = %s",
            (permission["name"], permission["module"], existing["id"]),
        )
        return existing

    created = fetch_one(
        """
        INSERT INTO permissions (name, code, module)
        VALUES (%s, %s, %s)
        RETURNING id, code
        """,
        (permission["name"], permission["code"], permission["module"]),
    )
    return created or {"id": "", "code": permission["code"]}


def ensure_role_permissions(role_record: dict[str, Any], permission_records: list[dict[str, Any]]) -> None:
    for route in ROLE_PERMISSION_MAP.get(role_record["code"], []):
        permission_code = route_to_permission_code(route)
        permission = next((item for item in permission_records if item["code"] == permission_code), None)
        if not permission:
            continue
        existing = fetch_one(
            "SELECT id FROM role_permissions WHERE role_id = %s AND permission_id = %s LIMIT 1",
            (role_record["id"], permission["id"]),
        )
        if not existing:
            execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s)",
                (role_record["id"], permission["id"]),
            )


def ensure_organization(organization: dict[str, Any]) -> dict[str, Any]:
    ensure_organization_transport_columns()
    ensure_organization_permissions_table()
    code = (make_slug(organization["name"]) or organization["name"]).upper()
    status = "blocked" if organization.get("isBlocked") else "active"
    existing = fetch_one("SELECT id, code FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization["name"],))
    if existing:
        updated = fetch_one(
            """
            UPDATE organizations
            SET code = %s, email = %s, phone = %s, country = %s, address_line_1 = %s, pan_number = %s, max_users = %s,
                employee_bus_count = %s, employee_car_count = %s, officer_car_count = %s, amount = %s, currency = %s, status = %s
            WHERE id = %s
            RETURNING id, name, max_users, address_line_1, address_line_2, phone, country, email, pan_number,
                      employee_bus_count, employee_car_count, officer_car_count, amount, currency, status
            """,
            (
                existing["code"] or code,
                organization.get("email", ""),
                organization.get("phone", ""),
                organization.get("country", ""),
                organization.get("address", ""),
                organization.get("pan", ""),
                organization.get("maxUsers", 0),
                max(0, int(organization.get("employeeBusCount", 0) or 0)),
                max(0, int(organization.get("employeeCarCount", 0) or 0)),
                max(0, int(organization.get("officerCarCount", 0) or 0)),
                max(0.0, float(organization.get("amount", 0) or 0)),
                (organization.get("currency") or "").strip(),
                status,
                existing["id"],
            ),
        )
        next_app_permissions = organization.get("appPermissions")
        if next_app_permissions is None:
            next_app_permissions = get_organization_app_permissions(existing["id"])
        sync_organization_permissions(existing["id"], next_app_permissions)
        return updated or existing

    created = fetch_one(
        """
        INSERT INTO organizations (
            name, code, email, phone, country, address_line_1, pan_number, max_users,
            employee_bus_count, employee_car_count, officer_car_count, amount, currency, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, max_users, address_line_1, address_line_2, phone, country, email, pan_number,
                  employee_bus_count, employee_car_count, officer_car_count, amount, currency, status
        """,
        (
            organization["name"],
            code,
            organization.get("email", ""),
            organization.get("phone", ""),
            organization.get("country", ""),
            organization.get("address", ""),
            organization.get("pan", ""),
            organization.get("maxUsers", 0),
            max(0, int(organization.get("employeeBusCount", 0) or 0)),
            max(0, int(organization.get("employeeCarCount", 0) or 0)),
            max(0, int(organization.get("officerCarCount", 0) or 0)),
            max(0.0, float(organization.get("amount", 0) or 0)),
            (organization.get("currency") or "").strip(),
            status,
        ),
    )
    if created:
        sync_organization_permissions(
            created["id"],
            organization.get("appPermissions") or [item["route"] for item in ACCESS_OPTIONS],
        )
    return created or {}


def ensure_department(organization_id: str, department_name: str) -> dict[str, Any] | None:
    normalized_name = department_name.strip()
    if not normalized_name:
        return None
    existing = fetch_one(
        "SELECT id FROM departments WHERE organization_id = %s AND LOWER(name) = LOWER(%s) LIMIT 1",
        (organization_id, normalized_name),
    )
    if existing:
        return existing
    return fetch_one(
        """
        INSERT INTO departments (organization_id, name, code)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (organization_id, normalized_name, (make_slug(normalized_name) or normalized_name).upper()),
    )


def get_seeded_org_user_limit(organization_name: str) -> int:
    seeded_count = sum(
        1 for item in DEFAULT_DEMO_USERS if item.get("organization", "").strip().lower() == organization_name.strip().lower()
    )
    return max(seeded_count, 1)


def sync_user_permissions(db_user_id: str, access_routes: list[str]) -> None:
    permission_codes = [route_to_permission_code(route) for route in access_routes]
    execute("DELETE FROM user_permissions WHERE user_id = %s", (db_user_id,))
    if not permission_codes:
        return
    permissions = fetch_all("SELECT id FROM permissions WHERE code = ANY(%s)", (permission_codes,))
    for permission in permissions:
        execute(
            "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
            (db_user_id, permission["id"]),
        )


def sync_organization_permissions(organization_id: str, app_routes: list[str]) -> None:
    ensure_organization_permissions_table()
    execute("DELETE FROM organization_permissions WHERE organization_id = %s", (organization_id,))
    unique_routes = list(dict.fromkeys(route for route in app_routes if route in ALL_ACCESS_OPTION_ROUTES))
    if not unique_routes:
        return
    permissions = fetch_all("SELECT id FROM permissions WHERE module = ANY(%s)", (unique_routes,))
    for permission in permissions:
        execute(
            "INSERT INTO organization_permissions (organization_id, permission_id) VALUES (%s, %s)",
            (organization_id, permission["id"]),
        )


def sync_user_edit_permissions(db_user_id: str, edit_routes: list[str]) -> None:
    ensure_custom_tables()
    execute("DELETE FROM user_edit_permissions WHERE user_id = %s", (db_user_id,))
    for route in list(dict.fromkeys(edit_routes)):
        permission = fetch_one("SELECT id FROM permissions WHERE module = %s LIMIT 1", (route,))
        if permission:
            execute(
                "INSERT INTO user_edit_permissions (user_id, permission_id) VALUES (%s, %s)",
                (db_user_id, permission["id"]),
            )


def ensure_user(user: dict[str, Any]) -> None:
    ensure_organization_transport_columns()
    existing_organization = fetch_one(
        """
        SELECT name, max_users, address_line_1, address_line_2, phone, country, email, pan_number,
               employee_bus_count, employee_car_count, officer_car_count
        FROM organizations
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1
        """,
        (user["organization"],),
    )
    organization_defaults = next(
        (item for item in DEFAULT_ORGANIZATIONS if item["name"] == user["organization"]),
        None,
    )
    persisted_organization = to_organization_config(existing_organization) if existing_organization else {}
    max_users = (
        persisted_organization.get("maxUsers")
        or (organization_defaults or {}).get("maxUsers")
        or get_seeded_org_user_limit(user["organization"])
    )
    organization = ensure_organization(
        {
            "name": user["organization"],
            "maxUsers": max_users,
            "address": persisted_organization.get("address")
            or (organization_defaults or {}).get("address")
            or "",
            "phone": persisted_organization.get("phone")
            or (organization_defaults or {}).get("phone")
            or "",
            "country": persisted_organization.get("country")
            or (organization_defaults or {}).get("country")
            or ("" if user["organization"] == "Platform" else "India"),
            "email": persisted_organization.get("email")
            or (organization_defaults or {}).get("email")
            or "",
            "pan": persisted_organization.get("pan")
            or (organization_defaults or {}).get("pan")
            or "",
            "employeeBusCount": persisted_organization.get("employeeBusCount")
            or (organization_defaults or {}).get("employeeBusCount")
            or 0,
            "employeeCarCount": persisted_organization.get("employeeCarCount")
            or (organization_defaults or {}).get("employeeCarCount")
            or 0,
            "officerCarCount": persisted_organization.get("officerCarCount")
            or (organization_defaults or {}).get("officerCarCount")
            or 0,
        }
    )
    department = ensure_department(organization["id"], user.get("department", ""))
    existing = fetch_one(
        """
        SELECT id, password_hash
        FROM users
        WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user["userId"]),
    )
    password_hash = hash_password(user["password"])

    if existing:
        user_row = fetch_one(
            """
            UPDATE users
            SET name = %s, email = %s, password_hash = %s, department_id = %s, status = 'active'
            WHERE id = %s
            RETURNING id
            """,
            (
                user["name"],
                user["email"],
                existing["password_hash"] or password_hash,
                department["id"] if department else None,
                existing["id"],
            ),
        )
    else:
        user_row = fetch_one(
            """
            INSERT INTO users (organization_id, user_id, name, email, password_hash, department_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'active')
            RETURNING id
            """,
            (
                organization["id"],
                user["userId"],
                user["name"],
                user["email"],
                password_hash,
                department["id"] if department else None,
            ),
        )

    if not user_row:
        return

    execute(
        """
        DELETE FROM user_roles
        WHERE user_id = %s
          AND role_id IN (SELECT id FROM roles WHERE code <> ALL(%s))
        """,
        (user_row["id"], user["roles"]),
    )
    for role in user["roles"]:
        role_record = ensure_role(role)
        existing_user_role = fetch_one(
            "SELECT id FROM user_roles WHERE user_id = %s AND role_id = %s LIMIT 1",
            (user_row["id"], role_record["id"]),
        )
        if not existing_user_role:
            execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                (user_row["id"], role_record["id"]),
            )

    sync_user_permissions(user_row["id"], user["accessRoutes"])
    sync_user_edit_permissions(user_row["id"], user.get("editRoutes", []))


def run_bootstrap_data() -> None:
    permissions = [
        ensure_permission({"name": item["label"], "code": route_to_permission_code(item["route"]), "module": item["route"]})
        for item in ALL_ACCESS_OPTIONS
    ]
    for role in ROLE_LABELS:
        role_record = ensure_role(role)
        ensure_role_permissions(role_record, permissions)
    for organization in DEFAULT_ORGANIZATIONS:
        ensure_organization(organization)
    for user in DEFAULT_DEMO_USERS:
        ensure_user(user)


def bootstrap_data_exists() -> bool:
    counts = fetch_one(
        """
        SELECT
          (SELECT COUNT(*) FROM roles) AS role_count,
          (SELECT COUNT(*) FROM users) AS user_count
        """
    )
    if not counts:
        return False

    permission_rows = fetch_all("SELECT code FROM permissions")
    permission_codes = {row.get("code") for row in permission_rows if row.get("code")}
    required_permission_codes = {route_to_permission_code(item["route"]) for item in ALL_ACCESS_OPTIONS}

    return (
        required_permission_codes.issubset(permission_codes)
        and int(counts.get("role_count") or 0) >= len(ROLE_LABELS)
        and int(counts.get("user_count") or 0) >= len(DEFAULT_DEMO_USERS)
    )


def ensure_bootstrap_data(force: bool = False) -> None:
    global bootstrap_ready
    if bootstrap_ready and not force:
        return
    with bootstrap_lock:
        if bootstrap_ready and not force:
            return
        if force or not bootstrap_data_exists():
            run_bootstrap_data()
        bootstrap_ready = True


def get_organizations_from_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_organization_transport_columns()
    ensure_organization_permissions_table()
    rows = fetch_all(
        """
        SELECT name, max_users, address_line_1, address_line_2, phone, country, email, pan_number,
               amount, currency,
               employee_bus_count, employee_car_count, officer_car_count, status, id
        FROM organizations
        ORDER BY name ASC
        """
    )
    permissions_by_org = get_organization_app_permissions_map([row.get("id") for row in rows if row.get("id")])
    truck_counts_by_org = get_organization_vehicle_counts_map([row.get("id") for row in rows if row.get("id")])
    return [
        to_organization_config(
            {
                **row,
                "app_permissions": permissions_by_org.get(row.get("id")),
                "truck_count": truck_counts_by_org.get(row.get("id"), 0),
            }
        )
        for row in rows
    ]


def reset_organizations_in_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    execute("DELETE FROM organizations WHERE name <> 'Platform'")
    for organization in DEFAULT_ORGANIZATIONS:
        ensure_organization(organization)
    ensure_bootstrap_data(force=True)
    return get_organizations_from_db()


def save_organizations_to_db(organizations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    for organization in organizations:
        ensure_organization(organization)
    return get_organizations_from_db()


def save_organization_to_db(organization: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    if not (organization.get("name") or "").strip():
        raise HTTPException(status_code=400, detail="Organization name is required")
    ensure_organization(organization)
    return get_organizations_from_db()


def delete_organization_in_db(organization_name: str) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_custom_tables()
    if organization_name.strip().lower() == "platform":
        raise HTTPException(status_code=400, detail="Platform organization cannot be deleted")

    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        return get_organizations_from_db()

    organization_id = organization["id"]
    execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM user_edit_permissions WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM gate_passes WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM trips WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM invoices WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE organization_id = %s)", (organization_id,))
    execute("DELETE FROM orders WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM drivers WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM vehicles WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM departments WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM users WHERE organization_id = %s", (organization_id,))
    execute("DELETE FROM organizations WHERE id = %s", (organization_id,))
    return get_organizations_from_db()


def get_users_from_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT
          u.id,
          u.user_id,
          u.name,
          u.email,
          u.organization_id,
          o.name AS organization_name,
          d.name AS department_name,
          COALESCE(ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}'::text[]) AS roles,
          COALESCE(ARRAY_AGG(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}'::text[]) AS permissions,
          COALESCE(ARRAY_AGG(DISTINCT ep.code) FILTER (WHERE ep.code IS NOT NULL), '{}'::text[]) AS edit_permissions
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        LEFT JOIN departments d ON d.id = u.department_id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN user_permissions up ON up.user_id = u.id
        LEFT JOIN permissions p ON p.id = up.permission_id
        LEFT JOIN user_edit_permissions uep ON uep.user_id = u.id
        LEFT JOIN permissions ep ON ep.id = uep.permission_id
        GROUP BY u.id, u.user_id, u.name, u.email, o.name, d.name, u.organization_id
        ORDER BY u.organization_id ASC, u.user_id ASC
        """
    )
    permissions_by_org = get_organization_app_permissions_map([row.get("organization_id") for row in rows if row.get("organization_id")])

    users = []
    for row in rows:
        session = to_session(
            {
                "user_id": row.get("user_id"),
                "name": row.get("name"),
                "organization_id": row.get("organization_id"),
                "organization_name": row.get("organization_name"),
                "roles": row.get("roles") or [],
                "permissions": row.get("permissions") or [],
                "edit_permissions": row.get("edit_permissions") or [],
            },
            set(permissions_by_org.get(row.get("organization_id"), [item["route"] for item in ACCESS_OPTIONS])),
        )
        users.append(
            {
                **session,
                "password": "1234",
                "email": row.get("email") or "",
                "department": row.get("department_name") or "",
            }
        )
    return users


def get_permission_options_from_db() -> list[dict[str, str]]:
    ensure_bootstrap_data()
    rows = fetch_all(
        """
        SELECT name, module
        FROM permissions
        WHERE module NOT IN ('/admin', '/settings', '/superadmin')
        ORDER BY name ASC
        """
    )
    return [
        {
            "label": row.get("name") or "",
            "route": row.get("module") or "",
        }
        for row in rows
        if row.get("name") and row.get("module")
    ]


def save_users_to_db(users: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    incoming = {f"{user['organization'].lower()}::{user['userId'].lower()}" for user in users}
    existing_users = fetch_all(
        """
        SELECT u.id, u.user_id, o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        """
    )
    for existing in existing_users:
        key = f"{(existing.get('organization_name') or '').lower()}::{(existing.get('user_id') or '').lower()}"
        if key not in incoming:
            execute("DELETE FROM sessions WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM user_permissions WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM user_edit_permissions WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM user_roles WHERE user_id = %s", (existing["id"],))
            execute("DELETE FROM users WHERE id = %s", (existing["id"],))
    for user in users:
        ensure_user(user)
    return get_users_from_db()


def save_user_access_in_db(organization_name: str, user_id: str, access_routes: list[str]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    user = fetch_one(
        """
        SELECT u.id
        FROM users u
        WHERE u.organization_id = %s AND LOWER(u.user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user_id.strip()),
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sync_user_permissions(user["id"], access_routes)
    return get_users_from_db()


def save_user_edit_access_in_db(organization_name: str, user_id: str, edit_routes: list[str]) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_custom_tables()
    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    user = fetch_one(
        """
        SELECT u.id
        FROM users u
        WHERE u.organization_id = %s AND LOWER(u.user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user_id.strip()),
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sync_user_edit_permissions(user["id"], edit_routes)
    return get_users_from_db()


def delete_user_in_db(organization_name: str, user_id: str) -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_custom_tables()
    if organization_name.strip().lower() == "platform" and user_id.strip().lower() == "supad":
        raise HTTPException(status_code=400, detail="Super admin cannot be deleted")

    organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name.strip(),))
    if not organization:
        return get_users_from_db()

    user = fetch_one(
        """
        SELECT id
        FROM users
        WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
        LIMIT 1
        """,
        (organization["id"], user_id.strip()),
    )
    if not user:
        return get_users_from_db()

    execute("DELETE FROM sessions WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM user_permissions WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM user_edit_permissions WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM user_roles WHERE user_id = %s", (user["id"],))
    execute("DELETE FROM users WHERE id = %s", (user["id"],))
    return get_users_from_db()


def reset_users_in_db() -> list[dict[str, Any]]:
    ensure_bootstrap_data()
    ensure_custom_tables()
    execute("DELETE FROM sessions")
    execute("DELETE FROM user_permissions")
    execute("DELETE FROM user_edit_permissions")
    execute("DELETE FROM user_roles")
    execute("DELETE FROM users WHERE user_id <> 'supad'")
    for user in DEFAULT_DEMO_USERS:
        ensure_user(user)
    ensure_bootstrap_data(force=True)
    return get_users_from_db()


def authenticate_user_from_db(organization_name: str, user_id: str, password: str) -> dict[str, Any] | None:
    org_name = organization_name.strip()
    user_code = user_id.strip()
    password_text = password.strip()
    if not org_name or not user_code or not password_text:
        return None

    def find_user() -> dict[str, Any] | None:
        organization = fetch_one("SELECT id, status FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (org_name,))
        if not organization:
            return None
        if (organization.get("status") or "active").lower() == "blocked":
            raise HTTPException(status_code=403, detail="This organization is blocked. Please contact the super admin.")
        row = fetch_one(
            """
            SELECT id
            FROM users
            WHERE organization_id = %s AND LOWER(user_id) = LOWER(%s)
            LIMIT 1
            """,
            (organization["id"], user_code),
        )
        if not row:
            return None
        return get_user_with_relations(row["id"])

    user = find_user()
    if not user:
        ensure_bootstrap_data()
        user = find_user()
    if not user or not verify_password(password_text, user["password_hash"]):
        return None

    execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user["id"],))
    token = str(uuid.uuid4())
    execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user["id"], token, datetime.now(timezone.utc) + timedelta(days=7)))
    return {"token": token, "session": to_session(user)}


def get_session_from_token(token: str) -> dict[str, Any] | None:
    if not token:
        return None
    session = fetch_one("SELECT user_id, expires_at FROM sessions WHERE token = %s LIMIT 1", (token,))
    if not session:
        return None
    expires_at = session.get("expires_at")
    comparison_now = datetime.now(expires_at.tzinfo) if expires_at and getattr(expires_at, "tzinfo", None) else datetime.utcnow()
    if expires_at and expires_at < comparison_now:
        execute("DELETE FROM sessions WHERE token = %s", (token,))
        return None
    user = get_user_with_relations(session["user_id"])
    if not user:
        execute("DELETE FROM sessions WHERE token = %s", (token,))
        return None
    return to_session(user)


def clear_session_token(token: str) -> None:
    if token:
        execute("DELETE FROM sessions WHERE token = %s", (token,))


def get_app_settings() -> dict[str, Any]:
    ensure_custom_tables()
    row = fetch_one("SELECT company_name, contact_email, google_maps_key, gps_provider FROM app_settings WHERE id = 'default'")
    return {
        "companyName": row.get("company_name") if row else "NextGen Logistics Pvt. Ltd.",
        "contactEmail": row.get("contact_email") if row else "ops@nextgenlogistics.in",
        "googleMapsKey": row.get("google_maps_key") if row else "",
        "gpsProvider": row.get("gps_provider") if row else "JioGPS",
    }


def save_app_settings(settings: dict[str, Any]) -> dict[str, Any]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO app_settings (id, company_name, contact_email, google_maps_key, gps_provider, updated_at)
        VALUES ('default', %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          contact_email = EXCLUDED.contact_email,
          google_maps_key = EXCLUDED.google_maps_key,
          gps_provider = EXCLUDED.gps_provider,
          updated_at = NOW()
        """,
        (settings["companyName"], settings["contactEmail"], settings["googleMapsKey"], settings["gpsProvider"]),
    )
    return get_app_settings()


def get_api_setup() -> dict[str, Any]:
    ensure_custom_tables()
    row = fetch_one("SELECT * FROM api_setups WHERE id = 'default'")
    return {
        "provider": row.get("provider") if row else "SAP S/4HANA",
        "baseUrl": row.get("base_url") if row else "",
        "authType": row.get("auth_type") if row else "Bearer Token",
        "clientId": row.get("client_id") if row else "",
        "clientSecret": row.get("client_secret") if row else "",
        "orderEndpoint": row.get("order_endpoint") if row else "",
        "syncMethod": row.get("sync_method") if row else "Pull every 15 minutes",
        "orderIdField": row.get("order_id_field") if row else "VBELN",
        "customerField": row.get("customer_field") if row else "KUNNR",
        "sourceField": row.get("source_field") if row else "WERKS_FROM",
        "destinationField": row.get("destination_field") if row else "WERKS_TO",
        "weightField": row.get("weight_field") if row else "BRGEW",
        "volumeField": row.get("volume_field") if row else "VOLUM",
        "status": "Connected" if row and row.get("status") == "Connected" else "Draft",
    }


def save_api_setup(setup: dict[str, Any]) -> dict[str, Any]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO api_setups (
          id, provider, base_url, auth_type, client_id, client_secret, order_endpoint, sync_method,
          order_id_field, customer_field, source_field, destination_field, weight_field, volume_field, status, updated_at
        )
        VALUES ('default', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          base_url = EXCLUDED.base_url,
          auth_type = EXCLUDED.auth_type,
          client_id = EXCLUDED.client_id,
          client_secret = EXCLUDED.client_secret,
          order_endpoint = EXCLUDED.order_endpoint,
          sync_method = EXCLUDED.sync_method,
          order_id_field = EXCLUDED.order_id_field,
          customer_field = EXCLUDED.customer_field,
          source_field = EXCLUDED.source_field,
          destination_field = EXCLUDED.destination_field,
          weight_field = EXCLUDED.weight_field,
          volume_field = EXCLUDED.volume_field,
          status = EXCLUDED.status,
          updated_at = NOW()
        """,
        (
            setup["provider"],
            setup["baseUrl"],
            setup["authType"],
            setup["clientId"],
            setup["clientSecret"],
            setup["orderEndpoint"],
            setup["syncMethod"],
            setup["orderIdField"],
            setup["customerField"],
            setup["sourceField"],
            setup["destinationField"],
            setup["weightField"],
            setup["volumeField"],
            setup["status"],
        ),
    )
    return get_api_setup()


def get_maintenance_entries() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, vehicle_id, vehicle_number, maintenance_type, service_date, next_due_date, service_cost, workshop_name, spare_parts, notes
        FROM maintenance_entries
        ORDER BY service_date DESC, created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "vehicleId": row["vehicle_id"],
            "vehicleNumber": row["vehicle_number"],
            "maintenanceType": row["maintenance_type"],
            "serviceDate": format_ymd(row["service_date"]),
            "nextDueDate": format_ymd(row["next_due_date"], "-"),
            "cost": f"Rs. {format_number_indian(decimal_to_float(row['service_cost']))}",
            "workshop": row["workshop_name"],
            "spareParts": row["spare_parts"],
            "notes": row["notes"],
        }
        for row in rows
    ]


def create_maintenance_entry(entry: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO maintenance_entries (
          id, vehicle_id, vehicle_number, maintenance_type, service_date, next_due_date, service_cost, workshop_name, spare_parts, notes, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"MNT-{800 + secrets.randbelow(9000)}",
            entry["vehicleId"],
            entry["vehicleNumber"],
            entry["maintenanceType"],
            entry["serviceDate"],
            entry.get("nextDueDate") or None,
            entry["serviceCost"],
            entry["workshop"],
            entry.get("spareParts") or "",
            entry["notes"],
        ),
    )
    return get_maintenance_entries()


def get_payment_entries() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, payee_name, payee_category, amount, payment_status, payment_method, due_date, paid_date, reference_number, notes
        FROM payment_entries
        ORDER BY created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "payeeName": row["payee_name"],
            "category": row["payee_category"],
            "amount": f"Rs. {format_number_indian(decimal_to_float(row['amount']))}",
            "status": row["payment_status"],
            "paymentMethod": row["payment_method"],
            "dueDate": format_ymd(row["due_date"], "-"),
            "paidDate": format_ymd(row["paid_date"], "-"),
            "referenceNumber": row["reference_number"],
            "notes": row["notes"],
        }
        for row in rows
    ]


def create_payment_entry(entry: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    execute(
        """
        INSERT INTO payment_entries (
          id, payee_name, payee_category, amount, payment_status, payment_method, due_date, paid_date, reference_number, notes, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"PAY-{900 + secrets.randbelow(9000)}",
            entry["payeeName"],
            entry["category"],
            entry["amount"],
            entry["status"],
            entry["paymentMethod"],
            entry.get("dueDate") or None,
            entry.get("paidDate") or None,
            entry.get("referenceNumber", ""),
            entry.get("notes", ""),
        ),
    )
    return get_payment_entries()


def get_transport_routes() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, route_name, start_location, end_location, distance_km, estimated_time, vehicle_type, via_points, color
        FROM transport_routes_custom
        ORDER BY created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "routeName": row["route_name"],
            "start": row["start_location"],
            "end": row["end_location"],
            "distanceKm": decimal_to_float(row["distance_km"]),
            "estTime": row["estimated_time"],
            "vehicleType": row["vehicle_type"],
            "viaPoints": row["via_points"],
            "color": row["color"],
        }
        for row in rows
    ]


def create_transport_route(route: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    colors = ["#1A73E8", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"]
    execute(
        """
        INSERT INTO transport_routes_custom (
          id, route_name, start_location, end_location, via_points, vehicle_type, distance_km, estimated_time, color, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"RT-{100 + secrets.randbelow(900)}",
            route["routeName"],
            route["start"],
            route["end"],
            route["viaPoints"],
            route["vehicleType"],
            route["distanceKm"],
            route["estTime"],
            colors[secrets.randbelow(len(colors))],
        ),
    )
    return get_transport_routes()


def get_weighments() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT id, vehicle_id, weighment_type, gross_weight, tare_weight, net_weight, material, recorded_at, status
        FROM weighments
        ORDER BY recorded_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "vehicle": row["vehicle_id"],
            "type": row["weighment_type"],
            "grossWeight": f"{format_number_indian(decimal_to_float(row['gross_weight']))} kg",
            "tareWeight": f"{format_number_indian(decimal_to_float(row['tare_weight']))} kg",
            "netWeight": f"{format_number_indian(decimal_to_float(row['net_weight']))} kg",
            "material": row["material"],
            "time": format_timestamp(row["recorded_at"]),
            "status": row["status"],
        }
        for row in rows
    ]


def create_weighment(entry: dict[str, Any]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    net_weight = max(float(entry["grossWeight"]) - float(entry["tareWeight"]), 0)
    execute(
        """
        INSERT INTO weighments (
          id, vehicle_id, weighment_type, gross_weight, tare_weight, net_weight, material, status, recorded_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            f"WB-{7000 + secrets.randbelow(9000)}",
            entry["vehicleId"],
            entry["type"],
            entry["grossWeight"],
            entry["tareWeight"],
            net_weight,
            entry["material"],
            entry.get("status") or "Completed",
        ),
    )
    return get_weighments()


def get_vehicle_assignments() -> list[dict[str, Any]]:
    ensure_custom_tables()
    rows = fetch_all("SELECT * FROM vehicle_assignments ORDER BY created_at DESC")
    return [
        {
            "id": row["id"],
            "deliveryId": row["delivery_id"],
            "customer": row["customer"],
            "source": row["source"],
            "destination": row["destination"],
            "quantityKg": decimal_to_float(row["quantity_kg"]),
            "loadType": row["load_type"],
            "recommendedTruckSize": row["recommended_truck_size"],
            "assignedVehicleId": row["assigned_vehicle_id"],
            "assignedVehicleType": row["assigned_vehicle_type"],
            "assignedVehicleCapacity": row["assigned_vehicle_capacity"],
            "assignedDriverId": row.get("assigned_driver_id") or "",
            "assignedDriverName": row.get("assigned_driver_name") or "",
            "assignedAssistantId": row.get("assigned_assistant_id") or "",
            "assignedAssistantName": row.get("assigned_assistant_name") or "",
            "gatePassId": row.get("gate_pass_id") or "",
            "gatePassStatus": row.get("gate_pass_status") or "Pending",
            "assignedBy": row["assigned_by"],
            "assignedByUserId": row["assigned_by_user_id"],
            "organization": row["organization"],
            "createdAt": format_timestamp(row["created_at"]),
            "notes": row["notes"],
        }
        for row in rows
    ]


def save_vehicle_assignments(assignments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_custom_tables()
    
    if assignments:
        delivery_ids = list(set(a.get("deliveryId") for a in assignments if a.get("deliveryId")))
        if delivery_ids:
            execute("DELETE FROM vehicle_assignments WHERE delivery_id = ANY(%s)", (delivery_ids,))

        for assignment in assignments:
            execute(
                """
                INSERT INTO vehicle_assignments (
                  id, delivery_id, customer, source, destination, quantity_kg, load_type, recommended_truck_size,
                  assigned_vehicle_id, assigned_vehicle_type, assigned_vehicle_capacity,
                  assigned_driver_id, assigned_driver_name, assigned_assistant_id, assigned_assistant_name,
                  gate_pass_id, gate_pass_status, assigned_by, assigned_by_user_id, organization, notes, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    assignment.get("id") or f"VA-{uuid.uuid4().hex[:8].upper()}",
                    assignment["deliveryId"],
                    assignment["customer"],
                    assignment["source"],
                    assignment["destination"],
                    assignment["quantityKg"],
                    assignment["loadType"],
                    assignment["recommendedTruckSize"],
                    assignment["assignedVehicleId"],
                    assignment["assignedVehicleType"],
                    assignment["assignedVehicleCapacity"],
                    assignment.get("assignedDriverId") or "",
                    assignment.get("assignedDriverName") or "",
                    assignment.get("assignedAssistantId") or "",
                    assignment.get("assignedAssistantName") or "",
                    assignment.get("gatePassId") or "",
                    assignment.get("gatePassStatus") or "Pending",
                    assignment["assignedBy"],
                    assignment["assignedByUserId"],
                    assignment["organization"],
                    assignment["notes"],
                    assignment.get("createdAt") or datetime.now(timezone.utc),
                ),
            )

            # Sync with gate_passes table to show in Gate Pass app
            gp_num = assignment.get("gatePassId")
            if gp_num:
                v_row = fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (assignment.get("assignedVehicleId"),))
                d_row = fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (assignment.get("assignedDriverId"),))
                o_row = fetch_one("SELECT id FROM orders WHERE order_number = %s LIMIT 1", (assignment.get("deliveryId"),))
                org_row = fetch_one("SELECT id FROM organizations WHERE name = %s LIMIT 1", (assignment.get("organization"),))
                
                execute(
                    """
                    INSERT INTO gate_passes (
                        gate_pass_number, organization_id, order_id, vehicle_id, driver_id, 
                        gate_status, remarks, security_person_name, challan_number, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (gate_pass_number) DO UPDATE SET
                        organization_id = EXCLUDED.organization_id,
                        order_id = EXCLUDED.order_id,
                        vehicle_id = EXCLUDED.vehicle_id,
                        driver_id = EXCLUDED.driver_id,
                        remarks = EXCLUDED.remarks,
                        security_person_name = EXCLUDED.security_person_name,
                        challan_number = EXCLUDED.challan_number,
                        updated_at = NOW()
                    """,
                    (
                        gp_num,
                        org_row["id"] if org_row else None,
                        o_row["id"] if o_row else None,
                        v_row["id"] if v_row else None,
                        d_row["id"] if d_row else None,
                        (assignment.get("gatePassStatus") or "Pending").lower(),
                        assignment.get("notes") or "Auto-assigned from Vehicle Assignment",
                        assignment.get("assignedBy") or "System",
                        assignment.get("challanNumber") or None,
                    )
                )
    return get_vehicle_assignments()


def get_orders():
    rows = fetch_all(
        """
        SELECT o.order_number, c.customer_name, o.pickup_address, o.drop_address, o.total_weight, o.unit, o.status, o.order_date
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.order_date ASC
        """
    )
    return {
        "orders": [
            {
                "id": row.get("order_number") or "UNKNOWN",
                "customer": row.get("customer_name") or "Unknown Customer",
                "source": row.get("pickup_address") or "Unknown",
                "destination": row.get("drop_address") or "Unknown",
                "weight": f"{format_number_indian(decimal_to_float(row['total_weight']))} {row.get('unit') or 'kg'}" if row.get("total_weight") is not None else "0 kg",
                "volume": "Standard CBM",
                "status": title_case(row.get("status"), "Pending"),
                "createdAt": format_ymd(row.get("order_date")),
            }
            for row in rows
        ]
    }


def parse_decimal(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    text = str(value).strip().replace(",", "")
    if not text:
        return default
    for suffix in ("kg", "cbm"):
        if text.lower().endswith(suffix):
            text = text[: -len(suffix)].strip()
    try:
        return float(text)
    except ValueError:
        return default


def ensure_customer_for_import(organization_id: str | None, customer_name: str) -> str | None:
    normalized_name = customer_name.strip()
    if not normalized_name:
        return None

    existing = fetch_one(
        """
        SELECT id
        FROM customers
        WHERE LOWER(customer_name) = LOWER(%s)
          AND (
            (%s IS NULL AND organization_id IS NULL)
            OR organization_id = %s
          )
        LIMIT 1
        """,
        (normalized_name, organization_id, organization_id),
    )
    if existing:
        return existing["id"]

    created = fetch_one(
        """
        INSERT INTO customers (organization_id, customer_code, customer_name, status)
        VALUES (%s, %s, %s, 'active')
        RETURNING id
        """,
        (
            organization_id,
            (make_slug(normalized_name) or normalized_name).upper()[:32],
            normalized_name,
        ),
    )
    return created["id"] if created else None


def save_imported_orders(orders: list[dict[str, Any]]) -> dict[str, Any]:
    ensure_bootstrap_data()
    imported_count = 0

    for order in orders:
        order_number = (order.get("id") or order.get("orderId") or "").strip()
        if not order_number:
            continue

        organization_id = None
        organization_name = (order.get("organization") or "").strip()
        if organization_name:
            organization = fetch_one(
                "SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1",
                (organization_name,),
            )
            if not organization:
                organization = ensure_organization(
                    {
                        "name": organization_name,
                        "maxUsers": get_seeded_org_user_limit(organization_name),
                        "address": "",
                        "phone": "",
                        "country": "India",
                        "email": "",
                        "pan": "",
                    }
                )
            organization_id = organization.get("id") if organization else None

        customer_id = ensure_customer_for_import(organization_id, str(order.get("customer") or "Unknown Customer"))
        total_weight = parse_decimal(order.get("weight"))
        total_quantity = parse_decimal(order.get("volume"))
        status = (str(order.get("status") or "Pending").strip() or "Pending").lower()
        unit = str(order.get("weightUnit") or "kg").strip() or "kg"

        existing = fetch_one("SELECT id FROM orders WHERE order_number = %s LIMIT 1", (order_number,))
        if existing:
            execute(
                """
                UPDATE orders
                SET organization_id = %s,
                    customer_id = %s,
                    pickup_address = %s,
                    drop_address = %s,
                    order_date = %s,
                    scheduled_pickup_date = %s,
                    scheduled_delivery_date = %s,
                    total_quantity = %s,
                    total_weight = %s,
                    unit = %s,
                    status = %s,
                    notes = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    organization_id,
                    customer_id,
                    order.get("source") or "",
                    order.get("destination") or "",
                    order.get("orderDate") or order.get("createdAt") or None,
                    order.get("pickupDate") or None,
                    order.get("deliveryDate") or None,
                    total_quantity,
                    total_weight,
                    unit,
                    status,
                    order.get("notes") or "",
                    existing["id"],
                ),
            )
        else:
            execute(
                """
                INSERT INTO orders (
                    organization_id, order_number, customer_id, pickup_address, drop_address,
                    order_date, scheduled_pickup_date, scheduled_delivery_date,
                    total_quantity, total_weight, unit, status, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    organization_id,
                    order_number,
                    customer_id,
                    order.get("source") or "",
                    order.get("destination") or "",
                    order.get("orderDate") or order.get("createdAt") or None,
                    order.get("pickupDate") or None,
                    order.get("deliveryDate") or None,
                    total_quantity,
                    total_weight,
                    unit,
                    status,
                    order.get("notes") or "",
                ),
            )

        imported_count += 1

    return {"ok": True, "imported": imported_count, "orders": get_orders()["orders"]}


def get_drivers():
    rows = fetch_all(
        """
        SELECT driver_code, driver_name, phone, license_number, status, photo_data, remarks
        FROM drivers
        ORDER BY driver_code ASC
        """
    )
    return {
        "drivers": [
            {
                "id": row.get("driver_code") or "Unknown",
                "name": row.get("driver_name") or "Unknown Driver",
                "phone": row.get("phone") or "N/A",
                "license": row.get("license_number") or "N/A",
                "photo": row.get("photo_data") or extract_driver_photo(row.get("remarks")),
                "tripsToday": 0,
                "rating": 5.0,
                "status": capitalize_status(row.get("status"), "In-Active"),
            }
            for row in rows
        ]
    }


def save_driver(driver: dict[str, Any]):
    organization = None
    if driver.get("organization"):
        organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (driver["organization"],))

    if driver.get("driverId"):
        existing = fetch_one("SELECT id, organization_id FROM drivers WHERE driver_code = %s LIMIT 1", (driver["driverId"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Driver not found")
        execute(
            """
            UPDATE drivers
            SET organization_id = %s, driver_name = %s, phone = %s, email = %s, license_number = %s, status = %s, photo_data = %s
            WHERE id = %s
            """,
            (
                organization["id"] if organization else existing.get("organization_id"),
                driver["name"],
                driver["phone"],
                driver.get("email"),
                driver["license"],
                (driver.get("status") or "in-active").lower(),
                driver.get("photo") or None,
                existing["id"],
            ),
        )
    else:
        count = fetch_one("SELECT COUNT(*) AS count FROM drivers")["count"]
        execute(
            """
            INSERT INTO drivers (organization_id, driver_code, driver_name, phone, email, license_number, status, photo_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                organization["id"] if organization else None,
                f"DRV-{401 + int(count)}",
                driver["name"],
                driver["phone"],
                driver.get("email"),
                driver["license"],
                (driver.get("status") or "in-active").lower(),
                driver.get("photo") or None,
            ),
        )
    return get_drivers()


def remove_driver(driver_id: str):
    existing = fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (driver_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Driver not found")
    execute("DELETE FROM drivers WHERE id = %s", (existing["id"],))
    return get_drivers()


def get_fleet():
    rows = fetch_all(
        """
        SELECT
          v.vehicle_number,
          v.vehicle_type,
          v.registration_number,
          v.capacity,
          v.capacity_unit,
          v.status,
          v.remarks,
          v.updated_at,
          v.organization_id,
          o.name AS organization_name
        FROM vehicles v
        LEFT JOIN organizations o ON o.id = v.organization_id
        ORDER BY vehicle_number ASC
        """
    )
    fleet = []
    for row in rows:
        status = (row.get("status") or "").lower()
        location = "Depot"
        if status in {"on trip", "loading"}:
            location = "On Route"
        elif status == "maintenance":
            location = "Workshop"
        ownership = row.get("remarks") or "Own Vehicle"
        if ownership.lower().startswith("ownership:"):
            ownership = ownership.split(":", 1)[1].strip() or "Own Vehicle"
        fleet.append(
            {
                "id": row.get("vehicle_number") or "Unknown",
                "registrationNumber": row.get("registration_number") or "",
                "ownership": ownership,
                "type": row.get("vehicle_type") or "Standard",
                "capacity": f"{format_number_indian(decimal_to_float(row['capacity']))} {row.get('capacity_unit') or 'kg'}" if row.get("capacity") is not None else "N/A",
                "location": location,
                "lastService": format_ymd(row.get("updated_at"), "Unknown"),
                "status": capitalize_status(row.get("status"), "Available"),
                "organizationId": row.get("organization_id"),
                "organizationName": row.get("organization_name") or "",
            }
        )
    return {"fleet": fleet}


def save_fleet(vehicle: dict[str, Any]):
    organization_name = (vehicle.get("organization") or "").strip()
    organization = None
    if organization_name:
        organization = fetch_one("SELECT id FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1", (organization_name,))

    if vehicle.get("vehicleId"):
        existing = fetch_one("SELECT id, status FROM vehicles WHERE vehicle_number = %s LIMIT 1", (vehicle["vehicleId"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        execute(
            """
            UPDATE vehicles
            SET organization_id = %s, vehicle_type = %s, registration_number = %s, capacity = %s, capacity_unit = 'kg', status = %s, remarks = %s
            WHERE id = %s
            """,
            (
                organization["id"] if organization else None,
                vehicle["vehicleType"],
                vehicle["vehicleNumber"],
                float(vehicle["capacityTon"]) * 1000,
                existing.get("status") or "available",
                f"Ownership: {vehicle['ownership']}",
                existing["id"],
            ),
        )
    else:
        count = fetch_one("SELECT COUNT(*) AS count FROM vehicles")["count"]
        execute(
            """
            INSERT INTO vehicles (organization_id, vehicle_number, vehicle_type, registration_number, capacity, capacity_unit, status, remarks)
            VALUES (%s, %s, %s, %s, %s, 'kg', 'available', %s)
            """,
            (
                organization["id"] if organization else None,
                f"VH-{200 + int(count) + 1}",
                vehicle["vehicleType"],
                vehicle["vehicleNumber"],
                float(vehicle["capacityTon"]) * 1000,
                f"Ownership: {vehicle['ownership']}",
            ),
        )
    return get_fleet()


def remove_fleet(vehicle_id: str):
    vehicle = fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (vehicle_id,))
    if not vehicle:
        return get_fleet()
    execute("DELETE FROM gate_passes WHERE vehicle_id = %s", (vehicle["id"],))
    execute("DELETE FROM trips WHERE vehicle_id = %s", (vehicle["id"],))
    execute("DELETE FROM vehicles WHERE id = %s", (vehicle["id"],))
    return get_fleet()


def get_gatepasses():
    ensure_custom_tables()
    rows = fetch_all(
        """
        SELECT gp.gate_pass_number, o.order_number, t.trip_number, v.vehicle_number, v.status AS vehicle_status, d.driver_name, d.license_number,
               gp.remarks, gp.security_person_name, gp.challan_number,
               gp.gate_status, gp.entry_time, gp.exit_time, gp.challan_pdf_url, gp.created_at
        FROM gate_passes gp
        LEFT JOIN orders o ON o.id = gp.order_id
        LEFT JOIN trips t ON t.id = gp.trip_id
        LEFT JOIN vehicles v ON v.id = gp.vehicle_id
        LEFT JOIN drivers d ON d.id = gp.driver_id
        ORDER BY gp.created_at DESC
        """
    )
    return {
        "gatePasses": [
            {
                "id": row.get("gate_pass_number") or "",
                "orderNo": row.get("order_number") or "",
                "deliveryNo": row.get("trip_number") or "",
                "vehicle": row.get("vehicle_number") or "",
                "depo": "Workshop"
                if row.get("vehicle_status") == "maintenance"
                else "On Route"
                if row.get("vehicle_status") == "on trip"
                else "Depot",
                "driver": row.get("driver_name") or "",
                "driverLicense": row.get("license_number") or "",
                "purpose": row.get("remarks") or "",
                "requestedBy": row.get("security_person_name") or "",
                "challanNo": row.get("challan_number") or "",
                "approvalStatus": title_case(row.get("gate_status"), "Pending"),
                "challanPdfUrl": row.get("challan_pdf_url") or "",
                "movementStatus": "Exited"
                if row.get("exit_time")
                else "Entered"
                if row.get("entry_time")
                else "Not Entered",
                "entryTime": format_timestamp(row.get("entry_time")) if row.get("entry_time") else None,
                "exitTime": format_timestamp(row.get("exit_time")) if row.get("exit_time") else None,
                "time": format_timestamp(row.get("created_at")),
            }
            for row in rows
        ]
    }


def get_trips():
    rows = fetch_all(
        """
        SELECT t.trip_number, t.start_location, t.end_location, t.planned_end_time, t.actual_end_time, t.distance_km, t.trip_status,
               v.vehicle_number, d.driver_name
        FROM trips t
        LEFT JOIN vehicles v ON v.id = t.vehicle_id
        LEFT JOIN drivers d ON d.id = t.driver_id
        ORDER BY t.updated_at DESC
        """
    )
    active_trips = []
    completed_trips = []
    for row in rows:
        base = {
            "id": row.get("trip_number") or "UNKNOWN",
            "vehicle": row.get("vehicle_number") or "Unknown",
            "driver": row.get("driver_name") or "Unknown",
        }
        if row.get("trip_status") == "completed":
            completed_trips.append(
                {
                    **base,
                    "distance": f"{decimal_to_float(row['distance_km'])} km" if row.get("distance_km") is not None else "N/A",
                    "completedAt": format_trip_datetime(row.get("actual_end_time")),
                }
            )
        else:
            status_label = "Planned"
            if row.get("trip_status") == "in transit":
                status_label = "In Transit"
            elif row.get("trip_status") == "loading":
                status_label = "Loading"
            elif row.get("trip_status") == "unloading":
                status_label = "Unloading"
            active_trips.append(
                {
                    **base,
                    "route": f"{row.get('start_location') or 'Unknown'} -> {row.get('end_location') or 'Unknown'}",
                    "eta": format_trip_datetime(row.get("planned_end_time")),
                    "status": status_label,
                }
            )
    return {"activeTrips": active_trips, "completedTrips": completed_trips}


def get_invoices():
    rows = fetch_all(
        """
        SELECT i.invoice_number, c.customer_name, i.total_amount, i.payment_status, i.created_at
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        ORDER BY i.created_at DESC
        """
    )
    return {
        "invoices": [
            {
                "id": row.get("invoice_number") or "Unknown",
                "tripId": "N/A",
                "customer": row.get("customer_name") or "Unknown Customer",
                "amount": decimal_to_float(row.get("total_amount")),
                "status": title_case(row.get("payment_status"), "Draft"),
                "createdAt": format_ymd(row.get("created_at"), "1970-01-01"),
            }
            for row in rows
        ]
    }


