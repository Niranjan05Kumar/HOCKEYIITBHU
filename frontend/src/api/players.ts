import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Player, PlayerCreateInput, PlayerQuery, PlayerUpdateInput } from "@/types/player";

/**
 * Fetch players list from the backend API.
 * Maps to GET /api/v1/players
 */
export const getPlayers = async (query?: PlayerQuery): Promise<PaginatedResponse<Player>> => {
    const response = await apiClient.get<PaginatedResponse<Player>>("/players", {
        params: query,
    });
    return response.data;
};

/**
 * Fetch player by ID.
 * Maps to GET /api/v1/players/:id
 */
export const getPlayerById = async (id: string): Promise<ApiResponse<Player>> => {
    const response = await apiClient.get<ApiResponse<Player>>(`/players/${id}`);
    return response.data;
};

/**
 * Create a new player record.
 * Handles profile photo upload via ImageKit flow if a file is provided.
 * Maps to POST /api/v1/players and PATCH /api/v1/players/:id
 */
export const createPlayer = async (data: PlayerCreateInput, photoFile?: File): Promise<ApiResponse<Player>> => {
    const response = await apiClient.post<ApiResponse<Player>>("/players", data);
    let player = response.data.data;

    if (photoFile && player._id) {
        const formData = new FormData();
        formData.append("profilePhotoFile", photoFile);
        const uploadRes = await apiClient.patch<ApiResponse<Player>>(`/players/${player._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        player = uploadRes.data.data;
    }

    return {
        ...response.data,
        data: player,
    };
};

/**
 * Update an existing player record.
 * Handles portrait replacement via ImageKit flow if a file is provided.
 * Maps to PATCH /api/v1/players/:id
 */
export const updatePlayer = async (
    id: string,
    data: PlayerUpdateInput,
    photoFile?: File,
): Promise<ApiResponse<Player>> => {
    if (photoFile) {
        const formData = new FormData();
        formData.append("profilePhotoFile", photoFile);
        await apiClient.patch<ApiResponse<Player>>(`/players/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    const response = await apiClient.patch<ApiResponse<Player>>(`/players/${id}`, data);
    return response.data;
};

/**
 * Delete a player record.
 * Maps to DELETE /api/v1/players/:id
 */
export const deletePlayer = async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
};
