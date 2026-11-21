from typing import Optional, List
from app.extensions import db
from app.models.merchants import Merchant

def get_merchant_by_id(merchant_id: str) -> Optional[Merchant]:
    """Fetch a merchant by their public ID."""
    return db.session.execute(
        db.select(Merchant).where(Merchant.merchant_id == merchant_id)
    ).scalar_one_or_none()

def get_merchant_by_user(user_id: str) -> Optional[Merchant]:
    """Fetch a merchant profile owned by a specific user."""
    return db.session.execute(
        db.select(Merchant).where(Merchant.user_id == user_id)
    ).scalar_one_or_none()

def create_merchant(merchant: Merchant) -> Merchant:
    """Adds a new Merchant to the session. Service must commit."""
    db.session.add(merchant)
    db.session.flush()
    return merchant

def update_merchant(merchant: Merchant) -> Merchant:
    """Updates a merchant in the session."""
    db.session.add(merchant)
    db.session.flush()
    return merchant
