from db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    height = db.Column(db.Float, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sessions = db.relationship("ChatSession", backref="user", lazy=True)
    workouts = db.relationship("WorkoutSession", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.username}>"