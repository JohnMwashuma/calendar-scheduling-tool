from db.models import Meeting
from sqlalchemy.orm import Session

def create_meeting(db: Session, advisor_id: int, link_id: str, start_time, end_time, client_email, client_linkedin, answers):
    meeting = Meeting(
        advisor_id=advisor_id,
        link_id=link_id,
        start_time=start_time,
        end_time=end_time,
        client_email=client_email,
        client_linkedin=client_linkedin,
        answers=answers,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

def is_time_slot_available(db: Session, link_id: str, start_time, end_time):
    print(f"Checking if time slot is available for link_id: {link_id}, start_time: {start_time}, end_time: {end_time}")
    # Check for overlapping meetings
    return not db.query(Meeting).filter(
        Meeting.link_id == link_id,
        Meeting.start_time < end_time,
        Meeting.end_time > start_time
    ).first()