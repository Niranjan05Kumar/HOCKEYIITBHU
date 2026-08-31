class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details: Record<string, unknown> | undefined;

    constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
