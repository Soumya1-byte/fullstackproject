import axios from 'axios';

let isRefreshing = false;
let pendingRequests = [];

function flushPendingRequests(error, token) {
  pendingRequests.forEach(({ resolve, reject, requestConfig }) => {
    if (error || !token) {
      reject(error || new Error('Token refresh failed'));
      return;
    }
    requestConfig.headers = requestConfig.headers || {};
    requestConfig.headers.Authorization = `Bearer ${token}`;
    resolve(apiClient(requestConfig));
  });
  pendingRequests = [];
}

function addPendingRequest(resolve, reject, requestConfig) {
  pendingRequests.push({ resolve, reject, requestConfig });
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function clearAccessToken() {
  localStorage.removeItem('token');
}

export function getAccessToken() {
  return localStorage.getItem('token');
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthMutation =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/logout');

    if (status !== 401 || originalRequest?._retry || originalRequest?.url?.includes('/auth/refresh') || isAuthMutation) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addPendingRequest(resolve, reject, originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await apiClient.post('/auth/refresh');
      const newToken = refreshResponse.data?.data?.token;
      if (!newToken) throw new Error('Refresh failed');

      setAccessToken(newToken);
      flushPendingRequests(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      flushPendingRequests(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
