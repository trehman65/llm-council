import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import HomePage from './components/HomePage';
import LLMCouncil from './components/LLMCouncil';
import SecondOrderAnalyzer from './components/SecondOrderAnalyzer';
import './App.css';

function AppContent() {
  const { loading, showLoginModal, closeLoginModal } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/llm-council" element={<LLMCouncil />} />
        <Route path="/second-order" element={<SecondOrderAnalyzer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showLoginModal && <Login onClose={closeLoginModal} />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
