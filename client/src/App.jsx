import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TrackSelection from './pages/TrackSelection';
import LapAnalysis from './pages/LapAnalysis';
import TrackDetails from './pages/TrackDetails';
import TrackComparison from './components/TrackComparison';

function Navigation() {
  const location = useLocation();

  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-bold text-white">
              🏁 AeroPulse AI
            </h1>
            <p className="text-slate-400 text-sm">
              Complete Toyota GR Cup 2025 Season Analysis
            </p>
          </Link>

          <nav className="flex gap-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tracks
            </Link>
            <Link
              to="/comparison"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/comparison'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Compare
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900">
        <Navigation />

        <Routes>
          <Route path="/" element={<TrackSelection />} />
          <Route path="/track/:trackId" element={<LapAnalysis />} />
          <Route path="/track/:trackId/details" element={<TrackDetails />} />
          <Route path="/comparison" element={<TrackComparison />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

