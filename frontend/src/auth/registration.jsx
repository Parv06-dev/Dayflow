import React, { useState } from 'react';
import authService from '../services/authService';

const Registration = ({ onViewChange }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !department || !role || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Client-side validation matching the backend wireframe specs
    const normalizedRole = role.toUpperCase();
    const normalizedEmail = email.toLowerCase();

    if (normalizedRole === 'ADMIN') {
      if (!normalizedEmail.includes('@admin') && !normalizedEmail.endsWith('admin.com')) {
        setError('Admin registration requires an email containing "@admin" or ending in "admin.com"');
        return;
      }
    } else if (normalizedRole === 'HR') {
      if (!normalizedEmail.includes('@hr') && !normalizedEmail.endsWith('hr.com')) {
        setError('HR registration requires an email containing "@hr" or ending in "hr.com"');
        return;
      }
    }

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        name,
        department,
        role,
        email,
        phone,
        password
      });

      setSuccess('Account created successfully! Redirecting to Login...');
      setTimeout(() => {
        onViewChange('login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            Dayflow <div className="logo-dot"></div>
          </div>
          <p className="auth-subtitle">Create a new Employee Resource account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                type="text"
                id="reg-name"
                className="form-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-dept">Department</label>
              <input
                type="text"
                id="reg-dept"
                className="form-input"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">System Role</label>
              <select
                id="reg-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR Manager</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <input
                type="tel"
                id="reg-phone"
                className="form-input"
                placeholder="10-digit number"
                maxLength="10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              type="email"
              id="reg-email"
              className="form-input"
              placeholder="e.g. john@gmail.com, admin@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {role === 'ADMIN' && <small style={{ color: 'var(--accent)' }}>Must contain '@admin' or end with 'admin.com'</small>}
            {role === 'HR' && <small style={{ color: 'var(--accent)' }}>Must contain '@hr' or end with 'hr.com'</small>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              type="password"
              id="reg-password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => onViewChange('login')}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default Registration;
