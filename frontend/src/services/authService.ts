import { apiClient } from './apiClient';
import type { ApiResponse, User } from '../types/api.types';
import type { LoginInput, RegisterInput } from '../lib/validators';

export const authService = {
    login: async (credentials: LoginInput): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
        return apiClient.post('/auth/login', credentials);
    },

    register: async (data: RegisterInput): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
        return apiClient.post('/auth/register', data);
    },

    logout: async (): Promise<ApiResponse> => {
        return apiClient.post('/auth/logout');
    },

    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
        return apiClient.get('/auth/me');
    }
};
