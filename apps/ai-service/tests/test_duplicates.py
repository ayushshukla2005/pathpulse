from app.duplicates import compute_duplicate_scores

def test_duplicate_scoring_descending_and_no_decision():
    candidate = "Elevator in the science building is broken and stuck on floor 2."
    comparisons = [
        {"id": "rep-10", "description": "Lobby entrance doors are wide open."},
        {"id": "rep-20", "description": "Elevator in the science building is broken and stuck on floor 2."},
        {"id": "rep-30", "description": "Wheelchair ramp is partially obstructed by a bicycle."},
    ]

    scores, threshold = compute_duplicate_scores(candidate, comparisons, threshold=0.65)
    assert threshold == 0.65
    assert len(scores) == 3

    for item in scores:
        assert "id" in item
        assert "similarityScore" in item
        assert "isLikelyDuplicate" in item
        assert "decision" not in item
        assert "action" not in item
        assert "status" not in item
        assert 0.0 <= item["similarityScore"] <= 1.0

    assert scores[0]["similarityScore"] >= scores[1]["similarityScore"]
    assert scores[1]["similarityScore"] >= scores[2]["similarityScore"]
    assert scores[0]["id"] == "rep-20"
    assert scores[0]["similarityScore"] == 1.0
    assert scores[0]["isLikelyDuplicate"] is True

def test_duplicate_scoring_empty_comparisons():
    scores, threshold = compute_duplicate_scores("Candidate text", [])
    assert scores == []
    assert threshold == 0.65
