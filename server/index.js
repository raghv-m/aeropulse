import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store (replace with Supabase for production)
let tracks = [];
let laps = [];
let sectionTimes = [];

// Helper function to generate lap name
function generateLapName(row, lapTimeSeconds) {
  const lapNum = row.LAP_NUMBER;
  const driverNum = row.NUMBER;

  // Determine lap type based on conditions
  if (row.FLAG_AT_FL === 'FCY' || row.FLAG_AT_FL === 'SC') {
    return `Lap ${lapNum} - Caution`;
  }

  // Check if it's a fast lap (under 1:40 for most tracks)
  if (lapTimeSeconds < 100) {
    return `Lap ${lapNum} - Fast Lap`;
  }

  // Check if it's the first lap
  if (lapNum === 1) {
    return `Lap ${lapNum} - Formation Lap`;
  }

  // Check for pit lap (lap time > 2 minutes usually indicates pit)
  if (lapTimeSeconds > 120) {
    return `Lap ${lapNum} - Pit Lap`;
  }

  // Default racing lap
  return `Lap ${lapNum} - Racing`;
}

// Helper function to generate lap description
function generateLapDescription(row, trackName) {
  const parts = [];

  // Add driver info
  parts.push(`Car #${row.NUMBER}`);

  // Add class
  if (row.CLASS) {
    parts.push(`${row.CLASS} Class`);
  }

  // Add flag status
  const flagStatus = row.FLAG_AT_FL || 'GF';
  const flagDescriptions = {
    'GF': 'Green Flag',
    'FCY': 'Full Course Yellow',
    'SC': 'Safety Car',
    'FF': 'Checkered Flag',
    'YF': 'Yellow Flag'
  };
  parts.push(flagDescriptions[flagStatus] || flagStatus);

  // Add speed info if available
  if (row.TOP_SPEED) {
    parts.push(`Top Speed: ${row.TOP_SPEED} km/h`);
  }

  // Add track name
  const trackNames = {
    'barber': 'Barber Motorsports Park',
    'indianapolis': 'Indianapolis Motor Speedway',
    'COTA': 'Circuit of the Americas',
    'Sonoma': 'Sonoma Raceway',
    'road-america': 'Road America',
    'sebring': 'Sebring International Raceway',
    'virginia-international-raceway': 'VIR'
  };
  parts.push(`at ${trackNames[trackName] || trackName}`);

  return parts.join(' • ');
}

