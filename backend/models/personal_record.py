from db import db
from datetime import datetime


class WeightLog(db.Model):
    __tablename__ = "weight_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    weight_lbs = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WeightLog {self.weight_lbs}kg>"


class PersonalRecord(db.Model):
    __tablename__ = "personal_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exercise_type = db.Column(db.String(50), nullable=False)
    weight_lbs = db.Column(db.Float, nullable=False)
    reps = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PersonalRecord {self.exercise_type}: {self.weight_lbs}kg x {self.reps}>"
