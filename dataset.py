import pandas as pd
import torch
import torch.nn as nn
import joblib

from flask import Flask , request , jsonify , render_template
from torch.utils.data import TensorDataset, DataLoader

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score , classification_report
   
app = Flask(__name__)   

# ============================================================
# 1. LOAD DATASET
# ============================================================

data = pd.read_csv(
    "dataset.txt",
    sep="\t",
    names=["labels", "text"]
)

# Remove empty rows
data = data.dropna()

text = data["text"]

labels = data["labels"].map({
    "human": 0,
    "ai": 1
})

# Remove rows with invalid labels
valid = labels.notna()

text = text[valid]
labels = labels[valid]

# ============================================================
# 2. TRAIN / VALIDATION / TEST SPLIT
# ============================================================

# First: 80% train, 20% temporary
X_train, X_temp, y_train, y_temp = train_test_split(
    text,
    labels,
    test_size=0.20,
    random_state=42,
    stratify=labels
)

# Split temporary 50/50
# Result: 80% train, 10% validation, 10% test
X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=42,
    stratify=y_temp
)

print("Training samples:", len(X_train))
print("Validation samples:", len(X_val))
print("Test samples:", len(X_test))


# ============================================================
# 3. TF-IDF
# ============================================================

vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=10000,
    lowercase=True
)

# IMPORTANT:
# Fit ONLY on training data
X_train = vectorizer.fit_transform(X_train).toarray()

# Validation/test only use the already fitted vectorizer
X_val = vectorizer.transform(X_val).toarray()
X_test = vectorizer.transform(X_test).toarray()


# ============================================================
# 4. CONVERT TO PYTORCH TENSORS
# ============================================================

X_train = torch.tensor(
    X_train,
    dtype=torch.float32
)

X_val = torch.tensor(
    X_val,
    dtype=torch.float32
)

X_test = torch.tensor(
    X_test,
    dtype=torch.float32
)

y_train = torch.tensor(
    y_train.values,
    dtype=torch.float32
).reshape(-1, 1)

y_val = torch.tensor(
    y_val.values,
    dtype=torch.float32
).reshape(-1, 1)

y_test = torch.tensor(
    y_test.values,
    dtype=torch.float32
).reshape(-1, 1)


# ============================================================
# 5. DATASETS
# ============================================================

train_dataset = TensorDataset(
    X_train,
    y_train
)

val_dataset = TensorDataset(
    X_val,
    y_val
)

test_dataset = TensorDataset(
    X_test,
    y_test
)


# ============================================================
# 6. DATALOADERS
# ============================================================

BATCH_SIZE = 32

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)


# ============================================================
# 7. DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)

print("Using device:", device)


# ============================================================
# 8. NEURAL NETWORK
# ============================================================

torch.manual_seed(42)

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


model = TextClassifier(
    X_train.shape[1]
).to(device)


# ============================================================
# 9. LOSS + OPTIMIZER
# ============================================================

loss_fn = nn.BCEWithLogitsLoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001,
    weight_decay=1e-5
)


# ============================================================
# 10. VALIDATION FUNCTION
# ============================================================

def validate(model, loader):

    model.eval()

    total_loss = 0

    all_predictions = []
    all_labels = []

    with torch.no_grad():

        for X_batch, y_batch in loader:

            X_batch = X_batch.to(device)
            y_batch = y_batch.to(device)

            outputs = model(X_batch)

            loss = loss_fn(
                outputs,
                y_batch
            )

            total_loss += loss.item()

            probabilities = torch.sigmoid(outputs)

            predictions = (
                probabilities >= 0.5
            ).float()

            all_predictions.extend(
                predictions.cpu().numpy().flatten()
            )

            all_labels.extend(
                y_batch.cpu().numpy().flatten()
            )

    accuracy = accuracy_score(
        all_labels,
        all_predictions
    )

    return total_loss / len(loader), accuracy


# ============================================================
# 11. TRAINING
# ============================================================

EPOCHS = 1000

for epoch in range(EPOCHS):

    model.train()

    total_train_loss = 0

    for X_batch, y_batch in train_loader:

        X_batch = X_batch.to(device)
        y_batch = y_batch.to(device)

        # Clear gradients
        optimizer.zero_grad()

        # Forward pass
        outputs = model(X_batch)

        # Loss
        loss = loss_fn(
            outputs,
            y_batch
        )

        # Backpropagation
        loss.backward()

        # Update weights
        optimizer.step()

        total_train_loss += loss.item()

    average_train_loss = (
        total_train_loss /
        len(train_loader)
    )

    # Validation
    val_loss, val_accuracy = validate(
        model,
        val_loader
    )

    if (epoch + 1)%100 == 0:

        print(
            f"Epoch [{epoch + 1}/{EPOCHS}] "
            f"Train Loss: {average_train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val Accuracy: {val_accuracy:.4f}"
        )


# ============================================================
# 12. FINAL TEST
# ============================================================

model.eval()

all_predictions = []
all_labels = []

with torch.no_grad():

    for X_batch, y_batch in test_loader:

        X_batch = X_batch.to(device)

        outputs = model(X_batch)

        probabilities = torch.sigmoid(
            outputs
        )

        predictions = (
            probabilities >= 0.5
        ).int()

        all_predictions.extend(
            predictions.cpu().numpy().flatten()
        )

        all_labels.extend(
            y_batch.numpy().flatten()
        )


# ============================================================
# 15. USER INPUT PREDICTION
# ============================================================

print("\n==============================")
print("       AI TEXT DETECTOR")
print("==============================")

def predict_text(user_text):

    user_vector = vectorizer.transform(
        [user_text]
    ).toarray()

    user_tensor = torch.tensor(
        user_vector,
        dtype=torch.float32
    ).to(device)

    model.eval()

    with torch.no_grad():

        output = model(user_tensor)

        probability = torch.sigmoid(
            output
        ).item()

    if probability >= 0.5:

        result = "AI-generated"
        confidence = probability * 100

    else:

        result = "Human-written"
        confidence = (1 - probability) * 100

    return {
        "result": result,
        "confidence": round(confidence, 2)
    }


import joblib

torch.save(model.state_dict(), "model.pth")
joblib.dump(vectorizer, "vectorizer.pkl")    

# API ENDPOINT    
@app.route("/")
def home():
    return render_template("app.html")


@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    user_text = data["text"]

    prediction = predict_text(user_text)

    return jsonify(prediction)


if __name__ == "__main__":
    app.run(debug=True)
    