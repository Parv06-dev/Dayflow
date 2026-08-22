import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';
import SalaryPage from './SalaryPage';

const ProfilePage = ({ user, onUserUpdate, readOnly = false }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Info Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/employees/${user.emp_id}`);
      setProfile(data);
      setName(data.emp_name);
      setEmail(data.emp_email);
      setPhone(data.emp_phno);
    } catch (err) {
      setError('Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !phone) {
      setError('Please fill in all info fields');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    // Email prefix checks if role is ADMIN or HR
    const role = user.emp_role;
    const normalizedEmail = email.toLowerCase();
    if (role === 'ADMIN') {
      if (!normalizedEmail.includes('@admin') && !normalizedEmail.endsWith('admin.com')) {
        setError('Admin email must contain "@admin" or end in "admin.com"');
        return;
      }
    } else if (role === 'HR') {
      if (!normalizedEmail.includes('@hr') && !normalizedEmail.endsWith('hr.com')) {
        setError('HR email must contain "@hr" or end in "hr.com"');
        return;
      }
    }

    try {
      await apiRequest(`/employees/${user.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email, phone }),
      });
      
      setSuccess('Profile updated successfully!');
      
      // Update parent session info if changed
      if (onUserUpdate) {
        const updatedUser = {
          ...user,
          emp_name: name,
          emp_email: email
        };
        localStorage.setItem('dayflow_user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
      }
      
      fetchProfileDetails();
    } catch (err) {
      setError(err.message || 'Failed to update details');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await apiRequest(`/employees/${user.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      });
      
      setSuccess('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Fetching profile details...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>My Account Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your personal details and account credentials.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-tabs">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
        {user.emp_role === 'ADMIN' && <button className={activeTab === 'salary' ? 'active' : ''} onClick={() => setActiveTab('salary')}>Salary Info</button>}
      </div>

      {activeTab === 'salary' && user.emp_role === 'ADMIN' ? <SalaryPage user={user} /> : (

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Personal Profile Info</h3>
            {readOnly ? <div className="profile-read-only">Employee information is view-only from the directory.</div> : null}
            <form onSubmit={handleInfoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={readOnly}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={readOnly}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number (10 digits)</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength="10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={readOnly}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department (Read-Only)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ opacity: 0.65 }}
                    value={profile?.emp_department || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Role (Read-Only)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ opacity: 0.65 }}
                    value={profile?.emp_role || ''}
                    disabled
                  />
                </div>
              </div>

              {!readOnly && <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: '10px' }}>
                Save Profile Changes
              </button>}
            </form>
          </div>
        </div>

        {!readOnly && <div className="dashboard-side">
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Update Password</h3>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ marginTop: '10px' }}>
                Update Password
              </button>
            </form>
          </div>

          <div className="card" style={{ marginTop: '20px', borderLeft: '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Account Standing</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Your account status is currently: <strong style={{ color: 'var(--success)' }}>{profile?.acc_status}</strong>. If you require department adjustments, please submit an HR query.
            </p>
          </div>
        </div>}
      </div>
      )}
    </div>
  );
};

export default ProfilePage;
