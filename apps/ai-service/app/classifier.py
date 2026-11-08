import re
import warnings
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

warnings.filterwarnings("ignore", category=UserWarning)

DEFAULT_TRAINING_CORPUS = [
    ("The elevator in the main lobby is completely out of service and won't respond to buttons.", "BROKEN_LIFT", "HIGH"),
    ("Passenger lift 2 is stuck on floor 3 and making strange grinding sounds.", "BROKEN_LIFT", "HIGH"),
    ("Elevator call button on the ground floor is broken and does not light up.", "BROKEN_LIFT", "MEDIUM"),
    ("The wheelchair lift near the library entrance is disabled and has an error message.", "BROKEN_LIFT", "HIGH"),
    ("Lift doors keep closing rapidly without detecting people in wheelchairs.", "BROKEN_LIFT", "HIGH"),
    ("The west tower elevator is unresponsive when pressing the call button.", "BROKEN_LIFT", "HIGH"),
    ("Elevator floor indicator display is not working properly inside car A.", "BROKEN_LIFT", "LOW"),
    ("Freight lift being used for mobility access is shut down for maintenance.", "BROKEN_LIFT", "MEDIUM"),
    ("Wheelchair ramp at the side entrance is completely blocked by delivery boxes and pallets.", "BLOCKED_RAMP", "HIGH"),
    ("Bicycles are locked to the access ramp handrail, obstructing wheelchair passage.", "BLOCKED_RAMP", "MEDIUM"),
    ("Construction materials and scaffolding are blocking the outdoor accessibility ramp.", "BLOCKED_RAMP", "HIGH"),
    ("Trash bins and debris have been left on the ramp making it impossible to navigate.", "BLOCKED_RAMP", "HIGH"),
    ("A delivery truck is parked directly across the wheelchair ramp curb cut.", "BLOCKED_RAMP", "HIGH"),
    ("Temporary sign placed in the middle of the access ramp narrows the pathway.", "BLOCKED_RAMP", "LOW"),
    ("Potted plants placed along the slope make the ramp too narrow for a wheelchair.", "BLOCKED_RAMP", "MEDIUM"),
    ("Leaves and mud accumulation makes the ramp surface slippery and partially blocked.", "BLOCKED_RAMP", "MEDIUM"),
    ("Automatic sliding doors at the main entrance are powered off and will not open.", "INACCESSIBLE_ENTRANCE", "HIGH"),
    ("The automated wheelchair push button at the south entrance is completely broken.", "INACCESSIBLE_ENTRANCE", "HIGH"),
    ("Heavy manual front door has excessive tension and cannot be pulled open from a wheelchair.", "INACCESSIBLE_ENTRANCE", "MEDIUM"),
    ("Revolving door is stuck and the adjacent accessible swing door is locked shut.", "INACCESSIBLE_ENTRANCE", "HIGH"),
    ("Front entrance only has three steep steps with no ramp or level access route.", "INACCESSIBLE_ENTRANCE", "HIGH"),
    ("Entrance threshold lip exceeds 5cm, preventing wheelchairs from entering smoothly.", "INACCESSIBLE_ENTRANCE", "MEDIUM"),
    ("Card reader at accessible turnstile is mounted too high and is unresponsive.", "INACCESSIBLE_ENTRANCE", "MEDIUM"),
    ("Intercom buzzer at building doorway is dead, no way to request door assistance.", "INACCESSIBLE_ENTRANCE", "HIGH"),
    ("Tactile ground indicator tiles are damaged and missing before the hallway stairs.", "OTHER", "MEDIUM"),
    ("Braille signage on the second floor corridor restroom is missing completely.", "OTHER", "LOW"),
    ("Hallway lighting is flickering constantly causing extreme glare and visual disorientation.", "OTHER", "LOW"),
    ("Loud persistent mechanical buzzing near the reception causes acoustic interference.", "OTHER", "LOW"),
    ("Handrail along the corridor ramp has a loose mounting bracket that wiggles.", "OTHER", "LOW"),
    ("Water leak creates a large slippery puddle across the accessible hallway route.", "OTHER", "MEDIUM"),
    ("Accessible parking spot markings are faded and have no vertical identification sign.", "OTHER", "LOW"),
    ("Directional sign pointing toward accessible facilities has fallen down from the wall.", "OTHER", "LOW"),
]

HIGH_SEVERITY_KEYWORDS = {
    "stuck", "emergency", "danger", "trapped", "completely", "impossible", "out of service",
    "broken", "shut down", "locked", "steep", "fails", "dead", "unresponsive", "cannot",
}
LOW_SEVERITY_KEYWORDS = {
    "loose", "flicker", "flickering", "faded", "scratched", "minor", "wiggles", "cosmetic",
    "narrow", "intermittent", "lip", "display", "indicator", "braille",
}

KEYWORD_CATEGORY_RULES = [
    ("BROKEN_LIFT", ["elevator", "lift", "car a", "car b", "hoist"]),
    ("BLOCKED_RAMP", ["ramp", "slope", "curb cut", "incline", "scaffolding on ramp"]),
    ("INACCESSIBLE_ENTRANCE", ["entrance", "door", "doorway", "sliding door", "revolving", "turnstile", "push button", "buzzer"]),
]

class ReportClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
        self.model = LogisticRegression(C=2.0, max_iter=300)
        self.is_fitted = False
        self._fit_default()

    def _fit_default(self):
        texts = [item[0] for item in DEFAULT_TRAINING_CORPUS]
        labels = [item[1] for item in DEFAULT_TRAINING_CORPUS]
        self.fit(texts, labels)

    def fit(self, texts: list[str], labels: list[str]):
        x = self.vectorizer.fit_transform(texts)
        self.model.fit(x, labels)
        self.is_fitted = True

    def classify(self, text: str, image_hint: Optional[str] = None) -> tuple[str, str, float]:
        clean_text = text.lower().strip()

        predicted_category = "OTHER"
        confidence = 0.5

        if self.is_fitted:
            x = self.vectorizer.transform([clean_text])
            probs = self.model.predict_proba(x)[0]
            classes = self.model.classes_
            max_idx = int(probs.argmax())
            predicted_category = str(classes[max_idx])
            confidence = float(probs[max_idx])

        for category, keywords in KEYWORD_CATEGORY_RULES:
            if any(re.search(r"\b" + re.escape(kw) + r"\b", clean_text) for kw in keywords):
                if category != predicted_category and confidence < 0.60:
                    predicted_category = category
                    confidence = 0.70
                elif category == predicted_category:
                    confidence = min(0.98, max(confidence, 0.75))
                break

        if image_hint and image_hint in {"BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"}:
            if image_hint == predicted_category:
                confidence = min(0.99, confidence + 0.08)
            elif confidence < 0.55:
                predicted_category = image_hint
                confidence = 0.65

        tokens = set(re.findall(r"\b\w+\b", clean_text))
        if any(kw in clean_text for kw in HIGH_SEVERITY_KEYWORDS):
            severity = "HIGH"
        elif any(kw in tokens for kw in LOW_SEVERITY_KEYWORDS):
            severity = "LOW"
        else:
            severity = "MEDIUM"

        return predicted_category, severity, round(float(confidence), 2)

classifier = ReportClassifier()
