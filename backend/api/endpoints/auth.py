from datetime import datetime, timedelta
from distutils.command import build
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Body
from fastapi.responses import JSONResponse, RedirectResponse
from httpx import AsyncClient, HTTPStatusError
import httpx
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from core.database import get_db
from api.deps import get_current_user
from crud.user import get_user_by_google_id, create_user
from schemas.user import UserCreate, User
from schemas.calendar import ConnectedGoogleAccount, ConnectedGoogleAccountCreate
from crud.calendar import (
    get_connected_account_by_google_account_id,
    create_connected_account,
    get_connected_accounts_by_user_id
)
from crud.session import create_session, delete_session, get_session_by_token
from core import config
import os

router = APIRouter()

config_starlette = Config(environ=os.environ)
oauth = OAuth(config_starlette)

oauth.register(
    name='google',
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    server_metadata_url=\
        'https://accounts.google.com/.well-known/openid-configuration',
     client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
        'access_type': 'offline',
        'prompt': 'consent'
    },
)

@router.get("/auth/google/login")
async def google_login(request: Request):
    """
    Redirect to Google's authorization page.
    """
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", name="google_callback")
async def google_callback(
    request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Handle the callback from Google's authorization page.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        frontend_redirect_url =\
            str(
                f"{config.FRONTEND_URL}/auth/google/callback?"
                f"error=google_auth_failed&error_description={str(e)}"
            )
        return RedirectResponse(frontend_redirect_url, status_code=302)

    userinfo = await oauth.google.userinfo(token=token)

    google_id = userinfo.get('sub')
    email = userinfo.get('email')
    name = userinfo.get('name')

    user = get_user_by_google_id(db, google_id=google_id)
    if not user:
        user_create = UserCreate(google_id=google_id, email=email, name=name)
        user = create_user(db, user=user_create)
    
    existing_account = get_connected_account_by_google_account_id(
        db, google_account_id=google_id, user_id=user.id)
    if not existing_account:
        connected_account_create = ConnectedGoogleAccountCreate(
            google_account_id=google_id,
            access_token=token.get('access_token', ''),
            refresh_token=token.get('refresh_token', ''),
            email=email,
            name=name,
            picture=userinfo.get('picture', ''),
            locale=userinfo.get('locale', ''),
            verified=userinfo.get('verified', False),
            hd=userinfo.get('hd', ''),
        )
        create_connected_account(
            db,
            connected_account=connected_account_create,
            user_id=user.id)
    
    access_token = token.get('access_token')
    if access_token:
        frontend_redirect_url = str(
            f"{config.FRONTEND_URL}/auth/callback-loading?"
            f"accessToken={access_token}&userId={user.id}"
        )
        return RedirectResponse(frontend_redirect_url, status_code=302)
    else:
        frontend_redirect_url =\
            str(
                f"{config.FRONTEND_URL}/auth/google/callback?"
                f"error=no_access_token"
            )
        return RedirectResponse(frontend_redirect_url, status_code=302)

