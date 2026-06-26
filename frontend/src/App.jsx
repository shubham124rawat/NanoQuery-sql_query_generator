import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GeneratorPage from './pages/GeneratorPage';
import SchemaPage from './pages/SchemaPage';
import HistoryPage from './pages/HistoryPage';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-text">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/generator" element={<GeneratorPage />} />
            <Route path="/schema" element={<SchemaPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
