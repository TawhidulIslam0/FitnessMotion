# FitnessMotion - Backend

Frontend web application for **FitnessMotion**, an AI-powered personal fitness coach and motion-checking platform.

---

## Features

* **🔐 Secure Authentication & User Management**
  * Built with Flask, Flask-Bcrypt for password hashing, and Flask-JWT-Extended for token-based authentication.
* **📊 Workout & Performance Tracking**
  * SQLAlchemy database models for user sessions, workout metrics, exercise accuracy, and personal records (PRs).
* **💬 AI Conversational Coach & Form Analysis**
  * Endpoints supporting real-time fitness chat and automated form analysis prompt builders.
* **🤖 Local PyTorch AI Microservice**
  * Dedicated standalone inference server utilizing Hugging Face Transformers (`Qwen/Qwen2.5-0.5B-Instruct`) to provide low-latency local LLM coaching.

---

## Tech Stack

* **Core Framework:** Python, Flask, Flask-RESTful / Blueprints
* **Database & ORM:** MySQL, PyMySQL, Flask-SQLAlchemy, Flask-Migrate
* **Authentication:** Flask-JWT-Extended, Flask-Bcrypt
* **AI & Machine Learning:** PyTorch, Hugging Face Transformers
* **Utilities:** Flask-CORS, Python-Dotenv, Requests

---

### Setup & Installation

1. **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2. **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    venv\Scripts\activate    # On Windows (use source venv/bin/activate on Mac/Linux)
    ```
3. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4. **Create a `.env` file inside the `backend` directory:**
    ```env
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_HOST=localhost
    DB_NAME=motioncorrect_db
    JWT_SECRET_KEY=your_secret_key
    ```
5. **Set up MySQL Database:**
   Open your MySQL client and run:
    ```sql
    CREATE DATABASE motioncorrect_db;
    ```

---

### Running the Backend (Requires 2 Terminals)

* **Terminal 1 — Local AI Model Server** (Start this first):
    ```bash
    python ai_server.py
    ```
    *(Note: The first run downloads the Qwen 0.5B model (~1GB). Wait until you see `AI server ready.`)*

* **Terminal 2 — Main Flask API Server**:
    ```bash
    python app.py
    ```

*(Optional) You can verify your local model setup by running:*
```bash
python test_model.py
```

---

## Project Structure
```text
backend/
├── ai/
│   ├── coach.py                 # AI conversational coach logic & chat prompts
│   └── form_analysis.py         # Prompt builder for exercise form evaluation
├── models/
│   ├── personal_record.py       # PR and weight log database models
│   ├── session.py               # Chat session and message database models
│   ├── user.py                  # User authentication database model
│   └── workout.py               # Workout session tracking database model
├── routes/
│   ├── chat.py                  # Chat blueprint API endpoints
│   ├── profile.py               # Profile, weight history, and PR endpoints
│   ├── users.py                 # Authentication (register/login) endpoints
│   └── workouts.py              # Workout save, history, and AI analysis endpoints
├── ai_server.py                 # Local PyTorch Qwen model inference microservice
├── app.py                       # Main Flask application entry point & DB context setup
├── config.py                    # Environment variables and app configuration
├── db.py                        # SQLAlchemy database initialization
├── requirements.txt             # Python dependencies
└── test_model.py                # Model verification testing script
```
