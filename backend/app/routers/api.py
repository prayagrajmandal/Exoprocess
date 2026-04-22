from concurrent.futures import ThreadPoolExecutor
import logging
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from app.services import tms


router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parents[2]
CHALLAN_UPLOAD_DIR = BASE_DIR / "uploads" / "challans"


@router.get("/health")
def api_health():
    return {"ok": True}


@router.get("/orders")
def orders():
    return tms.get_orders()


@router.post("/orders/import")
async def orders_import(request: Request):
    body = await request.json()
    orders = body.get("orders")
    if isinstance(orders, list):
        return tms.save_imported_orders(orders)

    order = body.get("order")
    if order:
        organization = body.get("organization")
        payload = dict(order)
        if organization and "organization" not in payload:
            payload["organization"] = organization
        return tms.save_imported_orders([payload])

    raise HTTPException(status_code=400, detail="Order payload is required")


@router.get("/drivers")
def drivers():
    return tms.get_drivers()


@router.post("/drivers")
async def drivers_save(request: Request):
    body = await request.json()
    driver = body.get("driver")
    if not driver:
        raise HTTPException(status_code=400, detail="Driver is required")
    return tms.save_driver(driver)


@router.delete("/drivers")
async def drivers_remove(request: Request):
    body = await request.json()
    driver_id = body.get("driverId")
    if not driver_id:
        raise HTTPException(status_code=400, detail="Driver ID is required")
    return tms.remove_driver(driver_id)


@router.get("/fleet")
def fleet():
    return tms.get_fleet()


@router.post("/fleet")
async def fleet_save(request: Request):
    body = await request.json()
    vehicle = body.get("vehicle")
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle is required")
    return tms.save_fleet(vehicle)


@router.delete("/fleet")
async def fleet_remove(request: Request):
    body = await request.json()
    vehicle_id = body.get("vehicleId")
    if not vehicle_id:
        raise HTTPException(status_code=400, detail="Vehicle ID is required")
    return tms.remove_fleet(vehicle_id)


@router.get("/gatepasses")
def gatepasses():
    return tms.get_gatepasses()


@router.get("/gatepasses/challan/files/{filename}")
def get_gatepass_challan_file(filename: str):
    file_path = CHALLAN_UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Challan file not found")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=file_path.name,
        content_disposition_type="inline",
    )


