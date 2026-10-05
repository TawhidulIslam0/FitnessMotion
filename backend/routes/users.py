from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from db import db
from models.user import User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
users_bp = Blueprint("users", __name__)

@users_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not username or not email or not password:
            return jsonify({"error": "All fields are required."}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered."}), 409

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already taken."}), 409

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully."}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password."}), 401

        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Login successful.",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500