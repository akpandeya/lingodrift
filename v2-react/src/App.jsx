import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DataLoader } from './components/DataLoader';
import { Dashboard } from './features/dashboard/Dashboard';
import { ReviewSession } from './features/review/ReviewSession';
import { DictionaryList } from './features/dictionary/DictionaryList';
import { DictionaryDetail } from './features/dictionary/DictionaryDetail';
import { MemoryGame } from './features/games/MemoryGame';
import { RaindropGame } from './features/games/RaindropGame';

function App() {
  return (
    <Router>
      <DataLoader>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review" element={<ReviewSession />} />

            <Route path="/dictionary" element={<DictionaryList />} />
            <Route path="/dictionary/:id" element={<DictionaryDetail />} />

            <Route path="/games/memory" element={<MemoryGame />} />
            <Route path="/games/raindrop" element={<RaindropGame />} />

            <Route path="/courses" element={<div className="text-center mt-20 text-slate-500">Courses Feature Coming Soon</div>} />
          </Routes>
        </Layout>
      </DataLoader>
    </Router>
  );
}

export default App;
