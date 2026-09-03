import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { ApiErrorResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Pre-configured Axios instance for the IIT (BHU) Hockey Platform API.
 * Uses session cookies via withCredentials: true.
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        const errorData = error.response?.data;
        if (errorData && !errorData.success && errorData.error) {
            // Enhanced error message if structured error from backend exists
            const customError = new Error(errorData.error.message || "An unexpected error occurred");
            (customError as unknown as { code?: string; details?: unknown }).code = errorData.error.code;
            (customError as unknown as { code?: string; details?: unknown }).details = errorData.error.details;
            return Promise.reject(customError);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
