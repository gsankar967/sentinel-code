import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ROCKETRIDE_API_URL = os.getenv("ROCKETRIDE_API_URL", "http://localhost:8080")
SANDBOX_URL = os.getenv("SANDBOX_URL", "http://localhost:3001")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
