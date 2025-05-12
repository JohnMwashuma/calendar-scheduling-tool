from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from core.database import get_db
from api.deps import get_current_user
from crud.scheduling_link import create_scheduling_link, get_scheduling_links_by_user_id
from schemas.scheduling_link import SchedulingLinkCreate, SchedulingLinkOut
import uuid
from schemas.meeting import MeetingCreate
from crud.meeting import create_meeting, is_time_slot_available
from db.models import SchedulingLink, User
from core.email_utils import send_email

router = APIRouter()

@router.post("/scheduling-links", response_model=SchedulingLinkOut)
async def create_link(
    data: SchedulingLinkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    link_id = str(uuid.uuid4())
    link = create_scheduling_link(
        db=db,
        user_id=current_user.id,
        link_id=link_id,
        usage_limit=data.usage_limit,
        expiration_date=data.expiration_date,
        meeting_length=data.meeting_length,
        advance_schedule_days=data.advance_schedule_days,
        questions=data.questions,
    )
    return link

@router.get("/scheduling-links", response_model=List[SchedulingLinkOut])
async def list_links(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_scheduling_links_by_user_id(db, current_user.id)

@router.post("/schedule/{link_id}/book")
async def book_meeting(
    link_id: str,
    data: MeetingCreate,
    db: Session = Depends(get_db)
):
    link = db.query(SchedulingLink).filter_by(link_id=link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Scheduling link not found.")
    if link.expiration_date and link.expiration_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This scheduling link has expired.")
    if link.usage_limit is not None and link.usage_limit <= 0:
        raise HTTPException(status_code=400, detail="This scheduling link has reached its usage limit.")

    start_time = data.time
    end_time = start_time + timedelta(minutes=link.meeting_length)

    # Check slot availability
    if not is_time_slot_available(db, link_id, start_time, end_time):
        raise HTTPException(status_code=400, detail="Time slot is no longer available.")

    # Create meeting
    create_meeting(
        db,
        advisor_id=link.user_id,
        link_id=link_id,
        start_time=start_time,
        end_time=end_time,
        client_email=data.email,
        client_linkedin=data.linkedin,
        answers=data.answers,
    )

    # Decrement usage limit
    if link.usage_limit is not None:
        link.usage_limit -= 1
        db.commit()

    # Send email to advisor
    advisor = db.query(User).filter_by(id=link.user_id).first()
    if advisor:
        subject = f"New Meeting Booking: {link.link_id}"
        answers_str = "\n".join(
            f"{q}: {a}" for q, a in zip(link.questions or [], data.answers or [])
        )
        body = (
            f"You have a new meeting booking!\n"
            f"Client Email: {data.email}\n"
            f"Scheduled Time: {start_time.strftime('%Y-%m-%d %H:%M')}\n"
            f"Answers to Questions:\n{answers_str}"
        )
        send_email(advisor.email, subject, body)

    return {"success": True, "message": "Booking confirmed."}