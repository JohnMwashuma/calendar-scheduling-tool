from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Time, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    name = Column(String)

    connected_google_accounts =\
        relationship("ConnectedGoogleAccount", back_populates="user")
    sessions = relationship("Session", back_populates="user")


class ConnectedGoogleAccount(Base):
    __tablename__ = "connected_google_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    google_account_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    email = Column(String, index=True)
    name = Column(String)
    picture = Column(String)
    locale = Column(String)
    verified = Column(Boolean)
    hd = Column(String)

    user = relationship("User", back_populates="connected_google_accounts")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    access_token = Column(String)

    user = relationship("User", back_populates="sessions")

class HubspotConnection(Base):
    __tablename__ = "hubspot_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(String)
    refresh_token = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    portal_id = Column(String)

    user = relationship("User", backref="hubspot_connections")

class SchedulingWindow(Base):
    __tablename__ = "scheduling_windows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weekday = Column(Integer, index=True)  # 0=Monday, 6=Sunday
    start_time = Column(Time)
    end_time = Column(Time)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="scheduling_windows")

class SchedulingLink(Base):
    __tablename__ = "scheduling_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    link_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    usage_limit = Column(Integer)
    expiration_date = Column(DateTime)
    meeting_length = Column(Integer)  # in minutes
    advance_schedule_days = Column(Integer)
    questions = Column(JSON)  # List of question strings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="scheduling_links")