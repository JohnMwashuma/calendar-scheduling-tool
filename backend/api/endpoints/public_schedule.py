from fastapi import APIRouter, HTTPException, Path, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from db.models import SchedulingLink, SchedulingWindow, User
from datetime import datetime, timedelta, date, time
from typing import Dict, List

router = APIRouter()

@router.get("/schedule/{link_id}")
async def public_schedule(
    link_id: str = Path(...),
    db: Session = Depends(get_db),
):
    # 1. Retrieve the SchedulingLink
    link = db.query(SchedulingLink).filter_by(link_id=link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Scheduling link not found.")
    # 2. Check expiration and usage limit
    if link.expiration_date and link.expiration_date < datetime.utcnow():
        return {"error": "This scheduling link has expired."}
    if link.usage_limit is not None and link.usage_limit <= 0:
        return {"error": "This scheduling link has reached its usage limit."}
    # 3. Get advisor info
    user = db.query(User).filter_by(id=link.user_id).first()
    advisor_name = user.name if user else "Advisor"
    # 4. Get scheduling windows
    windows = db.query(SchedulingWindow).filter_by(user_id=link.user_id).all()
    # 5. Calculate available slots (placeholder logic)
    today = date.today()
    available_slots: Dict[str, List[str]] = {}
    for day_offset in range(link.advance_schedule_days + 1):
        d = today + timedelta(days=day_offset)
        slots = []
        for w in windows:
            # Example: generate slots every meeting_length minutes between start and end
            start = datetime.combine(d, w.start_time)
            end = datetime.combine(d, w.end_time)
            t = start
            while t + timedelta(minutes=link.meeting_length) <= end:
                slots.append(t.strftime('%H:%M'))
                t += timedelta(minutes=link.meeting_length)
        if slots:
            available_slots[d.isoformat()] = slots
    return {
        "link_id": link.link_id,
        "advisor_name": advisor_name,
        "meeting_length": link.meeting_length,
        "available_slots": available_slots,
    } 