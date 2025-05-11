from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from core.database import get_db
from api.deps import get_current_user
from crud.scheduling_window import (
    create_scheduling_window,
    get_scheduling_windows_by_user_id,
    update_scheduling_window,
    delete_scheduling_window,
)
from schemas.scheduling_window import (
    SchedulingWindowCreate,
    SchedulingWindowUpdate,
    SchedulingWindowOut,
)
from db.models import SchedulingWindow

router = APIRouter()

# Helper to parse 'HH:MM' or 'HH:MM:SS' to time
_DEF = '%H:%M:%S'
_DEF_SHORT = '%H:%M'
def parse_time(s):
    try:
        if len(s.split(':')) == 2:
            return datetime.strptime(s, _DEF_SHORT).time()
        return datetime.strptime(s, _DEF).time()
    except Exception:
        raise HTTPException(
            status_code=400, detail=f"Invalid time format: {s}")

@router.post("/scheduling-windows", response_model=SchedulingWindowOut)
async def create_window(
    data: SchedulingWindowCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    start = parse_time(data.start_time)
    end = parse_time(data.end_time)
    if start >= end:
        raise HTTPException(
            status_code=400, detail="Start time must be before end time.")
    window = create_scheduling_window(
        db,
        user_id=current_user.id,
        weekday=data.weekday,
        start_time=start,
        end_time=end,
    )
    return window

@router.get("/scheduling-windows", response_model=List[SchedulingWindowOut])
async def list_windows(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_scheduling_windows_by_user_id(db, current_user.id)

@router.put(
        "/scheduling-windows/{window_id}",
        response_model=SchedulingWindowOut)
async def update_window(
    window_id: int,
    data: SchedulingWindowUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    window =\
        db.query(
            SchedulingWindow).filter_by(
                id=window_id, user_id=current_user.id).first()
    if not window:
        raise HTTPException(
            status_code=404, detail="Scheduling window not found.")
    start =\
        parse_time(data.start_time) if data.start_time else window.start_time
    end = parse_time(data.end_time) if data.end_time else window.end_time
    if start >= end:
        raise HTTPException(
            status_code=400, detail="Start time must be before end time.")
    updated = update_scheduling_window(
        db,
        window_id,
        start,
        end,
        weekday=data.weekday if data.weekday is not None else window.weekday,
    )
    return updated

@router.delete("/scheduling-windows/{window_id}")
async def delete_window(
    window_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    window =\
        db.query(
            SchedulingWindow).filter_by(
                id=window_id, user_id=current_user.id).first()
    if not window:
        raise HTTPException(
            status_code=404, detail="Scheduling window not found.")
    delete_scheduling_window(db, window_id)
    return { "success": True }
