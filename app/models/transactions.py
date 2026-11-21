from app.extensions import db
from enum import Enum


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    REVERSAL = "reversal"
    TOPUP = "topup"
    WITHDRAWAL = "withdrawal"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False)
    card_number = db.Column(db.String(20), db.ForeignKey("cards.card_number"), nullable=True)
    user_id = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=True)
    merchant_id = db.Column(db.String(50), db.ForeignKey("merchants.merchant_id"), nullable=True)
    terminal_id = db.Column(db.String(50), nullable=True)
    transaction_type = db.Column(db.Enum(TransactionType), server_default=TransactionType.PAYMENT.value, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=True)
    points_earned = db.Column(db.Numeric(10, 2), nullable=True, server_default="0.00")
    service_fee = db.Column(db.Numeric(10, 2), nullable=True, server_default="0.00")
    net_merchant_payout = db.Column(db.Numeric(10, 2), nullable=True)
    processed_by = db.Column(db.String(50), nullable=True, server_default="")
    status = db.Column(db.Enum(TransactionStatus), server_default=TransactionStatus.PENDING.value, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "card_number": self.card_number,
            "user_id": self.user_id,
            "merchant_id": self.merchant_id,
            "terminal_id": self.terminal_id,
            "transaction_type": self.transaction_type.value if self.transaction_type else None,
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "points_earned": float(self.points_earned) if self.points_earned is not None else 0.0,
            "service_fee": float(self.service_fee) if self.service_fee is not None else 0.0,
            "net_merchant_payout": float(self.net_merchant_payout) if self.net_merchant_payout is not None else 0.0,
            "processed_by": self.processed_by,
            "status": self.status.value if self.status else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }