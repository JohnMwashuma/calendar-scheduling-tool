from sqlalchemy.orm import Session
from db.models import HubspotConnection
from datetime import datetime

def create_hubspot_connection(db: Session, user_id: int, access_token: str, refresh_token: str, expires_at: datetime, portal_id: str):
    connection = HubspotConnection(
        user_id=user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
        portal_id=portal_id,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection

def get_hubspot_connection_by_user_id(db: Session, user_id: int):
    return db.query(HubspotConnection).filter(HubspotConnection.user_id == user_id).first()

def delete_hubspot_connection_by_user_id(db: Session, user_id: int):
    connection = db.query(HubspotConnection).filter(HubspotConnection.user_id == user_id).first()
    if connection:
        db.delete(connection)
        db.commit()
        return True
    return False 