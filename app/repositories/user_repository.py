import logging

from sqlalchemy import select, update, exists, or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.users import User
from app.models.cards import Card
from app.models.activity_logs import ActivityLog

logger = logging.getLogger(__name__)


class AuthRepository:
    """Handles database operations required by authentication."""

    def __init__(self, db: Session):
        self.db = db

    def find_user_by_identifier(self, identifier: str) -> User | None:
        stmt = select(User).where(
            or_(
                User.email == identifier,
                User.username == identifier,
                User.phone_number == identifier
            )
        )

        return self.db.scalars(stmt).first()

    def is_user_id_exist(self, user_id: int) -> bool:
        stmt = select(
            exists().where(User.user_id == user_id)
        )

        return bool(self.db.scalar(stmt))

    def is_phone_exist(self, phone: str) -> bool:
        stmt = select(
            exists().where(User.phone_number == phone)
        )

        return bool(self.db.scalar(stmt))

    def is_username_exist(self, username: str) -> bool:
        stmt = select(
            exists().where(User.username == username)
        )

        return bool(self.db.scalar(stmt))

    def get_initial_balance(self, card_number: str) -> float:
        stmt = select(Card.balance).where(
            Card.card_number == card_number
        )

        return self.db.execute(stmt).scalar_one()

    def get_card_status(self, card_number: str) -> str:
        stmt = select(Card.status).where(
            Card.card_number == card_number
        )

        return self.db.execute(stmt).scalar_one()

    def update_password(self, email: str, hashed_password: str) -> None:
        stmt = (
            update(User)
            .where(User.email == email)
            .values(password_hash=hashed_password)
        )

        self.db.execute(stmt)

    def find_user_by_email(self, email: str) -> tuple[str, int]:
        stmt = select(
            User.name,
            User.user_id
        ).where(User.email == email)

        row = self.db.execute(stmt).one()

        return row.name, row.user_id

    def find_name_by_email(self, email: str) -> str:
        stmt = select(User.name).where(
            User.email == email
        )

        name = self.db.scalar(stmt)

        return name if name is not None else "there"

    def insert_activity_log(
        self,
        user_id: str,
        activity_type: str,
        channel: str,
        status: str,
        description: str
    ) -> None:
        try:
            activity = ActivityLog(
                user_id=user_id,
                activity_type=activity_type,
                channel=channel,
                status=status,
                description=description
            )

            self.db.add(activity)
            self.db.flush()

        except SQLAlchemyError:
            logger.exception(
                "Activity log insert failed [%s/%s]",
                user_id,
                activity_type
            )
