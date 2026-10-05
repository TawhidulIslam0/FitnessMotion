# MotionCorrect - Frontend

Frontend web application for **MotionCorrect**, an AI-powered personal fitness coach and motion-checking platform.

---

## Features

* **📷 Real-Time Computer Vision Pose Tracking**
  * Tracks body joints live using browser-based MediaPipe BlazePose and HTML5 Canvas.
  * Calculates joint angles on the fly to monitor form and track repetitions.
* **💬 Interactive AI Chat Coach**
  * Built-in chat panel (`CoachPanel`) allowing users to ask fitness questions and receive real-time guidance.
* **📊 User Dashboard & Statistics**
  * View summary cards for total workouts, total reps, and average form accuracy.
  * Interactive workout history table displaying past sessions.
* **👤 Profile & Personal Records (PRs)**
  * Manage account info, track weight history, and view automated BMI calculations.
  * Log and review personal lifting records across multiple exercises (Squats, Bicep Curls, Shoulder Presses).
* **🔐 Secure Authentication**
  * Dedicated Login and Signup views with JWT token-based session handling.

---

## Tech Stack

* **Core Framework:** React
* **Build Tool:** Vite
* **Language:** JavaScript
* **Styling:** CSS3 (Inline styles & custom layouts)
* **Computer Vision:** `@mediapipe/tasks-vision` (BlazePose)
* **Routing:** `react-router-dom`

---

### Setup & Installation

1. **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev -- --open
    ```
    The application will be accessible at http://localhost:5173.

---

## Project Structure
```text
frontend/
├── public/
│   └── pose_landmarker_lite.task    # MediaPipe pose model asset
└── src/
    ├── App.jsx                      # Main routing and application structure
    ├── App.css                      # Application-specific styles
    ├── CoachPanel.jsx               # Interactive AI chat interface component
    ├── DashBoard.jsx                # User dashboard, stats, and workout history
    ├── Login.jsx                    # User sign-in screen
    ├── Profile.jsx                  # User profile, weight logs, and PR tracker
    ├── SignUp.jsx                   # User registration screen
    ├── WebcamCapture.jsx            # Computer vision pose detection & exercise screen
    ├── index.css                    # Global application styles
    └── main.jsx                     # Application entry point and DOM mounting