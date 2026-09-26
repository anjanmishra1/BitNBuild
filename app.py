import os
import threading
import joblib
import torch
import torch.nn as nn

from flask import Flask, request, jsonify
from flask_cors import CORS


# =========================================================
# CONFIG
# =========================================================

MODEL_FILE = "model.pth"
VECTORIZER_FILE = "vectorizer.pkl"
FEEDBACK_FILE = "feedback.txt"

FEEDBACK_THRESHOLD = 5


# =========================================================
# FLASK
# =========================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/predict": {"origins": "*"},
        r"/feedback": {"origins": "*"},
        r"/health": {"origins": "*"}
    }
)


# =========================================================
# DEVICE
# =========================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# =========================================================
# MODEL
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
# GLOBAL MODEL
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

    global model
    global vectorizer

    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(
            "model.pth not found."
        )

    if not os.path.exists(VECTORIZER_FILE):
        raise FileNotFoundError(
            "vectorizer.pkl not found."
        )

    new_vectorizer = joblib.load(
        VECTORIZER_FILE
    )

    input_size = len(
        new_vectorizer.get_feature_names_out()
    )

    new_model = TextClassifier(
        input_size
    )

    new_model.load_state_dict(
        torch.load(
            MODEL_FILE,
            map_location=device
        )
    )

    new_model.to(device)
    new_model.eval()

    with model_lock:
        vectorizer = new_vectorizer
        model = new_model

    print("Spider-Sense model loaded.")
    print("Device:", device)


# LOAD MODEL WHEN GUNICORN STARTS
try:
    load_model()
except Exception as error:
    print("Model loading failed:", error)


    with model_lock:

        vectorizer = new_vectorizer

        model = new_model


    print("Spider-Sense model loaded.")

    print(
        "Device:",
        device
    )


# =========================================================
# FEEDBACK COUNT
# =========================================================

def get_feedback_count():

    if not os.path.exists(
        FEEDBACK_FILE
    ):

        return 0


    with open(
        FEEDBACK_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        return sum(
            1
            for line in file
            if line.strip()
        )


# =========================================================
# SAVE FEEDBACK
# =========================================================

def save_feedback(
    text,
    correct_label
):

    clean_text = (
        text
        .replace("\t", " ")
        .replace("\r", " ")
        .replace("\n", " ")
        .strip()
    )


    with open(
        FEEDBACK_FILE,
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            f"{correct_label}\t{clean_text}\n"
        )


# =========================================================
# PREDICTION
# =========================================================

def predict_text(text):

    with model_lock:

        current_model = model

        current_vectorizer = vectorizer


        if (
            current_model is None
            or current_vectorizer is None
        ):

            raise RuntimeError(
                "Model is not loaded."
            )


        vector = current_vectorizer.transform(
            [text]
        ).toarray()


        tensor = torch.tensor(
            vector,
            dtype=torch.float32
        ).to(device)


        current_model.eval()


        with torch.no_grad():

            output = current_model(
                tensor
            )

            probability = torch.sigmoid(
                output
            ).item()


    if probability >= 0.5:

        result = "AI-generated"

        confidence = probability * 100

    else:

        result = "Human-written"

        confidence = (
            1 - probability
        ) * 100


    return {

        "result": result,

        "confidence": round(
            confidence,
            2
        ),

        "ai_probability": round(
            probability * 100,
            2
        )

    }


# =========================================================
# RETRAINING
# =========================================================

def retrain_model():

    global retraining_running


    if retraining_running:

        print(
            "Retraining already running."
        )

        return


    with retraining_lock:

        retraining_running = True


        try:

            print()
            print(
                "Spider-Sense retraining started..."
            )


            from train_model import train_model


            success = train_model()


            if success:

                load_model()


                print(
                    "Spider-Sense model updated."
                )

            else:

                print(
                    "Training did not complete."
                )


        except Exception as error:

            print(
                "Retraining error:",
                error
            )


        finally:

            retraining_running = False


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return jsonify({

        "name": "Spider-Sense",

        "status": "online",

        "message":
            "Spider-Sense API is running."

    })


# =========================================================
# PREDICT
# =========================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({

            "error":
                "Invalid JSON request."

        }), 400


    text = data.get(
        "text",
        ""
    )


    if not isinstance(
        text,
        str
    ):

        return jsonify({

            "error":
                "Text must be a string."

        }), 400


    text = text.strip()


    if not text:

        return jsonify({

            "error":
                "Text cannot be empty."

        }), 400


    try:

        result = predict_text(
            text
        )


        return jsonify(
            result
        )


    except Exception as error:

        print(
            "Prediction error:",
            error
        )


        return jsonify({

            "error":
                str(error)

        }), 500


# =========================================================
# FEEDBACK
# =========================================================

@app.route(
    "/feedback",
    methods=["POST"]
)
def feedback():

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({

            "error":
                "Invalid JSON request."

        }), 400


    text = data.get(
        "text",
        ""
    )


    correct_label = data.get(
        "correct_label",
        ""
    )


    if not isinstance(
        text,
        str
    ):

        return jsonify({

            "error":
                "Invalid text."

        }), 400


    if not isinstance(
        correct_label,
        str
    ):

        return jsonify({

            "error":
                "Invalid label."

        }), 400


    text = text.strip()

    correct_label = (
        correct_label
        .strip()
        .lower()
    )


    if not text:

        return jsonify({

            "error":
                "Text cannot be empty."

        }), 400


    if correct_label not in [
        "human",
        "ai"
    ]:

        return jsonify({

            "error":
                "Label must be human or ai."

        }), 400


    save_feedback(
        text,
        correct_label
    )


    feedback_count = (
        get_feedback_count()
    )


    print(
        "Feedback received:",
        feedback_count
    )


    if (
        feedback_count >=
        FEEDBACK_THRESHOLD
        and not retraining_running
    ):

        thread = threading.Thread(
            target=retrain_model,
            daemon=True
        )

        thread.start()


        return jsonify({

            "success": True,

            "message":
                "Feedback saved. "
                "Spider-Sense is "
                "retraining.",

            "feedback_count":
                feedback_count,

            "retraining":
                True

        })


    return jsonify({

        "success": True,

        "message":
            "Feedback saved.",

        "feedback_count":
            feedback_count,

        "remaining_until_retrain":
            max(
                0,
                FEEDBACK_THRESHOLD
                - feedback_count
            ),

        "retraining":
            retraining_running

    })


# =========================================================
# HEALTH
# =========================================================

@app.route(
    "/health"
)
def health():

    return jsonify({

        "status":
            "online",

        "model":
            "Spider-Sense",

        "device":
            str(device),

        "feedback_count":
            get_feedback_count(),

        "retraining":
            retraining_running

    })


# =========================================================
# START
# =========================================================

if __name__ == "__main__":

    load_model()


    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

    )
