from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from database import get_db
from datetime import datetime
import uuid, os, base64, httpx, anthropic

router = APIRouter()

def generate_ticket_id():
    now = datetime.now()
    unique = str(uuid.uuid4())[:6].upper()
    return f"OPPS-{now.strftime('%Y%m%d')}-{unique}"

async def analyze_image_with_ai(image_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": content_type,
                            "data": image_b64
                        }
                    },
                    {
                        "type": "text",
                        "text": """You are a civic problem detection AI. Analyze this image and identify the public/civic problem shown.
Return ONLY a valid JSON object like this (no extra text):
{
  "category": "Pothole",
  "title": "Deep pothole filled with water",
  "description": "A large pothole approximately 2 feet wide filled with rainwater, posing danger to vehicles and pedestrians",
  "severity": "High",
  "confidence": 92,
  "location_hint": "Road surface, appears to be a main road"
}
Categories must be one of: Pothole, Waterlogging, Broken Road, Streetlight, Garbage, Drain Overflow, Other
Severity must be one of: Low, Medium, High, Critical"""
                    }
                ]
            }]
        )
        text = message.content[0].text
        start = text.find('{')
        end = text.rfind('}') + 1
        if start >= 0 and end > start:
            import json
            result = json.loads(text[start:end])
            return {
                "category":      result.get("category", "Other"),
                "title":         result.get("title", ""),
                "description":   result.get("description", ""),
                "severity":      result.get("severity", "Medium"),
                "confidence":    result.get("confidence", 0),
                "location_hint": result.get("location_hint", "")
            }
    except Exception as e:
        print(f"AI analysis error: {e}")
    return {"category": None, "title": None, "description": None, "severity": None, "confidence": 0, "location_hint": None}

@router.post("/analyze-photo")
async def analyze_photo(photo: UploadFile = File(...)):
    try:
        photo_bytes = await photo.read()
        result = await analyze_image_with_ai(photo_bytes, photo.content_type or "image/jpeg")
        return {"success": True, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_all_reports():
    try:
        db = get_db()
        response = db.table("reports").select("*").order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-email/{email}")
def get_reports_by_email(email: str):
    try:
        db = get_db()
        reports = db.table("reports").select("*").eq("reporter_email", email).order("created_at", desc=True).execute()
        rewards = db.table("rewards").select("*").eq("reporter_email", email).execute()
        total_points = sum(r.get("points", 0) for r in rewards.data)
        return {"success": True, "data": reports.data, "rewards": rewards.data, "total_points": total_points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{status}")
def get_reports_by_status(status: str):
    try:
        db = get_db()
        response = db.table("reports").select("*").eq("status", status).order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category/{category}")
def get_reports_by_category(category: str):
    try:
        db = get_db()
        response = db.table("reports").select("*").eq("category", category).order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticket_id}")
def get_report_by_ticket(ticket_id: str):
    try:
        db = get_db()
        response = db.table("reports").select("*").eq("ticket_id", ticket_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Report not found")
        report = response.data[0]
        rewards = db.table("rewards").select("*").eq("report_id", report["id"]).execute()
        return {"success": True, "data": report, "rewards": rewards.data}
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
    ai_detected_category: str = Form(""),
    ai_confidence: float = Form(0),
    ai_description: str = Form(""),
    photo: UploadFile = File(None)
):
    try:
        db = get_db()
        ticket_id = generate_ticket_id()
        photo_url = None

        if photo and photo.filename:
            try:
                photo_bytes = await photo.read()
                file_ext = photo.filename.split(".")[-1]
                file_name = f"{ticket_id}.{file_ext}"
                db.storage.from_("report-photos").upload(
                    file_name, photo_bytes,
                    {"content-type": photo.content_type}
                )
                supabase_url = os.getenv("SUPABASE_URL")
                photo_url = f"{supabase_url}/storage/v1/object/public/report-photos/{file_name}"
            except Exception as photo_error:
                print(f"Photo upload error: {photo_error}")

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
            "fake_count": 0,
            "ai_detected_category": ai_detected_category,
            "ai_confidence": ai_confidence,
            "ai_description": ai_description
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