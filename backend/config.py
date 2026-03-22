import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ROCKETRIDE_URI = os.getenv("ROCKETRIDE_URI", "http://localhost:5565")
ROCKETRIDE_APIKEY = os.getenv("ROCKETRIDE_APIKEY", "")
SANDBOX_URL = os.getenv("SANDBOX_URL", "http://localhost:3001")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
