import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { GalleryItem, GalleryItemCreateInput, GalleryItemUpdateInput, GalleryQuery } from "@/types/gallery";

/**
 * Fetch gallery items from the backend API.
 * Maps to GET /api/v1/gallery
 */
export const getGalleryItems = async (query?: GalleryQuery): Promise<PaginatedResponse<GalleryItem>> => {
    const response = await apiClient.get<PaginatedResponse<GalleryItem>>("/gallery", {
        params: query,
    });
    return response.data;
};

/**
 * Fetch single gallery item by ID.
 * Maps to GET /api/v1/gallery/:id
 */
export const getGalleryItemById = async (id: string): Promise<ApiResponse<GalleryItem>> => {
    const response = await apiClient.get<ApiResponse<GalleryItem>>(`/gallery/${id}`);
    return response.data;
};

/**
 * Create a new gallery item.
 * Supports multipart image upload via backend ImageKit pipeline.
 * Maps to POST /api/v1/gallery
 */
export const createGalleryItem = async (
    data: GalleryItemCreateInput,
    imageFile?: File,
): Promise<ApiResponse<GalleryItem>> => {
    if (imageFile) {
        const formData = new FormData();
        formData.append("imageFile", imageFile);
        formData.append("category", data.category);
        if (data.tournament) formData.append("tournament", data.tournament);
        if (data.eventName) formData.append("eventName", data.eventName);
        if (data.caption) formData.append("caption", data.caption);
        if (data.description) formData.append("description", data.description);
        if (data.taggedPlayers && data.taggedPlayers.length > 0) {
            formData.append("taggedPlayers", JSON.stringify(data.taggedPlayers));
        }
        if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
        if (data.imageFileId) formData.append("imageFileId", data.imageFileId);

        const response = await apiClient.post<ApiResponse<GalleryItem>>("/gallery", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        if (data.year !== undefined && !Number.isNaN(data.year) && response.data?.data?._id) {
            const updateRes = await apiClient.patch<ApiResponse<GalleryItem>>(`/gallery/${response.data.data._id}`, {
                year: Number(data.year),
            });
            return updateRes.data;
        }

        return response.data;
    }

    const response = await apiClient.post<ApiResponse<GalleryItem>>("/gallery", data);
    return response.data;
};

/**
 * Update an existing gallery item by ID.
 * Supports image replacement via ImageKit pipeline if a new file is provided.
 * Maps to PATCH /api/v1/gallery/:id
 */
export const updateGalleryItem = async (
    id: string,
    data: GalleryItemUpdateInput,
    imageFile?: File,
): Promise<ApiResponse<GalleryItem>> => {
    if (imageFile) {
        const formData = new FormData();
        formData.append("imageFile", imageFile);
        if (data.category) formData.append("category", data.category);
        if (data.tournament !== undefined) formData.append("tournament", data.tournament || "");
        if (data.eventName !== undefined) formData.append("eventName", data.eventName || "");
        if (data.caption !== undefined) formData.append("caption", data.caption || "");
        if (data.description !== undefined) formData.append("description", data.description || "");
        if (data.taggedPlayers !== undefined) {
            formData.append("taggedPlayers", JSON.stringify(data.taggedPlayers));
        }

        await apiClient.patch<ApiResponse<GalleryItem>>(`/gallery/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const jsonPayload: GalleryItemUpdateInput = {};
        if (data.year !== undefined && !Number.isNaN(data.year)) {
            jsonPayload.year = Number(data.year);
        }
        if (data.category) jsonPayload.category = data.category;
        if (data.caption !== undefined) jsonPayload.caption = data.caption;
        if (data.eventName !== undefined) jsonPayload.eventName = data.eventName;
        if (data.description !== undefined) jsonPayload.description = data.description;
        if (data.tournament !== undefined) jsonPayload.tournament = data.tournament;
        if (data.taggedPlayers !== undefined) jsonPayload.taggedPlayers = data.taggedPlayers;

        const finalRes = await apiClient.patch<ApiResponse<GalleryItem>>(`/gallery/${id}`, jsonPayload);
        return finalRes.data;
    }

    const response = await apiClient.patch<ApiResponse<GalleryItem>>(`/gallery/${id}`, data);
    return response.data;
};

/**
 * Delete a gallery item by ID.
 * Permanently removes document from MongoDB and purges image file from ImageKit.
 * Maps to DELETE /api/v1/gallery/:id
 */
export const deleteGalleryItem = async (id: string): Promise<void> => {
    await apiClient.delete(`/gallery/${id}`);
};
