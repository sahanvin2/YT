import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { SiMicrosoft } from 'react-icons/si';
import XclubLogo from '../../components/Logo/MoviaLogo';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendSuccess('');
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      // Check if the error is due to unverified email
      if (result.needsVerification) {
        setNeedsVerification(true);
      }
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setError('');

    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      setResendSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <XclubLogo size={28} showText={true} />
          <h1>Welcome to Xclub</h1>
          <p>Sign in to continue</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {needsVerification && (
          <div className="warning-message" style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              📧 Email Verification Required
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Please verify your email address before logging in. Check your inbox for the verification link.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginTop: '5px'
              }}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {resendSuccess && (
          <div className="success-message" style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            ✅ {resendSuccess}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="oauth-buttons">
          <button onClick={handleGoogleLogin} className="btn-oauth btn-google">
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </button>
          <button onClick={handleMicrosoftLogin} className="btn-oauth btn-microsoft">
            <SiMicrosoft size={18} color="#00A4EF" />
            <span>Continue with Microsoft</span>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
