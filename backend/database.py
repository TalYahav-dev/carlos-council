from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import aiosqlite

import config

_db_path: str = config.DB_PATH


async def _get_db() -> aiosqlite.Connection:
    Path(_db_path).parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(_db_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    db = await _get_db()
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                brief TEXT NOT NULL,
                transcript JSON DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'running',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                lesson TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS organization_profiles (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                profile JSON NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS profile_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                source_name TEXT NOT NULL,
                payload JSON NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS session_context_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                profile_snapshot JSON NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.commit()
    finally:
        await db.close()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_session(session_id: str, brief: str) -> dict:
    db = await _get_db()
    try:
        now = _now()
        await db.execute(
            "INSERT INTO sessions (id, brief, transcript, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, brief, "{}", "running", now, now),
        )
        await db.commit()
        return {"id": session_id, "brief": brief, "status": "running", "created_at": now, "updated_at": now}
    finally:
        await db.close()


async def update_session(session_id: str, *, transcript: dict | None = None, status: str | None = None) -> None:
    db = await _get_db()
    try:
        parts = []
        params: list = []
        if transcript is not None:
            parts.append("transcript = ?")
            params.append(json.dumps(transcript))
        if status is not None:
            parts.append("status = ?")
            params.append(status)
        parts.append("updated_at = ?")
        params.append(_now())
        params.append(session_id)
        await db.execute(f"UPDATE sessions SET {', '.join(parts)} WHERE id = ?", params)
        await db.commit()
    finally:
        await db.close()


async def get_session(session_id: str) -> dict | None:
    db = await _get_db()
    try:
        cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "brief": row["brief"],
            "transcript": json.loads(row["transcript"]),
            "status": row["status"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    finally:
        await db.close()


async def list_sessions() -> list[dict]:
    db = await _get_db()
    try:
        cursor = await db.execute("SELECT id, brief, status, created_at FROM sessions ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [{"id": r["id"], "brief": r["brief"], "status": r["status"], "created_at": r["created_at"]} for r in rows]
    finally:
        await db.close()


async def save_lessons(session_id: str, lessons: list[dict]) -> None:
    db = await _get_db()
    try:
        now = _now()
        for lesson in lessons:
            await db.execute(
                "INSERT INTO lessons (session_id, lesson, category, created_at) VALUES (?, ?, ?, ?)",
                (session_id, lesson["lesson"], lesson.get("category", "general"), now),
            )
        await db.commit()
    finally:
        await db.close()


async def get_lessons(limit: int = 50) -> list[dict]:
    db = await _get_db()
    try:
        cursor = await db.execute(
            "SELECT session_id, lesson, category, created_at FROM lessons ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [
            {"session_id": r["session_id"], "lesson": r["lesson"], "category": r["category"], "created_at": r["created_at"]}
            for r in rows
        ]
    finally:
        await db.close()


async def get_profile() -> dict:
    db = await _get_db()
    try:
        cursor = await db.execute(
            "SELECT profile, updated_at FROM organization_profiles WHERE id = 1"
        )
        row = await cursor.fetchone()
        if row is None:
            return {"profile": {}, "updated_at": None}
        return {
            "profile": json.loads(row["profile"]),
            "updated_at": row["updated_at"],
        }
    finally:
        await db.close()


async def upsert_profile(profile: dict) -> dict:
    db = await _get_db()
    try:
        now = _now()
        await db.execute(
            """
            INSERT INTO organization_profiles (id, profile, created_at, updated_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              profile = excluded.profile,
              updated_at = excluded.updated_at
            """,
            (json.dumps(profile), now, now),
        )
        await db.commit()
        return {"profile": profile, "updated_at": now}
    finally:
        await db.close()


async def list_profile_sources() -> list[dict]:
    db = await _get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, source_type, source_name, payload, created_at, updated_at
            FROM profile_sources
            ORDER BY updated_at DESC, id DESC
            """
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "source_type": row["source_type"],
                "source_name": row["source_name"],
                "payload": json.loads(row["payload"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
    finally:
        await db.close()


async def create_profile_source(source_type: str, source_name: str, payload: object) -> dict:
    db = await _get_db()
    try:
        now = _now()
        cursor = await db.execute(
            """
            INSERT INTO profile_sources (source_type, source_name, payload, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (source_type, source_name, json.dumps(payload), now, now),
        )
        await db.commit()
        return {
            "id": cursor.lastrowid,
            "source_type": source_type,
            "source_name": source_name,
            "payload": payload,
            "created_at": now,
            "updated_at": now,
        }
    finally:
        await db.close()


async def save_session_context_snapshot(session_id: str, profile_snapshot: dict) -> None:
    db = await _get_db()
    try:
        await db.execute(
            """
            INSERT INTO session_context_snapshots (session_id, profile_snapshot, created_at)
            VALUES (?, ?, ?)
            """,
            (session_id, json.dumps(profile_snapshot), _now()),
        )
        await db.commit()
    finally:
        await db.close()
