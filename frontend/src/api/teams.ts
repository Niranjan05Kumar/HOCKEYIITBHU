import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Team, TeamCreateInput, TeamQuery, TeamUpdateInput } from "@/types/team";

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

/**
 * Create a new team record.
 * Handles team photo upload via ImageKit flow if a file is provided.
 * Maps to POST /api/v1/teams and PATCH /api/v1/teams/:id
 */
export const createTeam = async (data: TeamCreateInput, photoFile?: File): Promise<ApiResponse<Team>> => {
    const response = await apiClient.post<ApiResponse<Team>>("/teams", data);
    let team = response.data.data;

    if (photoFile && team._id) {
        const formData = new FormData();
        formData.append("teamPhotoFile", photoFile);
        const uploadRes = await apiClient.patch<ApiResponse<Team>>(`/teams/${team._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        team = uploadRes.data.data;
    }

    return {
        ...response.data,
        data: team,
    };
};

/**
 * Update an existing team record.
 * Handles photo replacement via ImageKit flow if a file is provided.
 * Maps to PATCH /api/v1/teams/:id
 */
export const updateTeam = async (id: string, data: TeamUpdateInput, photoFile?: File): Promise<ApiResponse<Team>> => {
    if (photoFile) {
        const formData = new FormData();
        formData.append("teamPhotoFile", photoFile);
        await apiClient.patch<ApiResponse<Team>>(`/teams/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    const response = await apiClient.patch<ApiResponse<Team>>(`/teams/${id}`, data);
    return response.data;
};

/**
 * Delete a team record.
 * Maps to DELETE /api/v1/teams/:id
 */
export const deleteTeam = async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
};
