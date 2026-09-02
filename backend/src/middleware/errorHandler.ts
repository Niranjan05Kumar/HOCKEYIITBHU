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

const errorHandler: ErrorRequestHandler = (error, _req, res, next): void => {
    void next;
    const isProduction = process.env.NODE_ENV === "production";
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

    if (error instanceof AppError) {
        console.error({
            name: error.name,
            statusCode: error.statusCode,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
        });
    } else if (error instanceof Error) {
        console.error({
            name: error.name,
            message: error.message,
            ...(error.stack && !isProduction ? { stack: error.stack } : {}),
        });
    } else {
        console.error({ error });
    }

    if (isProduction && statusCode >= 500) {
        message = "Internal server error";
        details = undefined;
    }

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
