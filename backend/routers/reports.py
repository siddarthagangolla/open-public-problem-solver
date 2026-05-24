from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from database import get_db
from models import CategoryEnum
from datetime import datetime
import uuid
import os

router = APIRouter()

def generate_ticket_id():
    now = datetime.now()
    unique = str(uuid.uuid4())[:6].upper()
    return f"OPPS-{now.strftime('%Y%m%d')}-{unique}"

@router.get("/")
def get_all_reports():
    try:
        db = get_db()
        response = db.table("reports")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticket_id}")
def get_report_by_ticket(ticket_id: str):
    try:
        db = get_db()
        response = db.table("reports")\
            .select("*")\
            .eq("ticket_id", ticket_id)\
            .execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(""),
    is_anonymous: bool = Form(False),
    reporter_name: str = Form(""),
    reporter_email: str = Form(""),
    photo: UploadFile = File(None)
):
    try:
        db = get_db()
        ticket_id = generate_ticket_id()
        photo_url = None

        # Upload photo if provided
        if photo and photo.filename:
            photo_bytes = await photo.read()
            file_ext = photo.filename.split(".")[-1]
            file_name = f"{ticket_id}.{file_ext}"
            db.storage.from_("report-photos").upload(
                file_name,
                photo_bytes,
                {"content-type": photo.content_type}
            )
            supabase_url = os.getenv("SUPABASE_URL")
            photo_url = f"{supabase_url}/storage/v1/object/public/report-photos/{file_name}"

        # Insert report
        report_data = {
            "ticket_id": ticket_id,
            "title": title,
            "description": description,
            "category": category,
            "latitude": latitude,
            "longitude": longitude,
            "address": address,
            "is_anonymous": is_anonymous,
            "reporter_name": "" if is_anonymous else reporter_name,
            "reporter_email": "" if is_anonymous else reporter_email,
            "photo_url": photo_url,
            "status": "Pending",
            "confirm_count": 0,
            "fake_count": 0
        }

        response = db.table("reports").insert(report_data).execute()
        return {
            "success": True,
            "message": "Report submitted successfully!",
            "ticket_id": ticket_id,
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category/{category}")
def get_reports_by_category(category: str):
    try:
        db = get_db()
        response = db.table("reports")\
            .select("*")\
            .eq("category", category)\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{status}")
def get_reports_by_status(status: str):
    try:
        db = get_db()
        response = db.table("reports")\
            .select("*")\
            .eq("status", status)\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))