# Sentinel Code

AI-powered vulnerability scanner with threat intelligence mapping. Built for the Frontier Tower AI Hackathon.

## The Problem

Developers ship vulnerable code every day. Manual security audits are slow, expensive, and often happen too late. Most teams don't have dedicated security engineers, and existing tools produce noisy results without actionable fixes.

## What Sentinel Code Does

Sentinel Code is an end-to-end security scanning system that analyzes code for OWASP Top 10 vulnerabilities, provides exploit proof, and suggests verified fixes — all powered by Google Gemini AI and orchestrated through a RocketRide pipeline.

### How It Works

1. **Paste code or link a GitHub repo** into the web UI
2. **RocketRide pipeline** orchestrates the scan flow (WebHook -> Prompt -> Gemini LLM -> Return Answers)
3. **Gemini 2.5 Flash** analyzes code for OWASP Top 10 vulnerabilities with structured JSON output
4. **AI generates exploit code** demonstrating each vulnerability is real
5. **AI suggests fixes** with corrected code for each issue
6. **Threat Intelligence Map** visualizes 25+ global threat origins with live feed animation

### Supported Languages

- Python
- JavaScript
- TypeScript
- Java
- Go

### Input Methods

- **Paste Code**: paste any code snippet directly with built-in vulnerable samples for each language
- **GitHub URL**: link a single file (`github.com/user/repo/blob/main/file.py`) or entire repo (`github.com/user/repo`) — Sentinel Code fetches and scans source files automatically via `git clone --depth 1`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4, React-Leaflet |
| **Backend** | Python 3.12, FastAPI, Pydantic, httpx |
| **AI Model** | Google Gemini 2.5 Flash (fallback from RocketRide pipeline) |
| **Pipeline** | RocketRide IDE Extension (`.pipe` file with WebHook -> Prompt -> Gemini -> Return Answers) |
| **Map Tiles** | CartoDB Dark Matter (dark cybersecurity theme) |
| **Testing** | pytest, pytest-asyncio (25 tests: unit + integration) |

## Architecture

```
                    +-------------------------------------------+
                    |           Next.js Frontend                |
                    |  +----------+ +----------+ +-----------+  |
                    |  |CodeInput | |ThreatMap | |VulnCard   |  |
                    |  +----+-----+ +----------+ +-----------+  |
                    +-------+------+----------------------------+
                            |      |
                  POST /api/scan   GET /api/threatmap
                    +-------v------v----------------------------+
                    |           FastAPI Backend                  |
                    |                                           |
                    |  +-------------------------------------+  |
                    |  |     scan_with_rocketride()           |  |
                    |  |  1. Check if RocketRide is running   |  |
                    |  |  2. POST /webhook with code          |  |
                    |  |  3. Parse structured JSON            |  |
                    |  |  4. Fallback: direct Gemini API      |  |
                    |  +--------+----------------+-----------+  |
                    +-----------+----------------+--------------+
                                |                |
                    +-----------v--+   +---------v--------------+
                    |  RocketRide  |   |  Gemini API Direct     |
                    |  Pipeline    |   |  (automatic fallback)  |
                    |  +--------+  |   +------------------------+
                    |  |WebHook |  |
                    |  |Prompt  |  |
                    |  |Gemini  |  |
                    |  |Return  |  |
                    |  +--------+  |
                    +--------------+
```

### Scan Pipeline Flow

```
User submits code/repo URL
    |
    v
[repo_fetcher] -- git clone --depth 1 (for repo URLs)
    |              Filters to source files only (.py, .js, .ts, .java, .go)
    |              Caps at 5 files / 5KB per file / 10KB total
    v
[RocketRide Pipeline] -- WebHook -> Prompt -> Gemini 2.5 Flash -> Return Answers
    |                     (falls back to direct Gemini API if pipeline not running)
    v
[JSON Parser] -- Extracts structured vulnerability data
    |              name, owasp_category, severity, affected_lines,
    |              description, exploit_code, fix_suggestion
    v
[Response] -- Frontend displays results with severity badges,
              expandable code snippets, and fix suggestions
```

