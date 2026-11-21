import uuid
from decimal import Decimal
from typing import Tuple, Dict, Any

from app.extensions import db
from app.models.cards import CardType
from app.models.transactions import Transaction, TransactionType, TransactionStatus
from app.repositories import card_repository, merchant_repository, transaction_repository

def get_transactions_for_card(card_number: str) -> list:
    """
    Returns recent transactions for a given card.
    """
    transactions = transaction_repository.get_transactions_by_card(card_number)
    return [t.to_dict() for t in transactions]

def calculate_discount(amount: Decimal, card_type: CardType) -> Decimal:
    """
    Applies a 20% discount if the user is eligible (PWD, Student, Senior).
    Returns the discounted amount.
    """
    eligible_types = [CardType.PWD, CardType.STUDENT, CardType.SENIOR]
    if card_type in eligible_types:
        return (amount * Decimal('0.80')).quantize(Decimal('0.01'))
    return amount

def calculate_cashback(amount: Decimal) -> Decimal:
    """
    Calculates 0.2% cashback points.
    """
    return (amount * Decimal('0.002')).quantize(Decimal('0.01'))

def process_payment(card_uid: str, merchant_id: str, amount: Decimal, terminal_id: str = None) -> Tuple[bool, Dict[str, Any]]:
    """
    Core business logic for processing a payment from a hardware terminal.
    Executes in a single database transaction.
    """
    try:
        # 1. Fetch Card
        card = card_repository.get_card_by_uid(card_uid)
        if not card:
            return False, {"error": "Card not found"}
        
        # We should check if card is active, but assuming it is for now unless status is added.

        # 2. Fetch Merchant
        merchant = merchant_repository.get_merchant_by_id(merchant_id)
        if not merchant:
            return False, {"error": "Merchant not found"}
        
        # 3. Calculate financial rules
        final_amount = calculate_discount(amount, card.card_type)
        points_earned = calculate_cashback(final_amount)
        
        # Determine merchant commission (assuming 2% service fee if not set)
        commission_rate = merchant.commission_rate if merchant.commission_rate else Decimal('0.02')
        service_fee = (final_amount * commission_rate).quantize(Decimal('0.01'))
        net_merchant_payout = final_amount - service_fee

        # 4. Check balance
        if card.balance < final_amount:
            return False, {"error": "Insufficient balance"}

        # 5. Perform atomic operations
        card.balance -= final_amount
        card.loyalty_points += points_earned
        card_repository.update_card(card)

        # 6. Log transaction
        txn = Transaction(
            transaction_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
            card_number=card.card_number,
            user_id=card.user_id,
            merchant_id=merchant_id,
            terminal_id=terminal_id,
            transaction_type=TransactionType.PAYMENT,
            amount=final_amount,
            points_earned=points_earned,
            service_fee=service_fee,
            net_merchant_payout=net_merchant_payout,
            status=TransactionStatus.COMPLETED,
            description=f"Payment at {merchant.business_name}"
        )
        transaction_repository.create_transaction(txn)

        # 7. Commit the entire unit of work
        db.session.commit()
        
        # TODO: Trigger Email Receipt Here
        print(f"[EMAIL MOCK] Receipt sent for {txn.transaction_id} to user {card.user_id}")

        return True, txn.to_dict()

    except Exception as e:
        db.session.rollback()
        # Log the exception explicitly here in a real production system
        print(f"Transaction failed: {str(e)}")
        return False, {"error": "Internal server error during transaction processing"}
