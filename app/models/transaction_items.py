from app.extensions import db


class TransactionItem(db.Model):
    __tablename__ = "transaction_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(50), db.ForeignKey("transactions.transaction_id"), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, server_default="1")
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "item_name": self.item_name,
            "unit_price": float(self.unit_price) if self.unit_price is not None else 0.0,
            "quantity": self.quantity,
            "subtotal": float(self.subtotal) if self.subtotal is not None else 0.0,
        }
