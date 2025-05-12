from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from core.database import get_db
from api.deps import get_current_user
from crud.scheduling_link import create_scheduling_link, get_scheduling_links_by_user_id
from schemas.scheduling_link import SchedulingLinkCreate, SchedulingLinkOut
import uuid
from schemas.meeting import MeetingCreate, MeetingOut
from crud.meeting import create_meeting, is_time_slot_available, get_meetings_by_advisor_id, get_meeting_by_id
from db.models import SchedulingLink, User, HubspotConnection
from core.email_utils import send_email
from core.hubspot_utils import get_hubspot_contact_by_email_with_notes
from core.linkedin_utils import is_valid_linkedin_url, scrape_linkedin_profile, extract_linkedin_username
from core.ai_utils import generate_linkedin_summary, augment_answers_with_notes
from core.config import LINKEDIN_SCRAPING_ENABLED
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
        raise HTTPException(
            status_code=404, detail="Scheduling link not found.")
    if link.expiration_date and link.expiration_date < datetime.utcnow():
        raise HTTPException(
            status_code=400, detail="This scheduling link has expired.")
    if link.usage_limit is not None and link.usage_limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="This scheduling link has reached its usage limit."
        )

    start_time = data.time
    end_time = start_time + timedelta(minutes=link.meeting_length)

    # Check slot availability
    if not is_time_slot_available(db, link_id, start_time, end_time):
        raise HTTPException(
            status_code=400,
            detail="Time slot is no longer available."
        )

    # Initialize variables for contact information
    linkedin_summary = None
    linkedin_info_str = ""
    contact_info_str = ""
    
    # Try to enrich with HubSpot contact details and notes
    hubspot_conn = db.query(HubspotConnection).filter_by(user_id=link.user_id).first()
    contact_details = None
    contact_notes = []
    if hubspot_conn and hubspot_conn.access_token:
        contact_details = get_hubspot_contact_by_email_with_notes(data.email, hubspot_conn.access_token)
        if contact_details:
            contact_info_str = "\n".join(f"{k}: {v}" for k, v in contact_details.items() if v and k != "notes")
            contact_notes = [n["content"] for n in contact_details.get("notes", []) if n.get("content")]
    
    # Process LinkedIn data if available and no detailed contact
    normalized_linkedin = data.linkedin
    if data.linkedin and LINKEDIN_SCRAPING_ENABLED:
        if not data.linkedin.startswith((
            'http://', 'https://')) and not is_valid_linkedin_url(
                data.linkedin):
            normalized_linkedin = f"https://www.linkedin.com/in/{data.linkedin}"
        if not contact_details or len(contact_details) < 3:
            if is_valid_linkedin_url(normalized_linkedin):
                profile_data = await scrape_linkedin_profile(normalized_linkedin)
                if profile_data:
                    linkedin_summary = await generate_linkedin_summary(profile_data)
                    if linkedin_summary:
                        linkedin_info_str = f"\n\nLinkedIn Profile Summary:\n{linkedin_summary}"

    # Choose context for augmentation: HubSpot notes if available, else LinkedIn summary
    context_for_augmentation = None
    if contact_notes:
        context_for_augmentation = contact_notes
    elif linkedin_summary:
        context_for_augmentation = [linkedin_summary]

    augmented_notes = None
    if data.answers and context_for_augmentation:
        augmented_notes = await augment_answers_with_notes(data.answers, context_for_augmentation)

    # Create meeting
    create_meeting(
        db,
        advisor_id=link.user_id,
        link_id=link_id,
        start_time=start_time,
        end_time=end_time,
        client_email=data.email,
        client_linkedin=normalized_linkedin,
        answers=data.answers,
        linkedin_summary=linkedin_summary,
        augmented_notes=augmented_notes
    )

    # Decrement usage limit
    if link.usage_limit is not None:
        link.usage_limit -= 1
        db.commit()

    # Send email to advisor
    advisor = db.query(User).filter_by(id=link.user_id).first()
    
    if advisor:
        subject = f"New Meeting Booking from: {data.email}"
        answers_str = "\n".join(
            f"{q}: {a}" for q, a in zip(link.questions or [], data.answers or [])
        )
        body = (
            f"You have a new meeting booking!\n"
            f"Client Email: {data.email}\n"
            f"Scheduled Time: {start_time.strftime('%Y-%m-%d %H:%M')}\n"
            f"Answers to Questions:\n{answers_str}"
        )

        if contact_info_str:
            body += f"\n\nHubSpot Contact Details:\n{contact_info_str}"

        if augmented_notes:
            body += f"\n\nAugmented Notes:\n{augmented_notes}"

        if linkedin_info_str:
            body += linkedin_info_str
        send_email(advisor.email, subject, body)

    return {"success": True, "message": "Booking confirmed."}

@router.get("/meetings", response_model=List[MeetingOut])
async def list_meetings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    meetings = get_meetings_by_advisor_id(db, current_user.id)
    return meetings

@router.get("/meetings/{meeting_id}", response_model=MeetingOut)
async def get_meeting_detail(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    meeting = get_meeting_by_id(db, meeting_id)
    if not meeting or meeting.advisor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return meeting