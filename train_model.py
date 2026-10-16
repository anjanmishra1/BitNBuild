import os
import copy
import random
import joblib
import pandas as pd
import numpy as np
import torch
import torch.nn as nn

from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BASE_DATASET = os.path.join(BASE_DIR, "dataset.txt")
FEEDBACK_DATASET = os.path.join(BASE_DIR, "feedback.txt")

MODEL_FILE = os.path.join(BASE_DIR, "model.pth")
VECTORIZER_FILE = os.path.join(BASE_DIR, "vectorizer.pkl")

RANDOM_STATE = 42

MAX_EPOCHS = 100
BATCH_SIZE = 32
LEARNING_RATE = 0.002
WEIGHT_DECAY = 1e-3
EARLY_STOPPING_PATIENCE = 15


# ============================================================
# MODEL ARCHITECTURE
# ============================================================

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


# ============================================================
# LOAD & PREPROCESS DATA
# ============================================================

def load_data():
    datasets = []

    # Original base dataset
    if os.path.exists(BASE_DATASET):
        print(f"Loading base dataset from {BASE_DATASET}...")
        base = pd.read_csv(
            BASE_DATASET,
            sep="\t",
            names=["labels", "text"],
            on_bad_lines="skip"
        )
        datasets.append(base)
    else:
        raise FileNotFoundError(f"dataset.txt not found at {BASE_DATASET}")

    # Feedback dataset
    if os.path.exists(FEEDBACK_DATASET):
        print(f"Loading feedback dataset from {FEEDBACK_DATASET}...")
        try:
            feedback = pd.read_csv(
                FEEDBACK_DATASET,
                sep="\t",
                names=["labels", "text"],
                on_bad_lines="skip"
            )
            if len(feedback) > 0:
                datasets.append(feedback)
                print(f"Feedback examples loaded: {len(feedback)}")
        except Exception as err:
            print("Warning reading feedback:", err)

    # Combine datasets
    data = pd.concat(datasets, ignore_index=True).dropna()

    data["labels"] = (
        data["labels"]
        .astype(str)
        .str.lower()
        .str.strip()
    )

    data["text"] = (
        data["text"]
        .astype(str)
        .str.strip()
    )

    # Filter to valid labels and non-empty text
    data = data[data["labels"].isin(["human", "ai"]) & (data["text"] != "")]

    # Deduplicate by text (keeps latest ground-truth correction)
    data = data.drop_duplicates(subset=["text"], keep="last")

    print("\n==============================")
    print("DATASET OVERVIEW")
    print("==============================")
    print(f"Total Unique Samples : {len(data)}")
    print(f"Human Samples        : {(data['labels'] == 'human').sum()}")
    print(f"AI Samples           : {(data['labels'] == 'ai').sum()}")
    print("==============================\n")

    return data


# ============================================================
# TRAIN FUNCTION
# ============================================================

