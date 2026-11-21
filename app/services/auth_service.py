
import logging

from app.repositories.user_repository import AuthRepository

logger = logging.getLogger(__name__)

class AuthService:

    def __init__(self, repository: AuthRepository):
        self.repository = repository

    def login(self, identifier: str, password: str) -> dict:
        # Find user
        try:
            user = self.repository.find_user_by_identifier(identifier)
        except Exception:
            logger.exception(
                "Login: user lookup failed for %r", identifier
            )
            raise InvalidCredentialsError()

        if user is None:
            logger.warning(
                "Login: user not found for %r", identifier
            )
            raise InvalidCredentialsError()

        # Verify password
        if not verify_password(password, user.password_hash):
            logger.warning(
                "Login: password mismatch for %r", identifier
            )
            raise InvalidCredentialsError()

        # Generate tokens
        try:
            access_token, refresh_token = generate_tokens(
                user.user_id,
                user.role
            )
        except Exception as exc:
            logger.exception("Login: token generation failed")
            raise RuntimeError("Failed to generate tokens") from exc

        # Build login result
        return {
            "id": user.user_id,
            "username": user.username,
            "role": user.role,
            "redirect_url": self._redirect_for(
                user.role,
                user.username
            ),
            "tokens": {
                "access": access_token,
                "refresh": refresh_token
            }
        }

    @staticmethod
    def _redirect_for(role: str, username: str) -> str:
        match role:
            case "super_admin":
                return f"/admin/{username}"

            case "merchant_admin" | "merchant_staff":
                return f"/merchant/{username}/dashboard"

            case _:
                return f"/u/{username}/dashboard"
