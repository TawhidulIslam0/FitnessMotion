# FitnessMotion

**FitnessMotion** is a full-stack AI-powered personal fitness coach and motion-checking web application. It uses real-time computer vision in the browser to track your body joints, count reps, analyze your form range of motion, and provide intelligent coaching feedback using a locally hosted Qwen Large Language Model.

---

## 🏗️ Architecture & Tech Stack

* **Frontend:** React, React Router, MediaPipe Tasks Vision (BlazePose), HTML5 Canvas
* **Backend API:** Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Bcrypt, MySQL, PyMySQL
* **AI Microservice:** PyTorch, Hugging Face Transformers (`Qwen/Qwen2.5-0.5B-Instruct`), Flask

---

## 🌟 Features

* **📷 Real-Time Computer Vision Pose Tracking**
  * Tracks body joints live using browser-based MediaPipe BlazePose and HTML5 Canvas.
  * Calculates joint angles on the fly to monitor form and track repetitions.
* **🤖 Local AI Coaching & Form Analysis**
  * Integrates a locally hosted Qwen Large Language Model via a Python/PyTorch microservice.
  * Automatically analyzes workout range-of-motion metrics and provides specific form feedback.
* **📊 Workout History & Performance Stats**
  * Monitor total workouts, completed reps, and average form accuracy percentages.
* **👤 User Profile, Weight Logs & Personal Records (PRs)**
  * Track weight changes over time with automated BMI calculations.
  * Record and track personal lifting records across multiple exercises (Squat, Bicep Curl, Shoulder Press).
* **💬 Interactive AI Chat Coach**
  * Persistent chat session with the Qwen model for real-time fitness tips and motivation.

---

## 🚀 Setup & Installation

### 1. Frontend Setup
1. **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2. **Install dependencies:**
    ```bash
    npm install react-router-dom
    npm install
    ```
3. **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173`.

> **Tip (Testing without backend):** If you want to test the frontend UI without running the backend, open your browser Console (F12) and run:
> ```javascript
> localStorage.setItem('token', 'test');
> localStorage.setItem('username', 'Admin');
> ```

---

### 2. Backend & AI Server Setup (MySQL Required)
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
4. **Configure Database (MySQL):**
   Open your MySQL client and create the database:
    ```sql
    CREATE DATABASE motioncorrect_db;
    ```
5. **Create a `.env` file inside the `backend` directory:**
    ```env
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_HOST=localhost
    DB_NAME=motioncorrect_db
    JWT_SECRET_KEY=your_secret_key
    ```
    *(Note: Database tables will be created automatically on first run).*

---

### 3. Running the Servers (Requires 2 Terminals)

* **Terminal 1 — Local AI Model Server** (Start this first):
    ```bash
    python ai_server.py
    ```
    > **Note:** The first time you run the AI server, it will automatically download the Qwen 0.5B AI model (~1GB). Subsequent startups load the model in about 30 seconds. Wait until you see `AI server ready.` before starting the main backend.

* **Terminal 2 — Main Flask API Server**:
    ```bash
    python app.py
    ```

*(Optional) You can verify your local model setup by running:*
```bash
python test_model.py
```

---

## 📂 Project Structure
```text
FitnessMotion/
├── backend/
│   ├── ai/
│   │   ├── coach.py                 # AI conversational coach logic & chat prompts
│   │   └── form_analysis.py         # Prompt builder for exercise form evaluation
│   ├── models/
│   │   ├── personal_record.py       # PR and weight log database models
│   │   ├── session.py               # Chat session and message database models
│   │   ├── user.py                  # User authentication database model
│   │   └── workout.py               # Workout session tracking database model
│   ├── routes/
│   │   ├── chat.py                  # Chat blueprint API endpoints
│   │   ├── profile.py               # Profile, weight history, and PR endpoints
│   │   ├── users.py                 # Authentication (register/login) endpoints
│   │   └── workouts.py              # Workout save, history, and AI analysis endpoints
│   ├── ai_server.py                 # Local PyTorch Qwen model inference microservice
│   ├── app.py                       # Main Flask application entry point & DB context setup
│   ├── config.py                    # Environment variables and app configuration
│   ├── db.py                        # SQLAlchemy database initialization
│   ├── requirements.txt             # Python dependencies
│   └── test_model.py                # Model verification testing script
└── frontend/
    ├── public/
    │   └── pose_landmarker_lite.task    # MediaPipe pose model asset
    ├── src/
    │   ├── App.jsx                  # Main routing and application structure
    │   ├── App.css                  # Application-specific styles
    │   ├── CoachPanel.jsx           # Interactive AI chat interface component
    │   ├── DashBoard.jsx            # User dashboard, stats, and workout history
    │   ├── Login.jsx                # User sign-in screen
    │   ├── Profile.jsx              # User profile, weight logs, and PR tracker
    │   ├── SignUp.jsx               # User registration screen
    │   ├── WebcamCapture.jsx        # Computer vision pose detection & exercise screen
    │   ├── index.css                # Global application styles
    │   └── main.jsx                 # Application entry point and DOM mounting
    └── package.json                 # Node.js dependencies and scripts
```
