from backend.models.scan import Vulnerability, ScanRequest, ScanResponse


def test_vulnerability_model():
    vuln = Vulnerability(
        name="SQL Injection in login",
        owasp_category="A03:2021 - Injection",
        severity="critical",
        affected_lines=[15, 16],
        description="User input concatenated into SQL query",
        exploit_code="' OR 1=1 --",
        fix_suggestion="Use parameterized queries",
    )
    assert vuln.severity == "critical"
    assert vuln.affected_lines == [15, 16]
    assert "Injection" in vuln.owasp_category


def test_vulnerability_minimal():
    vuln = Vulnerability(
        name="Test vuln",
        owasp_category="A01:2021",
        severity="low",
        description="Test description",
    )
    assert vuln.exploit_code == ""
    assert vuln.fix_suggestion == ""
    assert vuln.affected_lines == []


def test_scan_request_defaults():
    req = ScanRequest(code="print('hello')")
    assert req.language == "auto"
    assert req.repo_url is None


def test_scan_request_with_language():
    req = ScanRequest(code="x = 1", language="python")
    assert req.language == "python"


def test_scan_response_defaults():
    resp = ScanResponse(scan_id="abc123", status="scanning")
    assert resp.progress == 0.0
    assert resp.vulnerabilities == []
    assert resp.fixes == []
    assert resp.sandbox_results == []
    assert resp.error is None


def test_scan_response_with_vulnerabilities():
    vuln = Vulnerability(
        name="XSS",
        owasp_category="A03:2021 - Injection",
        severity="high",
        description="Cross-site scripting",
    )
    resp = ScanResponse(
        scan_id="abc123",
        status="complete",
        progress=1.0,
        vulnerabilities=[vuln],
    )
    assert len(resp.vulnerabilities) == 1
    assert resp.vulnerabilities[0].name == "XSS"
