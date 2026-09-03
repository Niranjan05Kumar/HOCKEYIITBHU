import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { HistoryEvent, HistoryEventQuery } from "@/types/history";

/**
 * Fetch a list of historical events from the backend API.
 * Maps to GET /api/v1/history
 */
export const getHistoryEvents = async (query?: HistoryEventQuery): Promise<PaginatedResponse<HistoryEvent>> => {
    const response = await apiClient.get<PaginatedResponse<HistoryEvent>>("/history", {
        params: query,
    });
    return response.data;
};

/**
 * Fetch a single historical event by its MongoDB ID.
 * Maps to GET /api/v1/history/:id
 */
export const getHistoryEventById = async (id: string): Promise<ApiResponse<HistoryEvent>> => {
    const response = await apiClient.get<ApiResponse<HistoryEvent>>(`/history/${id}`);
    return response.data;
};
