import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "issue_label_model.joblib"

model = joblib.load(MODEL_PATH)


def predict_issue_label(title: str, body: str = ""):
    text = f"{title}\n{body}"

    prediction = model.predict([text])[0]
    probabilities = model.predict_proba([text])[0]
    classes = model.classes_

    ranked = sorted(
        zip(classes, probabilities),
        key=lambda item: item[1],
        reverse=True,
    )

    return {
        "predicted_label": str(prediction),
        "category_scores": {
            str(category): round(float(score), 4)
            for category, score in ranked
        },
    }
