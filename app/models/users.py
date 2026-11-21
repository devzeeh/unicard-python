from app.extensions import db
from enum import Enum
import bcrypt


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    MERCHANT_ADMIN = "merchant_admin"
    MERCHANT_STAFF = "merchant_staff"
    CUSTOMER = "customer"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    status = db.Column(db.Enum(UserStatus), server_default=UserStatus.ACTIVE.value, nullable=False)
    pending_email = db.Column(db.String(100), unique=True, nullable=True)
    email_verification_token = db.Column(db.String(255), unique=True, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "role": self.role.value if self.role else None,
            "status": self.status.value if self.status else None,
            "pending_email": self.pending_email,
            "email_verification_token": self.email_verification_token,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }