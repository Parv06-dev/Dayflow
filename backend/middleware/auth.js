const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token from Authorization header
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'dayflow_secret_key_123_abc_xyz');
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or Expired Token' });
  }
};

// Check if user is ADMIN
const isAdmin = (req, res, next) => {
  if (req.user && req.user.emp_role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: 'Access Denied: Admins Only' });
  }
};

// Check if user is HR
const isHR = (req, res, next) => {
  if (req.user && req.user.emp_role === 'HR') {
    next();
  } else {
    return res.status(403).json({ message: 'Access Denied: HR Only' });
  }
};

// Check if user is ADMIN or HR
const isAdminOrHR = (req, res, next) => {
  if (req.user && (req.user.emp_role === 'ADMIN' || req.user.emp_role === 'HR')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access Denied: Admins or HR Only' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isHR,
  isAdminOrHR
};
