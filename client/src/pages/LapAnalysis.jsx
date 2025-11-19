import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LapSelector from '../components/LapSelector';
import SectionDeltaTable from '../components/SectionDeltaTable';
import PerformanceHeatmap from '../components/PerformanceHeatmap';

const API_URL = 'http://localhost:3001/api';

export default function LapAnalysis() {
  const { trackId } = useParams();
  const [track, setTrack] = useState(null);
  const [laps, setLaps] = useState([]);
  const [selectedLapA, setSelectedLapA] = useState(null);
  const [selectedLapB, setSelectedLapB] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/tracks`).then(r => r.json()),
      fetch(`${API_URL}/tracks/${trackId}/laps`).then(r => r.json())
    ]).then(([tracks, lapsData]) => {
      setTrack(tracks.find(t => t.id === trackId));
      setLaps(lapsData);
      setLoading(false);
    });
  }, [trackId]);

  useEffect(() => {
    if (selectedLapA && selectedLapB) {
      fetch(`${API_URL}/compare-laps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          lapAId: selectedLapA,
          lapBId: selectedLapB
        })
      })
        .then(r => r.json())
        .then(data => setComparison(data));
    }
  }, [selectedLapA, selectedLapB, trackId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">{track?.name}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LapSelector
          label="Lap A (Your Lap)"
          laps={laps}
          selectedLap={selectedLapA}
          onSelect={setSelectedLapA}
        />
        <LapSelector
          label="Lap B (Compare To)"
          laps={laps}
          selectedLap={selectedLapB}
          onSelect={setSelectedLapB}
        />
      </div>

      {comparison && (
        <>
          <SectionDeltaTable comparison={comparison} />
          <PerformanceHeatmap comparison={comparison} trackId={trackId} />
        </>
      )}
    </div>
  );
}

