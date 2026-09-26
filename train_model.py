import os
import random
import joblib
import pandas as pd
import torch
import torch.nn as nn

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# CONFIG
# ============================================================

BASE_DATASET = "dataset.txt"
FEEDBACK_DATASET = "feedback.txt"

MODEL_FILE = "model.pth"
VECTORIZER_FILE = "vectorizer.pkl"

RANDOM_STATE = 42

EPOCHS = 1000
BATCH_SIZE = 32
LEARNING_RATE = 0.001


# ============================================================
# MODEL
# ============================================================

class TextClassifier(nn.Module):

    def __init__(self, input_size):

        super().__init__()

        self.network = nn.Sequential(

            nn.Linear(
                input_size,
                128
            ),

            nn.ReLU(),

            nn.Dropout(0.3),

            nn.Linear(
                128,
                64
            ),

            nn.ReLU(),

            nn.Dropout(0.3),

            nn.Linear(
                64,
                1
            )
        )

    def forward(self, x):

        return self.network(x)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    datasets = []


    # Original dataset

    if os.path.exists(BASE_DATASET):

        print("Loading original dataset...")

        base = pd.read_csv(
            BASE_DATASET,
            sep="\t",
            names=["labels", "text"],
            on_bad_lines="skip"
        )

        datasets.append(base)

    else:

        raise FileNotFoundError(
            "dataset.txt was not found."
        )


    # Feedback dataset

    if os.path.exists(FEEDBACK_DATASET):

        print("Loading user feedback...")

        feedback = pd.read_csv(
            FEEDBACK_DATASET,
            sep="\t",
            names=["labels", "text"],
            on_bad_lines="skip"
        )

        datasets.append(feedback)

        print(
            f"Feedback examples: {len(feedback)}"
        )

    else:

        print(
            "No feedback found."
        )


    # Combine datasets

    data = pd.concat(
        datasets,
        ignore_index=True
    )


    # Clean

    data = data.dropna()

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


    # Valid labels only

    data = data[
        data["labels"].isin(
            ["human", "ai"]
        )
    ]


    data = data[
        data["text"] != ""
    ]


    # Remove duplicates

    data = data.drop_duplicates(
        subset=["labels", "text"]
    )


    print()
    print("==============================")
    print("DATASET")
    print("==============================")
    print(
        f"Total : {len(data)}"
    )
    print(
        f"Human : {(data['labels'] == 'human').sum()}"
    )
    print(
        f"AI    : {(data['labels'] == 'ai').sum()}"
    )
    print("==============================")
    print()


    return data


# ============================================================
# TRAIN FUNCTION
# ============================================================

def train_model():

    random.seed(
        RANDOM_STATE
    )

    torch.manual_seed(
        RANDOM_STATE
    )


    data = load_data()


    if len(data) < 20:

        print(
            "Not enough data to train."
        )

        return False


    texts = data["text"]

    labels = data["labels"].map({
        "human": 0,
        "ai": 1
    })


    # ========================================================
    # SPLIT
    # ========================================================

    X_train, X_temp, y_train, y_temp = train_test_split(

        texts,
        labels,

        test_size=0.20,

        random_state=RANDOM_STATE,

        stratify=labels
    )


    X_val, X_test, y_val, y_test = train_test_split(

        X_temp,
        y_temp,

        test_size=0.50,

        random_state=RANDOM_STATE,

        stratify=y_temp
    )


    # ========================================================
    # TF-IDF
    # ========================================================

    vectorizer = TfidfVectorizer(

        ngram_range=(1, 2),

        max_features=10000,

        lowercase=True,

        sublinear_tf=True
    )


    X_train = vectorizer.fit_transform(
        X_train
    ).toarray()


    X_val = vectorizer.transform(
        X_val
    ).toarray()


    X_test = vectorizer.transform(
        X_test
    ).toarray()


    # ========================================================
    # DEVICE
    # ========================================================

    device = torch.device(

        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )


    print(
        "Training device:",
        device
    )


    # ========================================================
    # TENSORS
    # ========================================================

    X_train_tensor = torch.tensor(
        X_train,
        dtype=torch.float32
    ).to(device)


    y_train_tensor = torch.tensor(
        y_train.to_numpy(),
        dtype=torch.float32
    ).view(-1, 1).to(device)


    X_val_tensor = torch.tensor(
        X_val,
        dtype=torch.float32
    ).to(device)


    y_val_tensor = torch.tensor(
        y_val.to_numpy(),
        dtype=torch.float32
    ).view(-1, 1).to(device)


    # ========================================================
    # MODEL
    # ========================================================

    model = TextClassifier(
        X_train.shape[1]
    ).to(device)


    loss_fn = nn.BCEWithLogitsLoss()


    optimizer = torch.optim.Adam(

        model.parameters(),

        lr=LEARNING_RATE,

        weight_decay=1e-5
    )


    # ========================================================
    # TRAIN
    # ========================================================

    print()
    print("==============================")
    print("TRAINING")
    print("==============================")


    for epoch in range(EPOCHS):

        model.train()


        permutation = torch.randperm(
            X_train_tensor.size(0)
        )


        total_loss = 0


        for start in range(
            0,
            len(permutation),
            BATCH_SIZE
        ):

            indices = permutation[
                start:start + BATCH_SIZE
            ]


            batch_x = X_train_tensor[
                indices
            ]


            batch_y = y_train_tensor[
                indices
            ]


            optimizer.zero_grad()


            outputs = model(
                batch_x
            )


            loss = loss_fn(
                outputs,
                batch_y
            )


            loss.backward()


            optimizer.step()


            total_loss += loss.item()


        # Validation

        model.eval()


        with torch.no_grad():

            validation_output = model(
                X_val_tensor
            )


            validation_probability = torch.sigmoid(
                validation_output
            )


            validation_prediction = (
                validation_probability >= 0.5
            ).int().cpu().numpy().flatten()


        validation_accuracy = accuracy_score(
            y_val,
            validation_prediction
        )

        if (epoch+1) % 100 == 0:
            print(
                f"Epoch {epoch + 1:02d}/{EPOCHS} "
                f"| Loss: {total_loss:.4f} "
                f"| Val Accuracy: "
                f"{validation_accuracy:.4f}"
            )


    # ========================================================
    # TEST
    # ========================================================

    X_test_tensor = torch.tensor(
        X_test,
        dtype=torch.float32
    ).to(device)


    model.eval()


    with torch.no_grad():

        output = model(
            X_test_tensor
        )


        probability = torch.sigmoid(
            output
        )


        prediction = (
            probability >= 0.5
        ).int().cpu().numpy().flatten()


    accuracy = accuracy_score(
        y_test,
        prediction
    )


    precision = precision_score(
        y_test,
        prediction,
        zero_division=0
    )


    recall = recall_score(
        y_test,
        prediction,
        zero_division=0
    )


    f1 = f1_score(
        y_test,
        prediction,
        zero_division=0
    )


    print()
    print("==============================")
    print("TEST RESULTS")
    print("==============================")


    print(
        f"Accuracy : {accuracy:.4f}"
    )


    print(
        f"Precision: {precision:.4f}"
    )


    print(
        f"Recall   : {recall:.4f}"
    )


    print(
        f"F1 Score : {f1:.4f}"
    )


    # ========================================================
    # SAVE
    # ========================================================

    torch.save(
        model.state_dict(),
        MODEL_FILE
    )


    joblib.dump(
        vectorizer,
        VECTORIZER_FILE
    )


    print()
    print("==============================")
    print("MODEL UPDATED")
    print("==============================")


    return True


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    train_model()