export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errorCode?: string;
    requestId?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'moderator' | 'admin';
    status: 'active' | 'suspended';
    profileImage?: string;
}

export interface AuthData {
    user: User;
    accessToken: string;
}
