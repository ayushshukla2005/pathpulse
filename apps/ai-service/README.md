# PathPulse AI Suggestion Service

The PathPulse AI Service is a lightweight, internal FastAPI microservice that assists human moderators by generating advisory report classifications, cluster summaries, and duplicate scores.

## Core Governance & Safety Guarantees

1. **Advisory Suggestions Only**: The AI never decides or alters any report status, verification level, or facility operational status. All outputs are suggestions for human review.
2. **Mandatory Human Verification Flag**: Every single response schema explicitly returns `requiresHumanVerification: true`.
3. **No External Network Dependencies**: Operates 100% offline using local TF-IDF and scikit-learn models. No external AI APIs or cloud models are called.
4. **Privacy-Preserving Logging**: Report text is never logged in full. Only request IDs, string lengths, model versions, status codes, and latencies are recorded.
5. **Resilient Failure Mode**: If this service is down, unreachable, or returns an error, the core PathPulse platform continues unaffected. Suggestions are simply absent.

## Endpoints

All endpoints except `/health` require internal authentication via the `AI_SERVICE_TOKEN` secret passed in `Authorization: Bearer <token>` or `x-ai-service-token`.

- **`GET /health`**: Health check returning `{ "status": "ok", "version": "..." }`.
- **`POST /v1/classify`**:
  - Input: `description` (10-1000 characters) and optional `imageHint` (category hint text, not image bytes).
  - Output: `category` (`BROKEN_LIFT`, `BLOCKED_RAMP`, `INACCESSIBLE_ENTRANCE`, `OTHER`), `severity` (`LOW`, `MEDIUM`, `HIGH`), `confidence` (0.0 to 1.0), `requiresHumanVerification: true`, `modelVersion`.
- **`POST /v1/summarize`**:
  - Input: `reports` (list of up to 50 items with `id` and `description`).
  - Output: `summary` (deterministic extractive summary of at most 3 sentences), `coveredReportIds`, `requiresHumanVerification: true`, `modelVersion`.
- **`POST /v1/duplicate-scores`**:
  - Input: `candidateDescription`, `comparisonReports` (list of up to 100 items with `id` and `description`), optional `threshold`.
  - Output: `scores` (list of similarity scores sorted descending with `isLikelyDuplicate`), `threshold`, `requiresHumanVerification: true`, `modelVersion`. Never returns a decision to merge or close.

## Dataset and Evaluation

- The evaluation dataset at `evaluation/labelled_reports.csv` is **entirely synthetic**, created with realistic dummy barrier descriptions. It contains no personal or real-world user data.
- Run evaluation:
  ```bash
  python evaluation/evaluate.py
  ```
- Metrics on held-out split (30% held-out evaluation):
  - Accuracy: 91.7%
  - Macro F1: 0.914
  - Precision: BROKEN_LIFT: 1.000, BLOCKED_RAMP: 0.750, INACCESSIBLE_ENTRANCE: 1.000, OTHER: 1.000
  - Recall: BROKEN_LIFT: 1.000, BLOCKED_RAMP: 1.000, INACCESSIBLE_ENTRANCE: 1.000, OTHER: 0.667

## Running Locally

1. Create and activate virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run test suite:
   ```bash
   pytest
   ```
4. Run server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
