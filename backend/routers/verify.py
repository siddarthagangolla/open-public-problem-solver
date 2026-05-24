from fastapi import APIRouter, HTTPException
from database import get_db
from models import VoteCreate

router = APIRouter()

@router.post("/")
def vote_on_report(vote_data: VoteCreate):
    try:
        db = get_db()

        # Check if report exists
        report = db.table("reports")\
            .select("*")\
            .eq("id", vote_data.report_id)\
            .execute()

        if not report.data:
            raise HTTPException(status_code=404, detail="Report not found")

        # Check if user already voted
        existing = db.table("verifications")\
            .select("*")\
            .eq("report_id", vote_data.report_id)\
            .eq("voter_email", vote_data.voter_email)\
            .execute()

        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="You have already voted on this report"
            )

        # Insert vote
        db.table("verifications").insert({
            "report_id": vote_data.report_id,
            "voter_email": vote_data.voter_email,
            "vote": vote_data.vote
        }).execute()

        # Get updated counts
        updated = db.table("reports")\
            .select("confirm_count, fake_count, status")\
            .eq("id", vote_data.report_id)\
            .execute()

        return {
            "success": True,
            "message": f"Your vote '{vote_data.vote}' has been recorded!",
            "updated_counts": updated.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{report_id}")
def get_votes_for_report(report_id: str):
    try:
        db = get_db()
        response = db.table("verifications")\
            .select("*")\
            .eq("report_id", report_id)\
            .execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))