import axios from 'axios';

const API = axios.create({
  // In dev: use relative URLs so Vite proxy works.
  // In prod: VITE_BACKEND_URL must point to the deployed backend.
  baseURL:
    import.meta.env.DEV
      ? ''
      : (import.meta.env.VITE_BACKEND_URL || ''),
});

if (!import.meta.env.DEV && !import.meta.env.VITE_BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_BACKEND_URL. API calls will hit the frontend domain and fail.');
}


// Add token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default API;