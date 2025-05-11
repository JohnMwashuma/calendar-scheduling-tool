from pydantic import BaseModel, ConfigDict

class ConnectedGoogleAccountBase(BaseModel):
    google_account_id: str

class ConnectedGoogleAccountCreate(ConnectedGoogleAccountBase):
    access_token: str
    refresh_token: str
    email: str
    name: str
    picture: str
    locale: str
    verified: bool
    hd: str

class ConnectedGoogleAccount(ConnectedGoogleAccountBase):
    id: int
    user_id: int
    access_token: str
    refresh_token: str
    email: str
    name: str
    picture: str
    locale: str
    verified: bool
    hd: str

    model_config = ConfigDict(from_attributes=True)