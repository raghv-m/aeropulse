import { useParams, Link } from 'react-router-dom';
import { trackLayouts } from '../data/trackLayouts';
import Track3DViewer from '../components/Track3DViewer';

const TrackDetails = () => {
  const { trackId } = useParams();
  const track = trackLayouts[trackId];

  if (!track) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Track Not Found</h2>
          <Link to="/" className="text-red-500 hover:text-red-400">
            ← Back to Track Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-red-500 hover:text-red-400 mb-4 inline-block">
          ← Back to Track Selection
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">{track.name}</h1>
        <p className="text-slate-400 text-lg">{track.location}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Length</div>
          <div className="text-white font-bold text-2xl">{track.length} km</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Turns</div>
          <div className="text-white font-bold text-2xl">{track.turns}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Direction</div>
          <div className="text-white font-bold text-2xl capitalize">{track.direction}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Elevation Change</div>
          <div className="text-white font-bold text-2xl">{track.elevation.change}m</div>
        </div>
      </div>

      {/* 3D Track Viewer */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">3D Track Layout</h2>
        <Track3DViewer trackId={trackId} />
      </div>

      {/* Track Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Key Corners */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Key Corners</h3>
          <ul className="space-y-2">
            {track.insights.keyCorners.map((corner, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">🏁</span>
                <span className="text-slate-300">{corner}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Track Challenges</h3>
          <ul className="space-y-2">
            {track.insights.challenges.map((challenge, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">⚠️</span>
                <span className="text-slate-300">{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Racing Strategy */}
      <div className="bg-slate-800 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Racing Strategy</h3>
        <p className="text-slate-300 text-lg italic mb-4">"{track.insights.strategy}"</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-slate-400 text-sm mb-2">Surface Type</div>
            <div className="text-white font-semibold">{track.insights.surfaceType}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-2">Runoff Areas</div>
            <div className="text-white font-semibold">{track.insights.runoffAreas}</div>
          </div>
        </div>
      </div>

      {/* Elevation Profile */}
      <div className="bg-slate-800 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Elevation Profile</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Minimum Elevation</span>
            <span className="text-white font-bold">{track.elevation.min}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Maximum Elevation</span>
            <span className="text-white font-bold">{track.elevation.max}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Change</span>
            <span className="text-white font-bold">{track.elevation.change}m</span>
          </div>

          {/* Visual elevation bar */}
          <div className="mt-4">
            <div className="bg-slate-900 rounded-full h-12 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-green-500 to-red-500 h-full rounded-full flex items-center justify-center"
                style={{ width: '100%' }}
              >
                <span className="text-white font-bold">
                  {track.elevation.min}m → {track.elevation.max}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Guide */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Turn-by-Turn Guide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {track.coordinates.map((coord, i) => {
            if (!coord.turn || coord.turn === "Back to Start") return null;
            
            const sectorColors = {
              1: 'bg-green-500/20 border-green-500',
              2: 'bg-yellow-500/20 border-yellow-500',
              3: 'bg-blue-500/20 border-blue-500'
            };

            return (
              <div
                key={i}
                className={`p-3 rounded-lg border ${sectorColors[coord.sector]}`}
              >
                <div className="text-white font-semibold text-sm">{coord.turn}</div>
                <div className="text-slate-400 text-xs mt-1">
                  Sector {coord.sector} • Elevation: {coord.z}m
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackDetails;

