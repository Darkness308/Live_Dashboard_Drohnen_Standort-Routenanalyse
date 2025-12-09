"""
MORPHEUS Backend API - WebSocket Module
=======================================

WebSocket-Endpoint für Live-Drohnenpositionen und Echtzeit-Updates.

Endpoints:
- /ws/drone-position - Bidirektionale Kommunikation für Drone Tracking

Features:
- Connection Management mit Auto-Cleanup
- Broadcast an alle verbundenen Clients
- JSON Message Parsing
- Typed Message Handlers

Usage:
    # In main.py einbinden:
    from .websocket import router as ws_router
    app.include_router(ws_router)
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


# =============================================================================
# Pydantic Models für WebSocket Messages
# =============================================================================


class DronePositionMessage(BaseModel):
    """Drohnenpositions-Nachricht."""

    type: str = "drone-position"
    droneId: str
    lat: float
    lng: float
    alt: Optional[float] = None
    heading: Optional[float] = None
    speed: Optional[float] = None
    timestamp: Optional[str] = None


class RouteUpdateMessage(BaseModel):
    """Routen-Update-Nachricht."""

    type: str = "route-update"
    routeId: str
    data: Dict[str, Any]


class NoiseUpdateMessage(BaseModel):
    """Lärmzonen-Update-Nachricht."""

    type: str = "noise-update"
    routeId: Optional[str] = None
    data: List[Dict[str, Any]]


# =============================================================================
# Connection Manager
# =============================================================================


class ConnectionManager:
    """
    Verwaltet WebSocket-Verbindungen und ermöglicht Broadcasting.

    Thread-Safe Implementation mit asyncio.Lock.

    Attributes:
        active_connections: Set aller aktiven WebSocket-Verbindungen
        message_queue: Queue für asynchrone Nachrichtenverteilung
        subscriptions: Dict von droneId -> Set[WebSocket] für gezielte Updates
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._broadcaster_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket) -> None:
        """
        Akzeptiert und registriert eine neue WebSocket-Verbindung.

        Args:
            websocket: Die zu registrierende WebSocket-Verbindung
        """
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Entfernt eine WebSocket-Verbindung und bereinigt Subscriptions.

        Args:
            websocket: Die zu entfernende WebSocket-Verbindung
        """
        async with self._lock:
            self.active_connections.discard(websocket)
            # Aus allen Subscriptions entfernen
            for drone_id in list(self.subscriptions.keys()):
                self.subscriptions[drone_id].discard(websocket)
                if not self.subscriptions[drone_id]:
                    del self.subscriptions[drone_id]
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def subscribe(self, websocket: WebSocket, drone_id: str) -> None:
        """
        Abonniert Updates für eine bestimmte Drohne.

        Args:
            websocket: Die subscribende Verbindung
            drone_id: ID der Drohne
        """
        async with self._lock:
            if drone_id not in self.subscriptions:
                self.subscriptions[drone_id] = set()
            self.subscriptions[drone_id].add(websocket)
        logger.debug(f"WebSocket subscribed to drone: {drone_id}")

    async def unsubscribe(self, websocket: WebSocket, drone_id: str) -> None:
        """
        Beendet Subscription für eine Drohne.

        Args:
            websocket: Die Verbindung
            drone_id: ID der Drohne
        """
        async with self._lock:
            if drone_id in self.subscriptions:
                self.subscriptions[drone_id].discard(websocket)

    async def broadcast(self, message: str) -> None:
        """
        Sendet Nachricht an alle verbundenen Clients.

        Fehlerhafte Verbindungen werden automatisch entfernt.

        Args:
            message: JSON-String der Nachricht
        """
        disconnected: List[WebSocket] = []

        async with self._lock:
            connections = list(self.active_connections)

        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.append(connection)

        # Fehlerhafte Verbindungen entfernen
        for ws in disconnected:
            await self.disconnect(ws)

    async def send_to_subscribers(self, drone_id: str, message: str) -> None:
        """
        Sendet Nachricht nur an Subscriber einer bestimmten Drohne.

        Args:
            drone_id: ID der Drohne
            message: JSON-String der Nachricht
        """
        async with self._lock:
            subscribers = list(self.subscriptions.get(drone_id, set()))

        disconnected: List[WebSocket] = []

        for ws in subscribers:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            await self.disconnect(ws)

    async def queue_message(self, message: str) -> None:
        """
        Fügt Nachricht zur Broadcast-Queue hinzu.

        Args:
            message: JSON-String der Nachricht
        """
        await self.message_queue.put(message)

    async def start_broadcaster(self) -> None:
        """Startet den Background-Broadcaster-Task."""
        if self._broadcaster_task is None or self._broadcaster_task.done():
            self._broadcaster_task = asyncio.create_task(self._run_broadcaster())
            logger.info("WebSocket broadcaster started")

    async def _run_broadcaster(self) -> None:
        """Background-Task für Queue-basiertes Broadcasting."""
        while True:
            try:
                message = await self.message_queue.get()
                await self.broadcast(message)
                self.message_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Broadcaster error: {e}")

    async def stop_broadcaster(self) -> None:
        """Stoppt den Broadcaster-Task."""
        if self._broadcaster_task and not self._broadcaster_task.done():
            self._broadcaster_task.cancel()
            try:
                await self._broadcaster_task
            except asyncio.CancelledError:
                pass
            logger.info("WebSocket broadcaster stopped")


# Singleton Instance
manager = ConnectionManager()


# =============================================================================
# Message Handlers
# =============================================================================


async def handle_subscribe(websocket: WebSocket, data: Dict[str, Any]) -> None:
    """Verarbeitet Subscribe-Anfragen."""
    drone_id = data.get("droneId")
    if drone_id:
        await manager.subscribe(websocket, drone_id)
        await websocket.send_text(
            json.dumps({"type": "subscribed", "droneId": drone_id})
        )


async def handle_unsubscribe(websocket: WebSocket, data: Dict[str, Any]) -> None:
    """Verarbeitet Unsubscribe-Anfragen."""
    drone_id = data.get("droneId")
    if drone_id:
        await manager.unsubscribe(websocket, drone_id)
        await websocket.send_text(
            json.dumps({"type": "unsubscribed", "droneId": drone_id})
        )


async def handle_drone_position(websocket: WebSocket, data: Dict[str, Any]) -> None:
    """
    Verarbeitet eingehende Drohnenpositionen und broadcastet sie.

    Fügt Timestamp hinzu falls nicht vorhanden.
    """
    # Timestamp hinzufügen
    if "timestamp" not in data:
        data["timestamp"] = datetime.utcnow().isoformat() + "Z"

    message = json.dumps({"type": "drone-position", "data": data})

    # An alle Clients broadcasten
    await manager.queue_message(message)

    # Zusätzlich gezielt an Subscriber
    drone_id = data.get("droneId")
    if drone_id:
        await manager.send_to_subscribers(drone_id, message)


# Message Handler Registry
MESSAGE_HANDLERS: Dict[str, Callable] = {
    "subscribe": handle_subscribe,
    "unsubscribe": handle_unsubscribe,
    "drone-position": handle_drone_position,
    "position": handle_drone_position,  # Alias
}


# =============================================================================
# WebSocket Endpoint
# =============================================================================


@router.websocket("/ws/drone-position")
async def websocket_drone_position(websocket: WebSocket):
    """
    WebSocket-Endpoint für Live-Drohnenpositionen.

    Empfängt Nachrichten von Clients (z.B. Drohnen-Gateway) und
    broadcastet sie an alle verbundenen Dashboard-Clients.

    Message Formats:

    Subscribe:
        {"type": "subscribe", "droneId": "drone-001"}

    Position Update:
        {
            "type": "drone-position",
            "droneId": "drone-001",
            "lat": 52.52,
            "lng": 13.405,
            "alt": 100,
            "heading": 45,
            "speed": 12.5
        }

    Unsubscribe:
        {"type": "unsubscribe", "droneId": "drone-001"}
    """
    await manager.connect(websocket)

    try:
        # Broadcaster starten falls nicht bereits aktiv
        await manager.start_broadcaster()

        while True:
            # Auf Nachrichten warten
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received: {raw_data[:100]}")
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "Invalid JSON"})
                )
                continue

            # Message Type ermitteln
            msg_type = data.get("type", "")

            # Handler aufrufen
            handler = MESSAGE_HANDLERS.get(msg_type)
            if handler:
                await handler(websocket, data)
            else:
                # Unbekannte Nachrichten werden gebroadcastet
                await manager.queue_message(raw_data)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket)


# =============================================================================
# HTTP Endpoint für Status
# =============================================================================


@router.get("/ws/status", tags=["WebSocket"])
async def websocket_status():
    """
    Status-Endpoint für WebSocket-Verbindungen.

    Returns:
        - active_connections: Anzahl aktiver Verbindungen
        - subscriptions: Anzahl aktiver Subscriptions pro Drohne
    """
    return {
        "active_connections": len(manager.active_connections),
        "subscriptions": {
            drone_id: len(subs) for drone_id, subs in manager.subscriptions.items()
        },
        "queue_size": manager.message_queue.qsize(),
    }


# =============================================================================
# Config Endpoint (für Frontend)
# =============================================================================


@router.get("/api/config", tags=["Config"])
async def get_config():
    """
    Frontend-Konfiguration (Google Maps API Key, etc.).

    HINWEIS: In Produktion sollten API-Keys nicht direkt exponiert werden.
    Stattdessen sollte ein Backend-Proxy verwendet werden.
    """
    return {
        "apiKey": os.getenv("GOOGLE_MAPS_API_KEY", ""),
        "mapId": os.getenv("GOOGLE_MAPS_MAP_ID", ""),
        "wsEndpoint": "/ws/drone-position",
        "version": "1.0.0",
    }
