from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import DATABASE_URL, JWT_SECRET_KEY
from db import db
from datetime import timedelta

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

db.init_app(app)
jwt = JWTManager(app)

from routes.chat import chat_bp
from routes.users import users_bp, bcrypt
from routes.workouts import workouts_bp
from routes.profile import profile_bp

app.register_blueprint(chat_bp)
app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(workouts_bp, url_prefix="/api")
app.register_blueprint(profile_bp, url_prefix="/api")

bcrypt.init_app(app)

with app.app_context():
    import models.user
    import models.session
    import models.workout
    import models.personal_record
    db.create_all()

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Flask backend is running."})

if __name__ == "__main__":
    app.run(debug=True, port=5000)