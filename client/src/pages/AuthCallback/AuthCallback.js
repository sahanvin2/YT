import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthCallback.css';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(error).replace(/_/g, ' '));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token) {
        try {
          setStatus('authenticating');
          const result = await loginWithToken(token);
          
          if (result.success) {
            setStatus('success');
            // Redirect to home after a brief success message
            setTimeout(() => {
              navigate('/');
            }, 1500);
          } else {
            setStatus('error');
            setErrorMessage(result.message || 'Authentication failed');
            setTimeout(() => navigate('/login'), 3000);
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          setStatus('error');
          setErrorMessage('An unexpected error occurred');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setStatus('error');
        setErrorMessage('No authentication token received');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuth();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        {status === 'processing' || status === 'authenticating' ? (
          <>
            <div className="spinner"></div>
            <h2>Completing authentication...</h2>
            <p>Please wait while we log you in.</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="success-icon">✓</div>
            <h2>Welcome!</h2>
            <p>Authentication successful. Redirecting...</p>
          </>
        ) : (
          <>
            <div className="error-icon">✗</div>
            <h2>Authentication Failed</h2>
            <p>{errorMessage}</p>
            <p className="redirect-notice">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
