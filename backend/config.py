import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root or backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv(Path(__file__).resolve().parent / ".env")

API_KEY: str = os.getenv("OPENAI_API_KEY", "")
BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o")
DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).resolve().parent / "data" / "council.db"))

# Comma-separated list of browser origins allowed to call the API directly.
# In the default setup the browser never calls the backend directly — the
# Next.js frontend proxies requests server-side — so this only matters if you
# expose the backend to browsers. Defaults to common local dev origins.
ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3006,http://127.0.0.1:3000,http://127.0.0.1:3006",
    ).split(",")
    if origin.strip()
]

# Network timeout (seconds) and retry count for LLM API calls.
LLM_TIMEOUT: float = float(os.getenv("LLM_TIMEOUT", "120"))
LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))


def validate() -> None:
    """Fail fast with a clear message if required configuration is missing."""
    if not API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Copy .env.example to .env and add your "
            "API key before starting the backend. See README.md for details."
        )
