import type { ErrorRequestHandler } from "express";
import AppError from "../utils/appError.js";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
    let statusCode = 500;
    let message = "Internal server error";

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    console.error(error);

    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "APPLICATION_ERROR",
            message,
        },
    });
};

export default errorHandler;
