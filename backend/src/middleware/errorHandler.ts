import type { ErrorRequestHandler } from "express";
import AppError from "../utils/appError.js";

const codeFromStatus = (statusCode: number): string => {
    switch (statusCode) {
        case 400:
            return "VALIDATION_ERROR";
        case 401:
            return "UNAUTHORIZED";
        case 403:
            return "FORBIDDEN";
        case 404:
            return "NOT_FOUND";
        case 409:
            return "CONFLICT";
        case 500:
            return "INTERNAL_SERVER_ERROR";
        default:
            return "APPLICATION_ERROR";
    }
};

const errorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
    let statusCode = 500;
    let message = "Internal server error";
    let details: Record<string, unknown> | undefined;

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        details = error.details;
    } else if (error instanceof Error) {
        message = error.message;
    }

    // Always log the error server-side for diagnostics
    console.error(error);

    res.status(statusCode).json({
        success: false,
        error: {
            code: codeFromStatus(statusCode),
            message,
            ...(details ? { details } : {}),
        },
    });
};

export default errorHandler;
