export default function SectionDeltaTable({ comparison }) {
  const { lapA, lapB, deltas } = comparison;

  const formatDelta = (delta) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(3)}s`;
  };

  const getDeltaColor = (delta) => {
    if (delta < -0.1) return 'text-green-500';
    if (delta > 0.1) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Section Breakdown</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-3 text-slate-400">Section</th>
              <th className="pb-3 text-slate-400">Lap A</th>
              <th className="pb-3 text-slate-400">Lap B</th>
              <th className="pb-3 text-slate-400">Delta</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(deltas.sections).map(([section, delta]) => {
              const sectionA = lapA.sections.find(s => s.section_name === section);
              const sectionB = lapB.sections.find(s => s.section_name === section);
              
              return (
                <tr key={section} className="border-b border-slate-700/50">
                  <td className="py-3 font-semibold text-white">{section}</td>
                  <td className="py-3 text-slate-300">{sectionA?.time_seconds.toFixed(3)}s</td>
                  <td className="py-3 text-slate-300">{sectionB?.time_seconds.toFixed(3)}s</td>
                  <td className={`py-3 font-bold ${getDeltaColor(delta)}`}>
                    {formatDelta(delta)}
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold">
              <td className="pt-4 text-white">Total</td>
              <td className="pt-4 text-slate-300">{lapA.total_time.toFixed(3)}s</td>
              <td className="pt-4 text-slate-300">{lapB.total_time.toFixed(3)}s</td>
              <td className={`pt-4 ${getDeltaColor(deltas.total)}`}>
                {formatDelta(deltas.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

