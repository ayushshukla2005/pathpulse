import pytest
from pydantic import ValidationError
from app.schemas import ClassifyRequest, ClassifyResponse, SummarizeRequest, DuplicateScoresRequest

def test_classify_request_length_validation():
    with pytest.raises(ValidationError):
        ClassifyRequest(description="short")

    req = ClassifyRequest(description="Valid description of broken elevator")
    assert req.description == "Valid description of broken elevator"

def test_classify_response_valid():
    res = ClassifyResponse(
        category="BROKEN_LIFT",
        severity="HIGH",
        confidence=0.88,
        requiresHumanVerification=True,
        modelVersion="v1.0.0",
    )
    assert res.category == "BROKEN_LIFT"
    assert res.requiresHumanVerification is True

def test_classify_response_rejects_invalid_category():
    with pytest.raises(ValidationError):
        ClassifyResponse(
            category="INVALID_CATEGORY",
            severity="HIGH",
            confidence=0.88,
            requiresHumanVerification=True,
            modelVersion="v1.0.0",
        )

def test_classify_response_rejects_invalid_severity():
    with pytest.raises(ValidationError):
        ClassifyResponse(
            category="BROKEN_LIFT",
            severity="CRITICAL",
            confidence=0.88,
            requiresHumanVerification=True,
            modelVersion="v1.0.0",
        )

def test_classify_response_rejects_missing_or_false_requires_human_verification():
    with pytest.raises(ValidationError):
        ClassifyResponse(
            category="BROKEN_LIFT",
            severity="HIGH",
            confidence=0.88,
            requiresHumanVerification=False,
            modelVersion="v1.0.0",
        )

def test_summarize_request_validation():
    with pytest.raises(ValidationError):
        SummarizeRequest(reports=[])

    with pytest.raises(ValidationError):
        reports = [{"id": f"id-{i}", "description": f"desc {i}"} for i in range(51)]
        SummarizeRequest(reports=reports)

def test_duplicate_scores_request_validation():
    with pytest.raises(ValidationError):
        reports = [{"id": f"id-{i}", "description": f"desc {i}"} for i in range(101)]
        DuplicateScoresRequest(candidateDescription="test", comparisonReports=reports)

