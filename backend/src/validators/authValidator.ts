import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

export const loginSchema = z.object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
}).strict();

export const validateLoginRequest = (req: Request, _res: Response, next: NextFunction): void => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        next(
            new AppError("Validation failed!", 400, {
                issues: result.error.issues.map((issue) => ({
                    path: issue.path,
                    message: issue.message,
                })),
            }),
        );
        return;
    }

    req.body = result.data;
    next();
};
