from app.extensions import db


class SystemSetting(db.Model):
    __tablename__ = "system_settings"

    setting_key = db.Column(db.String(50), primary_key=True)
    setting_value = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    updated_by = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), nullable=True)
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.now(), server_onupdate=db.func.now(), nullable=True)

    def to_dict(self):
        return {
            "setting_key": self.setting_key,
            "setting_value": self.setting_value,
            "description": self.description,
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