@router.get("/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    """
    Get the current user's information.
    """
    authorization_header = request.headers.get("Authorization")
    if not authorization_header or not authorization_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    google_access_token = authorization_header.split("Bearer ")[1]

    async with AsyncClient() as client:
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {google_access_token}"}
        try:
            response = await client.get(userinfo_url, headers=headers)
            response.raise_for_status()
            userinfo = response.json()

            google_id = userinfo.get('sub')

            if not google_id:
                raise HTTPException(
                    status_code=401, detail="Invalid Google access token")

            user = get_user_by_google_id(db, google_id=google_id)
            if user:
                return {"user": User.model_validate(user)}
            else:
                raise HTTPException(status_code=404, detail="User not found")

        except HTTPStatusError as e:
            print(f"Error fetching user info from Google: {e}")
            raise HTTPException(
                status_code=401, detail="Invalid Google access token")
        except Exception as e:
            print(f"Unexpected error fetching user info: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error")

@router.get("/calendars/connect/new")
async def connect_new_google_calendar(request: Request):
    redirect_uri = request.url_for('google_connect_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/calendars/connect/callback", name="google_connect_callback")
async def google_connect_callback(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        frontend_redirect_url = f"{config.FRONTEND_URL}/auth/google/callback?error=connect_error"
        return RedirectResponse(frontend_redirect_url, status_code=302)

    userinfo = await oauth.google.userinfo(token=token)
    google_account_id = userinfo.get('sub')

    if not google_account_id:
        frontend_redirect_url = f"{config.FRONTEND_URL}/auth/google/callback?error=connect_error"
        return RedirectResponse(frontend_redirect_url, status_code=302)

    existing_account = get_connected_account_by_google_account_id(
        db, google_account_id=google_account_id)
    if not existing_account:
        connected_account_create = ConnectedGoogleAccountCreate(
            google_account_id=google_account_id,
            access_token=token.get('access_token', ''),
            refresh_token=token.get('refresh_token', ''),
            email=userinfo.get('email', ''),
            name=userinfo.get('name', ''),
            picture=userinfo.get('picture', ''),
            locale=userinfo.get('locale', ''),
            verified=userinfo.get('verified', False),
            hd=userinfo.get('hd', ''),
        )
        create_connected_account(
            db,
            connected_account=connected_account_create,
            user_id=current_user.id)
        access_token = request.state.access_token
        user_id = current_user.id
        frontend_redirect_url = str(
            f"{config.FRONTEND_URL}/auth/callback-loading?"
            f"accessToken={access_token}&userId={user_id}"
        )
        return RedirectResponse(frontend_redirect_url, status_code=302)
    else:
        frontend_redirect_url = f"{config.FRONTEND_URL}/auth/google/callback?status=connect_error"
        return RedirectResponse(frontend_redirect_url, status_code=302)

async def get_google_account_details(access_token: str):
    async with httpx.AsyncClient() as client:
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            response = await client.get(userinfo_url, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"Error fetching Google account details: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error fetching Google account details: {e}")
            return None

@router.get("/calendars/connected")
async def list_connected_calendars(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connected_accounts = get_connected_accounts_by_user_id(
        db, user_id=current_user.id
    )
    return [ConnectedGoogleAccount.model_validate(account) for account in connected_accounts]

@router.get("/events")
async def list_calendar_events(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    List calendar events for the logged-in user from all connected Google accounts, grouped by account.
    """
    connected_accounts = get_connected_accounts_by_user_id(db, user_id=current_user.id)
    calendar_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    result = []
    async with httpx.AsyncClient() as client:
        for account in connected_accounts:
            if account.email == current_user.email:
                google_access_token = request.cookies.get("google_access_token")
                if google_access_token:
                    headers = {"Authorization": f"Bearer {google_access_token}"}
                else:
                    headers = {"Authorization": f"Bearer {account.access_token}"}
            else:
                headers = {"Authorization": f"Bearer {account.access_token}"}
            page_token = None
            all_events = []
            while True:
                params = {"maxResults": 100}
                if page_token:
                    params["pageToken"] = page_token
                try:
                    response = await client.get(calendar_url, headers=headers, params=params)
                    response.raise_for_status()
                    data = response.json()
                    events = data.get("items", [])
                    all_events.extend(events)
                    page_token = data.get("nextPageToken")
                    if not page_token:
                        break
                except Exception as e:
                    print(f"Error fetching calendar events for account {account.google_account_id}: {e}")
                    break
            result.append({
                "google_account_id": account.google_account_id,
                "email": account.email,
                "events": all_events
            })
    return result

@router.post("/auth/logout")
async def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_token")
    if session_token:
        delete_session(db, session_token=session_token)
        response.delete_cookie(key="session_token", path="/")
        return {"message": "Logout successful"}
    raise HTTPException(status_code=401, detail="Not authenticated")

from pydantic import BaseModel

class SetSessionRequest(BaseModel):
    user_id: int

@router.post("/auth/set-session")
async def set_session_cookie(
    request: Request,
    response: Response,
    body: SetSessionRequest,
    db: Session = Depends(get_db)
):
    access_token = request.cookies.get("google_access_token")
    session_token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(hours=24)
    create_session(
        db,
        user_id=body.user_id,
        session_token=session_token,
        expires_at=expires_at,
        access_token=access_token)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=False,
        secure=False,
        samesite="None")
    return {"session_token": session_token}