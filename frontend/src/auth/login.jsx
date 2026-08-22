import React, { useState } from 'react';
import authService from '../services/authService';

const Login = ({ onLoginSuccess, onViewChange }) => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      setError('Please enter your Login ID/Email and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authService.login(loginIdentifier, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Top App/Web Logo Box matching wireframe layout */}
        <div className="auth-header">
          <div className="auth-logo-wireframe">
            App/Web Logo
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-id">Login Id/Email :-</label>
            <input
              type="text"
              id="login-id"
              className="form-input"
              placeholder="e.g. OIJODO20220001 or john@gmail.com"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password :-</label>
            <input
              type="password"
              id="login-password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block wireframe-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'SIGN IN'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an Account?{' '}
          <span className="auth-link" onClick={() => onViewChange('register')}>
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
