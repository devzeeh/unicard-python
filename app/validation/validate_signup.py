from marshmallow import Schema, ValidationError, fields, validate, validates_schema

class ValidateSignup(Schema):
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    email = fields.Email(required=True, error_messages={"invalid": "Please a valid email address"})
    card_number = fields.Str(required=True)
    # validate the contact number in Philippine
    contact_number = fields.Str(
        required=True,
        validate=validate.Regexp(r"^09\d{9}$", error="Contact numbermust be an 11Digits number starting with 09.")
    )
    password = fields.Str(required=True, validate=validate.Length(min=8, error="Password must be at least 8 characters."))
    confirm_password = fields.Str(required=True)

@validates_schema
def validate_passwords(self, data, **kwarg):
    if data.get("password") != data.get("confirm_password"):
        raise ValidationError("Password do not match")