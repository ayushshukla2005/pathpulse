from app.sentry_scrubber import scrub_sentry_event, REDACTED_VALUE

def test_sentry_scrubber_redacts_sensitive_fields():
    raw_event = {
        "event_id": "9ec069f257b4474797034c44e9955773",
        "request": {
            "url": "http://ai-service:8000/v1/classify",
            "method": "POST",
            "headers": {
                "authorization": "Bearer secret-token-1234",
                "cookie": "session=sid999",
                "content-type": "application/json",
            },
            "cookies": {
                "auth_session": "secret_cookie",
            },
            "data": {
                "description": "Wheelchair ramp blocked with trash bags",
                "email": "user@domain.com",
                "password": "Password123!",
                "token": "auth_tok_xyz",
                "coordinates": [77.5946, 12.9716],
                "latitude": 12.9716,
                "longitude": 77.5946,
                "reportId": "rep_safe_123",
            },
        },
        "user": {
            "id": "usr_99",
            "email": "reporter@example.com",
            "ip_address": "198.51.100.23",
        },
        "extra": {
            "contactEmail": "admin@pathpulse.org",
            "component": "classifier",
        },
        "breadcrumbs": {
            "values": [
                {
                    "message": "Processed payload",
                    "data": {
                        "token": "breadcrumb_secret",
                        "status": "active",
                    },
                }
            ]
        },
    }

    sanitized = scrub_sentry_event(raw_event)

    headers = sanitized["request"]["headers"]
    assert headers["authorization"] == REDACTED_VALUE
    assert headers["cookie"] == REDACTED_VALUE
    assert headers["content-type"] == "application/json"

    assert sanitized["request"]["cookies"]["auth_session"] == REDACTED_VALUE

    body = sanitized["request"]["data"]
    assert body["description"] == REDACTED_VALUE
    assert body["email"] == REDACTED_VALUE
    assert body["password"] == REDACTED_VALUE
    assert body["token"] == REDACTED_VALUE
    assert body["coordinates"] == REDACTED_VALUE
    assert body["latitude"] == REDACTED_VALUE
    assert body["longitude"] == REDACTED_VALUE
    assert body["reportId"] == "rep_safe_123"

    user = sanitized["user"]
    assert user["id"] == "usr_99"
    assert user["email"] == REDACTED_VALUE
    assert user["ip_address"] == "0.0.0.0"

    assert sanitized["extra"]["contactEmail"] == REDACTED_VALUE
    assert sanitized["extra"]["component"] == "classifier"

    crumb = sanitized["breadcrumbs"]["values"][0]
    assert crumb["data"]["token"] == REDACTED_VALUE
    assert crumb["data"]["status"] == "active"

