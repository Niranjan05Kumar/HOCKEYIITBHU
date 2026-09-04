import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuthResponseData, LoginPayload } from "@/types/auth";

/**
 * Sends admin credentials to authenticate and establish a secure session cookie.
 * Endpoint: POST /api/v1/auth/login
 */
export async function login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", payload);
    return response.data;
}

/**
 * Retrieves the currently authenticated admin session.
 * Endpoint: GET /api/v1/auth/me
 */
export async function getCurrentAdmin(): Promise<ApiResponse<AuthResponseData>> {
    const response = await apiClient.get<ApiResponse<AuthResponseData>>("/auth/me");
    return response.data;
}

/**
 * Terminates the active admin session and invalidates the session cookie.
 * Endpoint: POST /api/v1/auth/logout
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>("/auth/logout");
    return response.data;
}
