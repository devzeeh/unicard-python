import os
from app import create_app

# Calling the create app function to initialize the Flask application
# Holds route endpoints
app = create_app()

if __name__ == '__main__':
    # Start the Flask development server
    port = int(os.environ.get('PORT', 5000))
    # debug mode should be False in production
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
