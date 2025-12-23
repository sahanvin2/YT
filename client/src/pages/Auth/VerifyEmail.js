import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import XclubLogo from '../../components/Logo/MoviaLogo';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <XclubLogo size={28} showText={true} />
          <h1>Email Verification</h1>
        </div>

        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          {status === 'verifying' && (
            <div>
              <div className="spinner" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="success-message" style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{ margin: '0 0 15px 0', color: '#155724' }}>Email Verified!</h2>
              <p style={{ margin: '0', fontSize: '16px' }}>{message}</p>
              <p style={{ margin: '20px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Redirecting to login page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="error-message" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid #f5c6cb',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h2 style={{ margin: '0 0 15px 0', color: '#721c24' }}>Verification Failed</h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>{message}</p>
              <Link 
                to="/login" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '12px 30px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
