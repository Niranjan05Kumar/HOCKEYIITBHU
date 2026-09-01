import "dotenv/config";
import ImageKit from "@imagekit/nodejs";
import AppError from "../utils/appError.js";

export type ImageKitConfig = {
    privateKey: string;
    maxFileSizeBytes: number;
};

const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const parseMaxFileSize = (value: string | undefined): number => {
    if (value === undefined || value.trim() === "") {
        return DEFAULT_MAX_FILE_SIZE_BYTES;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new AppError("IMAGEKIT_MAX_FILE_SIZE_BYTES must be a positive integer", 500);
    }

    return parsed;
};

export const getImageKitConfig = (): ImageKitConfig => {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();

    if (!privateKey) {
        throw new AppError("ImageKit configuration is incomplete. Set IMAGEKIT_PRIVATE_KEY", 500);
    }

    return {
        privateKey,
        maxFileSizeBytes: parseMaxFileSize(process.env.IMAGEKIT_MAX_FILE_SIZE_BYTES),
    };
};

const { privateKey } = getImageKitConfig();

export const imageKitClient = new ImageKit({
    privateKey,
});
