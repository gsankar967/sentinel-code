"""Integration tests — test the full scan pipeline with real API calls."""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.config import GEMINI_API_KEY

from fastapi.testclient import TestClient

client = TestClient(app)
SKIP_REASON = "GEMINI_API_KEY not set"


@pytest.mark.asyncio
@pytest.mark.skipif(not GEMINI_API_KEY, reason=SKIP_REASON)
async def test_full_scan_pipeline_python():
    """End-to-end: submit vulnerable Python code, poll until complete, verify vulns found."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/scan", json={
            "code": "import sqlite3\nfrom flask import Flask, request\napp = Flask(__name__)\n@app.route('/login', methods=['POST'])\ndef login():\n    username = request.form['username']\n    password = request.form['password']\n    query = f\"SELECT * FROM users WHERE username='{username}' AND password='{password}'\"\n    sqlite3.connect('db').execute(query)\n    return f'<h1>Welcome {username}!</h1>'",
            "language": "python",
        })
        assert resp.status_code == 200
        scan_id = resp.json()["scan_id"]

        for _ in range(60):
            await asyncio.sleep(1)
            result = (await ac.get(f"/api/scan/{scan_id}")).json()
            if result["status"] in ("complete", "error"):
                break

        assert result["status"] == "complete", f"Scan failed: {result.get('error')}"
        assert len(result["vulnerabilities"]) > 0
        vuln_names = [v["name"].lower() for v in result["vulnerabilities"]]
        assert any("sql" in name or "injection" in name for name in vuln_names), \
            f"Expected SQL injection, got: {vuln_names}"


@pytest.mark.asyncio
@pytest.mark.skipif(not GEMINI_API_KEY, reason=SKIP_REASON)
async def test_full_scan_pipeline_javascript():
    """End-to-end: submit vulnerable JS code, verify vulns found."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/scan", json={
            "code": "const express = require('express');\nconst app = express();\napp.get('/search', (req, res) => {\n  res.send('<h1>Results: ' + req.query.q + '</h1>');\n});\napp.post('/exec', (req, res) => {\n  require('child_process').exec(req.body.cmd, (err, out) => res.send(out));\n});",
            "language": "javascript",
        })
        assert resp.status_code == 200
        scan_id = resp.json()["scan_id"]

        for _ in range(60):
            await asyncio.sleep(1)
            result = (await ac.get(f"/api/scan/{scan_id}")).json()
            if result["status"] in ("complete", "error"):
                break

        assert result["status"] == "complete"
        assert len(result["vulnerabilities"]) > 0


@pytest.mark.asyncio
@pytest.mark.skipif(not GEMINI_API_KEY, reason=SKIP_REASON)
async def test_full_scan_pipeline_go():
    """End-to-end: submit vulnerable Go code, verify vulns found."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/scan", json={
            "code": "package main\nimport (\"database/sql\"; \"fmt\"; \"net/http\"; \"os/exec\")\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    cmd := r.URL.Query().Get(\"cmd\")\n    out, _ := exec.Command(\"sh\", \"-c\", cmd).Output()\n    w.Write(out)\n    username := r.FormValue(\"user\")\n    query := fmt.Sprintf(\"SELECT * FROM users WHERE name='%s'\", username)\n    db.Query(query)\n}",
            "language": "go",
        })
        assert resp.status_code == 200
        scan_id = resp.json()["scan_id"]

        for _ in range(60):
            await asyncio.sleep(1)
            result = (await ac.get(f"/api/scan/{scan_id}")).json()
            if result["status"] in ("complete", "error"):
                break

        assert result["status"] == "complete"
        assert len(result["vulnerabilities"]) > 0


def test_repo_fetch_single_file():
    """Test fetching a single file from GitHub."""
    resp = client.get("/api/repo", params={
        "url": "https://github.com/gsankar967/sentinel-code/blob/main/backend/config.py"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert data["language"] == "python"
    assert len(data["code"]) > 0


def test_repo_fetch_whole_repo():
    """Test fetching source files from a whole repo."""
    resp = client.get("/api/repo", params={
        "url": "https://github.com/gsankar967/sentinel-code"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert "# === FILE:" in data["code"]


def test_threatmap_data_structure():
    """Verify threat map data has correct geo coordinates."""
    resp = client.get("/api/threatmap")
    data = resp.json()
    for threat in data:
        assert -90 <= threat["lat"] <= 90, f"Invalid lat: {threat['lat']}"
        assert -180 <= threat["lng"] <= 180, f"Invalid lng: {threat['lng']}"
        assert threat["severity"] in {"critical", "high", "medium", "low"}
