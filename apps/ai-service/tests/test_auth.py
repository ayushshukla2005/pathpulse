from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_health_check_unauthenticated():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["version"] == settings.MODEL_VERSION

def test_classify_without_token_returns_401():
    res = client.post("/v1/classify", json={"description": "Elevator is completely broken"})
    assert res.status_code == 401

def test_classify_with_invalid_token_returns_401():
    res = client.post(
        "/v1/classify",
        headers={"Authorization": "Bearer invalid-wrong-token"},
        json={"description": "Elevator is completely broken"},
    )
    assert res.status_code == 401

def test_classify_with_valid_bearer_token_returns_200():
    res = client.post(
        "/v1/classify",
        headers={"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"},
        json={"description": "Elevator is completely broken"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["requiresHumanVerification"] is True
    assert data["category"] in {"BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"}

def test_classify_with_x_token_header_returns_200():
    res = client.post(
        "/v1/classify",
        headers={"x-ai-service-token": settings.AI_SERVICE_TOKEN},
        json={"description": "Wheelchair ramp is blocked by pallets"},
    )
    assert res.status_code == 200
    assert res.json()["requiresHumanVerification"] is True
