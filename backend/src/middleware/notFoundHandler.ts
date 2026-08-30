import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);

    next(error);
};

export default notFoundHandler;
