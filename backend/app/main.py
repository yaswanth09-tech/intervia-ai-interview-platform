from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import client as mongo_client
from app.routes import auth, resume, interview

app = FastAPI(title="Intervia")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)


@app.on_event("startup")
async def check_mongo_connection():
    """Fail fast with a clear message if Atlas is unreachable (e.g. IP not
    on the Network Access allowlist yet) instead of letting every request
    time out for 30s with a wall of pymongo traceback."""
    import httpx

    try:
        await mongo_client.admin.command("ping", serverSelectionTimeoutMS=5000)
        print("[startup] MongoDB Atlas: connected OK.")
    except Exception as e:
        current_ip = "unknown"
        try:
            async with httpx.AsyncClient(timeout=3.0) as http:
                resp = await http.get("https://api.ipify.org")
                current_ip = resp.text.strip()
        except Exception:
            pass
        print(
            "\n"
            "==================== MONGODB CONNECTION FAILED ====================\n"
            f"Could not reach MongoDB Atlas: {e}\n\n"
            f"Your current public IP appears to be: {current_ip}\n"
            "This usually means that IP is not on the Atlas allowlist yet\n"
            "(common on mobile hotspots, which rotate IPs).\n\n"
            "Fix: go to Atlas -> Network Access -> Add IP Address, and add\n"
            f"the IP above ({current_ip}).\n"
            "=====================================================================\n"
        )


@app.get("/health")
async def health_check():
    return {"status": "ok"}