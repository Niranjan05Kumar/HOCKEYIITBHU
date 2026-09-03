import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Tournament, TournamentQuery } from "@/types/tournament";

export const getTournaments = async (params?: TournamentQuery): Promise<ApiResponse<Tournament[]>> => {
    const response = await apiClient.get<ApiResponse<Tournament[]>>("/tournaments", { params });
    return response.data;
};

export const getTournamentById = async (id: string): Promise<ApiResponse<Tournament>> => {
    const response = await apiClient.get<ApiResponse<Tournament>>(`/tournaments/${id}`);
    return response.data;
};
