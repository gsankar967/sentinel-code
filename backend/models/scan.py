from pydantic import BaseModel
from typing import Optional


class ScanRequest(BaseModel):
    code: Optional[str] = None
    repo_url: Optional[str] = None
    language: str = "auto"


class Vulnerability(BaseModel):
    name: str
    owasp_category: str
    severity: str  # critical, high, medium, low
    affected_lines: list[int] = []
    description: str
    exploit_code: str = ""
    fix_suggestion: str = ""


class SandboxResult(BaseModel):
    vulnerability: str
    exploitable: bool
    output: str = ""


class Fix(BaseModel):
    original: str
    fixed: str
    vulnerability: str


class ScanResponse(BaseModel):
    scan_id: str
    status: str  # processing, scanning, testing, fixing, complete, error
    progress: float = 0.0
    vulnerabilities: list[Vulnerability] = []
    fixes: list[Fix] = []
    sandbox_results: list[SandboxResult] = []
    error: Optional[str] = None
