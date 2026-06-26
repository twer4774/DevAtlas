import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])

_connections: list[WebSocket] = []


async def broadcast(event: str, data: Any) -> None:
    message = json.dumps({"event": event, "data": data})
    dead = []
    for ws in _connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _connections.remove(ws)


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _connections.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        _connections.remove(ws)
