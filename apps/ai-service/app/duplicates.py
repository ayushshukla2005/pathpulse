from typing import Optional, TypedDict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ComparisonReport(TypedDict):
    id: str
    description: str

class ScoredDuplicate(TypedDict):
    id: str
    similarityScore: float
    isLikelyDuplicate: bool

def compute_duplicate_scores(
    candidate_description: str,
    comparison_reports: list[ComparisonReport],
    threshold: Optional[float] = None,
) -> tuple[list[ScoredDuplicate], float]:
    effective_threshold = 0.65 if threshold is None else float(threshold)

    if not comparison_reports:
        return [], effective_threshold

    candidate_text = candidate_description.strip()
    comparison_texts = [r["description"].strip() for r in comparison_reports]

    all_texts = [candidate_text] + comparison_texts

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    candidate_vec = tfidf_matrix[0:1]
    comparison_vecs = tfidf_matrix[1:]

    sim_matrix = cosine_similarity(candidate_vec, comparison_vecs)[0]

    scored_items: list[ScoredDuplicate] = []
    for i, report in enumerate(comparison_reports):
        score = float(sim_matrix[i])
        bounded_score = max(0.0, min(1.0, round(score, 4)))
        scored_items.append({
            "id": report["id"],
            "similarityScore": bounded_score,
            "isLikelyDuplicate": bounded_score >= effective_threshold,
        })

    scored_items.sort(key=lambda x: x["similarityScore"], reverse=True)
    return scored_items, effective_threshold
