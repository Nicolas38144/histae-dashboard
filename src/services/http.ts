import axios from 'axios';
import { AUTH_KEY, URL } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Inject token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh
let isRefreshing = false;
let failedQueue: Array<() => void> = [];

const processQueue = () => {
  failedQueue.forEach((cb) => cb());
  failedQueue = [];
};

api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${URL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );

          const newToken = data.accessToken;
          localStorage.setItem(AUTH_KEY, newToken);

          // Replay failed requests
          processQueue();

          isRefreshing = false;

          // Add the new token to the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          isRefreshing = false;
          localStorage.removeItem(AUTH_KEY);
          alert("Session expirée, veuillez vous reconnecter")
          window.location.href = '/login';
          return Promise.reject(err);
        }
      } else {
        // Queue the request to retry it later
        return new Promise((resolve) => {
          failedQueue.push(() => resolve(api(originalRequest)));
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
