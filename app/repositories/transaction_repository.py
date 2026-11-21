from typing import Optional, List
from app.extensions import db
from app.models.transactions import Transaction

def get_transaction_by_id(transaction_id: str) -> Optional[Transaction]:
    """Fetch a transaction by its public ID."""
    return db.session.execute(
        db.select(Transaction).where(Transaction.transaction_id == transaction_id)
    ).scalar_one_or_none()

def get_transactions_by_card(card_number: str, limit: int = 50) -> List[Transaction]:
    """Fetch recent transactions for a specific card."""
    return db.session.execute(
        db.select(Transaction)
        .where(Transaction.card_number == card_number)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    ).scalars().all()

def create_transaction(transaction: Transaction) -> Transaction:
    """
    Records a new transaction. Must be called alongside a card balance update
    in the Service layer, wrapping both in a single db.session.commit().
    """
    db.session.add(transaction)
    db.session.flush()
    return transaction
