import { trackLayouts, trackComparison } from '../data/trackLayouts';

const TrackComparison = () => {
  const tracks = Object.entries(trackLayouts);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Track Comparison Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-400 text-sm mb-1">Fastest Track</div>
            <div className="text-white font-bold text-lg">
              {trackLayouts[trackComparison.fastest]?.name}
            </div>
            <div className="text-green-500 text-sm">
              {trackLayouts[trackComparison.fastest]?.length} km
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-400 text-sm mb-1">Most Technical</div>
            <div className="text-white font-bold text-lg">
              {trackLayouts[trackComparison.mostTechnical]?.name}
            </div>
            <div className="text-yellow-500 text-sm">
              {trackLayouts[trackComparison.mostTechnical]?.turns} turns
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-400 text-sm mb-1">Most Elevation</div>
            <div className="text-white font-bold text-lg">
              {trackLayouts[trackComparison.mostElevation]?.name}
            </div>
            <div className="text-blue-500 text-sm">
              {trackLayouts[trackComparison.mostElevation]?.elevation.change}m change
            </div>
          </div>
        </div>

        {/* Track Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-2">Power Tracks</h3>
            <ul className="space-y-1">
              {trackComparison.categories.power.map(trackId => (
                <li key={trackId} className="text-slate-300 text-sm">
                  • {trackLayouts[trackId]?.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-2">Technical Tracks</h3>
            <ul className="space-y-1">
              {trackComparison.categories.technical.map(trackId => (
                <li key={trackId} className="text-slate-300 text-sm">
                  • {trackLayouts[trackId]?.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-2">Balanced Tracks</h3>
            <ul className="space-y-1">
              {trackComparison.categories.balanced.map(trackId => (
                <li key={trackId} className="text-slate-300 text-sm">
                  • {trackLayouts[trackId]?.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-slate-800 rounded-lg p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Detailed Track Statistics</h2>
        
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-3 text-slate-400 font-semibold">Track</th>
              <th className="pb-3 text-slate-400 font-semibold">Length</th>
              <th className="pb-3 text-slate-400 font-semibold">Turns</th>
              <th className="pb-3 text-slate-400 font-semibold">Direction</th>
              <th className="pb-3 text-slate-400 font-semibold">Elevation</th>
              <th className="pb-3 text-slate-400 font-semibold">Surface</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map(([id, track]) => (
              <tr key={id} className="border-b border-slate-700/50">
                <td className="py-3 text-white font-medium">{track.name}</td>
                <td className="py-3 text-slate-300">{track.length} km</td>
                <td className="py-3 text-slate-300">{track.turns}</td>
                <td className="py-3 text-slate-300 capitalize">{track.direction}</td>
                <td className="py-3 text-slate-300">{track.elevation.change}m</td>
                <td className="py-3 text-slate-300 text-sm">{track.insights.surfaceType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Racing Strategies */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Racing Strategies by Track</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(trackComparison.strategies).map(([trackId, strategy]) => (
            <div key={trackId} className="bg-slate-900 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-2">{trackLayouts[trackId]?.name}</h3>
              <p className="text-slate-300 text-sm italic">"{strategy}"</p>
              
              <div className="mt-3 space-y-1">
                <div className="text-slate-400 text-xs">Key Corners:</div>
                {trackLayouts[trackId]?.insights.keyCorners.map((corner, i) => (
                  <div key={i} className="text-slate-300 text-xs">• {corner}</div>
                ))}
              </div>

              <div className="mt-3 space-y-1">
                <div className="text-slate-400 text-xs">Challenges:</div>
                {trackLayouts[trackId]?.insights.challenges.map((challenge, i) => (
                  <div key={i} className="text-red-400 text-xs">⚠ {challenge}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elevation Comparison Chart */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Elevation Profile Comparison</h2>
        
        <div className="space-y-3">
          {tracks.map(([id, track]) => (
            <div key={id} className="flex items-center gap-4">
              <div className="w-48 text-white text-sm">{track.name}</div>
              <div className="flex-1 bg-slate-900 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-red-500 h-full rounded-full flex items-center justify-end pr-3"
                  style={{ width: `${(track.elevation.change / 80) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {track.elevation.change}m
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackComparison;

