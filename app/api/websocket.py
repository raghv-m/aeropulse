from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict, List
import json
import logging
from datetime import datetime

from app.models import TelemetryInput, GripResponse
from app.api.routes import model, explainer

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time telemetry"""
    
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, car_number: int):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        if car_number not in self.active_connections:
            self.active_connections[car_number] = []
        
        self.active_connections[car_number].append(websocket)
        logger.info(f"WebSocket connected for car #{car_number}")
    
    def disconnect(self, websocket: WebSocket, car_number: int):
        """Remove a WebSocket connection"""
        if car_number in self.active_connections:
            if websocket in self.active_connections[car_number]:
                self.active_connections[car_number].remove(websocket)
            
            # Clean up empty lists
            if not self.active_connections[car_number]:
                del self.active_connections[car_number]
        
        logger.info(f"WebSocket disconnected for car #{car_number}")
    
    async def broadcast_to_car(self, car_number: int, message: dict):
        """Broadcast a message to all connections for a specific car"""
        if car_number in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[car_number]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to car #{car_number}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected clients
            for connection in disconnected:
                self.disconnect(connection, car_number)
    
    async def broadcast_all(self, message: dict):
        """Broadcast a message to all active connections"""
        for car_number in list(self.active_connections.keys()):
            await self.broadcast_to_car(car_number, message)


manager = ConnectionManager()


@router.websocket("/ws/telemetry/{car_number}")
async def websocket_telemetry(websocket: WebSocket, car_number: int):
    """
    WebSocket endpoint for real-time telemetry streaming
    
    Clients send telemetry data and receive grip predictions in real-time
    """
    await manager.connect(websocket, car_number)
    
    try:
        while True:
            # Receive telemetry data from client
            data = await websocket.receive_json()
            
            try:
                # Parse telemetry input
                telemetry = TelemetryInput(**data)
                
                # Check if model is available
                if not model or not model.is_trained:
                    await websocket.send_json({
                        "error": "Model not trained",
                        "timestamp": datetime.now().isoformat()
                    })
                    continue
                
                # Predict grip loss
                grip_loss, confidence = model.predict(telemetry)
                threat = model.classify_threat(telemetry, grip_loss)
                recommendation = model.generate_recommendation(threat, grip_loss, telemetry)
                sector_affected = model.get_affected_sector(telemetry)
                
                # Generate SHAP explanations
                shap_values = []
                if explainer:
                    features = model._telemetry_to_features(telemetry)
                    shap_explanations = explainer.explain_prediction(features, model.feature_names)
                    shap_values = shap_explanations
                
                # Send prediction back to client
                response = {
                    "prediction": {
                        "grip_loss_percent": grip_loss,
                        "confidence": confidence,
                        "threat_type": threat,
                        "recommendation": recommendation,
                        "sector_affected": sector_affected,
                        "expected_time_gain": grip_loss * 0.1
                    },
                    "shap_values": shap_values,
                    "timestamp": datetime.now().isoformat(),
                    "car_number": car_number
                }
                
                await websocket.send_json(response)
            
            except ValueError as e:
                # Invalid telemetry data
                await websocket.send_json({
                    "error": f"Invalid telemetry data: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                })
            
            except Exception as e:
                # Prediction error
                logger.error(f"Prediction error for car #{car_number}: {e}")
                await websocket.send_json({
                    "error": f"Prediction failed: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, car_number)
        logger.info(f"Client disconnected: car #{car_number}")
    
    except Exception as e:
        logger.error(f"WebSocket error for car #{car_number}: {e}")
        manager.disconnect(websocket, car_number)


@router.websocket("/ws/broadcast")
async def websocket_broadcast(websocket: WebSocket):
    """
    WebSocket endpoint for broadcasting to all connected clients
    
    Useful for race-wide updates or announcements
    """
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Broadcast to all connected cars
            await manager.broadcast_all(data)
    
    except WebSocketDisconnect:
        logger.info("Broadcast client disconnected")
    
    except Exception as e:
        logger.error(f"Broadcast WebSocket error: {e}")

