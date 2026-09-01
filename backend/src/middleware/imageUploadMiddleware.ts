import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import AppError from "../utils/appError.js";
import { getImageUploadLimit, uploadImage } from "../services/imageService.js";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: getImageUploadLimit(),
    },
    fileFilter: (_req: Request, file, callback) => {
        if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            callback(null, true);
            return;
        }

        callback(new AppError("Unsupported image type. Allowed types: JPEG, PNG, WebP, GIF", 400));
    },
});

const sanitizeFileName = (fileName: string): string => {
    const cleanedName = (fileName || "upload").replace(/[^a-zA-Z0-9._-]+/g, "_").trim();
    return cleanedName || "upload";
};

const parseJsonLikeValue = (value: unknown): unknown => {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return value;
    }

    try {
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
            return JSON.parse(trimmed);
        }
    } catch {
        // Ignore JSON parsing failures and keep the original string value.
    }

    return value;
};

export const attachUploadedImage = (fieldName: string, targetField: string, fileIdField: string) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        upload.single(fieldName)(req, _res, async (error) => {
            if (error) {
                next(error);
                return;
            }

            if (req.body) {
                Object.entries(req.body).forEach(([key, value]) => {
                    req.body[key] = parseJsonLikeValue(value);
                });
            }

            if (!req.file) {
                next();
                return;
            }

            try {
                const uploadedImage = await uploadImage({
                    file: req.file.buffer,
                    fileName: sanitizeFileName(req.file.originalname || "upload"),
                    mimeType: req.file.mimetype || "application/octet-stream",
                });

                req.body[targetField] = uploadedImage.url;
                req.body[fileIdField] = uploadedImage.fileId;
                next();
            } catch (uploadError) {
                next(uploadError);
            }
        });
    };
};
