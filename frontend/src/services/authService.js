import apiRequest from './apiService';

const authService = {
  // Login
  login: async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        localStorage.setItem('dayflow_token', data.token);
        localStorage.setItem('dayflow_user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
  },

  // Get Current Session User
  getCurrentUser: () => {
    const userStr = localStorage.getItem('dayflow_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('dayflow_user');
      return null;
    }
  },

  // Get JWT Token
  getToken: () => {
    return localStorage.getItem('dayflow_token');
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('dayflow_token');
  }
};

export default authService;
