import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type {
    HistoryEvent,
    HistoryEventCreateInput,
    HistoryEventQuery,
    HistoryEventUpdateInput,
} from "@/types/history";

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

/**
 * Create a new historical event.
 * Maps to POST /api/v1/history
 */
export const createHistoryEvent = async (data: HistoryEventCreateInput): Promise<ApiResponse<HistoryEvent>> => {
    const response = await apiClient.post<ApiResponse<HistoryEvent>>("/history", data);
    return response.data;
};

/**
 * Update an existing historical event by ID.
 * Maps to PATCH /api/v1/history/:id
 */
export const updateHistoryEvent = async (
    id: string,
    data: HistoryEventUpdateInput,
): Promise<ApiResponse<HistoryEvent>> => {
    const response = await apiClient.patch<ApiResponse<HistoryEvent>>(`/history/${id}`, data);
    return response.data;
};

/**
 * Delete a historical event by ID.
 * Maps to DELETE /api/v1/history/:id
 */
export const deleteHistoryEvent = async (id: string): Promise<void> => {
    await apiClient.delete(`/history/${id}`);
};
