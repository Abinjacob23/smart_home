from flask import Flask, request
from database import init_db

# Import route blueprints
from routes.gas_routes import gas_bp
from routes.electricity_routes import electricity_bp
from routes.appliance_routes import appliance_bp
from routes.crack_routes import crack_bp


app = Flask(__name__)


# -----------------------------
# Initialize database
# -----------------------------
init_db()

# -----------------------------
# Register API routes
# -----------------------------
app.register_blueprint(gas_bp)
app.register_blueprint(electricity_bp)
app.register_blueprint(appliance_bp)
app.register_blueprint(crack_bp)


# -----------------------------
# Debug logging (very useful)
# -----------------------------
@app.before_request
def log_request():
    print(f"API REQUEST → {request.method} {request.path}")


# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )