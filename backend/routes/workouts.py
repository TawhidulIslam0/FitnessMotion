from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db
from models.workout import WorkoutSession
from ai.coach import get_ai_response
from ai.form_analysis import build_form_prompt
import threading
import uuid

workouts_bp = Blueprint("workouts", __name__)

_analysis_results = {}


@workouts_bp.route("/workout/save", methods=["POST"])
@jwt_required()
def save_workout():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        exercise_type = data.get("exercise_type", "").strip()
        total_reps = data.get("total_reps", 0)
        good_reps = data.get("good_reps", 0)
        accuracy = data.get("accuracy", 0.0)

        if not exercise_type:
            return jsonify({"error": "Exercise type is required."}), 400

        workout = WorkoutSession(
            user_id=user_id,
            exercise_type=exercise_type,
            total_reps=total_reps,
            good_reps=good_reps,
            accuracy=accuracy,
        )
        db.session.add(workout)
        db.session.commit()

        return jsonify({"message": "Workout saved successfully.", "id": workout.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@workouts_bp.route("/workout/history", methods=["GET"])
@jwt_required()
def workout_history():
    try:
        user_id = get_jwt_identity()
        workouts = WorkoutSession.query.filter_by(user_id=user_id).order_by(WorkoutSession.created_at.desc()).limit(20).all()
        return jsonify([{
            "id": w.id,
            "exercise_type": w.exercise_type,
            "total_reps": w.total_reps,
            "good_reps": w.good_reps,
            "accuracy": w.accuracy,
            "created_at": w.created_at.strftime("%Y-%m-%d %H:%M"),
        } for w in workouts]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@workouts_bp.route("/user/stats", methods=["GET"])
@jwt_required()
def user_stats():
    try:
        user_id = get_jwt_identity()

        workouts = WorkoutSession.query.filter_by(user_id=user_id).all()

        total_workouts = len(workouts)
        total_reps = sum(w.total_reps for w in workouts)
        avg_accuracy = (
            round(sum(w.accuracy for w in workouts) / total_workouts, 1)
            if total_workouts > 0
            else 0
        )

        return jsonify({
            "totalWorkouts": total_workouts,
            "totalReps": total_reps,
            "avgAccuracy": avg_accuracy,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@workouts_bp.route("/analyze-form", methods=["POST"])
@jwt_required()
def analyze_form():
    data = request.get_json()
    exercise_type = data.get("exercise_type", "").strip()
    total_reps = data.get("total_reps", 0)
    rep_stats = data.get("rep_stats", [])

    if not exercise_type or total_reps == 0:
        return jsonify({"error": "No workout data to analyze."}), 400

    task_id = str(uuid.uuid4())
    _analysis_results[task_id] = {"status": "processing"}

    def run_inference():
        try:
            prompt = build_form_prompt(exercise_type, total_reps, rep_stats)
            feedback = get_ai_response(prompt)
            _analysis_results[task_id] = {"status": "done", "feedback": feedback}
        except Exception as e:
            _analysis_results[task_id] = {"status": "error", "error": str(e)}

    thread = threading.Thread(target=run_inference, daemon=True)
    thread.start()

    return jsonify({"task_id": task_id, "status": "processing"}), 202


@workouts_bp.route("/analyze-form/result/<task_id>", methods=["GET"])
@jwt_required()
def analyze_form_result(task_id):
    result = _analysis_results.get(task_id)
    if not result:
        return jsonify({"error": "Not found"}), 404
    if result["status"] == "processing":
        return jsonify({"status": "processing"}), 202
    _analysis_results.pop(task_id, None)
    if result["status"] == "error":
        return jsonify({"error": result["error"]}), 500
    return jsonify({"feedback": result["feedback"]}), 200
