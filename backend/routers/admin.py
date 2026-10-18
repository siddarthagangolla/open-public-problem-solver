from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from database import get_db
from jose import jwt
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()
router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = os.getenv("ALGORITHM")

def verify_admin_token(authorization: str):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/reports")
def get_all_reports_admin(authorization: str = Header(...)):
    verify_admin_token(authorization)
    try:
        db = get_db()
        response = db.table("reports").select("*").order("created_at", desc=True).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reports/{report_id}")
async def update_report_status(
    report_id: str,
    status: str = Form(...),
    admin_comment: str = Form(""),
    authorization: str = Header(...),
    after_photo: UploadFile = File(None)
):
    verify_admin_token(authorization)
    try:
        db = get_db()
        update_data = {"status": status, "admin_comment": admin_comment}

        if after_photo and after_photo.filename:
            try:
                photo_bytes = await after_photo.read()
                file_name = f"after_{report_id}.{after_photo.filename.split('.')[-1]}"
                db.storage.from_("report-photos").upload(
                    file_name, photo_bytes,
                    {"content-type": after_photo.content_type}
                )
                supabase_url = os.getenv("SUPABASE_URL")
                update_data["after_photo_url"] = f"{supabase_url}/storage/v1/object/public/report-photos/{file_name}"
            except Exception as e:
                print(f"After photo error: {e}")

        if status == "Resolved":
            update_data["resolved_at"] = datetime.utcnow().isoformat()

        response = db.table("reports").update(update_data).eq("id", report_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Report not found")

        report = response.data[0]

        if status == "Resolved" and report.get("reporter_email"):
            try:
                resolved = db.table("reports").select("id").eq(
                    "reporter_email", report["reporter_email"]
                ).eq("status", "Resolved").execute()
                count = len(resolved.data)
                badge  = "Bronze"
                points = 100
                if count >= 10:
                    badge = "Platinum"; points = 500
                elif count >= 5:
                    badge = "Gold";     points = 300
                elif count >= 3:
                    badge = "Silver";   points = 200

                existing = db.table("rewards").select("id").eq("report_id", report_id).execute()
                if not existing.data:
                    db.table("rewards").insert({
                        "reporter_email": report["reporter_email"],
                        "reporter_name":  report.get("reporter_name", ""),
                        "report_id":      report_id,
                        "ticket_id":      report["ticket_id"],
                        "points":         points,
                        "badge":          badge
                    }).execute()
            except Exception as reward_error:
                print(f"Reward error: {reward_error}")

        return {"success": True, "message": f"Status updated to {status}", "data": report}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_dashboard_stats(authorization: str = Header(...)):
    verify_admin_token(authorization)
    try:
        db = get_db()
        all_reports = db.table("reports").select("status").execute()
        reports = all_reports.data
        stats = {
            "total":       len(reports),
            "pending":     len([r for r in reports if r["status"] == "Pending"]),
            "verified":    len([r for r in reports if r["status"] == "Verified"]),
            "in_progress": len([r for r in reports if r["status"] == "In Progress"]),
            "resolved":    len([r for r in reports if r["status"] == "Resolved"]),
            "fake":        len([r for r in reports if r["status"] == "Fake"]),
        }
        return {"success": True, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{report_id}")
def delete_report(report_id: str, authorization: str = Header(...)):
    verify_admin_token(authorization)
    try:
        db = get_db()
        db.table("rewards").delete().eq("report_id", report_id).execute()
        db.table("reports").delete().eq("id", report_id).execute()
        return {"success": True, "message": "Report deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))