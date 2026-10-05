import os
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "motioncorrect-dev-secret-2024")