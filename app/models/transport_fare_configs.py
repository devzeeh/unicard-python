from app.extensions import db


class TransportFareConfig(db.Model):
    __tablename__ = "transport_fare_configs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    merchant_id = db.Column(db.String(50), db.ForeignKey("merchants.merchant_id"), unique=True, nullable=False)
    base_fare = db.Column(db.Numeric(10, 2), server_default="15.00", nullable=False)
    base_km = db.Column(db.Numeric(5, 2), server_default="4.00", nullable=False)
    per_km_rate = db.Column(db.Numeric(10, 2), server_default="2.00", nullable=False)
    promo_discount_percent = db.Column(db.Numeric(5, 2), server_default="0.00", nullable=False)
    promo_name = db.Column(db.String(100), nullable=True)
    is_promo_active = db.Column(db.Boolean, server_default="0", nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "merchant_id": self.merchant_id,
            "base_fare": float(self.base_fare) if self.base_fare is not None else 0.0,
            "base_km": float(self.base_km) if self.base_km is not None else 0.0,
            "per_km_rate": float(self.per_km_rate) if self.per_km_rate is not None else 0.0,
            "promo_discount_percent": float(self.promo_discount_percent) if self.promo_discount_percent is not None else 0.0,
            "promo_name": self.promo_name,
            "is_promo_active": bool(self.is_promo_active) if self.is_promo_active is not None else False,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
