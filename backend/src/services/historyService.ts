import { isValidObjectId, type SortOrder } from "mongoose";
import HistoryEventModel from "../models/historyEventModel.js";
import AppError from "../utils/appError.js";

const HISTORY_CATEGORIES = ["Major Victory", "Championship", "Medal", "Milestone", "Memorable Performance"] as const;

export type HistoryEventCreateInput = {
    title: string;
    description: string;
    year: number;
    category: (typeof HISTORY_CATEGORIES)[number];
    tournament?: string;
    achievement?: string;
    photo?: string;
};

export type HistoryEventQueryInput = {
    year?: number;
    category?: (typeof HISTORY_CATEGORIES)[number];
    page?: number;
    limit?: number;
    sort?: "year" | "title" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const validateHistoryCategory = (value: string | undefined): void => {
    if (value !== undefined && !HISTORY_CATEGORIES.includes(value as (typeof HISTORY_CATEGORIES)[number])) {
        throw new AppError(
            "category must be one of: Major Victory, Championship, Medal, Milestone, Memorable Performance",
            400,
        );
    }
};

export const createHistoryEvent = async (data: HistoryEventCreateInput) => {
    validateHistoryCategory(data.category);

    const event = await HistoryEventModel.create({
        title: data.title,
        description: data.description,
        year: data.year,
        category: data.category,
        ...(data.tournament !== undefined ? { tournament: data.tournament } : {}),
        ...(data.achievement !== undefined ? { achievement: data.achievement } : {}),
        ...(data.photo !== undefined ? { photo: data.photo } : {}),
    });

    return event;
};

export const getHistoryEvents = async (query: HistoryEventQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "year";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (typeof query.year === "number") {
        filter.year = query.year;
    }

    if (query.category) {
        validateHistoryCategory(query.category);
        filter.category = query.category;
    }

    const [events, total] = await Promise.all([
        HistoryEventModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        HistoryEventModel.countDocuments(filter),
    ]);

    return {
        data: events,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getHistoryEventById = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new AppError("History event id must be a valid MongoDB ObjectId", 400);
    }

    const event = await HistoryEventModel.findById(id);

    if (!event) {
        throw new AppError("History event not found", 404);
    }

    return event;
};

export const updateHistoryEvent = async (id: string, data: Partial<HistoryEventCreateInput>) => {
    if (!isValidObjectId(id)) {
        throw new AppError("History event id must be a valid MongoDB ObjectId", 400);
    }

    const event = await HistoryEventModel.findById(id);

    if (!event) {
        throw new AppError("History event not found", 404);
    }

    if (data.category !== undefined) {
        validateHistoryCategory(data.category);
    }

    const nextData: Partial<HistoryEventCreateInput> = {};

    if (data.title !== undefined) nextData.title = data.title;
    if (data.description !== undefined) nextData.description = data.description;
    if (data.year !== undefined) nextData.year = data.year;
    if (data.category !== undefined) nextData.category = data.category;
    if (data.tournament !== undefined) nextData.tournament = data.tournament;
    if (data.achievement !== undefined) nextData.achievement = data.achievement;
    if (data.photo !== undefined) nextData.photo = data.photo;

    Object.assign(event, nextData);
    await event.save();

    return event;
};

export const deleteHistoryEvent = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new AppError("History event id must be a valid MongoDB ObjectId", 400);
    }

    const event = await HistoryEventModel.findById(id);

    if (!event) {
        throw new AppError("History event not found", 404);
    }

    await HistoryEventModel.findByIdAndDelete(id);
    return event;
};
