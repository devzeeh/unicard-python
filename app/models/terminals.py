from app.extensions import db
from enum import Enum


class TerminalRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TerminalStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TerminalRequest(db.Model):
    __tablename__ = "terminal_requests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.String(50), unique=True, nullable=False)
    merchant_id = db.Column(db.String(50), db.ForeignKey("merchants.merchant_id"), nullable=False)
    terminal_sn = db.Column(db.String(50), nullable=True)
    status = db.Column(db.Enum(TerminalRequestStatus), server_default=TerminalRequestStatus.PENDING.value, nullable=False)
    requested_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    handled_by = db.Column(db.String(50), nullable=True)
    handled_at = db.Column(db.TIMESTAMP, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "merchant_id": self.merchant_id,
            "terminal_sn": self.terminal_sn,
            "status": self.status.value if self.status else None,
            "requested_at": self.requested_at.isoformat() if self.requested_at else None,
            "handled_by": self.handled_by,
            "handled_at": self.handled_at.isoformat() if self.handled_at else None,
            "notes": self.notes,
        }


class Terminal(db.Model):
    __tablename__ = "terminals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    terminal_id = db.Column(db.String(50), unique=True, nullable=False)
    terminal_sn = db.Column(db.String(50), unique=True, nullable=False)
    merchant_id = db.Column(db.String(50), db.ForeignKey("merchants.merchant_id"), nullable=True)
    device_name = db.Column(db.String(100), nullable=False)
    location_details = db.Column(db.String(255), nullable=True)
    status = db.Column(db.Enum(TerminalStatus), server_default=TerminalStatus.INACTIVE.value, nullable=False)
    last_heartbeat = db.Column(db.TIMESTAMP, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "terminal_id": self.terminal_id,
            "terminal_sn": self.terminal_sn,
            "merchant_id": self.merchant_id,
            "device_name": self.device_name,
            "location_details": self.location_details,
            "status": self.status.value if self.status else None,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }