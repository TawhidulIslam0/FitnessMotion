import requests

AI_SERVER_URL = "http://localhost:5001/generate"

def is_fitness_related(message: str) -> bool:
    fitness_keywords = [
        "workout", "exercise", "squat", "squats", "curl", "curls",
        "bicep", "shoulder", "press", "rep", "reps", "posture",
        "form", "fitness", "gym", "training", "train", "pain",
        "stretch", "warmup", "warm up", "routine", "sets", "set",
        "muscle", "muscles", "legs", "arms", "back", "chest",
        "core", "abs", "glutes", "knees", "elbows", "hips",
        "balance", "mobility", "strength", "cardio", "injury",
        "injured", "hurt", "hurts"
    ]
    return any(keyword in message.lower() for keyword in fitness_keywords)


def contains_medical_concern(message: str) -> bool:
    medical_keywords = [
        "pain", "injury", "injured", "hurt", "hurts",
        "swelling", "swollen", "numb", "numbness",
        "dizzy", "dizziness", "sharp pain", "tear",
        "sprain", "strain", "burning", "chest pain",
        "can't walk", "cant walk", "cannot walk",
        "bleeding", "pop", "popped", "snap", "snapped"
    ]
    return any(keyword in message.lower() for keyword in medical_keywords)


def get_ai_response(prompt: str) -> str:
    if not prompt or not prompt.strip():
        return "Ask me about your workout form, posture, reps, or fitness goals."

    if contains_medical_concern(prompt):
        return (
            "I'm not a medical professional, but if you're experiencing pain or a possible injury, "
            "it may be best to stop exercising and consult a doctor or licensed healthcare provider."
        )

    if not is_fitness_related(prompt):
        return (
            "I'm here to help with workouts and posture coaching. "
            "Ask me about exercise form, reps, posture, or fitness tips."
        )

    try:
        res = requests.post(AI_SERVER_URL, json={"prompt": prompt}, timeout=180)
        res.raise_for_status()
        return res.json().get("response", "No response received.")
    except requests.exceptions.ConnectionError:
        return "AI server is not running. Please start ai_server.py on port 5001."
    except Exception as e:
        return f"AI error: {str(e)}"
