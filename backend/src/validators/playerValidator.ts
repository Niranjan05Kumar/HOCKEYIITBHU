import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const PLAYER_STATUSES = ["current", "former"] as const;
const PLAYING_POSITIONS = ["Forward", "Defender", "Midfielder", "Goalkeeper"] as const;
const PLAYER_SORT_FIELDS = ["name", "status", "createdAt", "updatedAt"] as const;

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

export const playerBodySchema = z
    .object({
        name: z.string().trim().min(1, "Name is required"),
        profilePhoto: z.string().trim().url("Profile photo must be a valid URL").optional(),
        profilePhotoFileId: z
            .string()
            .trim()
            .min(1, "profilePhotoFileId cannot be empty")
            .regex(/^[a-zA-Z0-9_-]+$/, "profilePhotoFileId must be a valid ImageKit file ID")
            .optional(),
        playingPosition: z
            .enum(PLAYING_POSITIONS, {
                message: "playingPosition must be one of: Forward, Defender, Midfielder, Goalkeeper",
            })
            .optional(),
        status: z.enum(PLAYER_STATUSES, { message: "status must be either 'current' or 'former'" }),
        playingYears: z
            .array(
                z
                    .number()
                    .int("playingYears must contain integers")
                    .min(1900, "Year must be 1900 or later")
                    .max(new Date().getFullYear() + 1, "Year is too far in the future"),
            )
            .optional(),
        jerseyNumber: z
            .number()
            .int("Jersey number must be an integer")
            .min(0, "Jersey number cannot be negative")
            .optional(),
        leadershipRoles: z.array(z.string().trim().min(1, "Leadership role cannot be empty")).optional(),
        achievements: z.array(objectIdSchema).optional(),
        individualStatistics: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

export const playerUpdateSchema = playerBodySchema.partial();

export const playerParamsSchema = z.object({
    id: objectIdSchema,
});

export const playerQuerySchema = z.object({
    status: z.enum(PLAYER_STATUSES, { message: "status must be either 'current' or 'former'" }).optional(),
    position: z
        .enum(PLAYING_POSITIONS, {
            message: "position must be one of: Forward, Defender, Midfielder, Goalkeeper",
        })
        .optional(),
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
    sort: z.enum(PLAYER_SORT_FIELDS, { message: "sort must be one of: name, status, createdAt, updatedAt" }).optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validatePlayerBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = playerBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validatePlayerUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = playerUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validatePlayerParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = playerParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validatePlayerQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = playerQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
