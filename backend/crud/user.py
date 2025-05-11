from sqlalchemy.orm import Session
from db.models import User
from schemas.user import UserCreate

def get_user_by_google_id(db: Session, google_id: str):
    """
    Get a user by their Google ID.
    :param db: The database session.
    :param google_id: The Google ID of the user.
    :return: The user with the given Google ID.
    """
    return db.query(User).filter(User.google_id == google_id).first()

def create_user(db: Session, user: UserCreate):
    """
    Create a new user.
    :param db: The database session.
    :param user: The user to create.
    :return: The created user.
    """
    db_user = User(google_id=user.google_id, email=user.email, name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_id(db: Session, user_id: int):
    """
    Get a user by their ID.
    :param db: The database session.
    :param user_id: The ID of the user.
    :return: The user with the given ID.
    """
    return db.query(User).filter(User.id == user_id).first()