def train_model():
    random.seed(RANDOM_STATE)
    np.random.seed(RANDOM_STATE)
    torch.manual_seed(RANDOM_STATE)

    data = load_data()

    if len(data) < 20:
        print("Not enough data to train.")
        return False

    texts = data["text"]
    labels = data["labels"].map({"human": 0, "ai": 1})

    # Stratified Train (80%) / Val (10%) / Test (10%) Split
    X_train_raw, X_temp_raw, y_train, y_temp = train_test_split(
        texts,
        labels,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=labels
    )

    X_val_raw, X_test_raw, y_val, y_test = train_test_split(
        X_temp_raw,
        y_temp,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=y_temp
    )

    print(f"Split sizes -> Train: {len(X_train_raw)} | Validation: {len(X_val_raw)} | Test: {len(X_test_raw)}")

    # FeatureUnion combining Word n-grams and Sub-word Character n-grams for out-of-vocabulary robustness
    vectorizer = FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 2), max_features=4000, sublinear_tf=True)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), max_features=4000, sublinear_tf=True))
    ])

    X_train = vectorizer.fit_transform(X_train_raw).toarray()
    X_val = vectorizer.transform(X_val_raw).toarray()
    X_test = vectorizer.transform(X_test_raw).toarray()

    input_size = X_train.shape[1]
    print(f"Extracted Hybrid Word+Char TF-IDF Features: {input_size}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Training Device:", device)

    # Convert to PyTorch Tensors
    X_train_t = torch.tensor(X_train, dtype=torch.float32).to(device)
    y_train_t = torch.tensor(y_train.to_numpy(), dtype=torch.float32).view(-1, 1).to(device)

    X_val_t = torch.tensor(X_val, dtype=torch.float32).to(device)
    y_val_t = torch.tensor(y_val.to_numpy(), dtype=torch.float32).view(-1, 1).to(device)

    X_test_t = torch.tensor(X_test, dtype=torch.float32).to(device)

    # Initialize Model, Loss Function, Optimizer with Weight Decay, and LR Scheduler
    model = TextClassifier(input_size).to(device)
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=8)

    # Training Loop with Early Stopping & Validation Checkpointing
    best_val_loss = float("inf")
    best_model_state = None
    epochs_no_improve = 0

    print("\n==============================")
    print("OPTIMIZED HYBRID TRAINING")
    print("==============================")

    for epoch in range(MAX_EPOCHS):
        model.train()
        permutation = torch.randperm(X_train_t.size(0))
        total_train_loss = 0.0

        for start in range(0, len(permutation), BATCH_SIZE):
            indices = permutation[start:start + BATCH_SIZE]
            batch_x = X_train_t[indices]
            batch_y = y_train_t[indices]

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = loss_fn(outputs, batch_y)
            loss.backward()
            optimizer.step()

            total_train_loss += loss.item()

        # Validation Step
        model.eval()
        with torch.no_grad():
            val_outputs = model(X_val_t)
            val_loss = loss_fn(val_outputs, y_val_t).item()
            val_probs = torch.sigmoid(val_outputs).cpu().numpy().flatten()
            val_preds = (val_probs >= 0.5).astype(int)
            val_acc = accuracy_score(y_val, val_preds)

        scheduler.step(val_loss)

        # Check for best validation checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = copy.deepcopy(model.state_dict())
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1

        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(
                f"Epoch {epoch + 1:03d}/{MAX_EPOCHS} | "
                f"Train Loss: {total_train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | "
                f"Val Acc: {val_acc * 100:.2f}%"
            )

        # Early stopping trigger
        if epochs_no_improve >= EARLY_STOPPING_PATIENCE and epoch >= 30:
            print(f"Early stopping at epoch {epoch + 1} (Best Val Loss: {best_val_loss:.4f})")
            break

    # Load best checkpoint for final evaluation and saving
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print("Restored best performing model checkpoint.")

    # ========================================================
    # EVALUATION ON UNSEEN TEST SET
    # ========================================================
    model.eval()
    with torch.no_grad():
        test_outputs = model(X_test_t)
        test_probs = torch.sigmoid(test_outputs).cpu().numpy().flatten()
        test_preds = (test_probs >= 0.5).astype(int)

    test_acc = accuracy_score(y_test, test_preds)
    test_prec = precision_score(y_test, test_preds, zero_division=0)
    test_rec = recall_score(y_test, test_preds, zero_division=0)
    test_f1 = f1_score(y_test, test_preds, zero_division=0)
    test_roc = roc_auc_score(y_test, test_probs)
    cm = confusion_matrix(y_test, test_preds)

    print("\n==============================")
    print("FINAL TEST SET EVALUATION")
    print("==============================")
    print(f"Test Accuracy  : {test_acc * 100:.2f}%")
    print(f"Test Precision : {test_prec * 100:.2f}%")
    print(f"Test Recall    : {test_rec * 100:.2f}%")
    print(f"Test F1 Score  : {test_f1 * 100:.2f}%")
    print(f"Test ROC-AUC   : {test_roc:.4f}")
    print("\nConfusion Matrix:")
    print(f"  True Human (TN): {cm[0, 0]} | False AI (FP): {cm[0, 1]}")
    print(f"  False Human (FN): {cm[1, 0]} | True AI (TP): {cm[1, 1]}")
    print("\nClassification Report:")
    print(classification_report(y_test, test_preds, target_names=["Human", "AI"], digits=4))

    # ========================================================
    # SAVE BEST ARTIFACTS
    # ========================================================
    torch.save(model.state_dict(), MODEL_FILE)
    joblib.dump(vectorizer, VECTORIZER_FILE)

    print("==============================")
    print(f"Saved optimized model -> {MODEL_FILE}")
    print(f"Saved TF-IDF vectorizer -> {VECTORIZER_FILE}")
    print("==============================\n")

    return True


if __name__ == "__main__":
    train_model()