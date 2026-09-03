import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Match, MatchQuery } from "@/types/match";

export const getMatches = async (params?: MatchQuery): Promise<ApiResponse<Match[]>> => {
    const response = await apiClient.get<ApiResponse<Match[]>>("/matches", { params });
    return response.data;
};

export const getMatchById = async (id: string): Promise<ApiResponse<Match>> => {
    const response = await apiClient.get<ApiResponse<Match>>(`/matches/${id}`);
    return response.data;
};
