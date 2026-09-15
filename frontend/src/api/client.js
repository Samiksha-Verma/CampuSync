import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Attaches the stored JWT to every request. Set/cleared by AuthContext on
// login/logout so every api/* module can just import `client` and not think about auth.
export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

export const API_BASE = API_BASE_URL;
