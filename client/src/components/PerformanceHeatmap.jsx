export default function PerformanceHeatmap({ comparison, trackId }) {
  const { deltas } = comparison;

  const getSectionColor = (delta) => {
    if (delta < -0.1) return 'bg-green-500';
    if (delta > 0.3) return 'bg-red-500';
    if (delta > 0.1) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getSectionLabel = (delta) => {
    if (delta < -0.1) return 'Faster';
    if (delta > 0.3) return 'Much Slower';
    if (delta > 0.1) return 'Slower';
    return 'Similar';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">Performance Heatmap</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(deltas.sections).map(([section, delta]) => (
          <div
            key={section}
            className="bg-slate-700 rounded-lg p-4 border-l-4"
            style={{ borderLeftColor: getSectionColor(delta).replace('bg-', '#') }}
          >
            <div className="text-sm text-slate-400 mb-1">{section}</div>
            <div className="text-2xl font-bold text-white mb-1">
              {delta > 0 ? '+' : ''}{delta.toFixed(3)}s
            </div>
            <div className={`text-sm font-semibold ${getSectionColor(delta).replace('bg-', 'text-')}`}>
              {getSectionLabel(delta)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-700 rounded-lg">
        <h4 className="font-semibold text-white mb-2">💡 Quick Insights</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          {Object.entries(deltas.sections).map(([section, delta]) => {
            if (delta > 0.2) {
              return (
                <li key={section}>
                  • Focus on {section}: You're losing {delta.toFixed(3)}s here
                </li>
              );
            }
            return null;
          }).filter(Boolean)}
        </ul>
      </div>
    </div>
  );
}

