from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import scan, threatmap

app = FastAPI(
    title="Sentinel Code API",
    description="AI-powered vulnerability scanner",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(threatmap.router)


@app.get("/")
async def root():
    return {"name": "Sentinel Code API", "status": "running"}
