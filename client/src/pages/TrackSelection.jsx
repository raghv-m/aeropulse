import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function TrackSelection() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/tracks`)
      .then(res => res.json())
      .then(data => {
        setTracks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading tracks:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-slate-400">Loading tracks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Select a Track</h2>
        <p className="text-slate-400">
          {tracks.length} tracks available • Toyota GR Cup 2025 Season
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map(track => (
          <div
            key={track.id}
            onClick={() => navigate(`/track/${track.id}`)}
            className="bg-slate-800 rounded-lg p-6 border-2 border-slate-700 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer transition-all transform hover:scale-105"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white">{track.name}</h3>
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                LIVE
              </span>
            </div>

            <div className="text-slate-400 text-sm space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">📍</span>
                <p>{track.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">🏁</span>
                <p>Length: {track.length_km} km</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">📊</span>
                <p>{track.num_sections} sectors</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/track/${track.id}/details`);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  3D View
                </button>
                <span className="text-red-500 font-semibold text-sm">
                  Lap Analysis →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No tracks available</p>
          <p className="text-slate-500 text-sm mt-2">
            Check backend connection at http://localhost:3001
          </p>
        </div>
      )}
    </div>
  );
}

