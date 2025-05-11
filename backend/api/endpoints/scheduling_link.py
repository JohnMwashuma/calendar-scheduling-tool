from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from core.database import get_db
from api.deps import get_current_user
from crud.scheduling_link import create_scheduling_link, get_scheduling_links_by_user_id
from schemas.scheduling_link import SchedulingLinkCreate, SchedulingLinkOut
import uuid

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