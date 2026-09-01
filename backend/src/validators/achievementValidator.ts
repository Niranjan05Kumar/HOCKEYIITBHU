import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const ACHIEVEMENT_TYPES = ["Championship", "Medal", "Award", "Major Victory", "Individual Achievement"] as const;
const RECIPIENT_TYPES = ["Player", "Team"] as const;
const ACHIEVEMENT_SORT_FIELDS = ["year", "title", "createdAt", "updatedAt"] as const;
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

export const achievementBodySchema = z
    .object({
        title: z.string().trim().min(1, "title is required"),
        description: z.string().trim().min(1, "description cannot be empty").optional(),
        type: z.enum(ACHIEVEMENT_TYPES, {
            message: "type must be one of: Championship, Medal, Award, Major Victory, Individual Achievement",
        }),
        year: z
            .number({ message: "year is required" })
            .int("year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year is too far in the future"),
        tournament: objectIdSchema.optional(),
        recipientType: z.enum(RECIPIENT_TYPES, { message: "recipientType must be either 'Player' or 'Team'" }),
        recipient: objectIdSchema,
    })
    .strict();

export const achievementUpdateSchema = achievementBodySchema.partial();

export const achievementParamsSchema = z.object({
    id: objectIdSchema,
});

export const achievementQuerySchema = z.object({
    year: z.coerce
        .number({ message: "year must be a valid number" })
        .int("year must be an integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year is too far in the future")
        .optional(),
    type: z
        .enum(ACHIEVEMENT_TYPES, {
            message: "type must be one of: Championship, Medal, Award, Major Victory, Individual Achievement",
        })
        .optional(),
    recipientType: z.enum(RECIPIENT_TYPES, { message: "recipientType must be either 'Player' or 'Team'" }).optional(),
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
        .enum(ACHIEVEMENT_SORT_FIELDS, { message: "sort must be one of: year, title, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateAchievementBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = achievementBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateAchievementUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = achievementUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateAchievementParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = achievementParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateAchievementQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = achievementQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
