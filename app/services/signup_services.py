from datetime import datetime, timezone
import bcrypt
from app.extensions import db
from app.models.users import User
from app.repositories import card_repository, user_repository

def signup_user(data: dict):
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    contact_number = data.get('contact_number')
    email = data.get('email')
    password = data.get('password')
    card_number = data.get('card_number')
    
    username = first_name 

    # VERIFY THE CARD FIRST
    card = card_repository.get_card_by_number(card_number)
    
    if not card:
        return False, None, "Invalid card number. This card does not exist in the system."
        
    if card.user_id:
        return False, None, "This card is already registered to another user."

    # CHECK FOR DUPLICATES
    if user_repository.get_user_by_email(email):
        return False, None, "This email address is already in use."
        
    if user_repository.get_user_by_username(username):
        return False, None, f"The username '{username}' is already taken. Please try another."
        
    if user_repository.get_user_by_contact(contact_number):
        return False, None, "This contact number is already registered."

    # HASH PASSWORD & GENERATE ID
    plain_password = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed_password = bcrypt.hashpw(plain_password, salt)
    hashed_password_str = hashed_password.decode('utf-8')

    user_id = card_repository.generate_user_id() 
    created_at = datetime.now(timezone.utc)

    # CREATE USER 
    new_user = User(
        user_id=user_id,
        username=username,
        name=f"{first_name} {last_name}",
        password_hash=hashed_password_str, 
        email=email,
        contact_number=contact_number,
        created_at=created_at,
        role="customer",
        status="active"
    )

    try:
        # Save the new user
        user_repository.create_user(new_user)

        # INITIALIZE AND LINK THE CARD
        # Fetch the initial balance using your repository function
        initial_balance = card_repository.get_initial_balance(card_number)
        
        # Apply the setup data to the card
        card.user_id = user_id
        card.card_type = "regular"
        # Sets the balance using getinitial()
        card.balance = initial_balance

        # Update the card in the database
        card_repository.update_card(card)

        # Commit everything together
        db.session.commit()

        return True, {
            "user_id": user_id,
            "created_at": created_at.isoformat(),
            "initial_balance": initial_balance,
            "card_type": "regular"
        }, "Account created successfully!"
    
    except Exception as e:
        db.session.rollback()
        print(f"Signup Error: {e}")
        return False, None, "Failed to create account due to a system error."