import apiClient from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Match, MatchCreateInput, MatchQuery, MatchUpdateInput } from "@/types/match";

export const getMatches = async (params?: MatchQuery): Promise<PaginatedResponse<Match>> => {
    const response = await apiClient.get<PaginatedResponse<Match>>("/matches", { params });
    return response.data;
};

export const getMatchById = async (id: string): Promise<ApiResponse<Match>> => {
    const response = await apiClient.get<ApiResponse<Match>>(`/matches/${id}`);
    return response.data;
};

/**
 * Create a new match record.
 * Maps to POST /api/v1/matches
 */
export const createMatch = async (data: MatchCreateInput): Promise<ApiResponse<Match>> => {
    const response = await apiClient.post<ApiResponse<Match>>("/matches", data);
    return response.data;
};

/**
 * Update an existing match record.
 * Maps to PATCH /api/v1/matches/:id
 */
export const updateMatch = async (id: string, data: MatchUpdateInput): Promise<ApiResponse<Match>> => {
    const response = await apiClient.patch<ApiResponse<Match>>(`/matches/${id}`, data);
    return response.data;
};

/**
 * Delete a match record.
 * Maps to DELETE /api/v1/matches/:id
 */
export const deleteMatch = async (id: string): Promise<void> => {
    await apiClient.delete(`/matches/${id}`);
};
