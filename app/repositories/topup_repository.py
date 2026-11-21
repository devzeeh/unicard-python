from typing import Optional, List
from app.extensions import db
from app.models.topups import Topup

def get_topup_by_id(topup_id: str) -> Optional[Topup]:
    """Fetch a topup record by its public ID."""
    return db.session.execute(
        db.select(Topup).where(Topup.topup_id == topup_id)
    ).scalar_one_or_none()

def get_topups_by_card(card_number: str, limit: int = 50) -> List[Topup]:
    """Fetch recent topups for a specific card."""
    return db.session.execute(
        db.select(Topup)
        .where(Topup.card_number == card_number)
        .order_by(Topup.created_at.desc())
        .limit(limit)
    ).scalars().all()

def create_topup(topup: Topup) -> Topup:
    """Records a new topup."""
    db.session.add(topup)
    db.session.flush()
    return topup
