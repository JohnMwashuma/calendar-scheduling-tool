from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from crud.user import get_user_by_id
from crud.session import get_session_by_token
from datetime import datetime

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_token")
    if not session_token:
        # Try to get from custom header if not in cookies
        session_token = request.headers.get("X-Session-Token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = get_session_by_token(db, session_token=session_token)
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid session")

    user = get_user_by_id(db, user_id=session.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    request.state.current_user = user
    request.state.access_token = session.access_token
    return user