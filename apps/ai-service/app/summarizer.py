import re
from typing import TypedDict

class ReportDict(TypedDict):
    id: str
    description: str

INFORMATIVE_TERMS = {
    "elevator", "lift", "ramp", "entrance", "door", "stuck", "broken",
    "blocked", "inaccessible", "wheelchair", "out", "service", "button",
    "obstruction", "handrail", "braille", "stairs", "step-free",
}

def split_sentences(text: str) -> list[str]:
    raw_sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    clean = []
    for s in raw_sentences:
        trimmed = s.strip()
        if len(trimmed) >= 12:
            clean.append(trimmed)
    return clean

def score_sentence(sentence: str) -> float:
    words = re.findall(r"\b[a-zA-Z]+\b", sentence.lower())
    if not words:
        return 0.0
    match_count = sum(1 for w in words if w in INFORMATIVE_TERMS)
    length = len(sentence)
    length_score = 1.0
    if length < 20 or length > 180:
        length_score = 0.6
    return (match_count * 2.0 + len(words) * 0.1) * length_score

def summarize_reports(reports: list[ReportDict], max_sentences: int = 3) -> tuple[str, list[str]]:
    if not reports:
        return "", []

    scored_sentences: list[tuple[float, str, str]] = []

    for r in reports:
        rep_id = r["id"]
        sentences = split_sentences(r["description"])
        if not sentences and len(r["description"].strip()) >= 5:
            sentences = [r["description"].strip()]
        for s in sentences:
            score = score_sentence(s)
            scored_sentences.append((score, s, rep_id))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)

    selected_sentences: list[str] = []
    covered_ids: set[str] = set()

    for _, sentence, rep_id in scored_sentences:
        normalized = sentence.lower()
        if not any(normalized in existing.lower() or existing.lower() in normalized for existing in selected_sentences):
            selected_sentences.append(sentence)
            covered_ids.add(rep_id)
        if len(selected_sentences) >= max_sentences:
            break

    summary = " ".join(selected_sentences[:max_sentences])
    return summary, sorted(list(covered_ids))

