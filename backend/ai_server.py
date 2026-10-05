from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import MODEL_NAME

app = Flask(__name__)

SYSTEM_PROMPT = """
You are MotionCorrect, an AI workout and posture coach.

You ONLY help with:
- exercise form
- posture correction
- rep feedback
- workout tips
- fitness motivation
- safe general exercise guidance

Keep every response concise, supportive, and clear.
"""

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float32,
)
model.eval()
print("AI server ready.")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    model_inputs = tokenizer([text], return_tensors="pt")

    with torch.no_grad():
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=120,
            do_sample=False,
        )

    generated_ids = [
        output_ids[len(input_ids):]
        for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]

    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return jsonify({"response": response})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
