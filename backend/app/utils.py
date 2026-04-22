from __future__ import annotations

import hashlib
import secrets
from decimal import Decimal
from typing import Any

from app.constants import ACCESS_OPTIONS, ROLE_PERMISSION_MAP


def route_to_permission_code(route: str) -> str:
    return route.replace("/", "").replace("/", "-") or "root"


def permission_code_to_route(code: str) -> str | None:
    for item in ACCESS_OPTIONS:
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


def capitalize_status(status: str | None, default: str) -> str:
    if not status:
        return default
    lowered = status.lower()
    replacements = {"on trip": "On Trip", "on break": "On Break", "in transit": "In Transit"}
    return replacements.get(lowered, lowered[:1].upper() + lowered[1:])


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
    }


def to_session(user: dict[str, Any]) -> dict[str, Any]:
    custom_routes = [permission_code_to_route(code) for code in user.get("permissions", [])]
    access_routes = [route for route in custom_routes if route]
    has_explicit_permissions = "permissions" in user
    return {
        "userId": user.get("user_id") or "",
        "name": user.get("name") or "",
        "roles": user.get("roles", []),
        "accessRoutes": list(dict.fromkeys(access_routes)) if has_explicit_permissions else get_default_access_for_roles(user.get("roles", [])),
        "organization": user.get("organization_name") or "",
    }
