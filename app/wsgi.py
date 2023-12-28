# Import the 'app' instance from the 'main' module (presumably where the Flask app is defined)
from main import app

# Check if the script is being run directly (not imported as a module)
if __name__ == "__main__":
    # Run the Flask application
    app.run()
