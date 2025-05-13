from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
import httpx
from core.database import get_db
from api.deps import get_current_user
from crud.hubspot import create_hubspot_connection, get_hubspot_connection_by_user_id, delete_hubspot_connection_by_user_id
from datetime import datetime, timedelta
from core.config import (
    HUBSPOT_CLIENT_ID, 
    HUBSPOT_CLIENT_SECRET, 
    HUBSPOT_REDIRECT_URI, 
    FRONTEND_URL
)
router = APIRouter()

HUBSPOT_SCOPES = "oauth crm.objects.contacts.read"

@router.get("/hubspot/connect/new")
async def hubspot_connect_new(request: Request):
    """
    Redirect user to Hubspot OAuth authorization URL.
    """
    session_token = request.cookies.get("session_token") or request.headers.get("X-Session-Token")
    print(f"session_token: {session_token}")
    params = {
        "client_id": HUBSPOT_CLIENT_ID,
        "redirect_uri": HUBSPOT_REDIRECT_URI,
        "scope": HUBSPOT_SCOPES,
        "response_type": "code",
        "state": session_token,
    }
    url = "https://app.hubspot.com/oauth/authorize"
    query = "&".join([f"{k}={v}" for k, v in params.items() if v is not None])
    return RedirectResponse(f"{url}?{query}")

@router.get("/hubspot/connect/callback")
async def hubspot_connect_callback(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Handle Hubspot OAuth callback, exchange code for tokens, store connection.
    """
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code from Hubspot callback.")
    token_url = "https://api.hubapi.com/oauth/v1/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": HUBSPOT_CLIENT_ID,
        "client_secret": HUBSPOT_CLIENT_SECRET,
        "redirect_uri": HUBSPOT_REDIRECT_URI,
        "code": code,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, data=data, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to get tokens from Hubspot: {resp.text}")
        tokens = resp.json()
        access_token = tokens["access_token"]
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 21600)  # default 6 hours
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        # Get Hubspot user ID and more info
        userinfo_url = "https://api.hubapi.com/integrations/v1/me"
        userinfo_headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_resp = await client.get(userinfo_url, headers=userinfo_headers)
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Hubspot user info.")
        userinfo = userinfo_resp.json()
        print(f"userinfo: {userinfo}")
        print(f'tokens: {tokens}')
        portal_id = str(userinfo.get("portalId")) if userinfo.get("portalId") else None

        create_hubspot_connection(
            db=db,
            user_id=current_user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            portal_id=portal_id,
        )
    access_token = request.state.access_token
    user_id = current_user.id
    print(f"user_id: {user_id}")
    frontend_redirect_url = str(
        f"{FRONTEND_URL}/auth/callback-loading?"
        f"accessToken={access_token}&userId={user_id}"
    )
    return RedirectResponse(frontend_redirect_url, status_code=302)

@router.get("/hubspot/connection/status")
async def hubspot_connection_status(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    connection = get_hubspot_connection_by_user_id(db, current_user.id)
    if connection:
        return {
            "connected": True,
        }
    else:
        return {"connected": False}

@router.post("/hubspot/disconnect")
async def hubspot_disconnect(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    success = delete_hubspot_connection_by_user_id(db, current_user.id)
    if success:
        return JSONResponse({"success": True}, status_code=status.HTTP_200_OK)
    else:
        return JSONResponse({"success": False, "error": "No Hubspot connection found."}, status_code=status.HTTP_404_NOT_FOUND) 