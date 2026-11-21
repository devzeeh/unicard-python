from app.extensions import db
from enum import Enum


class PaymentMethod(str, Enum):
    CASH = "cash"
    GCASH = "gcash"
    MAYA = "maya"
    OVER_THE_COUNTER = "over_the_counter"
    XENDIT = "xendit"


class TopupStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class Topup(db.Model):
    __tablename__ = "top_ups"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    topup_id = db.Column(db.String(50), unique=True, nullable=False)
    card_number = db.Column(db.String(20), db.ForeignKey("cards.card_number"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    convenience_fee = db.Column(db.Numeric(10, 2), nullable=False, server_default="0.00")
    gateway_cost = db.Column(db.Numeric(10, 2), nullable=False, server_default="0.00")
    net_gateway_fee = db.Column(db.Numeric(10, 2), nullable=False)
    total_charged = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    handled_by = db.Column(db.String(50), nullable=True, server_default="")
    external_id = db.Column(db.String(255), unique=True, nullable=True)
    status = db.Column(db.Enum(TopupStatus), server_default=TopupStatus.PENDING.value, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "topup_id": self.topup_id,
            "card_number": self.card_number,
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "convenience_fee": float(self.convenience_fee) if self.convenience_fee is not None else 0.0,
            "gateway_cost": float(self.gateway_cost) if self.gateway_cost is not None else 0.0,
            "net_gateway_fee": float(self.net_gateway_fee) if self.net_gateway_fee is not None else 0.0,
            "total_charged": float(self.total_charged) if self.total_charged is not None else 0.0,
            "payment_method": self.payment_method.value if self.payment_method else None,
            "handled_by": self.handled_by,
            "external_id": self.external_id,
            "status": self.status.value if self.status else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }