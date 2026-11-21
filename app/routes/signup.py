from flask import Blueprint, jsonify, render_template, request
from marshmallow import ValidationError
from app.services.signup_services import signup_user
from app.validation.validate_signup import ValidateSignup

sign_up = Blueprint('signup', __name__)

# calling the signup view
@sign_up.route('/signup', methods=['GET'])
def signup_page():
    return render_template('auth/signup.html')

@sign_up.route('/v1/signup', methods=["POST"])
def signup_process():
    try:
        # This single line validates EVERYTHING (missing fields, matching passwords, email format)
        # If anything is wrong, it immediately jumps to the 'except' block below.
        cleaned_data = ValidateSignup().load(request.get_json() or {})
        
    except ValidationError as err:
        # Grab the first error message to send back to the frontend
        first_error = next(iter(err.messages.values()))
        if isinstance(first_error, list):
            first_error = first_error[0]
            
        return jsonify({
            "status": "error", 
            "message": first_error
        }), 400

    # pass the validated data to services signup_user
    is_success, result_data, message = signup_user(cleaned_data)

    if is_success:
        return jsonify({
            "status": "success",
            "message": message, 
            "data": result_data
        }), 201  # 201 Created is the standard for successful signups
    
    return jsonify({
        "status": "error",
        "message": message
    }), 400