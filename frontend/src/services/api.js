import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Asegúrate de que este puerto coincida con tu backend de Flask
  headers: {
    'Content-Type': 'application/json'
  }
});

const handleAccessError = (status) => {
  if (status === 401) {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:expired'));
  } else if (status === 403) {
    window.dispatchEvent(new Event('auth:forbidden'));
  }
};

api.interceptors.request.use(
  (config) => {
    let user;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleAccessError(error.response?.status);
    return Promise.reject(error);
  }
);

// Para pantallas que necesitan la interfaz Response de fetch (incluye multipart).
export const authenticatedFetch = async (url, options = {}) => {
  let user;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
  const headers = new Headers(options.headers || {});
  if (user?.token) headers.set('Authorization', `Bearer ${user.token}`);
  const response = await fetch(url, { ...options, headers });
  handleAccessError(response.status);
  return response;
};

export default api;
