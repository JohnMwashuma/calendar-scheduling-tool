from sqlalchemy.orm import Session
from db.models import SchedulingLink
from datetime import datetime
from typing import List

def create_scheduling_link(db: Session, user_id: int, link_id: str, usage_limit: int, expiration_date: datetime, meeting_length: int, advance_schedule_days: int, questions: List[str]):
    link = SchedulingLink(
        user_id=user_id,
        link_id=link_id,
        usage_limit=usage_limit,
        expiration_date=expiration_date,
        meeting_length=meeting_length,
        advance_schedule_days=advance_schedule_days,
        questions=questions,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

def get_scheduling_links_by_user_id(db: Session, user_id: int):
    return db.query(SchedulingLink).filter(SchedulingLink.user_id == user_id).order_by(SchedulingLink.created_at.desc()).all() 