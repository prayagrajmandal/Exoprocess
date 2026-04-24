from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.services import tms


router = APIRouter(prefix="/api/clogo")
BASE_DIR = Path(__file__).resolve().parents[2]
CLOGO_UPLOAD_DIR = BASE_DIR / "uploads" / "clogo"


def _safe_filename(value: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in value).strip("-")
    return safe or "clogo"


async def _store_logo_file(organization_name: str, file: UploadFile) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    CLOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    organization = tms.fetch_one(
        "SELECT id, name FROM organizations WHERE LOWER(name) = LOWER(%s) LIMIT 1",
        (organization_name.strip(),),
    )
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"}:
        suffix = ".png"

    stored_filename = f"{_safe_filename(organization['name'])}{suffix}"
    stored_path = CLOGO_UPLOAD_DIR / stored_filename
    contents = await file.read()
    stored_path.write_bytes(contents)

    logo_url = f"/api/clogo/files/{stored_filename}"
    tms.save_organization_logo_data(organization["name"], logo_url)
    return {
        "organizationName": organization["name"],
        "logoData": logo_url,
        "filename": stored_filename,
    }


@router.get("/files/{filename}")
def get_clogo_file(filename: str):
    file_path = CLOGO_UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Organization logo file not found")
    return FileResponse(file_path, filename=file_path.name, content_disposition_type="inline")


@router.post("/upload")
async def upload_clogo(organizationName: str = Form(...), file: UploadFile = File(...)):
    return await _store_logo_file(organizationName, file)


@router.get("/{organization_name}")
def get_clogo(organization_name: str):
    result = tms.get_organization_logo_data(organization_name)
    if not result:
        raise HTTPException(status_code=404, detail="Organization logo not found")
    return result


@router.post("")
async def save_clogo(request: Request):
    body = await request.json()
    organization_name = (body.get("organizationName") or "").strip()
    logo_data = body.get("logoData") or ""
    if not organization_name:
        raise HTTPException(status_code=400, detail="Organization name is required")

    result = tms.save_organization_logo_data(organization_name, logo_data)
    if not result:
        raise HTTPException(status_code=404, detail="Organization not found")
    return result


@router.delete("/{organization_name}")
def delete_clogo(organization_name: str):
    result = tms.save_organization_logo_data(organization_name, "")
    if not result:
        raise HTTPException(status_code=404, detail="Organization not found")
    return result
