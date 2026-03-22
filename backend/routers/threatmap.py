import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api")

DATA_PATH = Path(__file__).parent.parent / "data" / "sample_threats.json"


@router.get("/threatmap")
async def get_threat_data():
    with open(DATA_PATH) as f:
        threats = json.load(f)
    return threats
