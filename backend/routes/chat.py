from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ai.coach import get_ai_response
from db import db
from models.session import ChatSession, Message

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    try:
        user_id = get_jwt_identity()

        data = request.get_json()
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "No message provided."}), 400

        # Create a new session if one doesn't exist
        session_id = data.get("session_id")
        if not session_id:
            new_session = ChatSession(user_id=user_id)
            db.session.add(new_session)
            db.session.commit()
            session_id = new_session.id

        # Save user message to DB
        user_msg = Message(session_id=session_id, role="user", content=user_message)
        db.session.add(user_msg)
        db.session.commit()

        # Get AI response
        response = get_ai_response(user_message)

        # Save AI response to DB
        ai_msg = Message(session_id=session_id, role="assistant", content=response)
        db.session.add(ai_msg)
        db.session.commit()

        return jsonify({
            "response": response,
            "session_id": session_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500