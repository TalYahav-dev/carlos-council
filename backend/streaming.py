from __future__ import annotations

import json


def format_sse_event(event_type: str, data: dict) -> dict:
    """Format an event for SSE transmission via sse-starlette."""
    return {"event": event_type, "data": json.dumps(data)}
