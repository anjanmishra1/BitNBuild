import os
import threading
import joblib
import torch
import torch.nn as nn
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS


# =========================================================
# CONFIG & PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model.pth")
VECTORIZER_FILE = os.path.join(BASE_DIR, "vectorizer.pkl")
FEEDBACK_FILE = os.path.join(BASE_DIR, "feedback.txt")

FEEDBACK_THRESHOLD = 5


# =========================================================
# FLASK & CORS
# =========================================================

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "templates")
)

CORS(app, resources={r"/*": {"origins": "*"}})


# =========================================================
# DEVICE
# =========================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# =========================================================
# MODEL ARCHITECTURE
# =========================================================

class TextClassifier(nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1)
        )

    def forward(self, x):
        return self.network(x)


# =========================================================
# GLOBAL STATE
# =========================================================

model = None
vectorizer = None
model_lock = threading.Lock()
retraining_lock = threading.Lock()
retraining_running = False


# =========================================================
# LOAD MODEL
# =========================================================

def load_model():
    global model, vectorizer

    # Auto-train if files are missing
    if not os.path.exists(MODEL_FILE) or not os.path.exists(VECTORIZER_FILE):
        print("Model or vectorizer file missing. Initializing training...")
        try:
            from train_model import train_model
            train_model()
        except Exception as error:
            print("Auto-training failed:", error)

    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(f"Model file not found: {MODEL_FILE}")

    if not os.path.exists(VECTORIZER_FILE):
        raise FileNotFoundError(f"Vectorizer file not found: {VECTORIZER_FILE}")

    new_vectorizer = joblib.load(VECTORIZER_FILE)
    input_size = len(new_vectorizer.get_feature_names_out())

    new_model = TextClassifier(input_size)
    new_model.load_state_dict(
        torch.load(MODEL_FILE, map_location=device, weights_only=True)
    )
    new_model.to(device)
    new_model.eval()

    with model_lock:
        vectorizer = new_vectorizer
        model = new_model

    print("Spider-Sense model loaded successfully.")
    print("Device:", device)
    return True


# Load model at startup
try:
    load_model()
except Exception as startup_err:
    print("Startup model loading failed (will retry on first request):", startup_err)


# =========================================================
# FEEDBACK STORAGE
# =========================================================

def get_feedback_count():
    if not os.path.exists(FEEDBACK_FILE):
        return 0

    with open(FEEDBACK_FILE, "r", encoding="utf-8") as file:
        return sum(1 for line in file if line.strip())


def save_feedback(text, correct_label):
    clean_text = (
        text
        .replace("\t", " ")
        .replace("\r", " ")
        .replace("\n", " ")
        .strip()
    )

    with open(FEEDBACK_FILE, "a", encoding="utf-8") as file:
        file.write(f"{correct_label}\t{clean_text}\n")


# =========================================================
# LINGUISTIC PATTERN ANALYSIS
# =========================================================

import re
import numpy as np

GENERIC_AI_PATTERNS = [
    r"\bdelve into\b", r"\btestament to\b", r"\bplays a (crucial|vital|pivotal|key) role\b",
    r"\bin today'?s (world|rapidly|fast-paced|ever-evolving)\b", r"\blandscape\b",
    r"\bfoster a sense\b", r"\btapestry\b", r"\bnuances?\b", r"\bstreamline\b",
    r"\bholistic approach\b", r"\bcomprehensive (approach|framework|solution)\b",
    r"\bby leveraging\b", r"\brapidly evolving\b", r"\bmultifaceted\b",
    r"\bseamlessly integrate\b", r"\bdecision-making\b", r"\bparadigm shift\b",
    r"\btransparency, planning, and evaluation\b", r"\bintelligent automation\b",
    r"\bcloud computing can contribute\b", r"\binterplay\b", r"\bfurthermore\b",
    r"\bframework\b", r"\bmethodology\b", r"\boptimizing\b", r"\btransforming\b",
    r"\bsignificant opportunities\b", r"\boperational effectiveness\b"
]

CASUAL_HUMAN_PATTERNS = [
    r"\b(hey|yo|bro|dude|gonna|wanna|gotta|kinda|lol|haha|btw|idk|nah|yeah|yep|nope)\b",
    r"\b(grab|hang out|snacks|pizza|tacos|coffee|chilling|sleep|woke up)\b",
    r"\b(my (cat|dog|mom|dad|roommate|friend|teacher|brother|sister))\b",
    r"(\!{2,}|\?{2,}|\.{3,})",
    r"'(s|re|ve|m|ll|d)\b",
    r"\b(i|me|my|we|us|our|you|he|she)\b"
]

def analyze_linguistics(text):
    lower = text.lower()
    words = re.findall(r"\b[a-z]+\b", lower)
    if not words:
        return 0.5
    ai_hits = sum(1 for p in GENERIC_AI_PATTERNS if re.search(p, lower))
    human_hits = sum(1 for p in CASUAL_HUMAN_PATTERNS if re.search(p, lower))
    score = 0.5
    if ai_hits > 0:
        score += min(0.45, ai_hits * 0.18)
    if human_hits > 0:
        score -= min(0.45, human_hits * 0.15)
    return max(0.05, min(0.95, score))


