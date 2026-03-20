import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api.types';

export interface Project {
    _id: string;
    title: string;
    description: string;
    status: string;
}

export const projectService = {
    getProjects: async (page = 1, limit = 10): Promise<ApiResponse<{ projects: Project[], total: number }>> => {
        return apiClient.get(`/projects?page=${page}&limit=${limit}`);
    },

    getProject: async (id: string): Promise<ApiResponse<Project>> => {
        return apiClient.get(`/projects/${id}`);
    }
};
