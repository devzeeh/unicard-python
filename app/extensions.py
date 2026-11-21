from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions without binding them to the app yet
db = SQLAlchemy()
migrate = Migrate()