// Load data on startup
async function loadData() {
  console.log('📊 Loading race data...');

  const dataPath = path.join(__dirname, '../data');
  const trackDirs = [
    'barber',
    'indianapolis',
    'COTA',
    'Sonoma',
    'road-america',
    'sebring',
    'virginia-international-raceway'
  ];

  for (const trackDir of trackDirs) {
    const trackPath = path.join(dataPath, trackDir);
    let files = await fs.readdir(trackPath);

    // Check if track has subdirectories
    let sectionFilePath = trackPath;
    const hasRaceSubdirs = files.some(f => f.startsWith('Race'));
    const hasTrackNameSubdir = files.some(f =>
      f === 'Road America' || f === 'Sebring' || f === 'VIR'
    );

    if (hasTrackNameSubdir) {
      // Tracks like road-america/Road America/Race 1
      const subdir = files.find(f =>
        f === 'Road America' || f === 'Sebring' || f === 'VIR'
      );
      sectionFilePath = path.join(trackPath, subdir, 'Race 1');
      files = await fs.readdir(sectionFilePath);
    } else if (hasRaceSubdirs) {
      // Tracks like COTA/Race 1 or Sonoma/Race 1
      sectionFilePath = path.join(trackPath, 'Race 1');
      files = await fs.readdir(sectionFilePath);
    }

    // Find section data file
    const sectionFile = files.find(f =>
      f.includes('AnalysisEnduranceWithSections') && f.includes('Race 1')
    );

    if (!sectionFile) {
      console.log(`  ⚠️  No section data found for ${trackDir}`);
      continue;
    }

    // Add track with proper metadata
    const trackMetadata = {
      'barber': { name: 'Barber Motorsports Park', length_km: 3.7, location: 'Alabama, USA' },
      'indianapolis': { name: 'Indianapolis Motor Speedway', length_km: 4.0, location: 'Indiana, USA' },
      'COTA': { name: 'Circuit of the Americas', length_km: 5.5, location: 'Texas, USA' },
      'Sonoma': { name: 'Sonoma Raceway', length_km: 4.1, location: 'California, USA' },
      'road-america': { name: 'Road America', length_km: 6.5, location: 'Wisconsin, USA' },
      'sebring': { name: 'Sebring International Raceway', length_km: 6.0, location: 'Florida, USA' },
      'virginia-international-raceway': { name: 'Virginia International Raceway', length_km: 5.3, location: 'Virginia, USA' }
    };

    const metadata = trackMetadata[trackDir] || {
      name: trackDir,
      length_km: 0,
      location: 'Unknown'
    };

    const track = {
      id: trackDir,
      name: metadata.name,
      length_km: metadata.length_km,
      location: metadata.location,
      num_sections: 3
    };
    tracks.push(track);

    // Parse CSV
    const csvContent = await fs.readFile(path.join(sectionFilePath, sectionFile), 'utf-8');
    const data = await new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: ';',
        transformHeader: (header) => header.trim(), // Remove spaces from headers
        complete: (results) => resolve(results.data)
      });
    });

    console.log(`  📄 Parsed ${data.length} rows from ${sectionFile}`);

    // Process first 100 laps
    let processedCount = 0;
    for (let i = 0; i < Math.min(data.length, 100); i++) {
      const row = data[i];

      // Validate required fields
      if (!row.NUMBER || !row.LAP_NUMBER || !row.LAP_TIME) {
        console.log(`  ⚠️  Row ${i + 2}: Missing required fields`);
        continue;
      }

      const lapTimeSeconds = parseLapTime(row.LAP_TIME);
      if (!lapTimeSeconds || isNaN(lapTimeSeconds)) {
        console.log(`  ⚠️  Row ${i + 2}: Invalid lap time: ${row.LAP_TIME}`);
        continue;
      }

      const lapId = laps.length + 1;

      // Generate lap name and description
      const lapName = generateLapName(row, lapTimeSeconds);
      const lapDescription = generateLapDescription(row, trackDir);

      laps.push({
        id: lapId,
        track_id: trackDir,
        driver_number: row.NUMBER.toString().trim(),
        lap_number: parseInt(row.LAP_NUMBER),
        total_time: lapTimeSeconds,
        session_type: 'race',
        lap_name: lapName,
        lap_description: lapDescription,
        top_speed: row.TOP_SPEED || null,
        flag_status: row.FLAG_AT_FL || 'GF',
        class: row.CLASS || 'Am'
      });

      // Add section times with validation
      if (row.S1_SECONDS && !isNaN(row.S1_SECONDS)) {
        sectionTimes.push({
          lap_id: lapId,
          section_name: 'S1',
          time_seconds: parseFloat(row.S1_SECONDS)
        });
      }
      if (row.S2_SECONDS && !isNaN(row.S2_SECONDS)) {
        sectionTimes.push({
          lap_id: lapId,
          section_name: 'S2',
          time_seconds: parseFloat(row.S2_SECONDS)
        });
      }
      if (row.S3_SECONDS && !isNaN(row.S3_SECONDS)) {
        sectionTimes.push({
          lap_id: lapId,
          section_name: 'S3',
          time_seconds: parseFloat(row.S3_SECONDS)
        });
      }

      processedCount++;
    }

    console.log(`  ✅ Processed ${processedCount} laps for ${track.name}`);
  }

  console.log(`\n✅ Total: ${tracks.length} tracks, ${laps.length} laps, ${sectionTimes.length} section times`);
}

function parseLapTime(timeStr) {
  if (!timeStr) return null;

  // Convert "1:54.168" to seconds (114.168)
  const str = timeStr.toString().trim();

  // Handle MM:SS.mmm format
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]);
      const seconds = parseFloat(parts[1]);

      if (isNaN(minutes) || isNaN(seconds)) {
        console.error(`Invalid lap time format: ${timeStr}`);
        return null;
      }

      return minutes * 60 + seconds;
    }
  }

  // Handle plain seconds format
  const seconds = parseFloat(str);
  return isNaN(seconds) ? null : seconds;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    tracks: tracks.length,
    laps: laps.length,
    sectionTimes: sectionTimes.length,
    timestamp: new Date().toISOString()
  });
});

// GET /api/tracks - List all available tracks
app.get('/api/tracks', (req, res) => {
  res.json(tracks);
});

