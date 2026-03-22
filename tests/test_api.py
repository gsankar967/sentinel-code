import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.scan import Vulnerability

client = TestClient(app)


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Sentinel Code API"
    assert data["status"] == "running"


def test_threatmap_returns_data():
    resp = client.get("/api/threatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check first threat has required fields
    threat = data[0]
    assert "id" in threat
    assert "lat" in threat
    assert "lng" in threat
    assert "severity" in threat
    assert "country" in threat


def test_threatmap_severity_values():
    resp = client.get("/api/threatmap")
    data = resp.json()
    valid_severities = {"critical", "high", "medium", "low"}
    for threat in data:
        assert threat["severity"] in valid_severities


def test_scan_requires_code_or_url():
    resp = client.post("/api/scan", json={"language": "python"})
    assert resp.status_code == 400


@patch("backend.routers.scan.scan_with_rocketride", new_callable=AsyncMock)
def test_scan_creates_and_returns_id(mock_scan):
    mock_scan.return_value = [
        Vulnerability(
            name="SQL Injection",
            owasp_category="A03:2021 - Injection",
            severity="critical",
            description="SQL injection vulnerability",
        )
    ]
    resp = client.post(
        "/api/scan",
        json={"code": "SELECT * FROM users WHERE id=" + "' + input", "language": "python"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "scan_id" in data
    assert data["status"] == "processing"


def test_scan_not_found():
    resp = client.get("/api/scan/nonexistent")
    assert resp.status_code == 404
