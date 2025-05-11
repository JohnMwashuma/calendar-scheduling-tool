from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class SchedulingLinkBase(BaseModel):
    usage_limit: int = Field(..., ge=1)
    expiration_date: datetime
    meeting_length: int = Field(..., ge=1)
    advance_schedule_days: int = Field(..., ge=0)
    questions: List[str] = Field(default_factory=list)

class SchedulingLinkCreate(SchedulingLinkBase):
    pass

class SchedulingLinkOut(SchedulingLinkBase):
    id: int
    link_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True) 