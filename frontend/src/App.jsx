import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import HomePage from './components/HomePage';
import LLMCouncil from './components/LLMCouncil';
import SecondOrderAnalyzer from './components/SecondOrderAnalyzer';
import ProjectManager from './components/ProjectManager';
import './App.css';

function AppContent() {
  const { loading, showLoginModal, closeLoginModal, user, openLoginModal, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hideHeader = location.pathname === '/auth/callback';

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
      {!hideHeader && (
        <header className="global-header">
          <div className="global-header-inner">
            <button className="global-brand" onClick={() => navigate('/')} title="Go to Home">
              <span className="global-brand-emoji" aria-hidden="true">🚀</span>
              Better PM
            </button>
            <div className="global-actions">
              {user ? (
                <div className="global-user">
                  <span className="global-user-name">{user.name || user.email}</span>
                  <button className="global-logout" onClick={logout} title="Log out">
                    Log out
                  </button>
                </div>
              ) : (
                <button className="global-signin" onClick={openLoginModal}>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>
      )}
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/llm-council" element={<LLMCouncil />} />
        <Route path="/second-order" element={<SecondOrderAnalyzer />} />
        <Route path="/project-manager" element={<ProjectManager />} />
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
