import axios from 'axios';

// Base URL for your Django backend
const isProd = import.meta.env.MODE === 'production';

// In production we default to same-origin (""), because all endpoints already
// start with "/api/...". In development we point to the local backend.
const API_BASE_URL = isProd
  ? (import.meta.env.VITE_API_BASE_URL || '')
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

// Debug API configuration in production
if (import.meta.env.MODE === 'production') {
  console.log('🔧 Production API Config:', {
    API_BASE_URL,
    MODE: import.meta.env.MODE,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
  });
}

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Simple in-memory cache for GET responses
const memoryCache = new Map(); // key -> { data, expiry }

const getFromCache = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
};

const setInCache = (key, data, ttlMs) => {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
};

const invalidateCacheByPrefix = (prefix) => {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
};

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
  // Check for appointment conflicts
  checkAppointmentConflicts: async (date, teamMemberId, time, appointmentId = null) => {
    try {
      // Get available slots for the given date and team member
      const response = await api.get(`/api/appointments/available_slots/?date=${date}&team_member=${teamMemberId}`);
      const { available_slots } = response.data;
      
      // If the time is not in available slots, it means there's a conflict
      const isTimeAvailable = available_slots.includes(time);
      
      // If we're editing an existing appointment, we need to check if the conflict is with itself
      if (!isTimeAvailable && appointmentId) {
        // Get the conflicting appointment
        const conflictingAppointments = await api.get(
          `/api/appointments/?appointment_date=${date}&team_member=${teamMemberId}`
        );
        
        // Check if the conflict is with the appointment being edited
        const conflict = conflictingAppointments.data.results?.find(
          app => app.appointment_time === time && app.id !== appointmentId
        );
        
        // If there's no conflict with other appointments, it's available
        if (!conflict) {
          return { hasConflict: false };
        }
      }
      
      return { 
        hasConflict: !isTimeAvailable,
        message: !isTimeAvailable ? 
          'Este profissional já possui um agendamento neste horário. Por favor, escolha outro horário.' : 
          null
      };
    } catch (error) {
      console.error('Error checking appointment conflicts:', error);
      return { 
        hasConflict: false, 
        error: 'Não foi possível verificar conflitos de agendamento. Prossiga com cuidado.'
      };
    }
  },
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
    try {
      const response = await api.get(endpoint);
      
      // Debug API responses in production
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 API GET ${endpoint}:`, {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
        });
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ API GET ${endpoint} failed:`, error.message);
      // Return empty array for list endpoints to prevent filter errors
      if (endpoint.includes('/api/')) {
        return [];
      }
      throw error;
    }
  },

  // Cached GET with TTL (milliseconds). Default 60s.
  getCached: async (endpoint, ttlMs = 60_000) => {
    const cacheKey = `GET ${endpoint}`;
    const cached = getFromCache(cacheKey);
    if (cached !== null) {
      if (process.env.NODE_ENV === 'production') {
        console.log(`🧠 Cache HIT for ${endpoint}`);
      }
      return cached;
    }
    if (process.env.NODE_ENV === 'production') {
      console.log(`🛰️ Cache MISS for ${endpoint}`);
    }
    const data = await api.get(endpoint).then(r => r.data);
    setInCache(cacheKey, data, ttlMs);
    return data;
  },

  // Generic POST request
  post: async (endpoint, data) => {
    const response = await api.post(endpoint, data);
    // Invalidate related caches for appointments, lists, and section stats
    invalidateCacheByPrefix('GET /api/appointments');
    invalidateCacheByPrefix('GET /api/appointments/section_stats');
    return response.data;
  },

  // Generic PUT request
  put: async (endpoint, data) => {
    const response = await api.put(endpoint, data);
    invalidateCacheByPrefix('GET /api/appointments');
    invalidateCacheByPrefix('GET /api/appointments/section_stats');
    return response.data;
  },

  // Generic DELETE request
  delete: async (endpoint) => {
    const response = await api.delete(endpoint);
    invalidateCacheByPrefix('GET /api/appointments');
    invalidateCacheByPrefix('GET /api/appointments/section_stats');
    return response.data;
  },
};

export default api;
