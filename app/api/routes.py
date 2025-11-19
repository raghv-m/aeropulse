from fastapi import APIRouter, HTTPException
from datetime import datetime
import time
import logging

from app.models import (
    TelemetryInput, 
    GripResponse, 
    GripPrediction, 
    SHAPExplanation,
    HealthResponse,
    TrainingRequest,
    TrainingResponse
)
from app.ml.grip_model import GripLossModel
from app.ml.explainer import GripExplainer
from app.ml.data_loader import load_all_datasets
from app.ml.feature_engineer import create_feature_matrix
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Global model instance (will be initialized on startup)
model: GripLossModel = None
explainer: GripExplainer = None


def initialize_model():
    """Initialize or load the model"""
    global model, explainer
    
    try:
        model = GripLossModel()
        model.load()
        explainer = GripExplainer(model.model)
        logger.info("Model loaded successfully")
    except FileNotFoundError:
        logger.warning("No trained model found. Train the model using /api/v1/train endpoint")
        model = GripLossModel()
        explainer = None


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "online",
        "service": "AeroPulse AI Backend",
        "version": settings.API_VERSION
    }


@router.get("/api/v1/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model and model.is_trained else "no_model",
        model_loaded=model.is_trained if model else False,
        timestamp=datetime.now(),
        version=settings.API_VERSION
    )


@router.post("/api/v1/predict", response_model=GripResponse)
async def predict_grip(telemetry: TelemetryInput):
    """
    Core prediction endpoint
    
    Predicts grip loss percentage and provides SHAP explanations
    """
    if not model or not model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Model not trained. Please train the model first using /api/v1/train"
        )
    
    start_time = time.time()
    
    try:
        # Predict grip loss
        grip_loss, confidence = model.predict(telemetry)
        
        # Classify threat type
        threat = model.classify_threat(telemetry, grip_loss)
        
        # Generate recommendation
        recommendation = model.generate_recommendation(threat, grip_loss, telemetry)
        
        # Get affected sector
        sector_affected = model.get_affected_sector(telemetry)
        
        # Calculate expected time gain
        expected_time_gain = grip_loss * 0.1
        
        # Generate SHAP explanations
        shap_values = []
        if explainer:
            features = model._telemetry_to_features(telemetry)
            shap_explanations = explainer.explain_prediction(features, model.feature_names)
            
            shap_values = [
                SHAPExplanation(**exp) for exp in shap_explanations
            ]
        
        processing_time = (time.time() - start_time) * 1000
        
        return GripResponse(
            prediction=GripPrediction(
                grip_loss_percent=grip_loss,
                confidence=confidence,
                threat_type=threat,
                recommendation=recommendation,
                sector_affected=sector_affected,
                expected_time_gain=expected_time_gain
            ),
            shap_values=shap_values,
            timestamp=datetime.now(),
            processing_time_ms=processing_time
        )
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    Train the grip loss prediction model
    
    This endpoint loads data, engineers features, and trains the XGBoost model
    """
    global model, explainer
    
    start_time = time.time()
    
    try:
        logger.info("Starting model training...")
        
        # Load data
        df = load_all_datasets(settings.DATA_PATH, request.track_ids)
        
        # Engineer features
        X, y, feature_names = create_feature_matrix(df)
        
        # Train model
        model = GripLossModel()
        metrics = model.train(X, y, feature_names)
        
        # Initialize explainer
        explainer = GripExplainer(model.model)
        
        training_time = time.time() - start_time
        
        logger.info(f"Training complete in {training_time:.2f}s")
        
        return TrainingResponse(
            status="success",
            samples_trained=metrics["samples_train"] + metrics["samples_test"],
            test_score=metrics["r2"],
            training_time_seconds=training_time,
            model_path=str(settings.MODEL_PATH)
        )
    
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v1/model/info")
async def model_info():
    """Get information about the current model"""
    if not model or not model.is_trained:
        raise HTTPException(status_code=404, detail="No trained model available")
    
    return {
        "feature_names": model.feature_names,
        "num_features": len(model.feature_names),
        "model_type": "XGBoost Regressor",
        "model_path": str(model.model_path)
    }

