from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth  # Correct import
from starlette.config import Config
from backend.core.database import get_db
from backend.crud.user import get_user_by_google_id, create_user
from backend.schemas.user import UserCreate
from backend.core import config
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
    client_kwargs={'scope': 'openid email profile'},
)

@router.get("/auth/google/login")
async def google_login(request: Request):
    """
    Redirect to Google's authorization page.
    """
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handle the callback from Google's authorization page.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Google authentication failed: {e}")

    userinfo = await oauth.google.userinfo(token=token)

    google_id = userinfo.get('sub')
    email = userinfo.get('email')
    name = userinfo.get('name')

    user = get_user_by_google_id(db, google_id=google_id)
    if not user:
        user_create = UserCreate(google_id=google_id, email=email, name=name)
        user = create_user(db, user=user_create)
    return { "user": user, "access_token": token.get('access_token') }