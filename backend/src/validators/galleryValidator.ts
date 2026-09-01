import { z } from "zod";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

const GALLERY_CATEGORIES = [
    "SPARDHA",
    "Inter-IIT",
    "GC",
    "Out Fest",
    "Team Photos",
    "Match Photos",
    "Awards & Medal Celebrations",
    "Old/Archive Memories",
    "Other Memorable Moments",
] as const;

const GALLERY_SORT_FIELDS = ["year", "category", "createdAt", "updatedAt"] as const;
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

export const galleryBodySchema = z
    .object({
        imageUrl: z.string().trim().min(1, "imageUrl is required").url("imageUrl must be a valid URL"),
        imageFileId: z
            .string()
            .trim()
            .min(1, "imageFileId cannot be empty")
            .regex(/^[a-zA-Z0-9_-]+$/, "imageFileId must be a valid ImageKit file ID")
            .optional(),
        year: z
            .number({ message: "year must be a valid number" })
            .int("year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year is too far in the future")
            .optional(),
        category: z.enum(GALLERY_CATEGORIES, {
            message:
                "category must be one of: SPARDHA, Inter-IIT, GC, Out Fest, Team Photos, Match Photos, Awards & Medal Celebrations, Old/Archive Memories, Other Memorable Moments",
        }),
        tournament: objectIdSchema.optional(),
        eventName: z.string().trim().min(1, "eventName cannot be empty").optional(),
        caption: z.string().trim().min(1, "caption cannot be empty").optional(),
        description: z.string().trim().min(1, "description cannot be empty").optional(),
        taggedPlayers: z.array(objectIdSchema).optional(),
    })
    .strict();

export const galleryUpdateSchema = galleryBodySchema.partial();

export const galleryParamsSchema = z.object({
    id: objectIdSchema,
});

export const galleryQuerySchema = z.object({
    year: z.coerce
        .number({ message: "year must be a valid number" })
        .int("year must be an integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year is too far in the future")
        .optional(),
    category: z
        .enum(GALLERY_CATEGORIES, {
            message:
                "category must be one of: SPARDHA, Inter-IIT, GC, Out Fest, Team Photos, Match Photos, Awards & Medal Celebrations, Old/Archive Memories, Other Memorable Moments",
        })
        .optional(),
    tournament: objectIdSchema.optional(),
    player: objectIdSchema.optional(),
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
        .enum(GALLERY_SORT_FIELDS, { message: "sort must be one of: year, category, createdAt, updatedAt" })
        .optional(),
    order: z.enum(["asc", "desc"], { message: "order must be either 'asc' or 'desc'" }).optional(),
});

export const validateGalleryBody = (req: Request, _res: Response, next: NextFunction): void => {
    const result = galleryBodySchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateGalleryUpdate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = galleryUpdateSchema.safeParse(req.body);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    req.body = result.data;
    next();
};

export const validateGalleryParams = (req: Request, _res: Response, next: NextFunction): void => {
    const result = galleryParamsSchema.safeParse(req.params);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.params, result.data);
    next();
};

export const validateGalleryQuery = (req: Request, _res: Response, next: NextFunction): void => {
    const result = galleryQuerySchema.safeParse(req.query);

    if (!result.success) {
        next(buildValidationError(result));
        return;
    }

    Object.assign(req.query, result.data);
    next();
};
