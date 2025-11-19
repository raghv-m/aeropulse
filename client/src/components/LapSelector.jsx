export default function LapSelector({ label, laps, selectedLap, onSelect }) {
  // Group laps by driver
  const driverGroups = laps.reduce((acc, lap) => {
    if (!acc[lap.driver_number]) {
      acc[lap.driver_number] = [];
    }
    acc[lap.driver_number].push(lap);
    return {};
  }, {});

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{label}</h3>
      
      <select
        value={selectedLap || ''}
        onChange={(e) => onSelect(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full bg-slate-700 text-white border border-slate-600 rounded px-4 py-2 focus:outline-none focus:border-red-500"
      >
        <option value="">Select a lap...</option>
        {laps.map(lap => (
          <option key={lap.id} value={lap.id}>
            Driver #{lap.driver_number} - Lap {lap.lap_number} ({lap.total_time?.toFixed(3)}s)
          </option>
        ))}
      </select>
    </div>
  );
}

