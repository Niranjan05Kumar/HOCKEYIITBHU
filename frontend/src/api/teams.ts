import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Team, TeamQuery } from "@/types/team";

/**
 * Fetch teams list from the backend API.
 * Maps to GET /api/v1/teams
 */
export const getTeams = async (query?: TeamQuery): Promise<PaginatedResponse<Team>> => {
    const response = await apiClient.get<PaginatedResponse<Team>>("/teams", {
        params: query,
    });
    return response.data;
};

/**
 * Fetch team by ID.
 * Maps to GET /api/v1/teams/:id
 */
export const getTeamById = async (id: string): Promise<ApiResponse<Team>> => {
    const response = await apiClient.get<ApiResponse<Team>>(`/teams/${id}`);
    return response.data;
};
