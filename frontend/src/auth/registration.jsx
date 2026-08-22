import React, { useState } from 'react';
import authService from '../services/authService';

const Registration = ({ onViewChange }) => {
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedInfo(null);

    if (!companyName || !name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        companyName,
        logoUrl,
        name,
        email,
        phone,
        password,
        confirmPassword
      });

      setCreatedInfo({
        loginId: result.loginId,
        email: result.email
      });
    } catch (err) {
      setError(err.message || 'Company Sign Up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-logo-wireframe">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxHeight: '40px' }} />
            ) : (
              'App/Web Logo'
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {createdInfo ? (
          <div className="alert alert-success" style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>🎉 Registration Successful!</h3>
            <p style={{ margin: '5px 0' }}>Your System-Generated Login ID:</p>
            <div className="login-id-badge" style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '10px 0', letterSpacing: '1px' }}>
              {createdInfo.loginId}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              Please note down your Login ID. You can sign in using this Login ID or your email address.
            </p>
            <button
              onClick={() => onViewChange('login')}
              className="btn btn-primary wireframe-btn"
              style={{ marginTop: '15px' }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Company Name + Upload Logo */}
            <div className="form-group">
              <label className="form-label">Company Name :-</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Odoo India"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <label className="upload-logo-btn" title="Upload Logo">
                  📁 Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Name :-</label>
              <input
                type="text"
                className="form-input"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email :-</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone :-</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit Phone Number"
                maxLength="10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password :-</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password :-</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '🙈'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block wireframe-btn"
              disabled={loading}
              style={{ marginTop: '15px' }}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account ?{' '}
          <span className="auth-link" onClick={() => onViewChange('login')}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default Registration;
