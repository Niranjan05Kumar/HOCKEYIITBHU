import { isValidObjectId, type SortOrder } from "mongoose";
import GalleryItemModel from "../models/galleryItemModel.js";
import { deleteImage } from "../services/imageService.js";
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

export type GalleryItemCreateInput = {
    imageUrl: string;
    imageFileId?: string;
    category: (typeof GALLERY_CATEGORIES)[number];
    year?: number;
    tournament?: string;
    eventName?: string;
    caption?: string;
    description?: string;
    taggedPlayers?: string[];
};

export type GalleryItemQueryInput = {
    category?: (typeof GALLERY_CATEGORIES)[number];
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const validateGalleryCategory = (value: string | undefined): void => {
    if (value !== undefined && !GALLERY_CATEGORIES.includes(value as (typeof GALLERY_CATEGORIES)[number])) {
        throw new AppError(
            "category must be one of: SPARDHA, Inter-IIT, GC, Out Fest, Team Photos, Match Photos, Awards & Medal Celebrations, Old/Archive Memories, Other Memorable Moments",
            400,
        );
    }
};

export const createGalleryItem = async (data: GalleryItemCreateInput) => {
    validateGalleryCategory(data.category);

    const item = await GalleryItemModel.create({
        imageUrl: data.imageUrl,
        ...(data.imageFileId !== undefined ? { imageFileId: data.imageFileId } : {}),
        category: data.category,
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.tournament !== undefined ? { tournament: data.tournament } : {}),
        ...(data.eventName !== undefined ? { eventName: data.eventName } : {}),
        ...(data.caption !== undefined ? { caption: data.caption } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.taggedPlayers !== undefined ? { taggedPlayers: data.taggedPlayers } : {}),
    });

    return item;
};

export const getGalleryItems = async (query: GalleryItemQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (query.category) {
        validateGalleryCategory(query.category);
        filter.category = query.category;
    }

    if (typeof query.year === "number") {
        filter.year = query.year;
    }

    const [items, total] = await Promise.all([
        GalleryItemModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        GalleryItemModel.countDocuments(filter),
    ]);

    return {
        data: items,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getGalleryItemById = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new AppError("Gallery item id must be a valid MongoDB ObjectId", 400);
    }

    const item = await GalleryItemModel.findById(id);

    if (!item) {
        throw new AppError("Gallery item not found", 404);
    }

    return item;
};

export const updateGalleryItem = async (id: string, data: Partial<GalleryItemCreateInput>) => {
    if (!isValidObjectId(id)) {
        throw new AppError("Gallery item id must be a valid MongoDB ObjectId", 400);
    }

    const item = await GalleryItemModel.findById(id);

    if (!item) {
        throw new AppError("Gallery item not found", 404);
    }

    if (data.category !== undefined) {
        validateGalleryCategory(data.category);
    }

    if (data.imageUrl !== undefined && data.imageUrl !== item.imageUrl && item.imageFileId) {
        await deleteImage(item.imageFileId);
    }

    if (data.imageFileId !== undefined && data.imageFileId !== item.imageFileId && item.imageFileId) {
        await deleteImage(item.imageFileId);
    }

    const nextData: Partial<GalleryItemCreateInput> = {};

    if (data.imageUrl !== undefined) nextData.imageUrl = data.imageUrl;
    if (data.imageFileId !== undefined) nextData.imageFileId = data.imageFileId;
    if (data.category !== undefined) nextData.category = data.category;
    if (data.year !== undefined) nextData.year = data.year;
    if (data.tournament !== undefined) nextData.tournament = data.tournament;
    if (data.eventName !== undefined) nextData.eventName = data.eventName;
    if (data.caption !== undefined) nextData.caption = data.caption;
    if (data.description !== undefined) nextData.description = data.description;
    if (data.taggedPlayers !== undefined) nextData.taggedPlayers = data.taggedPlayers;

    Object.assign(item, nextData);
    await item.save();

    return item;
};

export const deleteGalleryItem = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new AppError("Gallery item id must be a valid MongoDB ObjectId", 400);
    }

    const item = await GalleryItemModel.findById(id);

    if (!item) {
        throw new AppError("Gallery item not found", 404);
    }

    if (item.imageFileId) {
        await deleteImage(item.imageFileId);
    }

    await GalleryItemModel.findByIdAndDelete(id);
    return item;
};
