import numpy as np
import polars as pl
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


def create_feature_matrix(df: pl.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Engineer features from telemetry data:
    - sector_*_delta (vs best lap)
    - speed_drop_rate
    - gap_to_previous_normalized
    - air_temp_delta, wind_speed_delta
    - lap_in_stint (tire wear proxy)
    
    Target: grip_loss_percent = 100 * (lap_time - best_lap) / best_lap
    
    Args:
        df: Polars DataFrame with telemetry data
    
    Returns:
        Tuple of (X: feature matrix, y: target values, feature_names: list of feature names)
    """
    logger.info(f"Creating feature matrix from {len(df)} samples")
    
    # Parse sector times if they're in string format
    df = parse_sector_times(df)
    
    # Calculate best lap for each driver if not present
    if "BEST_LAP" not in df.columns:
        df = df.with_columns(
            pl.col("lap_time_seconds").min().over("NUMBER").alias("BEST_LAP")
        )
    
    # Calculate sector deltas (vs personal best)
    df = calculate_sector_deltas(df)
    
    # Calculate speed features
    df = calculate_speed_features(df)
    
    # Calculate weather deltas
    df = calculate_weather_deltas(df)
    
    # Calculate tire wear proxy
    df = calculate_tire_wear(df)
    
    # Calculate gap features
    df = calculate_gap_features(df)
    
    # Define feature columns
    feature_cols = [
        "s1_delta", "s2_delta", "s3_delta",
        "speed_drop", "gap_normalized",
        "temp_delta", "wind_delta",
        "lap_in_stint", "total_sector_time"
    ]
    
    # Filter to only rows with all features present
    df = df.filter(
        pl.all_horizontal([pl.col(col).is_not_null() for col in feature_cols if col in df.columns])
    )
    
    # Extract features that exist
    available_features = [col for col in feature_cols if col in df.columns]
    
    if not available_features:
        raise ValueError("No features available after processing")
    
    X = df.select(available_features).to_numpy()
    
    # Calculate target: grip loss percentage
    y = calculate_grip_loss_target(df)
    
    logger.info(f"Feature matrix created: {X.shape[0]} samples, {X.shape[1]} features")
    
    return X, y, available_features


def parse_sector_times(df: pl.DataFrame) -> pl.DataFrame:
    """Parse sector times from string format to float"""
    sector_cols = ["SECTOR_1", "SECTOR_2", "SECTOR_3"]
    
    for col in sector_cols:
        if col in df.columns:
            # Try to convert to float, handling various formats
            df = df.with_columns(
                pl.col(col).cast(pl.Float64, strict=False).alias(col.lower())
            )
    
    return df


def calculate_sector_deltas(df: pl.DataFrame) -> pl.DataFrame:
    """Calculate sector time deltas vs best lap"""
    # Calculate best sector times for each driver
    for i in range(1, 4):
        sector_col = f"sector_{i}"
        if sector_col in df.columns:
            best_col = f"best_sector_{i}"
            delta_col = f"s{i}_delta"
            
            # Get best sector time for each driver
            df = df.with_columns(
                pl.col(sector_col).min().over("NUMBER").alias(best_col)
            )
            
            # Calculate delta
            df = df.with_columns(
                (pl.col(sector_col) - pl.col(best_col)).alias(delta_col)
            )
    
    # Calculate total sector time
    if all(f"sector_{i}" in df.columns for i in range(1, 4)):
        df = df.with_columns(
            (pl.col("sector_1") + pl.col("sector_2") + pl.col("sector_3")).alias("total_sector_time")
        )
    
    return df


def calculate_speed_features(df: pl.DataFrame) -> pl.DataFrame:
    """Calculate speed-related features"""
    if "TOP_SPEED" in df.columns:
        # Calculate expected speed (track average)
        df = df.with_columns(
            pl.col("TOP_SPEED").mean().over("track_id").alias("expected_speed")
        )
        
        # Calculate speed drop
        df = df.with_columns(
            ((pl.col("expected_speed") - pl.col("TOP_SPEED")) / pl.col("expected_speed")).alias("speed_drop")
        )
    
    return df


def calculate_weather_deltas(df: pl.DataFrame) -> pl.DataFrame:
    """Calculate weather condition deltas"""
    if "air_temp" in df.columns:
        df = df.with_columns(
            (pl.col("air_temp") - pl.col("air_temp").mean()).alias("temp_delta")
        )
    else:
        df = df.with_columns(pl.lit(0.0).alias("temp_delta"))
    
    if "wind_speed" in df.columns:
        df = df.with_columns(
            (pl.col("wind_speed") - pl.col("wind_speed").mean()).alias("wind_delta")
        )
    else:
        df = df.with_columns(pl.lit(0.0).alias("wind_delta"))
    
    return df


def calculate_tire_wear(df: pl.DataFrame) -> pl.DataFrame:
    """Calculate tire wear proxy (laps in stint)"""
    # Assume pit stops every ~15 laps (simplified)
    df = df.with_columns(
        (pl.col("LAP_NUMBER") % 15).alias("lap_in_stint")
    )
    
    return df


def calculate_gap_features(df: pl.DataFrame) -> pl.DataFrame:
    """Calculate gap-related features"""
    if "GAP" in df.columns:
        df = df.with_columns(
            pl.col("GAP").cast(pl.Float64, strict=False).alias("gap_normalized")
        )
    else:
        # Use position-based gap estimation
        df = df.with_columns(pl.lit(2.0).alias("gap_normalized"))
    
    return df


def calculate_grip_loss_target(df: pl.DataFrame) -> np.ndarray:
    """
    Calculate grip loss percentage as target variable
    grip_loss = 100 * (lap_time - best_lap) / best_lap
    """
    if "lap_time_seconds" in df.columns and "BEST_LAP" in df.columns:
        y = (100 * (df["lap_time_seconds"] - df["BEST_LAP"]) / df["BEST_LAP"]).to_numpy()
    else:
        # Fallback: use sector time variance
        y = np.zeros(len(df))
    
    # Clip to reasonable range [0, 20]
    y = np.clip(y, 0, 20)
    
    return y