# =========================================================
# PREDICTION
# =========================================================

def predict_text(text):
    global model, vectorizer

    with model_lock:
        if model is None or vectorizer is None:
            try:
                load_model()
            except Exception as load_err:
                print("On-demand model loading failed:", load_err)

        current_model = model
        current_vectorizer = vectorizer

        if current_model is None or current_vectorizer is None:
            raise RuntimeError(
                "Model is not loaded. Please ensure model.pth and vectorizer.pkl exist."
            )

        vector = current_vectorizer.transform([text]).toarray()
        tensor = torch.tensor(vector, dtype=torch.float32).to(device)

        current_model.eval()
        with torch.no_grad():
            output = current_model(tensor)
            nn_probability = torch.sigmoid(output).item()

    # Linguistic heuristic score
    ling_prob = analyze_linguistics(text)
    words = text.split()
    nnz = np.count_nonzero(vector)

    # Adaptive calibrated ensemble
    if len(words) <= 7 and ling_prob <= 0.5:
        probability = min(nn_probability * 0.3 + ling_prob * 0.7, 0.45)
    elif nnz >= 20:
        probability = 0.70 * nn_probability + 0.30 * ling_prob
    else:
        probability = 0.40 * nn_probability + 0.60 * ling_prob

    if probability >= 0.5:
        result = "AI-generated"
        confidence = probability * 100
    else:
        result = "Human-written"
        confidence = (1 - probability) * 100

    return {
        "result": result,
        "confidence": round(confidence, 2),
        "ai_probability": round(probability * 100, 2)
    }


# =========================================================
# RETRAINING
# =========================================================

def retrain_model():
    global retraining_running

    if retraining_running:
        print("Retraining already running.")
        return

    with retraining_lock:
        retraining_running = True
        try:
            print("\nSpider-Sense retraining started...")
            from train_model import train_model
            success = train_model()
            if success:
                load_model()
                print("Spider-Sense model updated successfully from feedback.")
            else:
                print("Training did not complete.")
        except Exception as error:
            print("Retraining error:", error)
        finally:
            retraining_running = False


# =========================================================
# ROUTES
# =========================================================

@app.route("/")
def home():
    template_path = os.path.join(BASE_DIR, "templates", "index.html")
    if os.path.exists(template_path):
        return render_template("index.html")

    root_index = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(root_index):
        return send_from_directory(BASE_DIR, "index.html")

    return jsonify({
        "name": "Spider-Sense",
        "status": "online",
        "message": "Spider-Sense API is running."
    })


@app.route("/api")
def api_info():
    return jsonify({
        "name": "Spider-Sense",
        "status": "online",
        "model_loaded": model is not None,
        "device": str(device),
        "feedback_count": get_feedback_count(),
        "endpoints": {
            "GET /": "Web UI",
            "POST /predict": "Analyze text for AI vs Human",
            "POST /feedback": "Submit correct label for continuous learning",
            "GET /health": "Health and model status"
        }
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "online",
        "model": "Spider-Sense",
        "model_loaded": model is not None,
        "device": str(device),
        "feedback_count": get_feedback_count(),
        "retraining": retraining_running
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON request."}), 400

    text = data.get("text", "")

    if not isinstance(text, str):
        return jsonify({"error": "Text must be a string."}), 400

    text = text.strip()

    if not text:
        return jsonify({"error": "Text cannot be empty."}), 400

    try:
        result = predict_text(text)
        return jsonify(result)
    except Exception as error:
        print("Prediction error:", error)
        return jsonify({"error": str(error)}), 500


@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON request."}), 400

    text = data.get("text", "")
    correct_label = data.get("correct_label", "")

    if not isinstance(text, str):
        return jsonify({"error": "Invalid text."}), 400

    if not isinstance(correct_label, str):
        return jsonify({"error": "Invalid label."}), 400

    text = text.strip()
    correct_label = correct_label.strip().lower()

    if not text:
        return jsonify({"error": "Text cannot be empty."}), 400

    if correct_label not in ["human", "ai"]:
        return jsonify({"error": "Label must be human or ai."}), 400

    save_feedback(text, correct_label)
    feedback_count = get_feedback_count()
    print("Feedback received. Total feedback entries:", feedback_count)

    if feedback_count >= FEEDBACK_THRESHOLD and not retraining_running:
        thread = threading.Thread(target=retrain_model, daemon=True)
        thread.start()

        return jsonify({
            "success": True,
            "message": "Feedback saved. Spider-Sense is retraining.",
            "feedback_count": feedback_count,
            "retraining": True
        })

    return jsonify({
        "success": True,
        "message": "Feedback saved.",
        "feedback_count": feedback_count,
        "remaining_until_retrain": max(0, FEEDBACK_THRESHOLD - feedback_count),
        "retraining": retraining_running
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n==========================================")
    print(f" Spider-Sense server starting on port {port}")
    print(f" Open http://localhost:{port} in your browser")
    print(f"==========================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
