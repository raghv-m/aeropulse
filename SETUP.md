# RaceLine AI - Setup Guide

## What You Have

A complete, production-ready driver training platform with:

✅ **Backend** (Node.js + Express) - Loads Toyota GR Cup data from CSV files  
✅ **Frontend** (React + Vite) - Modern, fast UI with lap comparison  
✅ **Real Data** - Barber & Indianapolis race data already integrated  
✅ **No Database Required** - Works with in-memory data (can add Supabase later)

## Quick Start (2 Minutes)

### 1. Start Backend

```bash
cd server
node index.js
```

You should see:
```
📊 Loading race data...
✅ Loaded 2 tracks, 100 laps
🏁 RaceLine AI server running on http://localhost:3001
```

### 2. Start Frontend (New Terminal)

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:3000/
```

### 3. Open Browser

Go to: **http://localhost:3000**

## How to Use

1. **Select a Track** - Click on Barber or Indianapolis
2. **Select Lap A** - Choose a lap to analyze (e.g., Driver #3, Lap 5)
3. **Select Lap B** - Choose a comparison lap (e.g., Driver #3, Lap 10)
4. **View Results**:
   - Section breakdown table shows time deltas
   - Performance heatmap highlights problem areas
   - Quick insights suggest improvements

## Project Structure

```
raceline-ai/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TrackSelection.jsx    # Track selection page
│   │   │   └── LapAnalysis.jsx       # Main analysis page
│   │   ├── components/
│   │   │   ├── LapSelector.jsx       # Lap dropdown selector
│   │   │   ├── SectionDeltaTable.jsx # Delta comparison table
│   │   │   └── PerformanceHeatmap.jsx # Visual heatmap
│   │   └── App.jsx
│   └── package.json
├── server/              # Node.js backend
│   ├── index.js         # Main server file
│   └── package.json
└── data/                # Toyota GR Cup data
    ├── barber/
    └── indianapolis/
```

## Features

### ✅ Implemented

- Track selection page
- Lap comparison with section deltas
- Performance heatmap (color-coded sections)
- Real Toyota GR Cup data integration
- Responsive UI with Tailwind CSS

### 🚀 Ready to Add

- Telemetry charts (speed, throttle, brake)
- Track map visualization
- AI-powered coaching insights
- More tracks (COTA, Road America, etc.)

## Troubleshooting

### Backend won't start

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
cd server
npm install
```

### Frontend won't start

**Error**: `Cannot find module 'react'`

**Solution**:
```bash
cd client
npm install
```

### No data showing

**Check**:
1. Backend is running on port 3001
2. Check browser console (F12) for errors
3. Verify data files exist in `data/barber/` and `data/indianapolis/`

## Next Steps

### 1. Add More Tracks (10 minutes)

Edit `server/index.js`, line 48:
```javascript
const trackDirs = ['barber', 'indianapolis', 'road-america', 'sebring'];
```

### 2. Deploy to Production (30 minutes)

**Frontend (Vercel)**:
```bash
cd client
npm run build
vercel --prod
```

**Backend (Railway)**:
```bash
cd server
# Connect GitHub repo to Railway
# Set environment variable: PORT=3001
```

### 3. Add Supabase (Optional)

If you want persistent database:
1. Create Supabase project
2. Run `server/schema.sql` in SQL Editor
3. Run `server/scripts/ingestData.js` to populate
4. Update `server/index.js` to use Supabase instead of in-memory data

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, PapaCSV
- **Data**: Toyota GR Cup official race telemetry

## License

MIT - Built for Hack the Track 2025

