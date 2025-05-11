from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from httpx import AsyncClient, HTTPStatusError
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from core.database import get_db
from crud.user import get_user_by_google_id, create_user
from schemas.user import UserCreate, User
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