### Smart Fallback Strategy

The backend uses a two-tier scanning approach:

1. **RocketRide Pipeline (primary)**: If the RocketRide engine is running locally (port 5565), the backend sends code to the pipeline via webhook. A 3-second connectivity check determines if the pipeline is active.
2. **Direct Gemini API (fallback)**: If RocketRide is unavailable or returns empty results, the backend calls Gemini 2.5 Flash directly. This ensures scans always work regardless of RocketRide status.

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- A [Gemini API key](https://aistudio.google.com/apikey)
- (Optional) [RocketRide VS Code extension](https://marketplace.visualstudio.com/items?itemName=RocketRide.rocketride)

### Setup

```bash
# Clone the repo
git clone https://github.com/gsankar967/sentinel-code.git
cd sentinel-code

# Install Python dependencies
uv sync

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Run Locally

```bash
# Terminal 1: Start backend
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:3002** in your browser.

### Quick Demo

1. Open http://localhost:3002
2. Select a language (Python, JavaScript, TypeScript, Java, or Go)
3. Click **Load sample** to load vulnerable code
4. Click **Scan for Vulnerabilities**
5. Watch the progress bar move through: Analyzing -> Testing -> Fixing -> Complete
6. View results with severity badges, exploit code, and fix suggestions

### GitHub URL Scanning

1. Click the **GitHub URL** tab
2. Paste a URL:
   - Single file: `https://github.com/user/repo/blob/main/app.py`
   - Entire repo: `https://github.com/user/repo`
3. Click **Fetch** to pull the code
4. Click **Scan for Vulnerabilities**

**Tip**: Single file URLs scan fastest. For repos, Sentinel Code fetches the first 5 source files (max 5KB each).

### Run Tests

```bash
# All tests (unit + integration with live Gemini API)
uv run pytest tests/ -v

# Unit tests only (fast, no API calls)
uv run pytest tests/test_models.py tests/test_api.py tests/test_gemini_scanner.py -v

# Integration tests only (requires GEMINI_API_KEY)
uv run pytest tests/test_integration.py -v
```

**Test coverage: 25/25 passing**
- 6 API endpoint tests (health check, threat map, scan CRUD, validation)
- 7 Gemini scanner tests (prompt validation, JSON parsing, markdown fence handling, fallback behavior)
- 6 data model tests (Vulnerability, ScanRequest, ScanResponse with defaults and edge cases)
- 6 integration tests (live Python/JS/Go scans with real Gemini API, repo fetch, threat map geo validation)

## Project Structure

```
sentinel_code/
├── .env.example                # Environment variable template
├── .gitignore                  # Excludes .env, .pipe files (API key protection)
├── pyproject.toml              # Python project config + dependencies
├── pipelines/
│   └── vulnerability_scan.pipe # RocketRide visual pipeline (gitignored, contains API keys)
├── backend/
│   ├── main.py                 # FastAPI app, CORS (ports 3000-3002), router mounting
│   ├── config.py               # Loads GEMINI_API_KEY, ROCKETRIDE_URI, ROCKETRIDE_APIKEY
│   ├── routers/
│   │   ├── scan.py             # POST /api/scan, GET /api/scan/{id}, GET /api/repo
│   │   │                       # Repo fetcher: git clone, file filtering, truncation
│   │   └── threatmap.py        # GET /api/threatmap — serves seed threat data
│   ├── services/
│   │   └── gemini_scanner.py   # Core scanning logic:
│   │                           #   - OWASP Top 10 prompt engineering
│   │                           #   - RocketRide webhook integration
│   │                           #   - Direct Gemini API fallback
│   │                           #   - JSON response parsing (markdown fences, arrays, objects)
│   │                           #   - Code truncation (20KB max)
│   ├── models/
│   │   └── scan.py             # Pydantic models: Vulnerability, ScanRequest, ScanResponse
│   └── data/
│       └── sample_threats.json # 25 geo-located threat data points (CVEs, IPs, coordinates)
├── frontend/
│   ├── package.json            # Next.js 15, React 19, react-leaflet, tailwindcss
│   ├── next.config.ts          # API proxy: /api/* -> localhost:8000
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Dark theme layout, shield logo, navbar (Scanner/Threat Map)
│       │   ├── page.tsx        # Main page: hero, threat map, code input, scan results
│       │   │                   # Polling logic with error retry, progress tracking
│       │   ├── globals.css     # CSS variables, pulsing marker animations (4 severity levels)
│       │   └── threatmap/
│       │       └── page.tsx    # Full-page threat map view
│       ├── components/
│       │   ├── CodeInput.tsx   # Dual mode: Paste Code / GitHub URL
│       │   │                   # 5 language samples, repo fetch with error display
│       │   ├── ThreatMap.tsx   # React-Leaflet, CartoDB dark tiles, pulsing severity markers
│       │   │                   # Stats overlay, severity legend, popup details
│       │   ├── ScanProgress.tsx # 4-stage progress bar with spinner animation
│       │   │                   # Stages: Analyzing -> Testing -> Fixing -> Complete
│       │   └── VulnerabilityCard.tsx # Expandable cards with severity badges
│       │                       # Shows description, exploit code, fix suggestion
│       └── lib/
│           ├── api.ts          # Backend API client helpers
│           └── types.ts        # TypeScript interfaces (Vulnerability, ScanResult, ThreatPoint)
├── tests/
│   ├── test_models.py          # Pydantic model validation (defaults, required fields, edge cases)
│   ├── test_api.py             # API endpoint tests with mocked scanner
│   ├── test_gemini_scanner.py  # Scanner unit tests: prompt content, JSON parsing, fallback
│   └── test_integration.py     # Live end-to-end: Python/JS/Go scans, repo fetch, threat map
└── docker-compose.yml          # Docker deployment (backend + frontend containers)
```

## API Reference

### POST /api/scan

Submit code for vulnerability scanning.

**Request:**
```json
{
  "code": "import os\nos.system(input())",
  "language": "python"
}
```

**Response:**
```json
{
  "scan_id": "a3040e89",
  "status": "processing"
}
```

### GET /api/scan/{id}

Poll scan status and results. Status progresses: `scanning` -> `testing` -> `fixing` -> `complete`.

**Response (complete):**
```json
{
  "scan_id": "a3040e89",
  "status": "complete",
  "progress": 1.0,
  "vulnerabilities": [
    {
      "name": "SQL Injection via Unsanitized Input",
      "owasp_category": "A03:2021 - Injection",
      "severity": "critical",
      "affected_lines": [10, 11],
      "description": "User input is concatenated directly into SQL query...",
      "exploit_code": "# input: ' OR 1=1 -- bypasses authentication",
      "fix_suggestion": "cursor.execute('SELECT * FROM users WHERE id=?', (user_id,))"
    }
  ]
}
```

### GET /api/repo?url=...

Fetch source code from a GitHub URL.

**Single file:**
```
GET /api/repo?url=https://github.com/user/repo/blob/main/app.py
```

**Entire repo** (fetches up to 5 source files, 5KB each):
```
GET /api/repo?url=https://github.com/user/repo
```

**Response:**
```json
{
  "code": "# === FILE: app.py ===\nimport os...",
  "language": "python"
}
```

### GET /api/threatmap

Returns 25 geo-located threat intelligence data points.

**Response:**
```json
[
  {
    "id": "CVE-2024-3094",
    "lat": 55.7558,
    "lng": 37.6173,
    "severity": "critical",
    "country": "Russia",
    "description": "XZ Utils backdoor...",
    "cve_id": "CVE-2024-3094"
  }
]
```

## RocketRide Pipeline

The vulnerability scan is orchestrated through a RocketRide pipeline (`pipelines/vulnerability_scan.pipe`), a visual AI workflow built in the RocketRide VS Code extension.

### Pipeline Nodes

```
WebHook (source) -> Prompt (OWASP instructions) -> Gemini 2.5 Flash (LLM) -> Return Answers (output)
```

| Node | Type | Role |
|------|------|------|
| **WebHook** | Source | Receives code + language via HTTP POST |
| **Prompt** | Text | Injects OWASP Top 10 analysis instructions |
| **Gemini** | LLM | Google Gemini 2.5 Flash performs the vulnerability analysis |
| **Return Answers** | Infrastructure | Returns structured JSON response |

### Setup RocketRide

1. Install the [RocketRide VS Code extension](https://marketplace.visualstudio.com/items?itemName=RocketRide.rocketride)
2. Click the rocket icon in VS Code sidebar -> Connect -> **Local**
3. Open `pipelines/vulnerability_scan.pipe` — it renders as a visual canvas
4. Configure the Gemini node with your API key
5. Click the **play button** to start the pipeline
6. The backend will automatically route scans through RocketRide when it's running

If RocketRide isn't running, the backend falls back to direct Gemini API calls automatically.

### Security Note

`.pipe` files store API keys in plaintext JSON. They are excluded from git via `.gitignore` to prevent credential leaks. We submitted a [bug bounty PR](https://github.com/rocketride-org/rocketride-server/pull/379) to address this in the RocketRide project.

## Threat Intelligence Map

The interactive dark-themed map displays 25 geo-located threat data points sourced from real CVE data:

- **Pulsing markers** color-coded by severity (red = critical, orange = high, yellow = medium, blue = low)
- **Live feed animation** — threats appear one by one with a green pulsing "Live" indicator and CVE ID ticker
- **Stats overlay** — active threat count with severity breakdown (8C / 9H / 6M / 2L)
- **Severity legend** — color reference panel
- **Dark tiles** — CartoDB Dark Matter for cybersecurity aesthetic
- **Click popups** — shows CVE ID, country, severity, and description for each threat

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key from [AI Studio](https://aistudio.google.com/apikey) | Yes | — |
| `ROCKETRIDE_URI` | RocketRide webhook URL | No | `http://localhost:5565` |
| `ROCKETRIDE_APIKEY` | RocketRide public authorization key | No | — |
| `SANDBOX_URL` | Vercel Sandbox sidecar URL | No | `http://localhost:3001` |

## OWASP Top 10 Coverage

Sentinel Code scans for all OWASP Top 10 2021 categories:

| Category | Examples |
|----------|----------|
| **A01** Broken Access Control | Missing auth checks, IDOR, privilege escalation |
| **A02** Cryptographic Failures | Hardcoded secrets, weak encryption, plaintext passwords |
| **A03** Injection | SQL injection, command injection, XSS |
| **A04** Insecure Design | Debug mode in production, missing rate limiting |
| **A05** Security Misconfiguration | Exposed debug endpoints, overly permissive CORS |
| **A06** Vulnerable Components | Outdated dependencies with known CVEs |
| **A07** Authentication Failures | Weak passwords, missing MFA, session issues |
| **A08** Data Integrity Failures | Insecure deserialization, unsigned updates |
| **A09** Logging Failures | Missing audit logs, sensitive data in logs |
| **A10** SSRF | Unvalidated URL redirects, internal network access |

## Security Contributions

During development, we discovered that RocketRide stores API keys in plaintext inside `.pipe` files. We submitted a bug bounty PR to the RocketRide project:

- **PR**: [rocketride-org/rocketride-server#379](https://github.com/rocketride-org/rocketride-server/pull/379)
- **Bug**: `.pipe` files embed API keys in plaintext JSON, leading to credential leaks when committed to public repos
- **Fix**: Added `*.pipe` to `.gitignore` with recommendations for environment variable references

## License

MIT
