import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import './AuthCallback.css';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    // Check if we're in a popup window
    const isPopup = window.opener !== null;

    if (error) {
      if (isPopup) {
        // Send error to parent window
        window.opener.postMessage(
          { type: 'OAUTH_ERROR', error },
          window.location.origin
        );
        window.close();
      } else {
        // Redirect to login with error after a short delay
        setTimeout(() => {
          navigate(`/login?error=${error}`);
        }, 2000);
      }
      return;
    }

    if (token) {
      // Handle the auth callback
      handleCallback(token)
        .then(() => {
          if (isPopup) {
            // Send success message to parent window
            window.opener.postMessage(
              { type: 'OAUTH_SUCCESS', token },
              window.location.origin
            );
            window.close();
          } else {
            // Redirect to home after successful authentication
            navigate('/');
          }
        })
        .catch((err) => {
          console.error('Auth callback error:', err);
          if (isPopup) {
            window.opener.postMessage(
              { type: 'OAUTH_ERROR', error: 'authentication_failed' },
              window.location.origin
            );
            window.close();
          } else {
            navigate('/login?error=authentication_failed');
          }
        });
    } else {
      // No token
      if (isPopup) {
        window.opener.postMessage(
          { type: 'OAUTH_ERROR', error: 'missing_token' },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/login?error=missing_token');
      }
    }
  }, [token, error, handleCallback, navigate]);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        {error ? (
          <>
            <div className="error-icon">⚠️</div>
            <h2>Authentication Error</h2>
            <p>{error}</p>
            <p className="redirect-text">
              {window.opener ? 'Closing window...' : 'Redirecting to login...'}
            </p>
          </>
        ) : (
          <>
            <Loader2 className="spinner" />
            <h2>Completing sign in...</h2>
            <p>Please wait while we verify your credentials</p>
          </>
        )}
      </div>
    </div>
  );
}

