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
 * Supports multipart file upload via photoFile if provided.
 * Maps to POST /api/v1/history
 */
export const createHistoryEvent = async (
    data: HistoryEventCreateInput,
    photoFile?: File,
): Promise<ApiResponse<HistoryEvent>> => {
    const fileToUpload = photoFile || data.photoFile;

    if (fileToUpload) {
        const formData = new FormData();
        formData.append("photoFile", fileToUpload);
        formData.append("year", String(data.year));
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("category", data.category);
        if (data.tournament) formData.append("tournament", data.tournament);
        if (data.achievement) formData.append("achievement", data.achievement);

        const response = await apiClient.post<ApiResponse<HistoryEvent>>("/history", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    }

    const jsonPayload = { ...data };
    delete jsonPayload.photoFile;
    const response = await apiClient.post<ApiResponse<HistoryEvent>>("/history", jsonPayload);
    return response.data;
};

/**
 * Update an existing historical event by ID.
 * Supports archival photo replacement via photoFile if provided,
 * as well as image detachment via { photo: null, photoFileId: null }.
 * Maps to PATCH /api/v1/history/:id
 */
export const updateHistoryEvent = async (
    id: string,
    data: HistoryEventUpdateInput,
    photoFile?: File,
): Promise<ApiResponse<HistoryEvent>> => {
    const fileToUpload = photoFile || data.photoFile;

    if (fileToUpload) {
        const formData = new FormData();
        formData.append("photoFile", fileToUpload);
        if (data.year !== undefined) formData.append("year", String(data.year));
        if (data.title !== undefined) formData.append("title", data.title);
        if (data.description !== undefined) formData.append("description", data.description);
        if (data.category !== undefined) formData.append("category", data.category);
        if (data.tournament !== undefined) formData.append("tournament", data.tournament || "");
        if (data.achievement !== undefined) formData.append("achievement", data.achievement || "");

        const response = await apiClient.patch<ApiResponse<HistoryEvent>>(`/history/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    }

    const jsonPayload = { ...data };
    delete jsonPayload.photoFile;
    const response = await apiClient.patch<ApiResponse<HistoryEvent>>(`/history/${id}`, jsonPayload);
    return response.data;
};

/**
 * Delete a historical event by ID.
 * Maps to DELETE /api/v1/history/:id
 */
export const deleteHistoryEvent = async (id: string): Promise<void> => {
    await apiClient.delete(`/history/${id}`);
};
