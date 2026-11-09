import time
import uuid
import logging
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header, Request, status

from app.config import settings
from app.schemas import (
    ClassifyRequest,
    ClassifyResponse,
    SummarizeRequest,
    SummarizeResponse,
    DuplicateScoresRequest,
    DuplicateScoresResponse,
    DuplicateScoreItem,
    HealthResponse,
)
from app.classifier import classifier
from app.summarizer import summarize_reports
from app.duplicates import compute_duplicate_scores
from app.sentry_scrubber import scrub_sentry_event

if settings.SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,
        before_send=scrub_sentry_event,
    )

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(
    title="PathPulse AI Suggestion Service",
    description="Advisory AI classification, summarisation, and duplicate scoring for PathPulse",
    version=settings.MODEL_VERSION,
)

async def verify_internal_token(
    authorization: Optional[str] = Header(None),
    x_ai_service_token: Optional[str] = Header(None),
):
    token = None
    if authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        else:
            token = authorization
    elif x_ai_service_token:
        token = x_ai_service_token

    if not token or token != settings.AI_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing AI service authorization token",
        )
    return token

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())
    start_time = time.perf_counter()

    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    logger.info(
        f"req_id={req_id} method={request.method} path={request.url.path} "
        f"status={response.status_code} duration_ms={duration_ms} model_version={settings.MODEL_VERSION}"
    )
    return response

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version=settings.MODEL_VERSION)

@app.post("/v1/classify", response_model=ClassifyResponse, dependencies=[Depends(verify_internal_token)])
async def classify_report(payload: ClassifyRequest):
    req_id = str(uuid.uuid4())
    text_length = len(payload.description)
    logger.info(f"classify_request req_id={req_id} text_length={text_length} has_image_hint={payload.imageHint is not None}")

    category, severity, confidence = classifier.classify(
        text=payload.description,
        image_hint=payload.imageHint,
    )

    return ClassifyResponse(
        category=category,
        severity=severity,
        confidence=confidence,
        requiresHumanVerification=True,
        modelVersion=settings.MODEL_VERSION,
    )

@app.post("/v1/summarize", response_model=SummarizeResponse, dependencies=[Depends(verify_internal_token)])
async def summarize_report_cluster(payload: SummarizeRequest):
    req_id = str(uuid.uuid4())
    report_count = len(payload.reports)
    total_length = sum(len(r.description) for r in payload.reports)
    logger.info(f"summarize_request req_id={req_id} report_count={report_count} total_chars={total_length}")

    reports_data = [{"id": r.id, "description": r.description} for r in payload.reports]
    summary_text, covered_ids = summarize_reports(reports_data, max_sentences=3)

    return SummarizeResponse(
        summary=summary_text,
        coveredReportIds=covered_ids,
        requiresHumanVerification=True,
        modelVersion=settings.MODEL_VERSION,
    )

@app.post("/v1/duplicate-scores", response_model=DuplicateScoresResponse, dependencies=[Depends(verify_internal_token)])
async def score_duplicates(payload: DuplicateScoresRequest):
    req_id = str(uuid.uuid4())
    candidate_length = len(payload.candidateDescription)
    comp_count = len(payload.comparisonReports)
    logger.info(f"duplicates_request req_id={req_id} candidate_length={candidate_length} comparison_count={comp_count}")

    comparison_data = [{"id": r.id, "description": r.description} for r in payload.comparisonReports]
    scores, effective_threshold = compute_duplicate_scores(
        candidate_description=payload.candidateDescription,
        comparison_reports=comparison_data,
        threshold=payload.threshold or settings.DUPLICATE_THRESHOLD,
    )

    score_items = [
        DuplicateScoreItem(
            id=item["id"],
            similarityScore=item["similarityScore"],
            isLikelyDuplicate=item["isLikelyDuplicate"],
        )
        for item in scores
    ]

    return DuplicateScoresResponse(
        scores=score_items,
        threshold=effective_threshold,
        requiresHumanVerification=True,
        modelVersion=settings.MODEL_VERSION,
    )
