from app.extensions import db
from enum import Enum


class MerchantStatus(str, Enum):
    PENDING_APPROVAL = "pending approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class BusinessType(str, Enum):
    RETAIL = "retail"
    TRANSPORTATION = "transportation"
    FOOD_AND_BEVERAGE = "food_and_beverage"
    SERVICES = "services"
    OTHER = "other"


class Merchant(db.Model):
    __tablename__ = "merchants"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    merchant_id = db.Column(db.String(50), unique=True, nullable=False)
    business_name = db.Column(db.String(150), nullable=False)
    business_type = db.Column(db.String(100), nullable=False)
    business_registration_number = db.Column(db.String(100), unique=True, nullable=True)
    business_address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    user_id = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=False)
    owner_name = db.Column(db.String(100), nullable=False)
    business_email = db.Column(db.String(100), unique=True, nullable=False)
    business_phone = db.Column(db.String(20), unique=True, nullable=False)
    commission_rate = db.Column(db.Numeric(5, 2), server_default="2.00", nullable=False)
    settlement_account_name = db.Column(db.String(100), nullable=True)
    settlement_account_number = db.Column(db.String(50), nullable=True)
    settlement_bank_name = db.Column(db.String(100), nullable=True)
    status = db.Column(db.Enum(MerchantStatus), server_default=MerchantStatus.PENDING_APPROVAL.value, nullable=False)
    business_document = db.Column(db.String(255), nullable=True)
    bir_document = db.Column(db.String(255), nullable=True)
    valid_id = db.Column(db.String(255), nullable=True)
    bank_document = db.Column(db.String(255), nullable=True)
    business_structure = db.Column(db.Enum("sole_proprietorship", "partnership", "corporation", "cooperative", name="business_structure"), nullable=True)
    document_status = db.Column(db.Enum("pending", "approved", "rejected", name="document_status"), server_default="pending", nullable=True)
    message = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=True)
    approved_at = db.Column(db.TIMESTAMP, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        business_type_value = self.business_type.value if isinstance(self.business_type, Enum) else self.business_type
        status_value = self.status.value if self.status else None
        return {
            "id": self.id,
            "merchant_id": self.merchant_id,
            "business_name": self.business_name,
            "business_type": business_type_value,
            "business_registration_number": self.business_registration_number,
            "business_address": self.business_address,
            "city": self.city,
            "postal_code": self.postal_code,
            "user_id": self.user_id,
            "owner_name": self.owner_name,
            "business_email": self.business_email,
            "business_phone": self.business_phone,
            "commission_rate": float(self.commission_rate) if self.commission_rate is not None else 0.0,
            "settlement_account_name": self.settlement_account_name,
            "settlement_account_number": self.settlement_account_number,
            "settlement_bank_name": self.settlement_bank_name,
            "status": status_value,
            "business_document": self.business_document,
            "bir_document": self.bir_document,
            "valid_id": self.valid_id,
            "bank_document": self.bank_document,
            "business_structure": self.business_structure,
            "document_status": self.document_status,
            "message": self.message,
            "approved_by": self.approved_by,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
