from app.extensions import db
from enum import Enum


class ActivityType(str, Enum):
    ONBOARDING = "onboarding"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    LOGIN = "login"
    LOGOUT = "logout"
    PROFILE_UPDATE = "profile_update"
    CARD_LINKED = "card_linked"


class Channel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    MULTI = "multi"


class ActivityStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"
    FAILED = "failed"


class UserActivityLogs(db.Model):
    __tablename__ = "user_activity_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=False)
    processed_by = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=True)
    activity_type = db.Column(db.Enum(ActivityType), nullable=False)
    channel = db.Column(db.Enum(Channel), nullable=True)
    status = db.Column(db.Enum(ActivityStatus), server_default=ActivityStatus.COMPLETED.value, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    log_metadata = db.Column("metadata", db.JSON, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "processed_by": self.processed_by,
            "activity_type": self.activity_type.value if self.activity_type else None,
            "channel": self.channel.value if self.channel else None,
            "status": self.status.value if self.status else None,
            "description": self.description,
            "metadata": self.log_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }