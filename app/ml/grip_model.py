import xgboost as xgb
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from pathlib import Path
from typing import Tuple, List, Optional
import logging

from app.models import TelemetryInput
from app.config import settings

logger = logging.getLogger(__name__)


class GripLossModel:
    """XGBoost model for predicting grip loss percentage"""
    
    def __init__(self, model_path: Optional[Path] = None):
        self.model: Optional[xgb.XGBRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.model_path = model_path or settings.MODEL_PATH
        self.is_trained = False
        
    def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]) -> dict:
        """
        Train XGBoost model with 80/20 split
        
        Args:
            X: Feature matrix
            y: Target values (grip loss percentage)
            feature_names: List of feature names
        
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training model with {X.shape[0]} samples, {X.shape[1]} features")
        
        self.feature_names = feature_names
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=settings.TEST_SIZE,
            random_state=settings.RANDOM_STATE
        )
        
        # Normalize features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost
        self.model = xgb.XGBRegressor(
            n_estimators=settings.XGBOOST_N_ESTIMATORS,
            max_depth=settings.XGBOOST_MAX_DEPTH,
            learning_rate=settings.XGBOOST_LEARNING_RATE,
            subsample=settings.XGBOOST_SUBSAMPLE,
            objective='reg:squarederror',
            random_state=settings.RANDOM_STATE,
            n_jobs=-1
        )
        
        self.model.fit(
            X_train_scaled, y_train,
            eval_set=[(X_test_scaled, y_test)],
            verbose=False
        )
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.is_trained = True
        
        logger.info(f"Training complete - MSE: {mse:.4f}, R²: {r2:.4f}")
        
        # Save model
        self.save()
        
        return {
            "mse": float(mse),
            "r2": float(r2),
            "samples_train": len(X_train),
            "samples_test": len(X_test)
        }
    
    def predict(self, telemetry: TelemetryInput) -> Tuple[float, float]:
        """
        Predict grip loss for given telemetry
        
        Args:
            telemetry: Input telemetry data
        
        Returns:
            Tuple of (grip_loss_percent, confidence)
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() or load() first.")
        
        features = self._telemetry_to_features(telemetry)
        features_scaled = self.scaler.transform([features])
        prediction = self.model.predict(features_scaled)[0]
        
        # Calculate confidence (simplified - based on prediction variance)
        confidence = min(0.95, max(0.70, 1.0 - (abs(prediction) / 20.0)))
        
        return float(prediction), float(confidence)
    
    def _telemetry_to_features(self, telemetry: TelemetryInput) -> np.ndarray:
        """Convert telemetry input to feature vector"""
        # This is a simplified version - adjust based on actual feature engineering
        features = [
            telemetry.sector_1_time - 28.0,  # s1_delta (assuming 28s baseline)
            telemetry.sector_2_time - 32.0,  # s2_delta
            telemetry.sector_3_time - 30.0,  # s3_delta
            (180.0 - telemetry.top_speed) / 180.0,  # speed_drop
            telemetry.gap_to_previous,  # gap_normalized
            telemetry.air_temperature - 25.0,  # temp_delta
            telemetry.wind_speed - 10.0,  # wind_delta
            telemetry.lap_number % 15,  # lap_in_stint
            telemetry.sector_1_time + telemetry.sector_2_time + telemetry.sector_3_time  # total_sector_time
        ]
        
        return np.array(features[:len(self.feature_names)])
    
    def classify_threat(self, telemetry: TelemetryInput, grip_loss: float) -> str:
        """
        Classify the type of threat causing grip loss
        
        Returns: "dirty_air", "tire_fade", "weather_shift", or "none"
        """
        # Dirty air: close gap + low speed
        if (telemetry.gap_to_previous < settings.DIRTY_AIR_GAP_THRESHOLD and 
            telemetry.top_speed < settings.DIRTY_AIR_SPEED_THRESHOLD):
            return "dirty_air"
        
        # Tire fade: uneven sector times
        sector_diff = abs(telemetry.sector_1_time - telemetry.sector_3_time)
        if sector_diff > settings.TIRE_FADE_SECTOR_DIFF_THRESHOLD:
            return "tire_fade"
        
        # Weather shift: high grip loss
        if grip_loss > settings.WEATHER_SHIFT_GRIP_THRESHOLD:
            return "weather_shift"
        
        return "none"
    
    def generate_recommendation(self, threat: str, grip_loss: float, telemetry: TelemetryInput) -> str:
        """Generate voice-ready coaching recommendation"""
        if threat == "dirty_air":
            gap_target = 1.8
            time_gain = grip_loss * 0.1
            return f"Trail {gap_target} seconds — regain {time_gain:.1f} seconds"
        
        elif threat == "tire_fade":
            return "Brake bias plus 2 percent — cool fronts"
        
        elif threat == "weather_shift":
            throttle_reduction = 7
            return f"Wind gust — ease throttle {throttle_reduction} percent"
        
        else:
            return "Maintain current pace"
    
    def get_affected_sector(self, telemetry: TelemetryInput) -> int:
        """Determine which sector is most affected"""
        sectors = [
            telemetry.sector_1_time,
            telemetry.sector_2_time,
            telemetry.sector_3_time
        ]
        # Return sector with highest time (1-indexed)
        return int(np.argmax(sectors) + 1)
    
    def save(self):
        """Save model and scaler to disk"""
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        model_file = self.model_path / "model.pkl"
        scaler_file = self.model_path / "scaler.pkl"
        features_file = self.model_path / "features.pkl"
        
        joblib.dump(self.model, model_file)
        joblib.dump(self.scaler, scaler_file)
        joblib.dump(self.feature_names, features_file)
        
        logger.info(f"Model saved to {self.model_path}")
    
    def load(self):
        """Load model and scaler from disk"""
        model_file = self.model_path / "model.pkl"
        scaler_file = self.model_path / "scaler.pkl"
        features_file = self.model_path / "features.pkl"
        
        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {model_file}")
        
        self.model = joblib.load(model_file)
        self.scaler = joblib.load(scaler_file)
        self.feature_names = joblib.load(features_file)
        self.is_trained = True
        
        logger.info(f"Model loaded from {self.model_path}")

