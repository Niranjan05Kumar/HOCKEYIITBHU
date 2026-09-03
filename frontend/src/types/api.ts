/**
 * Common API Response and Error Types matching backend structure.
 * Reference: docs/API_REQUEST_RESPONSE_STRUCTURES.md
 */

export interface ApiResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    meta: PaginationMeta;
    message?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

export interface ApiErrorResponse {
    success: false;
    error: ApiError;
}

export type ApiResult<T> = ApiResponse<T> | PaginatedResponse<T>;
