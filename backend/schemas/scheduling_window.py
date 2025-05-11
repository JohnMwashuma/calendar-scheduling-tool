from pydantic import BaseModel, ConfigDict, Field, field_serializer
from typing import Optional
import datetime

class SchedulingWindowBase(BaseModel):
    weekday: int = Field(..., ge=0, le=6)
    start_time: datetime.time
    end_time: datetime.time

class SchedulingWindowCreate(BaseModel):
    weekday: int = Field(..., ge=0, le=6)
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}(:\d{2})?$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}(:\d{2})?$')

class SchedulingWindowUpdate(BaseModel):
    weekday: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}(:\d{2})?$')
    end_time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}(:\d{2})?$')

class SchedulingWindowOut(SchedulingWindowBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

    @field_serializer('start_time', 'end_time')
    def serialize_time(self, value: datetime.time, _info):
        return value.strftime('%H:%M')