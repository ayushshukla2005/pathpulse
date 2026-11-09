from app.classifier import ReportClassifier

ALLOWED_CATEGORIES = {"BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"}
ALLOWED_SEVERITIES = {"LOW", "MEDIUM", "HIGH"}

def test_classifier_returns_allowed_categories_only():
    clf = ReportClassifier()
    test_cases = [
        "The elevator is stuck between floors and will not move",
        "A pile of wooden pallets blocks the wheelchair ramp",
        "The automated main entrance doors are locked and will not slide open",
        "The hallway lighting is flickering and the braille room plaque fell down",
        "Unclear ambiguous issue reported in the facility",
    ]

    for text in test_cases:
        cat, sev, conf = clf.classify(text)
        assert cat in ALLOWED_CATEGORIES
        assert sev in ALLOWED_SEVERITIES
        assert 0.0 <= conf <= 1.0

def test_classifier_image_hint_influence():
    clf = ReportClassifier()
    cat, sev, conf = clf.classify("Entrance doors broken", image_hint="INACCESSIBLE_ENTRANCE")
    assert cat == "INACCESSIBLE_ENTRANCE"
    assert conf >= 0.70

def test_classifier_severity_assignment():
    clf = ReportClassifier()
    _, sev_high, _ = clf.classify("Elevator is completely broken and trapped passenger inside")
    assert sev_high == "HIGH"

    _, sev_low, _ = clf.classify("Corridor handrail has a minor loose mounting screw that wiggles")
    assert sev_low == "LOW"

