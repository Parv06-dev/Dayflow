import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';
import SalaryPage from './SalaryPage';

const ProfilePage = ({ user, onUserUpdate, readOnly = false }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] = useState(readOnly ? 'resume' : 'private'); // 'resume', 'private', 'salary', 'security'

  // Extended Wireframe Form State
  const [formData, setFormData] = useState({
    emp_name: '',
    job_position: '',
    emp_email: '',
    emp_phno: '',
    company_name: '',
    emp_department: '',
    location: '',
    dob: '',
    residing_address: '',
    nationality: 'Indian',
    personal_email: '',
    gender: 'Male',
    marital_status: 'Single',
    date_of_joining: '',
    bank_account_no: '',
    bank_name: '',
    ifsc_code: '',
    pan_no: '',
    uan_no: ''
  });

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user && user.emp_id) {
      fetchProfileDetails();
    }
  }, [user?.emp_id]);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/employees/${user.emp_id}`);
      setProfile(data);
      setFormData({
        emp_name: data.emp_name || '',
        job_position: data.job_position || data.emp_role || '',
        emp_email: data.emp_email || '',
        emp_phno: data.emp_phno || '',
        company_name: data.company_name || 'Odoo India',
        emp_department: data.emp_department || '',
        location: data.location || 'India',
        dob: data.dob ? String(data.dob).substring(0, 10) : '',
        residing_address: data.residing_address || '',
        nationality: data.nationality || 'Indian',
        personal_email: data.personal_email || data.emp_email || '',
        gender: data.gender || 'Male',
        marital_status: data.marital_status || 'Single',
        date_of_joining: data.date_of_joining ? String(data.date_of_joining).substring(0, 10) : '2026-01-01',
        bank_account_no: data.bank_account_no || '',
        bank_name: data.bank_name || '',
        ifsc_code: data.ifsc_code || '',
        pan_no: data.pan_no || '',
        uan_no: data.uan_no || ''
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message || 'Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiRequest(`/employees/${user.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      
      setSuccess('Profile updated successfully!');
      
      if (onUserUpdate) {
        const updatedUser = {
          ...user,
          emp_name: formData.emp_name,
          emp_email: formData.emp_email
        };
        localStorage.setItem('dayflow_user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
      }
      
      fetchProfileDetails();
    } catch (err) {
      setError(err.message || 'Failed to update profile details');
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
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.75rem' }}>My Profile</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Header Profile Info Card */}
      <div className="card-glass" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '24px', alignItems: 'center' }}>
          {/* Avatar with edit pencil */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: (() => {
                const name = formData.emp_name || user.emp_name || 'U';
                const hue = (name.charCodeAt(0) * 47) % 360;
                return `linear-gradient(135deg, hsl(${hue}, 65%, 40%), hsl(${(hue + 60) % 360}, 70%, 55%))`;
              })(),
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: '#fff',
              fontWeight: '700'
            }}>
              {(formData.emp_name || user.emp_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div title="Edit Photo" style={{
              position: 'absolute',
              top: '38px',
              left: '38px',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}>
              ✏️
            </div>
          </div>

          {/* Left Column Profile Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>{formData.emp_name || 'My Name'}</h2>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Job Position</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={formData.job_position}
                onChange={(e) => handleInputChange('job_position', e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={formData.emp_email}
                onChange={(e) => handleInputChange('emp_email', e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mobile</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={formData.emp_phno}
                onChange={(e) => handleInputChange('emp_phno', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Right Column Profile Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Company</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem', opacity: 0.8 }}
                value={formData.company_name}
                disabled
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Department</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={formData.emp_department}
                onChange={(e) => handleInputChange('emp_department', e.target.value)}
                disabled={readOnly || user.emp_role === 'EMPLOYEE'}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manager</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value="HR Manager"
                disabled
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Location</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wireframe Tabs Header */}
      <div className="profile-tabs" style={{ marginBottom: '24px' }}>
        <button
          className={activeTab === 'resume' ? 'active' : ''}
          onClick={() => setActiveTab('resume')}
        >
          Resume
        </button>
        {!readOnly && (
          <>
            <button
              className={activeTab === 'private' ? 'active' : ''}
              onClick={() => setActiveTab('private')}
            >
              Private Info
            </button>
            <button
              className={activeTab === 'salary' ? 'active' : ''}
              onClick={() => setActiveTab('salary')}
            >
              Salary Info
            </button>
            <button
              className={activeTab === 'security' ? 'active' : ''}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </>
        )}
      </div>

      {/* TAB 1: RESUME */}
      {activeTab === 'resume' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Resume & Work Experience</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No resume uploaded yet. You can attach work certificates or project resumes here.
          </p>
        </div>
      )}

      {/* TAB 2: PRIVATE INFO (Exact Wireframe Fields Layout) */}
      {activeTab === 'private' && (
        <form onSubmit={handleInfoSubmit}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              {/* Left Column: Personal Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth :-</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Residing Address :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Residential Address"
                    value={formData.residing_address}
                    onChange={(e) => handleInputChange('residing_address', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nationality :-</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Email :-</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="personal@gmail.com"
                    value={formData.personal_email}
                    onChange={(e) => handleInputChange('personal_email', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender :-</label>
                  <select
                    className="form-input"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={readOnly}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Marital Status :-</label>
                  <select
                    className="form-input"
                    value={formData.marital_status}
                    onChange={(e) => handleInputChange('marital_status', e.target.value)}
                    disabled={readOnly}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Joining :-</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date_of_joining}
                    onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                    disabled={readOnly || user.emp_role === 'EMPLOYEE'}
                  />
                </div>
              </div>

              {/* Right Column: Bank Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Bank Details
                </h4>

                <div className="form-group">
                  <label className="form-label">Account Number :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Bank Account No"
                    value={formData.bank_account_no}
                    onChange={(e) => handleInputChange('bank_account_no', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="IFSC Code"
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PAN No :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PAN Number"
                    value={formData.pan_no}
                    onChange={(e) => handleInputChange('pan_no', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UAN No :-</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="UAN Number"
                    value={formData.uan_no}
                    onChange={(e) => handleInputChange('uan_no', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emp Code :-</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profile?.login_id || `EMP#${profile?.emp_id}`}
                    disabled
                  />
                </div>
              </div>
            </div>

            {!readOnly && (
              <div style={{ marginTop: '32px', textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Save Private Info
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* TAB 3: SALARY INFO */}
      {activeTab === 'salary' && (
        <SalaryPage user={user} />
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <h3 style={{ marginBottom: '20px' }}>Security & Credentials</h3>
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
      )}
    </div>
  );
};

export default ProfilePage;
