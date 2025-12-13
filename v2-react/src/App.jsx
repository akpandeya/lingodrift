import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { ReviewSession } from './features/review/ReviewSession';
import { DictionaryList } from './features/dictionary/DictionaryList';
import { DictionaryDetail } from './features/dictionary/DictionaryDetail';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<ReviewSession />} />
          <Route path="/courses" element={<div className="text-center mt-20 text-slate-500">Courses Feature Coming Soon</div>} />

          <Route path="/dictionary" element={<DictionaryList />} />
          <Route path="/dictionary/:id" element={<DictionaryDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
