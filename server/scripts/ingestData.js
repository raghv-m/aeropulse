import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Track configuration
const TRACKS = [
  { id: 'barber', name: 'Barber Motorsports Park', length_km: 3.7, num_sections: 3 },
  { id: 'indianapolis', name: 'Indianapolis Motor Speedway', length_km: 4.0, num_sections: 3 },
];

async function parseCSV(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

async function ingestTrack(trackConfig) {
  console.log(`\n📊 Ingesting ${trackConfig.name}...`);
  
  // 1. Insert track
  const { data: track, error: trackError } = await supabase
    .from('tracks')
    .upsert(trackConfig)
    .select()
    .single();
  
  if (trackError) {
    console.error(`❌ Error inserting track:`, trackError);
    return;
  }
  
  console.log(`✅ Track inserted: ${track.name}`);
  
  // 2. Parse section data
  const dataPath = path.join(__dirname, '../../data', trackConfig.id);
  const sectionFile = await fs.readdir(dataPath).then(files => 
    files.find(f => f.includes('AnalysisEnduranceWithSections') && f.includes('Race 1'))
  );
  
  if (!sectionFile) {
    console.log(`⚠️  No section data found for ${trackConfig.name}`);
    return;
  }
  
  const sectionData = await parseCSV(path.join(dataPath, sectionFile));
  console.log(`📄 Parsed ${sectionData.length} lap records`);
  
  // 3. Insert laps and section times
  let lapCount = 0;
  for (const row of sectionData.slice(0, 100)) { // Limit to first 100 laps for demo
    if (!row.NUMBER || !row.LAP_NUMBER || !row.LAP_TIME) continue;
    
    // Convert lap time from MM:SS.mmm to seconds
    const lapTimeSeconds = parseLapTime(row.LAP_TIME);
    if (!lapTimeSeconds) continue;
    
    // Insert lap
    const { data: lap, error: lapError } = await supabase
      .from('laps')
      .insert({
        track_id: trackConfig.id,
        driver_number: row.NUMBER.toString(),
        lap_number: row.LAP_NUMBER,
        total_time: lapTimeSeconds,
        session_type: 'race'
      })
      .select()
      .single();
    
    if (lapError) {
      console.error(`❌ Error inserting lap:`, lapError);
      continue;
    }
    
    // Insert section times
    const sections = [];
    if (row.S1_SECONDS) sections.push({ section_name: 'S1', time_seconds: row.S1_SECONDS });
    if (row.S2_SECONDS) sections.push({ section_name: 'S2', time_seconds: row.S2_SECONDS });
    if (row.S3_SECONDS) sections.push({ section_name: 'S3', time_seconds: row.S3_SECONDS });
    
    for (const section of sections) {
      await supabase.from('section_times').insert({
        lap_id: lap.id,
        ...section
      });
    }
    
    lapCount++;
    if (lapCount % 10 === 0) {
      console.log(`  ⏱️  Processed ${lapCount} laps...`);
    }
  }
  
  console.log(`✅ Ingested ${lapCount} laps for ${trackConfig.name}`);
}

function parseLapTime(timeStr) {
  if (!timeStr) return null;
  
  // Handle MM:SS.mmm format
  const parts = timeStr.toString().split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  
  // Handle SS.mmm format
  return parseFloat(timeStr);
}

async function main() {
  console.log('🏁 RaceLine AI - Data Ingestion');
  console.log('================================\n');
  
  for (const track of TRACKS) {
    await ingestTrack(track);
  }
  
  console.log('\n✅ Data ingestion complete!');
}

main().catch(console.error);

