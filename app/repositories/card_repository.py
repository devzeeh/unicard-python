from typing import Optional, List
from decimal import Decimal

from sqlalchemy import text
from app.extensions import db
from app.models.cards import Card

def get_card_number(card_number: str) -> Optional[Card]:
    """Fetch a card by its visible card number."""
    return db.session.execute(
        db.select(Card).where(Card.card_number == card_number)
    ).scalar_one_or_none()

def get_card_by_uid(card_uid: str) -> Optional[Card]:
    """Fetch a card by its physical hardware UID (scanned by ESP32)."""
    return db.session.execute(
        db.select(Card).where(Card.card_uid == card_uid)
    ).scalar_one_or_none()

def get_cards_by_user(user_id: str) -> List[Card]:
    """Fetch all cards linked to a specific user."""
    return db.session.execute(
        db.select(Card).where(Card.user_id == user_id)
    ).scalars().all()

def create_card(card: Card) -> Card:
    """Adds a new Card to the session. Service must commit."""
    db.session.add(card)
    db.session.flush()
    return card

def update_card(card: Card) -> Card:
    """Updates a card in the session."""
    db.session.add(card)
    db.session.flush()
    return card

def update_card_balance(card_number: str, amount_change: Decimal) -> Optional[Card]:
    """
    Safely adjusts the card balance atomically within the transaction.
    Positive amount_change for top-ups, negative for payments.
    """
    card = get_card_number(card_number)
    if card:
        card.balance += amount_change
        db.session.flush()
    return card

def get_initial_balance(card_number: str) -> float:
    """
    Fecth the initail balance of the given card number.
    Return 0.00 if the card is not found.
    """
    try:
        card = get_card_number(card_number)
        #query = text("SELECT balance FROM cards WHERE card_number = :card")
        #result = db.session.execute(query, {"card": card_number}).scalar()

        return float(card.balance) if card is not None else 0.0
    except Exception as e:
        print(f"Database error fetching card balance: {e}")
        return 0.0