import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const HISTORY_CATEGORIES = ["Major Victory", "Championship", "Medal", "Milestone", "Memorable Performance"] as const;
const HISTORY_SORT_FIELDS = ["year", "title", "category", "createdAt", "updatedAt"] as const;
const objectIdSchema = z
    .string({ message: "ObjectId must be a string" })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB ObjectId");

const buildValidationError = (result: {
    error: { issues: Array<{ path: ReadonlyArray<PropertyKey>; message: string }> };
}): AppError =>
    new AppError("Validation failed!", 400, {
        issues: result.error.issues.map((issue) => ({
            path: issue.path.map((segment) => String(segment)),
            message: issue.message,
        })),
    });

export const historyBodySchema = z
    .object({
        year: z
            .number({ message: "year is required" })
            .int("year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year is too far in the future"),
        title: z.string().trim().min(1, "title is required"),
        description: z.string().trim().min(1, "description is required"),
        category: z.enum(HISTORY_CATEGORIES, {
            message: "category must be one of: Major Victory, Championship, Medal, Milestone, Memorable Performance",
        }),
        tournament: objectIdSchema.optional(),
        achievement: objectIdSchema.optional(),
        photo: z.string().trim().url("photo must be a valid URL").optional(),
    })
    .strict();

export const historyUpdateSchema = historyBodySchema.partial();

export const historyParamsSchema = z.object({
    id: objectIdSchema,
});

export const historyQuerySchema = z.object({
    year: z.coerce
        .number({ message: "year must be a valid number" })
        .int("year must be an integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year is too far in the future")
        .optional(),
    category: z
        .enum(HISTORY_CATEGORIES, {
            message: "category must be one of: Major Victory, Championship, Medal, Milestone, Memorable Performance",
        })
        .optional(),
    page: z.coerce
        .number({ message: "page must be a valid number" })
        .int("page must be an integer")
        .min(1, "page must be at least 1")
        .optional(),
    limit: z.coerce
        .number({ message: "limit must be a valid number" })
        .int("limit must be an integer")
        .min(1, "limit must be at least 1")
        .max(100, "limit cannot exceed 100")
        .optional(),
    sort: z
        .enum(HISTORY_SORT_FIELDS, { message: "sort must be one of: year, title, category, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateHistoryBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = historyBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateHistoryUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = historyUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateHistoryParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = historyParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateHistoryQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = historyQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
