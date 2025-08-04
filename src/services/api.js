import axios from 'axios';

// Base URL for your Django backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Test connection to backend
  testConnection: async () => {
    try {
      const response = await api.get('/api/health/');
      return response.data;
    } catch (error) {
      console.error('Backend connection failed:', error);
      throw error;
    }
  },

  // Generic GET request
  get: async (endpoint) => {
    const response = await api.get(endpoint);
    return response.data;
  },

  // Generic POST request
  post: async (endpoint, data) => {
    const response = await api.post(endpoint, data);
    return response.data;
  },

  // Generic PUT request
  put: async (endpoint, data) => {
    const response = await api.put(endpoint, data);
    return response.data;
  },

  // Generic DELETE request
  delete: async (endpoint) => {
    const response = await api.delete(endpoint);
    return response.data;
  },
};

export default api;
