from pydantic import BaseModel
from typing import List, Optional


class IssueRecord(BaseModel):
    id: str
    severity: str  # Critical | Warning | Minor
    standard: Optional[str] = None
    heuristic: Optional[str] = None
    element: Optional[str] = None
    description: str
    recommendation: str


class BoundingBoxRecord(BaseModel):
    issue_id: str
    severity: str
    label: str
    x: float
    y: float
    width: float
    height: float


class PersonaRecord(BaseModel):
    name: str
    role: str
    score: int
    satisfaction: str  # High | Medium | Low
    friction: str
    recommendation: str


class BusinessImpactRecord(BaseModel):
    conversion_lift_percentage: float
    estimated_monthly_revenue_lift: float
    csat_lift_percentage: float
    development_effort: str  # High | Medium | Low


class BeforeAfterRecord(BaseModel):
    before: dict  # { html: str, css: str, visual: str }
    after: dict   # { html: str, css: str, visual: str }


class PageRecord(BaseModel):
    url: str
    path: str
    parent_path: str
    title: str
    uxScore: int
    a11yScore: int
    uxIssues: List[IssueRecord]
    a11yIssues: List[IssueRecord]
    personas: List[PersonaRecord]
    businessImpact: BusinessImpactRecord
    beforeAfter: BeforeAfterRecord
    screenshotBoxes: List[BoundingBoxRecord]
    screenshot_b64: Optional[str] = None


class HistoryScore(BaseModel):
    timestamp: str
    uxScore: int
    a11yScore: int


class AuditRecord(BaseModel):
    id: str
    url: str
    timestamp: str
    overallScore: int
    uxScore: int
    a11yScore: int
    totalPages: int
    criticalCount: int
    warningCount: int
    minorCount: int
    resolvedIssuesCount: int
    historyScores: List[HistoryScore]
    pages: List[PageRecord]
    source: Optional[str] = "url"



class AuditStartRequest(BaseModel):
    url: Optional[str] = None
    input_type: str = "url"  # "url" | "screenshot" | "figma"
    screenshots: Optional[List[str]] = None  # Base64 image list
    figma_url: Optional[str] = None
    figma_token: Optional[str] = None
    enhance_analysis: Optional[bool] = False


class CoachChatRequest(BaseModel):
    message: str
    url: Optional[str] = None
    audit_context: Optional[dict] = None


class ProgressEvent(BaseModel):
    type: str           # progress | complete | error
    audit_id: str
    status: str
    current_page: str
    discovered_count: int
    completed_count: int
    current_agent: str
    percent: int
    estimated_time: str
    error: Optional[str] = None


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class UserLoginRequest(BaseModel):
    email: str
    password: str

