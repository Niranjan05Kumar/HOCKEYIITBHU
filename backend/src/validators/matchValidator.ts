import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const MATCH_RESULTS = ["Win", "Loss", "Draw"] as const;
const MATCH_SORT_FIELDS = ["date", "opponent", "createdAt", "updatedAt"] as const;
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

export const matchBodySchema = z
    .object({
        tournamentEdition: objectIdSchema,
        date: z.coerce.date({ message: "date must be a valid date string" }).optional(),
        opponent: z.string().trim().min(1, "opponent is required"),
        iitBhuScore: z
            .number()
            .int("iitBhuScore must be an integer")
            .min(0, "iitBhuScore cannot be negative")
            .optional(),
        opponentScore: z
            .number()
            .int("opponentScore must be an integer")
            .min(0, "opponentScore cannot be negative")
            .optional(),
        result: z.enum(MATCH_RESULTS, { message: "result must be one of: Win, Loss, Draw" }).optional(),
        round: z.string().trim().min(1, "round cannot be empty").optional(),
    })
    .strict();

export const matchUpdateSchema = matchBodySchema.partial();

export const matchParamsSchema = z.object({
    id: objectIdSchema,
});

export const matchQuerySchema = z.object({
    tournamentEditionId: objectIdSchema.optional(),
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
        .enum(MATCH_SORT_FIELDS, { message: "sort must be one of: date, opponent, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateMatchBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = matchBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateMatchUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = matchUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateMatchParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = matchParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateMatchQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = matchQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
