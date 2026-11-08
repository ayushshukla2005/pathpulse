from typing import Literal, Optional
from pydantic import BaseModel, Field

CategoryLiteral = Literal["BROKEN_LIFT", "BLOCKED_RAMP", "INACCESSIBLE_ENTRANCE", "OTHER"]
SeverityLiteral = Literal["LOW", "MEDIUM", "HIGH"]

class ClassifyRequest(BaseModel):
    description: str = Field(min_length=10, max_length=1000)
    imageHint: Optional[str] = None

class ClassifyResponse(BaseModel):
    category: CategoryLiteral
    severity: SeverityLiteral
    confidence: float = Field(ge=0.0, le=1.0)
    requiresHumanVerification: Literal[True] = True
    modelVersion: str

class ReportInput(BaseModel):
    id: str
    description: str

class SummarizeRequest(BaseModel):
    reports: list[ReportInput] = Field(min_length=1, max_length=50)

class SummarizeResponse(BaseModel):
    summary: str
    coveredReportIds: list[str]
    requiresHumanVerification: Literal[True] = True
    modelVersion: str

class DuplicateScoreItem(BaseModel):
    id: str
    similarityScore: float = Field(ge=0.0, le=1.0)
    isLikelyDuplicate: bool

class DuplicateScoresRequest(BaseModel):
    candidateDescription: str
    comparisonReports: list[ReportInput] = Field(max_length=100)
    threshold: Optional[float] = None

class DuplicateScoresResponse(BaseModel):
    scores: list[DuplicateScoreItem]
    threshold: float
    requiresHumanVerification: Literal[True] = True
    modelVersion: str

class HealthResponse(BaseModel):
    status: str
    version: str
