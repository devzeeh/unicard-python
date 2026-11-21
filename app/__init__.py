import os
from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, migrate

def create_app():
    """
    Initializes the Flask application, loads environment variables, configures the database,
    and blueprint endpoints routes.
    """
    # Load environment variables from .env file
    load_dotenv()
    
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-dev-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    from app.routes.auth import auth_bp
    from app.routes.signup import sign_up
    from app.routes.transactions import transactions
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/')
    app.register_blueprint(sign_up, url_prefix='/')
    app.register_blueprint(transactions, url_prefix='/v1/transactions')

    # A simple healthcheck route to ensure it's working
    @app.route('/health')
    def health():
        return {"status": "ok", "message": "UniCard Python API is running!"}

    return app
