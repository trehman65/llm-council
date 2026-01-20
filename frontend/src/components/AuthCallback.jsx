import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthCallback.css';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      handleCallback(token);
      navigate('/', { replace: true });
    } else {
      setError('No authentication token received');
    }
  }, [searchParams, handleCallback, navigate]);

  if (error) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-card error">
          <h2>Authentication Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <div className="auth-spinner"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;

