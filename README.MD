#  MotionCorrect

**MotionCorrect** is a full-stack AI-powered personal fitness coach and motion-checking web application. It uses real-time computer vision in the browser to track your body joints, count reps, analyze your form range of motion, and provide intelligent coaching feedback using a locally hosted Qwen Large Language Model.

---

##  Architecture & Tech Stack

- **Frontend:** React, React Router, MediaPipe Tasks Vision (BlazePose), HTML5 Canvas
- **Backend API:** Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Bcrypt, MySQL
- **AI Microservice:** PyTorch, Hugging Face Transformers (`Qwen/Qwen2.5-0.5B-Instruct`), Flask

---


# 1\. Go to frontend folder

cd frontend

# 2\. Install packages

npm install react-router-dom
npm install

# 3\. Run the app

**Terminal 1 — Main Frontend:**

npm run dev

# 4\. Testing without backend

If you wanna test it without backend ClickF12 on Console
type the following 2 lines after the > 

localStorage.setItem('token', 'test');
localStorage.setItem('username', 'Admin');


## Backend Setup

Navigate to the backend folder:

cd backend

Create a Python virtual environment:

python -m venv venv

Activate the environment (Windows):

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

### Database Setup (MySQL required)

1. Open MySQL and create the database:

```sql
CREATE DATABASE motioncorrect_db;
```

2. Create a `.env` file inside the `backend/` folder with the following content:

```
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_NAME=motioncorrect_db
JWT_SECRET_KEY=your_secret_key
```

Replace `your_mysql_password` with your actual MySQL password.

The database tables will be created automatically on first run.

### Run the backend (requires 2 terminals):

**Terminal 2 — AI Server** (must start first):

python ai_server.py

> **Note:** The first time you run the AI server, it will automatically download the Qwen 0.5B AI model (~1GB). This only happens once. Subsequent startups load the model in about 30 seconds. Wait until you see `AI server ready.` before starting the main backend.

**Terminal 3 — Main Backend:**

python app.py

# 5. Run the test model:

python test_model.py
