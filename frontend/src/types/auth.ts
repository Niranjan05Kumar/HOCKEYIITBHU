export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponseData {
    admin: AdminUser;
}

export interface AuthState {
    admin: AdminUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: LoginPayload) => Promise<AdminUser>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}
