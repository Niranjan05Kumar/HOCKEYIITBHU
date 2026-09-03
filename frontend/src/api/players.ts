import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Player, PlayerQuery } from "@/types/player";

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
