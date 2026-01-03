import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { SiMicrosoft } from 'react-icons/si';
import MoviaLogo from '../../components/Logo/MoviaLogo';
import api from '../../config/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register({
      name: username,
      email,
      password
    });

    if (result.success) {
      // Show verification message instead of navigating
      setShowVerificationMessage(true);
      setError('');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const apiBase = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? `${window.location.origin}/api` : 'http://localhost:5001/api');
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    const apiBase = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? `${window.location.origin}/api` : 'http://localhost:5001/api');
    window.location.href = `${apiBase}/auth/microsoft`;
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <MoviaLogo size={28} showText={true} />
          <h1>Join Movia</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showVerificationMessage && (
          <div className="success-message" style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>✅ Registration Successful!</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
              We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.
            </p>
            <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#856404' }}>
              ⏰ The verification link will expire in 24 hours.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  setResendLoading(true);
                  setResendSuccess('');
                  try {
                    const response = await api.post('/auth/resend-verification', { email });
                    setResendSuccess(response.data.message);
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to resend verification email');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                disabled={resendLoading}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: resendLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <Link
                to="/login"
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  display: 'inline-block'
                }}
              >
                Go to Login
              </Link>
            </div>
            {resendSuccess && (
              <div style={{ marginTop: '10px', color: '#155724', fontSize: '13px' }}>
                ✅ {resendSuccess}
              </div>
            )}
          </div>
        )}

        {!showVerificationMessage && (
          <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={onChange}
              required
              minLength="3"
              placeholder="Choose a username"
            />
          </div>

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
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              minLength="6"
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        )}

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
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
