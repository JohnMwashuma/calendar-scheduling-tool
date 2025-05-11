from pydantic import BaseModel, ConfigDict

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    google_id: str

class User(UserBase):
    id: int
    google_id: str

    model_config = ConfigDict(from_attributes=True)