import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { GalleryItem, GalleryQuery } from "@/types/gallery";

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
