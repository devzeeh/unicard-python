from decimal import Decimal, InvalidOperation
from flask import Blueprint, jsonify, request
from app.services.transaction_service import get_transactions_for_card, process_payment

transactions = Blueprint('transactions', __name__)

@transactions.route('/<card_number>', methods=['GET'])
def list_transactions(card_number):
    """
    Returns a list of recent transactions for a card.
    """
    history = get_transactions_for_card(card_number)
    return jsonify({
        "status": "success",
        "data": history
    }), 200

@transactions.route('/process', methods=['POST'])
def handle_payment():
    """
    Endpoint for hardware terminals to process a payment.
    Expects JSON:
    {
        "card_uid": "ABC12",
        "merchant_id": "MERCH-XYZ",
        "amount": "150.00",
        "terminal_id": "TERM-1" (optional)
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400
        
    card_uid = data.get('card_uid')
    merchant_id = data.get('merchant_id')
    amount_str = data.get('amount')
    terminal_id = data.get('terminal_id')

    if not all([card_uid, merchant_id, amount_str]):
        return jsonify({"status": "error", "message": "card_uid, merchant_id, and amount are required"}), 400

    try:
        amount = Decimal(str(amount_str))
    except (InvalidOperation, ValueError):
        return jsonify({"status": "error", "message": "Invalid amount format"}), 400

    if amount <= Decimal('0.00'):
        return jsonify({"status": "error", "message": "Amount must be greater than zero"}), 400

    success, result = process_payment(card_uid, merchant_id, amount, terminal_id)
    
    if success:
        return jsonify({
            "status": "success",
            "transaction": result
        }), 201
    else:
        return jsonify({
            "status": "error",
            "message": result.get("error")
        }), 400
