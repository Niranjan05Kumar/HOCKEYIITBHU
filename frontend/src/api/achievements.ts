import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type {
    Achievement,
    AchievementCreateInput,
    AchievementQuery,
    AchievementUpdateInput,
} from "@/types/achievement";

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

/**
 * Create a new achievement record.
 * Maps to POST /api/v1/achievements
 */
export const createAchievement = async (data: AchievementCreateInput): Promise<ApiResponse<Achievement>> => {
    const response = await apiClient.post<ApiResponse<Achievement>>("/achievements", data);
    return response.data;
};

/**
 * Update an existing achievement record by ID.
 * Maps to PATCH /api/v1/achievements/:id
 */
export const updateAchievement = async (
    id: string,
    data: AchievementUpdateInput,
): Promise<ApiResponse<Achievement>> => {
    const response = await apiClient.patch<ApiResponse<Achievement>>(`/achievements/${id}`, data);
    return response.data;
};

/**
 * Delete an achievement record by ID.
 * Maps to DELETE /api/v1/achievements/:id
 */
export const deleteAchievement = async (id: string): Promise<void> => {
    await apiClient.delete(`/achievements/${id}`);
};
