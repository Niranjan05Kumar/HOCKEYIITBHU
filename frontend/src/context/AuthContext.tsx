import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentAdmin, login as apiLogin, logout as apiLogout } from "@/api/auth";
import type { AdminUser, AuthState, LoginPayload } from "@/types/auth";
import { AuthContext } from "./AuthContextDefinition";

export interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Determines if an authenticated session currently exists
    const isAuthenticated = useMemo(() => admin !== null, [admin]);

    // Checks current session with backend via GET /api/v1/auth/me
    const refreshAuth = useCallback(async () => {
        try {
            const response = await getCurrentAdmin();
            if (response.data?.admin) {
                setAdmin(response.data.admin);
            } else {
                setAdmin(null);
            }
        } catch {
            // Unauthenticated or expired session
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshAuth();
    }, [refreshAuth]);

    // Logs in and updates state upon successful session establishment
    const handleLogin = useCallback(async (credentials: LoginPayload): Promise<AdminUser> => {
        setLoading(true);
        try {
            const response = await apiLogin(credentials);
            const authenticatedAdmin = response.data.admin;
            setAdmin(authenticatedAdmin);
            return authenticatedAdmin;
        } finally {
            setLoading(false);
        }
    }, []);

    // Logs out and terminates backend session
    const handleLogout = useCallback(async () => {
        setLoading(true);
        try {
            await apiLogout();
        } catch {
            // Continue with client-side cleanup regardless of logout API status
        } finally {
            setAdmin(null);
            setLoading(false);
        }
    }, []);

    const value = useMemo<AuthState>(
        () => ({
            admin,
            isAuthenticated,
            loading,
            login: handleLogin,
            logout: handleLogout,
            refreshAuth,
        }),
        [admin, isAuthenticated, loading, handleLogin, handleLogout, refreshAuth],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
