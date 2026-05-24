from fastapi import APIRouter, HTTPException, Header
from database import get_db
from models import AdminUpdate
from jose import jwt
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def verify_admin_token(authorization: str):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/reports")
def get_all_reports_admin(authorization: str = Header(...)):
    verify_admin_token(authorization)
    try:
        db = get_db()
        response = db.table("reports")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/reports/{report_id}")
def update_report_status(
    report_id: str,
    update_data: AdminUpdate,
    authorization: str = Header(...)
):
    verify_admin_token(authorization)
    try:
        db = get_db()
        response = db.table("reports").update({
            "status": update_data.status,
            "admin_comment": update_data.admin_comment
        }).eq("id", report_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Report not found")

        return {
            "success": True,
            "message": f"Report status updated to {update_data.status}",
            "data": response.data[0]
        }
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
            "total": len(reports),
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
        db.table("reports").delete().eq("id", report_id).execute()
        return {"success": True, "message": "Report deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))