async def store_gatepass_challan(gate_pass_id: str, file: UploadFile):
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    existing = tms.fetch_one("SELECT id, gate_pass_number FROM gate_passes WHERE gate_pass_number = %s LIMIT 1", (gate_pass_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Gate pass not found")

    CHALLAN_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe_gate_pass_id = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in gate_pass_id).strip("-")
    if not safe_gate_pass_id:
        safe_gate_pass_id = existing["gate_pass_number"]
    stored_filename = f"{safe_gate_pass_id}.pdf"
    stored_path = CHALLAN_UPLOAD_DIR / stored_filename

    contents = await file.read()
    with stored_path.open("wb") as output_file:
        output_file.write(contents)

    challan_url = f"/api/gatepasses/challan/files/{stored_filename}"
    tms.execute("UPDATE gate_passes SET challan_pdf_url = %s WHERE id = %s", (challan_url, existing["id"]))

    return {
        "ok": True,
        "gatePassId": gate_pass_id,
        "challanPdfUrl": challan_url,
        "filename": stored_filename,
    }


@router.post("/gatepasses/{gate_pass_id}/challan")
async def upload_gatepass_challan(gate_pass_id: str, file: UploadFile = File(...)):
    return await store_gatepass_challan(gate_pass_id, file)


@router.post("/gatepasses/challan")
async def upload_gatepass_challan_by_order_no(orderNo: str = Form(...), file: UploadFile = File(...)):
    return await store_gatepass_challan(orderNo, file)


@router.post("/gatepasses")
async def gatepasses_save(request: Request):
    body = await request.json()
    tms.ensure_custom_tables()
    if body.get("movementUpdate"):
        movement_update = body["movementUpdate"]
        existing = tms.fetch_one("SELECT id FROM gate_passes WHERE gate_pass_number = %s LIMIT 1", (movement_update["id"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Gate pass not found")

        action = movement_update["action"].lower()
        if action == "entry":
            tms.execute(
                "UPDATE gate_passes SET entry_time = COALESCE(entry_time, NOW()) WHERE id = %s",
                (existing["id"],),
            )
        elif action == "exit":
            tms.execute(
                "UPDATE gate_passes SET entry_time = COALESCE(entry_time, NOW()), exit_time = NOW() WHERE id = %s",
                (existing["id"],),
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported movement action")
        return tms.get_gatepasses()

    if body.get("statusUpdate"):
        status_update = body["statusUpdate"]
        existing = tms.fetch_one("SELECT id FROM gate_passes WHERE gate_pass_number = %s LIMIT 1", (status_update["id"],))
        if not existing:
            raise HTTPException(status_code=404, detail="Gate pass not found")
        tms.execute("UPDATE gate_passes SET gate_status = %s WHERE id = %s", (status_update["status"].lower(), existing["id"]))
        return tms.get_gatepasses()

    gate_pass = body.get("gatePass")
    if not gate_pass:
        raise HTTPException(status_code=400, detail="Gate pass payload is required")

    count = tms.fetch_one("SELECT COUNT(*) AS count FROM gate_passes")["count"]
    vehicle = tms.fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (gate_pass["vehicleId"],))
    driver = tms.fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (gate_pass["driverId"],))
    if not vehicle or not driver:
        raise HTTPException(status_code=400, detail="Vehicle or driver not found")
    tms.execute(
        """
        INSERT INTO gate_passes (gate_pass_number, vehicle_id, driver_id, gate_status, security_person_name, remarks, challan_pdf_url, exit_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            f"GP-{500 + int(count) + 1}",
            vehicle["id"],
            driver["id"],
            gate_pass["approvalStatus"].lower(),
            gate_pass["requestedBy"],
            gate_pass["purpose"],
            gate_pass.get("challanPdfUrl") or None,
            gate_pass.get("expectedReturn") or None,
        ),
    )
    return tms.get_gatepasses()


@router.get("/trips")
def trips():
    return tms.get_trips()


@router.get("/tracking")
def tracking():
    try:
        return tms.get_tracking_feed()
    except Exception as exc:  # pragma: no cover - defensive fallback for live GPS feeds
        logger.exception("Tracking feed request failed")
        return {
            "vehicles": [],
            "stats": {
                "total": 0,
                "moving": 0,
                "delayed": 0,
                "stopped": 0,
                "avgEtaMinutes": 0,
                "latestUpdate": "",
            },
            "source": "gps_data_m",
            "error": str(exc),
        }


@router.get("/invoices")
def invoices():
    return tms.get_invoices()


@router.post("/auth/login")
async def auth_login(request: Request):
    body = await request.json()
    try:
        result = tms.authenticate_user_from_db(body.get("organization", ""), body.get("userId", ""), body.get("password", ""))
        if not result:
            return JSONResponse(status_code=401, content={"error": "Invalid organization, User ID, or Password."})
        return result
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.get("/auth/session")
def auth_session(token: str = Query(default="")):
    session = tms.get_session_from_token(token)
    if not session:
        return JSONResponse(status_code=401, content={"session": None})
    return {"session": session}


@router.post("/auth/logout")
async def auth_logout(request: Request):
    body = await request.json()
    tms.clear_session_token(body.get("token", ""))
    return {"ok": True}


@router.get("/organizations")
def organizations():
    return {"organizations": tms.get_organizations_from_db()}


@router.post("/organizations")
async def organizations_save(request: Request):
    body = await request.json()
    return {"organizations": tms.save_organizations_to_db(body.get("organizations", []))}


@router.post("/organizations/save")
async def organization_save(request: Request):
    body = await request.json()
    try:
        return {"organizations": tms.save_organization_to_db(body.get("organization", {}))}
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.delete("/organizations")
async def organizations_remove(request: Request):
    body = await request.json()
    try:
        return {"organizations": tms.delete_organization_in_db(body.get("organizationName", ""))}
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.post("/organizations/reset")
def organizations_reset():
    return {"organizations": tms.reset_organizations_in_db()}


@router.get("/users")
def users():
    return {"users": tms.get_users_from_db()}


@router.get("/permissions")
def permissions():
    return {"permissions": tms.get_permission_options_from_db()}


@router.get("/admin/bootstrap")
def admin_bootstrap():
    with ThreadPoolExecutor(max_workers=3) as executor:
        users_future = executor.submit(tms.get_users_from_db)
        organizations_future = executor.submit(tms.get_organizations_from_db)
        permissions_future = executor.submit(tms.get_permission_options_from_db)

        return {
            "users": users_future.result(),
            "organizations": organizations_future.result(),
            "permissions": permissions_future.result(),
        }


@router.post("/users")
async def users_save(request: Request):
    body = await request.json()
    return {"users": tms.save_users_to_db(body.get("users", []))}


@router.post("/users/access")
async def users_access_save(request: Request):
    body = await request.json()
    try:
        return {
            "users": tms.save_user_access_in_db(
                body.get("organization", ""),
                body.get("userId", ""),
                body.get("accessRoutes", []),
            )
        }
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.post("/users/edit-access")
async def users_edit_access_save(request: Request):
    body = await request.json()
    try:
        return {
            "users": tms.save_user_edit_access_in_db(
                body.get("organization", ""),
                body.get("userId", ""),
                body.get("editRoutes", []),
            )
        }
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.delete("/users")
async def users_remove(request: Request):
    body = await request.json()
    try:
        return {"users": tms.delete_user_in_db(body.get("organization", ""), body.get("userId", ""))}
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@router.post("/users/reset")
def users_reset():
    return {"users": tms.reset_users_in_db()}


@router.get("/settings")
def settings():
    return {"settings": tms.get_app_settings()}


@router.post("/settings")
async def settings_save(request: Request):
    body = await request.json()
    settings = body.get("settings") or {
        "companyName": "",
        "contactEmail": "",
        "googleMapsKey": "",
        "gpsProvider": "JioGPS",
    }
    return {"settings": tms.save_app_settings(settings)}


@router.get("/api-setup")
def api_setup():
    return {"setup": tms.get_api_setup()}


@router.post("/api-setup")
async def api_setup_save(request: Request):
    body = await request.json()
    setup = body.get("setup") or {
        "provider": "SAP S/4HANA",
        "baseUrl": "",
        "authType": "Bearer Token",
        "clientId": "",
        "clientSecret": "",
        "orderEndpoint": "",
        "syncMethod": "Pull every 15 minutes",
        "orderIdField": "VBELN",
        "customerField": "KUNNR",
        "sourceField": "WERKS_FROM",
        "destinationField": "WERKS_TO",
        "weightField": "BRGEW",
        "volumeField": "VOLUM",
        "status": "Draft",
    }
    return {"setup": tms.save_api_setup(setup)}


@router.get("/maintenance")
def maintenance():
    return {"entries": tms.get_maintenance_entries()}


@router.post("/maintenance")
async def maintenance_save(request: Request):
    body = await request.json()
    entry = body.get("entry")
    if not entry:
        raise HTTPException(status_code=400, detail="Entry is required")
    return {"entries": tms.create_maintenance_entry(entry)}


@router.get("/payments")
def payments():
    return {"entries": tms.get_payment_entries()}


@router.post("/payments")
async def payments_save(request: Request):
    body = await request.json()
    entry = body.get("entry")
    if not entry:
        raise HTTPException(status_code=400, detail="Entry is required")
    return {"entries": tms.create_payment_entry(entry)}


@router.get("/routes-map")
def routes_map():
    return {"routes": tms.get_transport_routes()}


@router.post("/routes-map")
async def routes_map_save(request: Request):
    body = await request.json()
    route = body.get("route")
    if not route:
        raise HTTPException(status_code=400, detail="Route is required")
    return {"routes": tms.create_transport_route(route)}


@router.get("/weighments")
def weighments():
    return {"weighments": tms.get_weighments()}


@router.post("/weighments")
async def weighments_save(request: Request):
    body = await request.json()
    weighment = body.get("weighment")
    if not weighment:
        raise HTTPException(status_code=400, detail="Weighment is required")
    return {"weighments": tms.create_weighment(weighment)}


@router.get("/vehicle-assignments")
def vehicle_assignments():
    return {"assignments": tms.get_vehicle_assignments()}


@router.post("/vehicle-assignments")
async def vehicle_assignments_save(request: Request):
    body = await request.json()
    return {"assignments": tms.save_vehicle_assignments(body.get("assignments", []))}
