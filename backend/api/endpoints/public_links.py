from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from db.models import SchedulingLink, User
from typing import Dict

router = APIRouter()

@router.get("/public/scheduling-links")
async def public_scheduling_links(db: Session = Depends(get_db)):
    # Get all scheduling links and their advisors
    links = db.query(SchedulingLink).all()
    advisors: Dict[int, Dict] = {}
    for link in links:
        user = db.query(User).filter_by(id=link.user_id).first()
        if not user:
            continue
        if user.id not in advisors:
            advisors[user.id] = {
                "advisor_name": user.name,
                "advisor_email": user.email,
                "links": []
            }
        advisors[user.id]["links"].append({
            "link_id": link.link_id,
            "usage_limit": link.usage_limit,
            "expiration_date": link.expiration_date,
            "meeting_length": link.meeting_length,
            "advance_schedule_days": link.advance_schedule_days,
            "questions": link.questions,
        })
    # Return as a list of advisors
    return list(advisors.values()) 