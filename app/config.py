from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # API Configuration
    API_TITLE: str = "AeroPulse AI Backend"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "FastAPI backend for grip prediction with XGBoost and SHAP explainability"
    
    # Paths
    DATA_PATH: Path = Path("./data")
    MODEL_PATH: Path = Path("./models/saved")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app"
    ]
    
    # ML Hyperparameters
    XGBOOST_N_ESTIMATORS: int = 200
    XGBOOST_MAX_DEPTH: int = 6
    XGBOOST_LEARNING_RATE: float = 0.05
    XGBOOST_SUBSAMPLE: float = 0.8
    XGBOOST_EARLY_STOPPING_ROUNDS: int = 10
    
    # Training Configuration
    TEST_SIZE: float = 0.2
    RANDOM_STATE: int = 42
    
    # Data Processing
    MAX_GRIP_LOSS_PERCENT: float = 20.0
    MIN_GRIP_LOSS_PERCENT: float = 0.0
    
    # Performance Thresholds
    DIRTY_AIR_GAP_THRESHOLD: float = 1.5  # seconds
    DIRTY_AIR_SPEED_THRESHOLD: float = 175.0  # mph
    TIRE_FADE_SECTOR_DIFF_THRESHOLD: float = 0.3  # seconds
    WEATHER_SHIFT_GRIP_THRESHOLD: float = 3.0  # percent
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

