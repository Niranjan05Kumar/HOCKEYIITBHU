import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const TOURNAMENT_EDITION_SORT_FIELDS = ["year", "edition", "createdAt", "updatedAt"] as const;
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

export const tournamentEditionBodySchema = z
    .object({
        tournament: objectIdSchema,
        year: z
            .number({ message: "year is required" })
            .int("year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year is too far in the future"),
        edition: z.string().trim().min(1, "edition is required"),
        team: objectIdSchema,
        hostInstitute: z.string().trim().min(1, "hostInstitute cannot be empty").optional(),
        participatingTeams: z.array(z.string().trim().min(1, "Participating team name cannot be empty")).optional(),
        finalPosition: z
            .number()
            .int("finalPosition must be an integer")
            .min(1, "finalPosition must be at least 1")
            .optional(),
        captain: objectIdSchema.optional(),
        viceCaptain: objectIdSchema.optional(),
        achievements: z.array(objectIdSchema).optional(),
        awards: z.array(objectIdSchema).optional(),
        photos: z.array(objectIdSchema).optional(),
    })
    .strict();

export const tournamentEditionUpdateSchema = tournamentEditionBodySchema.partial();

export const tournamentEditionParamsSchema = z.object({
    id: objectIdSchema,
});

export const tournamentEditionQuerySchema = z.object({
    tournament: objectIdSchema.optional(),
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
    sort: z
        .enum(TOURNAMENT_EDITION_SORT_FIELDS, { message: "sort must be one of: year, edition, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateTournamentEditionBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentEditionBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTournamentEditionUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentEditionUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateTournamentEditionParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentEditionParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateTournamentEditionQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = tournamentEditionQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
