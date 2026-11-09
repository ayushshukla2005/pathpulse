import re
from typing import Any, Dict

SENSITIVE_KEY_PATTERNS = [
    re.compile(r"^authorization$", re.I),
    re.compile(r"^cookie$", re.I),
    re.compile(r"^set-cookie$", re.I),
    re.compile(r"session", re.I),
    re.compile(r"password", re.I),
    re.compile(r"token", re.I),
    re.compile(r"secret", re.I),
    re.compile(r"api[-_]?key", re.I),
    re.compile(r"^email$", re.I),
    re.compile(r"^description$", re.I),
    re.compile(r"^coordinates$", re.I),
    re.compile(r"^latitude$", re.I),
    re.compile(r"^longitude$", re.I),
    re.compile(r"^lat$", re.I),
    re.compile(r"^lng$", re.I),
]

REDACTED_VALUE = "[REDACTED]"
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
BEARER_REGEX = re.compile(r"^Bearer\s+", re.I)

def is_sensitive_key(key: str) -> bool:
    return any(p.search(key) for p in SENSITIVE_KEY_PATTERNS)

def redact_sensitive_data(target: Any) -> Any:
    if target is None:
        return None

    if isinstance(target, str):
        if EMAIL_REGEX.match(target) or BEARER_REGEX.match(target):
            return REDACTED_VALUE
        return target

    if isinstance(target, list):
        return [redact_sensitive_data(item) for item in target]

    if isinstance(target, dict):
        output: Dict[str, Any] = {}
        for key, val in target.items():
            if is_sensitive_key(str(key)):
                output[key] = REDACTED_VALUE
            elif isinstance(val, (dict, list)):
                output[key] = redact_sensitive_data(val)
            elif isinstance(val, str) and (EMAIL_REGEX.match(val) or BEARER_REGEX.match(val)):
                output[key] = REDACTED_VALUE
            else:
                output[key] = val
        return output

    return target

def scrub_sentry_event(event: Dict[str, Any], hint: Any = None) -> Dict[str, Any]:
    if not isinstance(event, dict):
        return event

    request_data = event.get("request")
    if isinstance(request_data, dict):
        if "headers" in request_data and isinstance(request_data["headers"], dict):
            request_data["headers"] = redact_sensitive_data(request_data["headers"])

        if "cookies" in request_data and isinstance(request_data["cookies"], dict):
            request_data["cookies"] = {k: REDACTED_VALUE for k in request_data["cookies"].keys()}

        if "data" in request_data:
            request_data["data"] = redact_sensitive_data(request_data["data"])

    user_data = event.get("user")
    if isinstance(user_data, dict):
        if "email" in user_data:
            user_data["email"] = REDACTED_VALUE
        if "ip_address" in user_data:
            user_data["ip_address"] = "0.0.0.0"

    if "extra" in event and isinstance(event["extra"], dict):
        event["extra"] = redact_sensitive_data(event["extra"])

    breadcrumbs = event.get("breadcrumbs")
    if isinstance(breadcrumbs, dict) and "values" in breadcrumbs and isinstance(breadcrumbs["values"], list):
        for crumb in breadcrumbs["values"]:
            if isinstance(crumb, dict) and "data" in crumb and isinstance(crumb["data"], dict):
                crumb["data"] = redact_sensitive_data(crumb["data"])
    elif isinstance(breadcrumbs, list):
        for crumb in breadcrumbs:
            if isinstance(crumb, dict) and "data" in crumb and isinstance(crumb["data"], dict):
                crumb["data"] = redact_sensitive_data(crumb["data"])

    return event
