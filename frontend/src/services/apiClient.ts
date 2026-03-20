import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from '../security/tokenManager';
import { API_CONFIG } from '../lib/constants';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: true, // Crucial for httpOnly refresh tokens
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Standardize successful API format internally across the app
        return response.data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if login request failed to prevent infinite loop
            if (originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error.response?.data || error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call silent refresh endpoint
                const refreshResponse = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true
                });

                const { accessToken } = refreshResponse.data.data;
                tokenManager.setToken(accessToken);

                processQueue(null, accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Force logout when refresh fails globally
                useAuthStore.getState().clearAuth();

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Standardize error propagation
        return Promise.reject(error.response?.data || error);
    }
);
