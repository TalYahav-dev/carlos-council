"""HTTP-level checks that don't require a live LLM.

Covers health, profile round-trip, request validation, and 404s. The full
council flow is covered deterministically in test_orchestrator_run.py.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    import main

    with TestClient(main.app) as test_client:
        yield test_client


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_profile_returns_normalized_default(client):
    response = client.get("/api/profile")
    assert response.status_code == 200
    body = response.json()
    assert "profile" in body
    assert body["profile"]["notes"] == []
    assert body["profile"]["company"] == {}


def test_put_profile_round_trips(client):
    response = client.put("/api/profile", json={"company": {"name": "Acme"}})
    assert response.status_code == 200
    body = response.json()
    assert body["profile"]["company"] == {"name": "Acme"}

    # Read back persists.
    again = client.get("/api/profile")
    assert again.json()["profile"]["company"] == {"name": "Acme"}


def test_start_council_rejects_empty_brief(client):
    response = client.post("/api/council/start", json={"brief": "   "})
    assert response.status_code == 422


def test_unknown_session_status_returns_404(client):
    response = client.get("/api/council/does-not-exist/status")
    assert response.status_code == 404


def test_unknown_session_stream_returns_404(client):
    response = client.get("/api/council/does-not-exist/stream")
    assert response.status_code == 404
