import uuid
import asyncio
from fastapi import APIRouter, HTTPException
from backend.models.scan import ScanRequest, ScanResponse
from backend.services.gemini_scanner import scan_with_rocketride

router = APIRouter(prefix="/api")

# In-memory scan storage
scans: dict[str, ScanResponse] = {}


@router.post("/scan")
async def create_scan(request: ScanRequest):
    if not request.code and not request.repo_url:
        raise HTTPException(status_code=400, detail="Provide code or repo_url")

    scan_id = str(uuid.uuid4())[:8]
    scans[scan_id] = ScanResponse(
        scan_id=scan_id,
        status="scanning",
        progress=0.1,
    )

    # Run scan in background
    asyncio.create_task(_run_scan(scan_id, request))

    return {"scan_id": scan_id, "status": "processing"}


async def _run_scan(scan_id: str, request: ScanRequest):
    scan = scans[scan_id]

    try:
        # Phase 1: Gemini scan
        scan.status = "scanning"
        scan.progress = 0.3

        code = request.code or ""
        vulns = await scan_with_rocketride(code, request.language)

        scan.vulnerabilities = vulns
        scan.progress = 0.6

        # Phase 2: Sandbox testing (simplified for now)
        scan.status = "testing"
        scan.progress = 0.7
        await asyncio.sleep(1)  # Simulate sandbox testing

        # Phase 3: Fix verification
        scan.status = "fixing"
        scan.progress = 0.9
        await asyncio.sleep(0.5)  # Simulate fix verification

        # Complete
        scan.status = "complete"
        scan.progress = 1.0

    except Exception as e:
        scan.status = "error"
        scan.error = str(e)


@router.get("/scan/{scan_id}")
async def get_scan(scan_id: str):
    if scan_id not in scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scans[scan_id]
