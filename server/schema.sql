-- RaceLine AI Database Schema

-- Tracks table
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  length_km DECIMAL,
  num_sections INT,
  map_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laps table
CREATE TABLE laps (
  id SERIAL PRIMARY KEY,
  track_id TEXT REFERENCES tracks(id),
  driver_number TEXT,
  lap_number INT,
  total_time DECIMAL,
  session_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry table (detailed point-by-point data)
CREATE TABLE telemetry (
  id SERIAL PRIMARY KEY,
  lap_id INT REFERENCES laps(id) ON DELETE CASCADE,
  distance_m DECIMAL,
  speed_mph DECIMAL,
  throttle_percent DECIMAL,
  brake_pressure DECIMAL,
  gear INT,
  timestamp TIMESTAMPTZ
);

-- Section times table
CREATE TABLE section_times (
  id SERIAL PRIMARY KEY,
  lap_id INT REFERENCES laps(id) ON DELETE CASCADE,
  section_name TEXT,
  time_seconds DECIMAL
);

-- Indexes for performance
CREATE INDEX idx_laps_track_id ON laps(track_id);
CREATE INDEX idx_telemetry_lap_id ON telemetry(lap_id);
CREATE INDEX idx_telemetry_distance ON telemetry(distance_m);
CREATE INDEX idx_section_times_lap_id ON section_times(lap_id);

-- Enable Row Level Security (RLS) for public read access
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_times ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON tracks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON laps FOR SELECT USING (true);
CREATE POLICY "Public read access" ON telemetry FOR SELECT USING (true);
CREATE POLICY "Public read access" ON section_times FOR SELECT USING (true);

