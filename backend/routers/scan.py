import uuid
import asyncio
import re
import httpx
from fastapi import APIRouter, HTTPException, Query
from backend.models.scan import ScanRequest, ScanResponse
from backend.services.gemini_scanner import scan_with_rocketride

router = APIRouter(prefix="/api")

LANG_MAP = {
    ".py": "python", ".js": "javascript", ".ts": "typescript",
    ".java": "java", ".go": "go", ".rb": "ruby", ".rs": "rust",
    ".c": "c", ".cpp": "cpp", ".cs": "csharp", ".php": "php",
}

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


SCAN_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".rs", ".c", ".cpp", ".cs", ".php"}


@router.get("/repo")
async def fetch_repo(url: str = Query(..., description="GitHub file or repo URL")):
    """Fetch code from a GitHub URL (single file or repo)."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        # Case 1: Direct file URL (blob or raw)
        blob_match = re.match(r"https://github\.com/([^/]+)/([^/]+)/blob/(.+)", url)
        if blob_match:
            owner, repo, path = blob_match.groups()
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{path}"
            resp = await client.get(raw_url)
            resp.raise_for_status()
            ext_match = re.search(r"(\.\w+)$", path)
            lang = LANG_MAP.get(ext_match.group(1), "auto") if ext_match else "auto"
            return {"code": resp.text, "language": lang}

        # Case 2: Repo URL — clone via gh CLI and read source files
        repo_match = re.match(r"https://github\.com/([^/]+)/([^/]+)/?$", url)
        if repo_match:
            owner, repo = repo_match.groups()
            import tempfile, os, subprocess
            with tempfile.TemporaryDirectory() as tmpdir:
                result = subprocess.run(
                    ["git", "clone", "--depth", "1", url, tmpdir + "/repo"],
                    capture_output=True, text=True, timeout=30,
                )
                if result.returncode != 0:
                    raise HTTPException(status_code=400, detail=f"Could not clone repo: {result.stderr[:200]}")

                repo_dir = tmpdir + "/repo"
                code_parts = []
                total_size = 0
                for root, dirs, files in os.walk(repo_dir):
                    # Skip hidden dirs and common non-source dirs
                    dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", "__pycache__", "venv", ".venv", "dist", "build"}]
                    for f in files:
                        ext_match = re.search(r"(\.\w+)$", f)
                        if not ext_match or ext_match.group(1) not in SCAN_EXTENSIONS:
                            continue
                        filepath = os.path.join(root, f)
                        relpath = os.path.relpath(filepath, repo_dir)
                        try:
                            content = open(filepath).read()
                        except Exception:
                            continue
                        code_parts.append(f"# === FILE: {relpath} ===\n{content}")
                        total_size += len(content)
                        if len(code_parts) >= 10 or total_size > 50000:
                            break
                    if len(code_parts) >= 10 or total_size > 50000:
                        break

            if not code_parts:
                raise HTTPException(status_code=400, detail="No source files found in repo")
            return {"code": "\n\n".join(code_parts), "language": "auto"}

        # Case 3: Raw URL or other
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            ext_match = re.search(r"(\.\w+)$", url.split("?")[0])
            lang = LANG_MAP.get(ext_match.group(1), "auto") if ext_match else "auto"
            return {"code": resp.text, "language": lang}
        except Exception:
            raise HTTPException(status_code=400, detail="Could not fetch code from URL")


@router.get("/scan/{scan_id}")
async def get_scan(scan_id: str):
    if scan_id not in scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scans[scan_id]
