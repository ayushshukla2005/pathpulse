from app.summarizer import summarize_reports, split_sentences

def test_split_sentences():
    text = "The elevator is broken. Doors will not open! Please fix it immediately."
    s = split_sentences(text)
    assert len(s) == 3

def test_summarizer_max_sentences_and_covered_ids():
    reports = [
        {"id": "rep-1", "description": "The west elevator is completely broken and out of service."},
        {"id": "rep-2", "description": "Elevator doors are stuck on floor 3. People cannot enter."},
        {"id": "rep-3", "description": "Wheelchair access ramp is blocked by heavy debris and boxes."},
        {"id": "rep-4", "description": "Hallway light is loose and flickering slightly."},
    ]

    summary, covered_ids = summarize_reports(reports, max_sentences=3)
    sentences = [s for s in summary.split(".") if s.strip()]
    assert len(sentences) <= 3
    assert len(covered_ids) <= 3
    valid_ids = {"rep-1", "rep-2", "rep-3", "rep-4"}
    for cid in covered_ids:
        assert cid in valid_ids

def test_summarizer_empty_input():
    summary, covered_ids = summarize_reports([])
    assert summary == ""
    assert covered_ids == []
