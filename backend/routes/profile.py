from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db
from models.user import User
from models.personal_record import PersonalRecord, WeightLog

profile_bp = Blueprint("profile", __name__)

VALID_EXERCISES = ["squat", "bicep_curl", "shoulder_press"]


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({"error": "User not found."}), 404

        latest_log = (
            WeightLog.query.filter_by(user_id=user_id)
            .order_by(WeightLog.created_at.desc())
            .first()
        )
        current_weight = latest_log.weight_lbs if latest_log else user.weight

        return jsonify({
            "username": user.username,
            "email": user.email,
            "height": user.height,
            "weight": current_weight,
            "created_at": user.created_at.strftime("%Y-%m-%d"),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/profile/weight", methods=["POST"])
@jwt_required()
def update_weight():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        weight_lbs = data.get("weight_lbs")

        if not weight_lbs or float(weight_lbs) <= 0:
            return jsonify({"error": "Valid weight is required."}), 400

        log = WeightLog(user_id=user_id, weight_lbs=float(weight_lbs))
        db.session.add(log)

        user = User.query.filter_by(id=user_id).first()
        user.weight = float(weight_lbs)
        db.session.commit()

        return jsonify({"message": "Weight updated successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/profile/weight-history", methods=["GET"])
@jwt_required()
def weight_history():
    try:
        user_id = get_jwt_identity()
        logs = (
            WeightLog.query.filter_by(user_id=user_id)
            .order_by(WeightLog.created_at.desc())
            .limit(10)
            .all()
        )
        return jsonify([
            {"weight_lbs": log.weight_lbs, "date": log.created_at.strftime("%Y-%m-%d")}
            for log in logs
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/profile/prs", methods=["GET"])
@jwt_required()
def get_prs():
    try:
        user_id = get_jwt_identity()
        result = {}
        for exercise in VALID_EXERCISES:
            records = (
                PersonalRecord.query.filter_by(user_id=user_id, exercise_type=exercise)
                .order_by(PersonalRecord.created_at.desc())
                .limit(10)
                .all()
            )
            result[exercise] = [
                {
                    "weight_lbs": r.weight_lbs,
                    "reps": r.reps,
                    "date": r.created_at.strftime("%Y-%m-%d"),
                }
                for r in records
            ]
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/profile/pr", methods=["POST"])
@jwt_required()
def add_pr():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        exercise_type = data.get("exercise_type", "").strip()
        weight_lbs = data.get("weight_lbs")
        reps = data.get("reps", 1)

        if exercise_type not in VALID_EXERCISES:
            return jsonify({"error": "Invalid exercise type."}), 400
        if not weight_lbs or float(weight_lbs) <= 0:
            return jsonify({"error": "Valid weight is required."}), 400

        pr = PersonalRecord(
            user_id=user_id,
            exercise_type=exercise_type,
            weight_lbs=float(weight_lbs),
            reps=int(reps) if reps else 1,
        )
        db.session.add(pr)
        db.session.commit()

        return jsonify({"message": "PR recorded successfully."}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
