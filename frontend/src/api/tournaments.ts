import apiClient from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
    Tournament,
    TournamentCreateInput,
    TournamentEdition,
    TournamentEditionCreateInput,
    TournamentEditionQuery,
    TournamentEditionUpdateInput,
    TournamentQuery,
    TournamentUpdateInput,
} from "@/types/tournament";

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

/**
 * Upload a tournament logo image to ImageKit via backend media pipeline.
 */
export const uploadTournamentLogo = async (file: File, tournamentName: string): Promise<string> => {
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("category", "Other Memorable Moments");
    formData.append("caption", `${tournamentName.trim() || "Tournament"} Insignia Crest`);

    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>("/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.data.imageUrl;
};

/**
 * Create a new tournament record.
 * Maps to POST /api/v1/tournaments
 */
export const createTournament = async (
    data: TournamentCreateInput,
    logoFile?: File,
): Promise<ApiResponse<Tournament>> => {
    const payload = { ...data };

    if (logoFile) {
        const logoUrl = await uploadTournamentLogo(logoFile, data.name);
        payload.logo = logoUrl;
    }

    const response = await apiClient.post<ApiResponse<Tournament>>("/tournaments", payload);
    return response.data;
};

/**
 * Update an existing tournament record.
 * Maps to PATCH /api/v1/tournaments/:id
 */
export const updateTournament = async (
    id: string,
    data: TournamentUpdateInput,
    logoFile?: File,
): Promise<ApiResponse<Tournament>> => {
    const payload = { ...data };

    if (logoFile) {
        const logoUrl = await uploadTournamentLogo(logoFile, data.name || "Tournament");
        payload.logo = logoUrl;
    }

    const response = await apiClient.patch<ApiResponse<Tournament>>(`/tournaments/${id}`, payload);
    return response.data;
};

/**
 * Delete a tournament record.
 * Maps to DELETE /api/v1/tournaments/:id
 */
export const deleteTournament = async (id: string): Promise<void> => {
    await apiClient.delete(`/tournaments/${id}`);
};

/**
 * Create a new tournament edition.
 * Maps to POST /api/v1/tournament-editions
 */
export const createTournamentEdition = async (
    data: TournamentEditionCreateInput,
): Promise<ApiResponse<TournamentEdition>> => {
    const response = await apiClient.post<ApiResponse<TournamentEdition>>("/tournament-editions", data);
    return response.data;
};

/**
 * Update an existing tournament edition.
 * Maps to PATCH /api/v1/tournament-editions/:id
 */
export const updateTournamentEdition = async (
    id: string,
    data: TournamentEditionUpdateInput,
): Promise<ApiResponse<TournamentEdition>> => {
    const response = await apiClient.patch<ApiResponse<TournamentEdition>>(`/tournament-editions/${id}`, data);
    return response.data;
};

/**
 * Delete a tournament edition.
 * Maps to DELETE /api/v1/tournament-editions/:id
 */
export const deleteTournamentEdition = async (id: string): Promise<void> => {
    await apiClient.delete(`/tournament-editions/${id}`);
};
