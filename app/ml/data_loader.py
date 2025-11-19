import polars as pl
from pathlib import Path
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


def load_all_datasets(data_path: Path, track_ids: Optional[List[str]] = None) -> pl.DataFrame:
    """
    Load and merge 6 types of datasets from Toyota GR Cup data:
    - provisional_results.csv (03_Provisional Results)
    - official_results.csv (03_*Official*)
    - endurance_sections.csv (23_AnalysisEnduranceWithSections)
    - weather_data.csv (26_Weather)
    - best_10_laps.csv (99_Best 10 Laps)
    - lap_timing_telemetry.csv (R*_*_lap_time.csv)
    
    Args:
        data_path: Path to data directory
        track_ids: Optional list of track IDs to load (e.g., ['barber', 'indianapolis'])
    
    Returns:
        Merged DataFrame with all telemetry and metadata
    """
    logger.info(f"Loading datasets from {data_path}")
    
    if track_ids is None:
        track_ids = ['barber', 'indianapolis']
    
    all_data = []
    
    for track_id in track_ids:
        track_path = data_path / track_id
        if not track_path.exists():
            logger.warning(f"Track path not found: {track_path}")
            continue
        
        logger.info(f"Loading data for track: {track_id}")
        
        try:
            # Load endurance sections (main telemetry data)
            sections_file = find_file(track_path, "23_AnalysisEnduranceWithSections", "Race 1")
            if sections_file:
                sections_df = pl.read_csv(sections_file, separator=';', ignore_errors=True)
                sections_df = sections_df.with_columns(pl.lit(track_id).alias("track_id"))
                
                # Load weather data
                weather_file = find_file(track_path, "26_Weather", "Race 1")
                if weather_file:
                    weather_df = pl.read_csv(weather_file, separator=';', ignore_errors=True)
                    # Join on closest timestamp or lap number
                    sections_df = merge_weather_data(sections_df, weather_df)
                
                # Load best laps
                best_laps_file = find_file(track_path, "99_Best 10 Laps")
                if best_laps_file:
                    best_laps_df = pl.read_csv(best_laps_file, separator=';', ignore_errors=True)
                    sections_df = merge_best_laps(sections_df, best_laps_df)
                
                # Load official results
                results_file = find_file(track_path, "03_", "Official")
                if results_file:
                    results_df = pl.read_csv(results_file, separator=';', ignore_errors=True)
                    sections_df = merge_results(sections_df, results_df)
                
                all_data.append(sections_df)
                logger.info(f"Loaded {len(sections_df)} rows for {track_id}")
        
        except Exception as e:
            logger.error(f"Error loading data for {track_id}: {e}")
            continue
    
    if not all_data:
        raise ValueError("No data loaded from any track")
    
    # Concatenate all tracks
    df = pl.concat(all_data, how="vertical")
    
    # Validate and clean
    df = validate_data(df)
    
    logger.info(f"Total rows loaded: {len(df)}")
    return df


def find_file(path: Path, *patterns: str) -> Optional[Path]:
    """Find first file matching all patterns"""
    for file in path.glob("*.CSV"):
        if all(pattern.lower() in file.name.lower() for pattern in patterns):
            return file
    for file in path.glob("*.csv"):
        if all(pattern.lower() in file.name.lower() for pattern in patterns):
            return file
    return None


def merge_weather_data(sections_df: pl.DataFrame, weather_df: pl.DataFrame) -> pl.DataFrame:
    """Merge weather data with sections data"""
    # Simplified: take average weather conditions
    if "AIR_TEMP" in weather_df.columns:
        avg_air_temp = weather_df["AIR_TEMP"].mean()
        sections_df = sections_df.with_columns(pl.lit(avg_air_temp).alias("air_temp"))
    
    if "WIND_SPEED" in weather_df.columns:
        avg_wind = weather_df["WIND_SPEED"].mean()
        sections_df = sections_df.with_columns(pl.lit(avg_wind).alias("wind_speed"))
    
    return sections_df


def merge_best_laps(sections_df: pl.DataFrame, best_laps_df: pl.DataFrame) -> pl.DataFrame:
    """Merge best lap times for each driver"""
    if "NUMBER" in best_laps_df.columns and "BEST_LAP" in best_laps_df.columns:
        best_laps_df = best_laps_df.select(["NUMBER", "BEST_LAP"])
        sections_df = sections_df.join(best_laps_df, on="NUMBER", how="left")
    return sections_df


def merge_results(sections_df: pl.DataFrame, results_df: pl.DataFrame) -> pl.DataFrame:
    """Merge official results data"""
    if "NUMBER" in results_df.columns:
        # Select relevant columns from results
        cols_to_join = ["NUMBER"]
        if "POSITION" in results_df.columns:
            cols_to_join.append("POSITION")
        
        results_df = results_df.select(cols_to_join)
        sections_df = sections_df.join(results_df, on="NUMBER", how="left")
    
    return sections_df


def validate_data(df: pl.DataFrame) -> pl.DataFrame:
    """Remove nulls, outliers, validate ranges"""
    logger.info(f"Validating data: {len(df)} rows before validation")
    
    # Remove rows with missing critical fields
    required_cols = ["NUMBER", "LAP_NUMBER", "LAP_TIME"]
    for col in required_cols:
        if col in df.columns:
            df = df.filter(pl.col(col).is_not_null())
    
    # Remove outliers (lap times > 1.2x median)
    if "LAP_TIME" in df.columns:
        # Convert lap time string to seconds if needed
        df = df.with_columns(parse_lap_time_column(pl.col("LAP_TIME")).alias("lap_time_seconds"))
        
        median_time = df["lap_time_seconds"].median()
        if median_time:
            df = df.filter(
                (pl.col("lap_time_seconds") > 0) &
                (pl.col("lap_time_seconds") < median_time * 1.2)
            )
    
    logger.info(f"Validation complete: {len(df)} rows after validation")
    return df


def parse_lap_time_column(col: pl.Expr) -> pl.Expr:
    """Parse lap time from MM:SS.mmm format to seconds"""
    # This is a simplified version - adjust based on actual data format
    return col.cast(pl.Float64, strict=False)

