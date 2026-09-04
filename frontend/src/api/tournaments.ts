import apiClient from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Tournament, TournamentEdition, TournamentEditionQuery, TournamentQuery } from "@/types/tournament";

export const getTournaments = async (params?: TournamentQuery): Promise<PaginatedResponse<Tournament>> => {
    const response = await apiClient.get<PaginatedResponse<Tournament>>("/tournaments", { params });
    return response.data;
};

export const getTournamentById = async (id: string): Promise<ApiResponse<Tournament>> => {
    const response = await apiClient.get<ApiResponse<Tournament>>(`/tournaments/${id}`);
    return response.data;
};

export const getTournamentEditions = async (
    params?: TournamentEditionQuery,
): Promise<PaginatedResponse<TournamentEdition>> => {
    const response = await apiClient.get<PaginatedResponse<TournamentEdition>>("/tournament-editions", { params });
    return response.data;
};

export const getTournamentEditionById = async (id: string): Promise<ApiResponse<TournamentEdition>> => {
    const response = await apiClient.get<ApiResponse<TournamentEdition>>(`/tournament-editions/${id}`);
    return response.data;
};
