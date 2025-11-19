from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TelemetryInput(BaseModel):
    """Input telemetry data for grip prediction"""
    number: int = Field(..., description="Car number")
    lap_number: int = Field(..., description="Lap number in the session")
    sector_1_time: float = Field(..., description="Sector 1 time in seconds")
    sector_2_time: float = Field(..., description="Sector 2 time in seconds")
    sector_3_time: float = Field(..., description="Sector 3 time in seconds")
    top_speed: float = Field(..., description="Top speed in mph")
    gap_to_previous: float = Field(..., description="Gap to car ahead in seconds")
    air_temperature: float = Field(..., description="Air temperature in Celsius")
    wind_speed: float = Field(..., description="Wind speed in mph")
    track_temperature: Optional[float] = Field(None, description="Track temperature in Celsius")
    rain: bool = Field(False, description="Rain condition flag")
    
    class Config:
        json_schema_extra = {
            "example": {
                "number": 77,
                "lap_number": 15,
                "sector_1_time": 28.5,
                "sector_2_time": 32.1,
                "sector_3_time": 29.8,
                "top_speed": 182.5,
                "gap_to_previous": 2.3,
                "air_temperature": 25.0,
                "wind_speed": 8.5,
                "track_temperature": 35.0,
                "rain": False
            }
        }


class GripPrediction(BaseModel):
    """Grip loss prediction result"""
    grip_loss_percent: float = Field(..., description="Predicted grip loss percentage")
    confidence: float = Field(..., description="Prediction confidence score (0-1)")
    threat_type: str = Field(..., description="Type of threat: dirty_air, tire_fade, weather_shift, or none")
    recommendation: str = Field(..., description="Voice-ready coaching recommendation")
    sector_affected: int = Field(..., description="Most affected sector (1, 2, or 3)")
    expected_time_gain: float = Field(..., description="Expected time gain if recommendation followed (seconds)")


class SHAPExplanation(BaseModel):
    """SHAP value explanation for a single feature"""
    feature_name: str = Field(..., description="Name of the feature")
    contribution: float = Field(..., description="SHAP contribution value")
    feature_value: float = Field(..., description="Actual feature value")
    baseline: float = Field(..., description="Baseline value for comparison")


class GripResponse(BaseModel):
    """Complete response with prediction and explanations"""
    prediction: GripPrediction
    shap_values: List[SHAPExplanation]
    timestamp: datetime
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    timestamp: datetime
    version: str


class TrainingRequest(BaseModel):
    """Request to train the model"""
    track_ids: Optional[List[str]] = Field(None, description="Specific tracks to train on")
    force_retrain: bool = Field(False, description="Force retraining even if model exists")


class TrainingResponse(BaseModel):
    """Training completion response"""
    status: str
    samples_trained: int
    test_score: float
    training_time_seconds: float
    model_path: str

