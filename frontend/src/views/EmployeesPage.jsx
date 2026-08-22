import React, { useState, useEffect } from 'react';
import apiRequest from '../services/apiService';

const EmployeesPage = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // Detail/Edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Employee Form state
  const [addForm, setAddForm] = useState({
    name: '',
    department: '',
    role: 'EMPLOYEE',
    email: '',
    phone: '',
    password: ''
  });

  // Edit Employee Form state
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    role: '',
    email: '',
    phone: '',
    acc_status: ''
  });

  const isManager = user.emp_role === 'ADMIN' || user.emp_role === 'HR';
  const isAdminUser = user.emp_role === 'ADMIN';

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, roleFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let endpoint = '/employees';
      const params = [];
      if (searchTerm) params.push(`name=${encodeURIComponent(searchTerm)}`);
      if (roleFilter) params.push(`role=${encodeURIComponent(roleFilter)}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const data = await apiRequest(endpoint);
      setEmployees(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations matching backend and wireframe
    const normalizedRole = addForm.role.toUpperCase();
    const normalizedEmail = addForm.email.toLowerCase();

    if (normalizedRole === 'ADMIN') {
      if (!normalizedEmail.includes('@admin') && !normalizedEmail.endsWith('admin.com')) {
        alert('Admin registration requires an email containing "@admin" or ending in "admin.com"');
        return;
      }
    } else if (normalizedRole === 'HR') {
      if (!normalizedEmail.includes('@hr') && !normalizedEmail.endsWith('hr.com')) {
        alert('HR registration requires an email containing "@hr" or ending in "hr.com"');
        return;
      }
    }

    if (addForm.phone.length !== 10 || isNaN(addForm.phone)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }

    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify(addForm),
      });
      setShowAddModal(false);
      setAddForm({
        name: '',
        department: '',
        role: 'EMPLOYEE',
        email: '',
        phone: '',
        password: ''
      });
      fetchEmployees();
      alert('Employee added successfully!');
    } catch (err) {
      alert(err.message || 'Failed to add employee');
    }
  };

  const handleEditClick = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      name: emp.emp_name,
      department: emp.emp_department,
      role: emp.emp_role,
      email: emp.emp_email,
      phone: emp.emp_phno,
      acc_status: emp.acc_status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    const normalizedRole = editForm.role.toUpperCase();
    const normalizedEmail = editForm.email.toLowerCase();

    if (normalizedRole === 'ADMIN') {
      if (!normalizedEmail.includes('@admin') && !normalizedEmail.endsWith('admin.com')) {
        alert('Admin email must contain "@admin" or end in "admin.com"');
        return;
      }
    } else if (normalizedRole === 'HR') {
      if (!normalizedEmail.includes('@hr') && !normalizedEmail.endsWith('hr.com')) {
        alert('HR email must contain "@hr" or end in "hr.com"');
        return;
      }
    }

    if (editForm.phone.length !== 10 || isNaN(editForm.phone)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }

    try {
      await apiRequest(`/employees/${selectedEmp.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      fetchEmployees();
      alert('Employee profile updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.acc_status === 'Active' ? 'UnActive' : 'Active';
    try {
      await apiRequest(`/employees/${emp.emp_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          acc_status: nextStatus
        }),
      });
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (empId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action is permanent and will cascade to delete their logins, attendance logs, and leave requests.')) {
      return;
    }

    try {
      const data = await apiRequest(`/employees/${empId}`, {
        method: 'DELETE',
      });
      fetchEmployees();
      alert(data.message);
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Employees Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Search and manage company staff information.</p>
        </div>

        {isManager && (
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Employee
          </button>
        )}
      </div>

      <div className="search-bar-row">
        <input
          type="text"
          className="form-input search-input"
          placeholder="🔍 Search employees by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-input search-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="HR">HR Manager</option>
          <option value="ADMIN">System Admin</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Searching staff...</div>
      ) : (
        <div className="employee-grid">
          {employees.length > 0 ? (
            employees.map((emp) => (
              <div key={emp.emp_id} className="card employee-card">
                <div className="user-avatar emp-card-avatar">
                  {emp.emp_name.charAt(0)}
                </div>
                
                <h4 className="emp-card-name">{emp.emp_name}</h4>
                <p className="emp-card-dept">{emp.emp_department}</p>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span className={`badge badge-${emp.emp_role.toLowerCase()}`}>{emp.emp_role}</span>
                  <span className={`badge ${emp.acc_status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {emp.acc_status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <p>📧 {emp.emp_email}</p>
                  <p>📞 {emp.emp_phno}</p>
                </div>

                {isManager && (
                  <div className="employee-card-actions">
                    <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleEditClick(emp)}>
                      Edit
                    </button>

                    <button
                      className={`btn ${emp.acc_status === 'Active' ? 'btn-secondary' : 'btn-success'}`}
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: emp.acc_status === 'Active' ? 'var(--error)' : 'white' }}
                      onClick={() => handleToggleStatus(emp)}
                    >
                      {emp.acc_status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>

                    {isAdminUser && (
                      <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(emp.emp_id)}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No employees matched your search query.
            </div>
          )}
        </div>
      )}

      {/* --- ADD EMPLOYEE MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Employee Profile</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select
                      className="form-input"
                      value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                      required
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR Manager</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number (10 digits)</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength="10"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (Optional, default 'password123')</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="password123"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EMPLOYEE MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Employee: {selectedEmp?.emp_name}</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select
                      className="form-input"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      required
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR Manager</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength="10"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-input"
                      value={editForm.acc_status}
                      onChange={(e) => setEditForm({ ...editForm, acc_status: e.target.value })}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="UnActive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
