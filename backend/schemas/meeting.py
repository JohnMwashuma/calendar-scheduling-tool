from pydantic import BaseModel, EmailStr, Field
from typing import List, Any, Optional
from datetime import datetime

class MeetingCreate(BaseModel):
    time: datetime
    email: EmailStr
    linkedin: Optional[str]
    answers: List[Any]
    augmented_notes: Optional[str] = None
    linkedin_summary: Optional[str] = None

class MeetingOut(BaseModel):
    id: int
    advisor_id: int
    link_id: str
    start_time: datetime
    end_time: datetime
    client_email: EmailStr
    client_linkedin: Optional[str]
    answers: List[Any]
    created_at: datetime
    augmented_notes: Optional[str] = None
    linkedin_summary: Optional[str] = None