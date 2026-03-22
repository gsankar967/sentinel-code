import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from backend.services.gemini_scanner import scan_with_gemini, scan_with_rocketride, OWASP_PROMPT


def test_owasp_prompt_contains_all_categories():
    assert "A01: Broken Access Control" in OWASP_PROMPT
    assert "A02: Cryptographic Failures" in OWASP_PROMPT
    assert "A03: Injection" in OWASP_PROMPT
    assert "A04: Insecure Design" in OWASP_PROMPT
    assert "A05: Security Misconfiguration" in OWASP_PROMPT
    assert "A06: Vulnerable and Outdated Components" in OWASP_PROMPT
    assert "A07: Identification and Authentication Failures" in OWASP_PROMPT
    assert "A08: Software and Data Integrity Failures" in OWASP_PROMPT
    assert "A09: Security Logging and Monitoring Failures" in OWASP_PROMPT
    assert "A10: Server-Side Request Forgery" in OWASP_PROMPT


def test_owasp_prompt_format_placeholders():
    prompt = OWASP_PROMPT.format(language="python", code="x = 1")
    assert "python" in prompt
    assert "x = 1" in prompt


@pytest.mark.asyncio
async def test_scan_with_gemini_no_api_key():
    with patch("backend.services.gemini_scanner.GEMINI_API_KEY", ""):
        with pytest.raises(ValueError, match="GEMINI_API_KEY not set"):
            await scan_with_gemini("print('hello')", "python")


@pytest.mark.asyncio
async def test_scan_with_gemini_parses_response():
    mock_response = MagicMock()
    mock_response.text = '{"vulnerabilities": [{"name": "SQL Injection", "owasp_category": "A03:2021 - Injection", "severity": "critical", "affected_lines": [5], "description": "SQL injection found", "exploit_code": "", "fix_suggestion": ""}]}'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("backend.services.gemini_scanner.GEMINI_API_KEY", "fake-key"):
        with patch("backend.services.gemini_scanner.genai.Client", return_value=mock_client):
            vulns = await scan_with_gemini("query = f'SELECT * FROM users WHERE id={id}'", "python")

    assert len(vulns) == 1
    assert vulns[0].name == "SQL Injection"
    assert vulns[0].severity == "critical"


@pytest.mark.asyncio
async def test_scan_with_gemini_handles_markdown_fences():
    mock_response = MagicMock()
    mock_response.text = '```json\n{"vulnerabilities": []}\n```'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("backend.services.gemini_scanner.GEMINI_API_KEY", "fake-key"):
        with patch("backend.services.gemini_scanner.genai.Client", return_value=mock_client):
            vulns = await scan_with_gemini("print('safe')", "python")

    assert vulns == []


@pytest.mark.asyncio
async def test_scan_with_gemini_handles_invalid_json():
    mock_response = MagicMock()
    mock_response.text = "This is not JSON at all"

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("backend.services.gemini_scanner.GEMINI_API_KEY", "fake-key"):
        with patch("backend.services.gemini_scanner.genai.Client", return_value=mock_client):
            vulns = await scan_with_gemini("print('hello')", "python")

    assert vulns == []


@pytest.mark.asyncio
async def test_scan_with_rocketride_falls_back_to_gemini():
    """When RocketRide is unavailable, should fall back to direct Gemini."""
    mock_response = MagicMock()
    mock_response.text = '{"vulnerabilities": [{"name": "XSS", "owasp_category": "A03:2021", "severity": "high", "description": "XSS found"}]}'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("backend.services.gemini_scanner.GEMINI_API_KEY", "fake-key"):
        with patch("backend.services.gemini_scanner.genai.Client", return_value=mock_client):
            vulns = await scan_with_rocketride("<script>alert(1)</script>", "javascript")

    assert len(vulns) == 1
    assert vulns[0].name == "XSS"
