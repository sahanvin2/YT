import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthCallback.css';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      alert(`Authentication failed: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      // Store token and redirect
      localStorage.setItem('token', token);
      login(token);
      
      // Redirect to home
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        <div className="spinner"></div>
        <h2>Completing authentication...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
