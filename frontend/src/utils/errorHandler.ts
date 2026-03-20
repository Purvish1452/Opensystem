import { AxiosError } from 'axios';

/**
 * Standardizes errors from API or network into a readable string
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        return error.response?.data?.message || error.message || 'An unexpected API error occurred';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
};
