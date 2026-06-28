from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

import config
from database import (
    create_profile_source,
    create_session,
    get_session,
    get_profile,
    init_db,
    list_sessions,
    list_profile_sources,
    save_session_context_snapshot,
    upsert_profile,
)
from dossier import normalize_business_profile
from models import BriefRequest, ClarificationAnswer
from models import BusinessProfile, BusinessProfileResponse, ProfileSourceCreate
from orchestrator import Orchestrator
from session import CouncilSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.validate()
    await init_db()
    logger.info("Database initialized; using model %s", config.MODEL_NAME)
    yield


app = FastAPI(title="Carlos Council", version="0.1.0", lifespan=lifespan)

# CORS — restricted to configured origins. In the default deployment the
# browser never calls the backend directly (the Next.js frontend proxies
# server-side), so this is a defence-in-depth measure. Credentials are not
# used (no cookies/auth), so we do not enable allow_credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

# In-memory store of active sessions
active_sessions: dict[str, CouncilSession] = {}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/council/start")
async def start_council(req: BriefRequest):
    session_id = str(uuid4())
    await create_session(session_id, req.brief)
    profile_record = await get_profile()
    profile_snapshot = normalize_business_profile(profile_record["profile"])
    await save_session_context_snapshot(session_id, profile_snapshot)

    session = CouncilSession(session_id, req.brief, profile_snapshot=profile_snapshot)
    orchestrator = Orchestrator(session)
    session.orchestrator = orchestrator
    active_sessions[session_id] = session

    asyncio.create_task(orchestrator.run())
    logger.info("Started council session %s", session_id)

    return {"session_id": session_id}


@app.get("/api/council/{session_id}/stream")
async def stream_council(session_id: str):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    orchestrator = session.orchestrator
    if orchestrator is None:
        raise HTTPException(status_code=404, detail="Orchestrator not found")

    async def event_generator():
        # Replay any events that already happened before the client connected
        for evt in list(session.event_history):
            yield evt

        # Then consume live events from the queue
        while True:
            event = await orchestrator.event_queue.get()
            if event is None:
                break
            yield event

    return EventSourceResponse(event_generator())


@app.post("/api/council/{session_id}/clarify")
async def clarify(session_id: str, answer: ClarificationAnswer):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.clarification_answers = answer.answers
    session.clarification_event.set()
    return {"status": "ok"}


@app.get("/api/council/{session_id}/status")
async def get_status(session_id: str):
    session = active_sessions.get(session_id)
    if session:
        return {
            "session_id": session_id,
            "status": session.status,
            "phase": session.phase,
        }

    # Fall back to database
    db_session = await get_session(session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "status": db_session["status"],
        "phase": None,
    }


@app.get("/api/council/{session_id}/snapshot")
async def get_snapshot(session_id: str):
    session = active_sessions.get(session_id)
    if session:
        return {
            "session_id": session_id,
            "status": session.status,
            "phase": session.phase,
            "transcript": session.transcript,
            "clarification_questions": session.clarification_questions,
            "clarification_answers": session.clarification_answers,
        }

    db_session = await get_session(session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "status": db_session["status"],
        "phase": None,
        "transcript": db_session["transcript"],
        "clarification_questions": [],
        "clarification_answers": {},
    }


@app.get("/api/sessions")
async def list_all_sessions():
    return await list_sessions()


@app.get("/api/sessions/{session_id}")
async def get_session_detail(session_id: str):
    db_session = await get_session(session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@app.get("/api/profile", response_model=BusinessProfileResponse)
async def get_business_profile():
    record = await get_profile()
    return {
        "profile": normalize_business_profile(record["profile"]),
        "updated_at": record["updated_at"],
    }


@app.put("/api/profile", response_model=BusinessProfileResponse)
async def update_business_profile(profile: BusinessProfile):
    normalized = normalize_business_profile(profile.model_dump())
    record = await upsert_profile(normalized)
    return {
        "profile": normalized,
        "updated_at": record["updated_at"],
    }


@app.get("/api/profile/sources")
async def get_business_profile_sources():
    return await list_profile_sources()


@app.post("/api/profile/sources")
async def add_business_profile_source(source: ProfileSourceCreate):
    return await create_profile_source(
        source_type=source.source_type,
        source_name=source.source_name,
        payload=source.payload,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
