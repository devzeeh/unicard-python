from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.services.auth_service import authenticate_user

auth_bp = Blueprint('auth', __name__)

# 1. GET only: Fetches the HTML page
@auth_bp.route('/login', methods=['GET'])
def login_page():
    # If the user is already logged in, redirect them based on their role
    if 'role' in session:
        return redirect_based_on_role(session.get('role'))
        
    return render_template('auth/login.html')

# 2. POST only: Handles logic and validation
@auth_bp.route('/v1/login', methods=['POST'])
def login_process():
    data = request.get_json() or {}
    identifier = data.get('identifier')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"status": "error", "message": "Identifier and password are required."}), 400
        
    is_success, user, message = authenticate_user(identifier, password)

    if is_success and user:
        # Save explicit session data
        session.clear() # clear any old session data
        session['user_id'] = user.user_id
        session['role'] = user.role
        
        # Return success with the redirect URL
        redirect_url = get_role_redirect_url(user.role)
        return jsonify({"status": "success", "message": message, "redirect_url": redirect_url}), 200
        
    return jsonify({"status": "error", "message": message}), 401

@auth_bp.route('/logout', methods=['GET', 'POST'])
def logout():
    """Explicitly clears the session and logs the user out."""
    session.clear()
    # Updated to point to the new GET function name
    return redirect(url_for('auth.login_page'))

def get_role_redirect_url(role: str) -> str:
    """Helper to determine where a user should land after login."""
    if role == 'super_admin':
        return '/admin'
    elif role == 'merchant_admin' or role == 'merchant_staff':
        return '/merchant'
    else:
        return '/dashboard'

def redirect_based_on_role(role: str):
    return redirect(get_role_redirect_url(role))