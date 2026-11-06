import ast
import pandas as pd
import joblib

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "clean_issues.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "issue_label_model.joblib"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)


def parse_labels(value):
    if pd.isna(value):
        return []

    try:
        labels = ast.literal_eval(str(value))
        if isinstance(labels, list):
            return [str(x).strip().lower() for x in labels]
    except (ValueError, SyntaxError):
        pass

    return []


label_mapping = {
    "bug": "Bug",
    "question": "Question",
    "usage question": "Question",
    "question/not a bug": "Question",
    "documentation": "Documentation",
    "docs": "Documentation",
    "enhancement": "Enhancement",
    "new feature": "Enhancement",
    "feature request": "Enhancement",
    "feature": "Enhancement",
    "performance": "Performance",
}

df["parsed_labels"] = df["labels"].apply(parse_labels)


def choose_category(labels):
    matched = {
        label_mapping[label]
        for label in labels
        if label in label_mapping
    }

    if len(matched) == 1:
        return next(iter(matched))

    return None


df["category"] = df["parsed_labels"].apply(choose_category)

df = df[df["category"].notna()].copy()

df["text"] = (
    df["title"].fillna("").astype(str)
    + "\n"
    + df["body"].fillna("").astype(str)
).str.strip()

df = df[df["text"] != ""].copy()

print("Training examples:", len(df))
print("\nCategory distribution:")
print(df["category"].value_counts())

X_train, X_test, y_train, y_test = train_test_split(
    df["text"],
    df["category"],
    test_size=0.2,
    random_state=42,
    stratify=df["category"],
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words="english",
        max_features=20000,
        ngram_range=(1, 2),
        sublinear_tf=True,
    )),
    ("classifier", LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
    )),
])

print("\nTraining model...")
model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\nAccuracy:", round(accuracy_score(y_test, predictions), 4))
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

joblib.dump(model, MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
