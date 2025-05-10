from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    google_id: str

class User(UserBase):
    id: int
    google_id: str

    class Config:
        orm_mode = True