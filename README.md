# AeroPulse AI - Intelligent Racing Analytics Platform

Turn raw telemetry into racing mastery. AeroPulse AI combines traditional lap analysis with ML-powered grip prediction to help drivers optimize performance.

## 🏁 Data Coverage - COMPLETE SEASON!

**ALL 7 Tracks** from Toyota GR Cup 2025:
- 🏎️ Barber Motorsports Park (Alabama)
- 🏎️ Indianapolis Motor Speedway (Indiana)
- 🏎️ Circuit of the Americas (Texas)
- 🏎️ Sonoma Raceway (California)
- 🏎️ Road America (Wisconsin)
- 🏎️ Sebring International Raceway (Florida)
- 🏎️ Virginia International Raceway (Virginia)

**14 Races** • **700+ Laps** • **2000+ Sector Times**

## ✨ What It Does

### Traditional Analysis
- **Multi-Track Selection**: Choose from 3 professional racing circuits
- **Lap Comparison**: Compare any two laps side-by-side with detailed section breakdowns
- **Performance Heatmap**: Visual color-coded sections showing where time is gained/lost
- **Enriched Lap Data**: Intelligent lap naming and categorization (optimal/good/average/slow)
- **Best Lap Analysis**: Delta to best lap with percentage calculations

### AI-Powered Features
- **Grip Loss Prediction**: XGBoost ML model predicts grip loss percentage
- **SHAP Explainability**: Understand why the AI made its prediction
- **Threat Classification**: Identifies dirty air, tire fade, or weather impacts
- **Voice-Ready Coaching**: Actionable recommendations for drivers
- **Real-Time Streaming**: WebSocket support for live telemetry

## 🛠️ Tech Stack

**Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router
**Backend (Analysis)**: Node.js, Express - Port 3001
**Backend (AI)**: Python, FastAPI, XGBoost, SHAP, Polars - Port 8000
**Data**: Toyota GR Cup official race telemetry (ALL 7 tracks, 14 races)

## Project Structure

```
raceline-ai/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── pages/      # TrackSelection, LapAnalysis
│   │   ├── components/ # LapSelector, SectionDeltaTable, PerformanceHeatmap
│   │   └── App.jsx
│   └── package.json
├── server/              # Node.js backend (Express)
│   ├── scripts/
│   │   └── ingestData.js  # Data ingestion script
│   ├── index.js
│   ├── schema.sql
│   └── package.json
└── data/                # Toyota GR Cup race data
    ├── barber/
    ├── indianapolis/
    └── ...
```

## Quick Start

### 1. Setup Supabase Database

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema from `server/schema.sql`
4. Get your project URL and service key from Settings > API

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env and add your Supabase credentials
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Ingest Data

```bash
cd server
npm run ingest
```

This will parse the Toyota GR Cup CSV files and populate your Supabase database with:
- Track information
- Lap times and metadata
- Section times (S1, S2, S3)

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
App runs on http://localhost:3000

## How to Use

1. **Select a Track**: Choose from available tracks (Barber, Indianapolis, etc.)
2. **Select Lap A**: Pick your lap to analyze
3. **Select Lap B**: Pick a comparison lap (e.g., fastest lap, different driver)
4. **View Analysis**:
   - Section breakdown table shows time deltas per section
   - Performance heatmap highlights problem areas
   - Quick insights suggest where to focus improvement

## Data Sources

This project uses official Toyota GR Cup race data including:
- Lap timing data with section splits
- Driver numbers and lap counts
- Session information (practice, qualifying, race)

Tracks included:
- Barber Motorsports Park
- Indianapolis Motor Speedway
- Circuit of the Americas (COTA)
- Road America
- Sebring International Raceway
- Sonoma Raceway
- Virginia International Raceway (VIR)

## API Endpoints

- `GET /api/tracks` - List all tracks
- `GET /api/tracks/:trackId/laps` - Get all laps for a track
- `GET /api/laps/:lapId/telemetry` - Get detailed telemetry for a lap
- `POST /api/compare-laps` - Compare two laps
- `GET /api/tracks/:trackId/optimal-lap` - Get theoretical optimal lap

## Deployment

**Frontend (Vercel)**:
```bash
cd client
npm run build
vercel --prod
```

**Backend (Railway/Render)**:
```bash
cd server
# Deploy via Railway CLI or connect GitHub repo
```

## Hackathon Submission

**Event**: Hack the Track 2025 - Toyota GR Cup  
**Category**: Driver Training & Insights  
**Tracks Used**: Barber Motorsports Park, Indianapolis Motor Speedway

## License

MIT License - Built for Hack the Track 2025

