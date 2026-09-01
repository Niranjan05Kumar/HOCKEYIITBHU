import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const TOURNAMENT_TYPES = [
    "SPARDHA",
    "Inter-IIT",
    "Inter-IIT Sports Meet",
    "GC",
    "General Championship (GC)",
    "Out Fest",
    "Sports Out Fests",
    "institute_sports_fest",
] as const;

const TOURNAMENT_SORT_FIELDS = ["name", "type", "createdAt", "updatedAt"] as const;
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

export const tournamentBodySchema = z
    .object({
        name: z.string().trim().min(1, "name is required"),
        type: z.enum(TOURNAMENT_TYPES, {
            message:
                "type must match a supported tournament category: SPARDHA, Inter-IIT, GC, Out Fest, or a documented equivalent",
        }),
        description: z.string().trim().min(1, "description cannot be empty").optional(),
        logo: z.string().trim().url("logo must be a valid URL").optional(),
    })
    .strict();

export const tournamentUpdateSchema = tournamentBodySchema.partial();

export const tournamentParamsSchema = z.object({
    id: objectIdSchema,
});

export const tournamentQuerySchema = z.object({
    name: z.string().trim().min(1, "name cannot be empty").optional(),
    type: z
        .enum(TOURNAMENT_TYPES, {
            message:
                "type must match a supported tournament category: SPARDHA, Inter-IIT, GC, Out Fest, or a documented equivalent",
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
        .enum(TOURNAMENT_SORT_FIELDS, { message: "sort must be one of: name, type, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateTournamentBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTournamentUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTournamentParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateTournamentQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
