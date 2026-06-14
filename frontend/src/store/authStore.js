import { create } from 'zustand';
import api from '../services/api.js';

const useAuthStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  // Login action (Student)
  login: async (studentDetails) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', studentDetails);
      
      const userData = data.user || data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));

      set({ user: userData, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid enrollment details or captcha';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Admin Login action
  loginAdmin: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/admin-login', { email, password });
      
      const userData = data.user || data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));

      set({ user: userData, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid admin credentials';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Teacher Login action
  loginTeacher: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/teacher/login', { email, password });
      
      const userData = data.user || data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));

      set({ user: userData, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid teacher credentials';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Register action
  register: async (userDetails) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', userDetails);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      set({ user: data, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error occurred during registration';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Logout action
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  // Fetch current user details (validate session)
  checkSession: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/user/profile');
      set({ user: data, token });
    } catch (err) {
      console.warn('Session check failed. Logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  }
}));

export default useAuthStore;
