import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LLMCouncil from './components/LLMCouncil';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<LLMCouncil />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
