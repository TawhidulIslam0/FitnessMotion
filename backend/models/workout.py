from db import db
from datetime import datetime


class WorkoutSession(db.Model):
    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exercise_type = db.Column(db.String(100), nullable=False)
    total_reps = db.Column(db.Integer, default=0)
    good_reps = db.Column(db.Integer, default=0)
    accuracy = db.Column(db.Float, default=0.0)
    rep_stats = db.Column(db.JSON, nullable=True)
    ai_insights = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WorkoutSession {self.exercise_type}: {self.total_reps} reps>"
