from app.extensions import db
from enum import Enum


class TerminalAssignmentAction(str, Enum):
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    MERCHANT_DELETED = "merchant_deleted"
    MAINTENANCE = "maintenance"


class TerminalAssignmentLog(db.Model):
    __tablename__ = "terminal_assignment_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    terminal_id = db.Column(db.String(50), nullable=False)
    terminal_sn = db.Column(db.String(50), nullable=False)
    merchant_id = db.Column(db.String(50), nullable=False)
    action = db.Column(db.Enum(TerminalAssignmentAction), nullable=False)
    device_name = db.Column(db.String(100), nullable=True)
    location_details = db.Column(db.String(255), nullable=True)
    performed_by = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "terminal_id": self.terminal_id,
            "terminal_sn": self.terminal_sn,
            "merchant_id": self.merchant_id,
            "action": self.action.value if self.action else None,
            "device_name": self.device_name,
            "location_details": self.location_details,
            "performed_by": self.performed_by,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
