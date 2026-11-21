from app.extensions import db
from enum import Enum


class CardType(str, Enum):
    REGULAR = "regular"
    STUDENT = "student"
    PWD = "pwd"
    SENIOR = "senior"


class CardStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    LOST = "lost"


class Card(db.Model):
    __tablename__ = "cards"

    card_number = db.Column(db.String(20), primary_key=True)
    card_uid = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    card_type = db.Column(db.Enum(CardType), server_default=CardType.REGULAR.value, nullable=False)
    discount_verified = db.Column(db.Boolean, server_default="0", nullable=False)
    balance = db.Column(db.Numeric(10, 2), server_default="0.00", nullable=False)
    loyalty_points = db.Column(db.Numeric(10, 2), server_default="0.00", nullable=False)
    status = db.Column(db.Enum(CardStatus), server_default=CardStatus.INACTIVE.value, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    linked_at = db.Column(db.TIMESTAMP, nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "card_number": self.card_number,
            "card_uid": self.card_uid,
            "user_id": self.user_id,
            "card_type": self.card_type.value if self.card_type else None,
            "discount_verified": bool(self.discount_verified) if self.discount_verified is not None else False,
            "balance": float(self.balance) if self.balance is not None else 0.0,
            "loyalty_points": float(self.loyalty_points) if self.loyalty_points is not None else 0.0,
            "status": self.status.value if self.status else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "linked_at": self.linked_at.isoformat() if self.linked_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
