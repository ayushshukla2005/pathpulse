import csv
import sys
import warnings
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

warnings.filterwarnings("ignore")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.classifier import ReportClassifier

CATEGORIES = ["BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"]

def load_dataset(csv_path: Path):
    texts = []
    categories = []
    severities = []
    ids = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ids.append(row["id"])
            texts.append(row["text"])
            categories.append(row["category"])
            severities.append(row["severity"])
    return ids, texts, categories, severities

def main():
    base_dir = Path(__file__).resolve().parent
    csv_path = base_dir / "labelled_reports.csv"
    results_path = base_dir / "results.txt"

    ids, texts, categories, severities = load_dataset(csv_path)

    x_train, x_test, y_train, y_test, ids_train, ids_test = train_test_split(
        texts, categories, ids, test_size=0.30, random_state=42, stratify=categories
    )

    eval_classifier = ReportClassifier()
    eval_classifier.fit(x_train, y_train)

    predictions = []
    confidences = []
    for text in x_test:
        pred_cat, _, conf = eval_classifier.classify(text)
        predictions.append(pred_cat)
        confidences.append(conf)

    report_str = classification_report(
        y_test, predictions, labels=CATEGORIES, target_names=CATEGORIES, digits=3, zero_division=0
    )
    cm = confusion_matrix(y_test, predictions, labels=CATEGORIES)

    output_lines = [
        "PathPulse AI Classification Evaluation Results",
        f"Model Version: {eval_classifier.model.__class__.__name__} + TF-IDF (1,2 ngrams)",
        f"Total Samples: {len(texts)} (Train: {len(x_train)}, Evaluation: {len(x_test)})",
        "Split: 70% Train / 30% Stratified Held-out Evaluation",
        "",
        "Classification Report:",
        report_str,
        "Confusion Matrix (Rows=True, Columns=Predicted):",
        "Labels: " + ", ".join(CATEGORIES),
    ]

    for i, row in enumerate(cm):
        output_lines.append(f"{CATEGORIES[i]:22}: {row.tolist()}")

    output_lines.append("")
    output_lines.append("Per-Sample Predictions on Held-Out Set:")
    for rep_id, text, actual, pred, conf in zip(ids_test, x_test, y_test, predictions, confidences):
        correct = "PASS" if actual == pred else "FAIL"
        output_lines.append(f"[{correct}] id={rep_id} actual={actual} pred={pred} conf={conf:.2f} text=\"{text[:60]}...\"")

    output_text = "\n".join(output_lines)
    print(output_text)

    with open(results_path, "w", encoding="utf-8") as f:
        f.write(output_text + "\n")

if __name__ == "__main__":
    main()
