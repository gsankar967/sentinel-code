# Sentinel Code

AI-powered vulnerability scanner with threat intelligence mapping. Built for the AI hackathon.

## What It Does

1. **Paste code** (or link a repo) into the web UI
2. **Gemini AI scans** for OWASP Top 10 vulnerabilities via RocketRide pipeline
3. **Vercel Sandbox** runs exploit code in isolation to prove vulnerabilities are real
4. **AI suggests fixes** and verifies they resolve the issue
5. **Generates a security audit report** with severity ratings and remediation steps
6. **Threat Intelligence Map** visualizes global vulnerability origins on an interactive dark-themed map

## Tech Stack

- **Frontend**: Next.js + React + Tailwind CSS + React-Leaflet
- **Backend**: Python FastAPI
- **AI**: Google Gemini 2.0 Flash (via RocketRide pipeline)
- **Pipeline**: RocketRide IDE Extension (.pipe file)
- **Sandbox**: Vercel Sandbox (@vercel/sandbox)
- **Map**: CartoDB Dark Matter tiles + pulsing threat markers

## Quick Start

```bash
# Install Python dependencies
uv sync

# Set up environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Run backend
uv run uvicorn backend.main:app --reload --port 8000

# Run frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
sentinel_code/
├── pipelines/               # RocketRide .pipe files
├── backend/                 # FastAPI Python backend
│   ├── routers/             # API endpoints
│   ├── services/            # Gemini scanner, sandbox client
│   ├── models/              # Pydantic data models
│   └── data/                # Seed threat data
├── sandbox/                 # Node.js Vercel Sandbox sidecar
└── frontend/                # Next.js web UI
    └── src/
        ├── app/             # Pages
        └── components/      # React components
```

## RocketRide Pipeline

The core vulnerability scan runs through a RocketRide pipeline (`pipelines/vulnerability_scan.pipe`):

```
Input (code + language) → Gemini LLM (OWASP analysis) → Output (structured vulnerabilities)
```

Open the `.pipe` file in VS Code with the RocketRide extension to visualize and run the pipeline.
