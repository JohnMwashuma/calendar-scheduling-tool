from sqlalchemy.orm import Session
from db.models import SchedulingWindow
from datetime import time

def create_scheduling_window(db: Session, user_id: int, weekday: int, start_time: time, end_time: time):
    window = SchedulingWindow(
        user_id=user_id,
        weekday=weekday,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(window)
    db.commit()
    db.refresh(window)
    return window

def get_scheduling_windows_by_user_id(db: Session, user_id: int):
    return db.query(SchedulingWindow).filter(SchedulingWindow.user_id == user_id).order_by(SchedulingWindow.weekday, SchedulingWindow.start_time).all()

def update_scheduling_window(db: Session, window_id: int, start_time: time, end_time: time, weekday: int = None):
    window = db.query(SchedulingWindow).filter(SchedulingWindow.id == window_id).first()
    if window:
        window.start_time = start_time
        window.end_time = end_time
        if weekday is not None:
            window.weekday = weekday
        db.commit()
        db.refresh(window)
    return window

def delete_scheduling_window(db: Session, window_id: int):
    window = db.query(SchedulingWindow).filter(SchedulingWindow.id == window_id).first()
    if window:
        db.delete(window)
        db.commit()
        return True
    return False 