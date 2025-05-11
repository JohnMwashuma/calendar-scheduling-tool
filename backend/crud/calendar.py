from sqlalchemy.orm import Session
from db.models import ConnectedGoogleAccount
from schemas.calendar import ConnectedGoogleAccountCreate

def get_connected_accounts_by_user_id(
        db: Session,
        user_id: int
):
    return db.query(ConnectedGoogleAccount).filter(
        ConnectedGoogleAccount.user_id == user_id
    ).all()

def get_connected_account_by_google_account_id(
        db: Session,
        google_account_id: str,
        user_id = None
):
    if user_id:
        return db.query(ConnectedGoogleAccount).filter(
            ConnectedGoogleAccount.google_account_id == google_account_id,
            ConnectedGoogleAccount.user_id == user_id
        ).first()
    else:
        return db.query(ConnectedGoogleAccount).filter(
            ConnectedGoogleAccount.google_account_id == google_account_id
        ).first()

def create_connected_account(
        db: Session,
        connected_account: ConnectedGoogleAccountCreate,
        user_id: int
):
    db_connected_account = ConnectedGoogleAccount(
        user_id=user_id,
        google_account_id=connected_account.google_account_id,
        access_token=connected_account.access_token,
        refresh_token=connected_account.refresh_token,
        email=connected_account.email,
        name=connected_account.name,
        picture=connected_account.picture,
        locale=connected_account.locale,
        verified=connected_account.verified,
        hd=connected_account.hd
    )
    db.add(db_connected_account)
    db.commit()
    db.refresh(db_connected_account)
    return db_connected_account