// GET /api/tracks/:trackId/laps - Get all laps for a track
app.get('/api/tracks/:trackId/laps', (req, res) => {
  try {
    const { trackId } = req.params;
    const { enriched } = req.query; // Optional query param for enriched data

    // Validate track exists
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      return res.status(404).json({ error: `Track '${trackId}' not found` });
    }

    let trackLaps = laps.filter(lap => lap.track_id === trackId);

    if (trackLaps.length === 0) {
      return res.status(404).json({
        error: `No laps found for track '${trackId}'`,
        hint: 'Check if data was loaded correctly'
      });
    }

    // If enriched data requested, add best lap info and categorization
    if (enriched === 'true') {
      // Group laps by driver
      const driverLaps = {};
      trackLaps.forEach(lap => {
        if (!driverLaps[lap.driver_number]) {
          driverLaps[lap.driver_number] = [];
        }
        driverLaps[lap.driver_number].push(lap);
      });

      // Find best lap for each driver
      const driverBestLaps = {};
      Object.keys(driverLaps).forEach(driverNum => {
        const validLaps = driverLaps[driverNum].filter(l => l.total_time < 120); // Exclude pit laps
        if (validLaps.length > 0) {
          driverBestLaps[driverNum] = Math.min(...validLaps.map(l => l.total_time));
        }
      });

      // Enrich each lap with additional info
      trackLaps = trackLaps.map(lap => {
        const bestLap = driverBestLaps[lap.driver_number];
        const delta = bestLap ? lap.total_time - bestLap : 0;
        const deltaPercent = bestLap ? ((delta / bestLap) * 100) : 0;

        return {
          ...lap,
          is_best_lap: bestLap && Math.abs(lap.total_time - bestLap) < 0.01,
          delta_to_best: delta,
          delta_percent: deltaPercent,
          lap_category: categorizeLap(lap, delta, deltaPercent)
        };
      });
    }

    res.json(trackLaps);
  } catch (error) {
    console.error('Error in /api/tracks/:trackId/laps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to categorize laps
function categorizeLap(lap, delta, deltaPercent) {
  if (lap.flag_status !== 'GF') {
    return 'caution';
  }
  if (lap.total_time > 120) {
    return 'pit';
  }
  if (lap.lap_number === 1) {
    return 'formation';
  }
  if (deltaPercent < 0.5) {
    return 'optimal';
  }
  if (deltaPercent < 2) {
    return 'good';
  }
  if (deltaPercent < 5) {
    return 'average';
  }
  return 'slow';
}

// POST /api/compare-laps - Compare two laps
app.post('/api/compare-laps', (req, res) => {
  try {
    const { trackId, lapAId, lapBId } = req.body;

    // Validate input
    if (!lapAId || !lapBId) {
      return res.status(400).json({
        error: 'Missing required fields: lapAId and lapBId'
      });
    }

    const lapA = getLapWithData(parseInt(lapAId));
    const lapB = getLapWithData(parseInt(lapBId));

    if (!lapA) {
      return res.status(404).json({ error: `Lap A (ID: ${lapAId}) not found` });
    }

    if (!lapB) {
      return res.status(404).json({ error: `Lap B (ID: ${lapBId}) not found` });
    }

    // Validate sections exist
    if (!lapA.sections || lapA.sections.length === 0) {
      return res.status(400).json({
        error: `Lap A has no section data`,
        lapA
      });
    }

    if (!lapB.sections || lapB.sections.length === 0) {
      return res.status(400).json({
        error: `Lap B has no section data`,
        lapB
      });
    }

    const deltas = calculateDeltas(lapA, lapB);

    res.json({ lapA, lapB, deltas });
  } catch (error) {
    console.error('Error in /api/compare-laps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getLapWithData(lapId) {
  const lap = laps.find(l => l.id === lapId);
  if (!lap) return null;

  const sections = sectionTimes.filter(s => s.lap_id === lapId);

  return {
    ...lap,
    sections
  };
}

function calculateDeltas(lapA, lapB) {
  const sectionDeltas = {};

  lapA.sections.forEach(sectionA => {
    const sectionB = lapB.sections.find(s => s.section_name === sectionA.section_name);
    if (sectionB) {
      sectionDeltas[sectionA.section_name] = sectionA.time_seconds - sectionB.time_seconds;
    }
  });

  return {
    total: lapA.total_time - lapB.total_time,
    sections: sectionDeltas
  };
}

const PORT = process.env.PORT || 3001;

// Load data then start server
loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`🏁 RaceLine AI server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to load data:', err);
  process.exit(1);
});

