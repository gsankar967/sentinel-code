import json
import httpx
from google import genai
from google.genai import types
from backend.config import GEMINI_API_KEY, ROCKETRIDE_API_URL
from backend.models.scan import Vulnerability

OWASP_PROMPT = """You are an expert security auditor. Analyze the following {language} code for security vulnerabilities.

Focus on OWASP Top 10 2021:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)

For each vulnerability found, return a JSON object with:
- name: descriptive name of the vulnerability
- owasp_category: the OWASP category (e.g. "A03:2021 - Injection")
- severity: one of "critical", "high", "medium", "low"
- affected_lines: array of line numbers affected
- description: what the vulnerability is and why it's dangerous
- exploit_code: code that demonstrates how to exploit this vulnerability
- fix_suggestion: the corrected version of the affected code

Return ONLY valid JSON in this format, no markdown or explanation:
{{"vulnerabilities": [...]}}

Code to analyze:
```
{code}
```"""


async def scan_with_rocketride(code: str, language: str) -> list[Vulnerability]:
    """Try to scan via RocketRide pipeline engine first."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{ROCKETRIDE_API_URL}/api/v1/pipelines/vulnerability_scan/run",
                json={"inputs": {"code": code, "language": language}},
            )
            if resp.status_code == 200:
                data = resp.json()
                output = data.get("output", data.get("result", {}))
                vulns = output.get("vulnerabilities", [])
                return [Vulnerability(**v) for v in vulns]
    except Exception:
        pass  # Fall back to direct Gemini
    return await scan_with_gemini(code, language)


async def scan_with_gemini(code: str, language: str) -> list[Vulnerability]:
    """Direct Gemini API call as fallback."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = OWASP_PROMPT.format(language=language, code=code)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=16384,
        ),
    )

    text = response.text.strip()
    # Extract JSON — try markdown fences first, then brace extraction
    import re
    json_match = re.search(r"```(?:json)?\s*\n(.*?)(?:\n```|$)", text, re.DOTALL)
    if json_match:
        text = json_match.group(1).strip()
    # If still not valid JSON, extract from first { to last }
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]

    try:
        data = json.loads(text)
        vulns_raw = data.get("vulnerabilities", [])
        vulns = []
        for v in vulns_raw:
            try:
                vulns.append(Vulnerability(**v))
            except Exception:
                # Handle extra/missing fields gracefully
                vulns.append(Vulnerability(
                    name=v.get("name", "Unknown"),
                    owasp_category=v.get("owasp_category", "Unknown"),
                    severity=v.get("severity", "medium"),
                    affected_lines=v.get("affected_lines", []),
                    description=v.get("description", ""),
                    exploit_code=str(v.get("exploit_code", "")),
                    fix_suggestion=str(v.get("fix_suggestion", "")),
                ))
        return vulns
    except json.JSONDecodeError:
        return []
