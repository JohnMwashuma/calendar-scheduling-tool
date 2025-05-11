from datetime import datetime
from db.models import Session as SessionModel

from sqlalchemy.orm import Session


def create_session(db: Session, user_id: int, session_token: str, expires_at: datetime, access_token: str):
    db_session = SessionModel(user_id=user_id, session_token=session_token, expires_at=expires_at, access_token=access_token)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session_by_token(db: Session, session_token: str):
    return db.query(SessionModel).filter(SessionModel.session_token == session_token).first()

def delete_session(db: Session, session_token: str):
    session = db.query(SessionModel).filter(SessionModel.session_token == session_token).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False