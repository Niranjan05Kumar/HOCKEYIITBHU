import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const TEAM_SORT_FIELDS = ["year", "createdAt", "updatedAt"] as const;
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

export const teamBodySchema = z
    .object({
        year: z
            .number({ message: "year is required" })
            .int("year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year is too far in the future"),
        players: z
            .array(objectIdSchema, { message: "players must be an array of valid MongoDB ObjectIds" })
            .min(1, "At least one player is required"),
        captain: objectIdSchema.optional(),
        viceCaptain: objectIdSchema.optional(),
        coach: z.string().trim().min(1, "coach cannot be empty").optional(),
        teamPhoto: z.string().trim().url("teamPhoto must be a valid URL").optional(),
        achievements: z.array(objectIdSchema).optional(),
    })
    .strict();

export const teamUpdateSchema = teamBodySchema.partial();

export const teamParamsSchema = z.object({
    id: objectIdSchema,
});

export const teamQuerySchema = z.object({
    year: z.coerce
        .number({ message: "year must be a valid number" })
        .int("year must be an integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year is too far in the future")
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
    sort: z.enum(TEAM_SORT_FIELDS, { message: "sort must be one of: year, createdAt, updatedAt" }).optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateTeamBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = teamBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTeamUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = teamUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTeamParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = teamParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.params = result.data;
    next();
};

export const validateTeamQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = teamQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.query = result.data as typeof req.query;
    next();
};
