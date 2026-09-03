import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Achievement, AchievementQuery } from "@/types/achievement";

/**
 * Fetch achievements from backend API.
 * Maps to GET /api/v1/achievements
 */
export const getAchievements = async (query?: AchievementQuery): Promise<PaginatedResponse<Achievement>> => {
    const response = await apiClient.get<PaginatedResponse<Achievement>>("/achievements", {
        params: query,
    });
    return response.data;
};

/**
 * Fetch a single achievement by ID.
 * Maps to GET /api/v1/achievements/:id
 */
export const getAchievementById = async (id: string): Promise<ApiResponse<Achievement>> => {
    const response = await apiClient.get<ApiResponse<Achievement>>(`/achievements/${id}`);
    return response.data;
};
