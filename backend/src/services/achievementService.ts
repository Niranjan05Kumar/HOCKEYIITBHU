import { isValidObjectId, type SortOrder } from "mongoose";
import AchievementModel from "../models/achievementModel.js";
import TournamentModel from "../models/tournamentModel.js";
import PlayerModel from "../models/playerModel.js";
import TeamModel from "../models/teamModel.js";
import AppError from "../utils/appError.js";

const ACHIEVEMENT_TYPES = ["Championship", "Medal", "Award", "Major Victory", "Individual Achievement"] as const;
const RECIPIENT_TYPES = ["Player", "Team"] as const;

export type AchievementCreateInput = {
    title: string;
    description?: string;
    type: (typeof ACHIEVEMENT_TYPES)[number];
    year: number;
    tournament?: string;
    recipientType: (typeof RECIPIENT_TYPES)[number];
    recipient: string;
};

export type AchievementQueryInput = {
    year?: number;
    type?: (typeof ACHIEVEMENT_TYPES)[number];
    recipientType?: (typeof RECIPIENT_TYPES)[number];
    page?: number;
    limit?: number;
    sort?: "year" | "title" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const assertValidObjectId = (id: string, label: string): void => {
    if (!isValidObjectId(id)) {
        throw new AppError(`${label} must be a valid MongoDB ObjectId`, 400);
    }
};

const validateAchievementType = (value: string | undefined): void => {
    if (value !== undefined && !ACHIEVEMENT_TYPES.includes(value as (typeof ACHIEVEMENT_TYPES)[number])) {
        throw new AppError(
            "type must be one of: Championship, Medal, Award, Major Victory, Individual Achievement",
            400,
        );
    }
};

const validateRecipientType = (value: string | undefined): void => {
    if (value !== undefined && !RECIPIENT_TYPES.includes(value as (typeof RECIPIENT_TYPES)[number])) {
        throw new AppError("recipientType must be either 'Player' or 'Team'", 400);
    }
};

export const createAchievement = async (data: AchievementCreateInput) => {
    validateAchievementType(data.type);
    validateRecipientType(data.recipientType);
    assertValidObjectId(data.recipient, "recipient");

    if (data.tournament) {
        assertValidObjectId(data.tournament, "tournament");
        const tournamentExists = await TournamentModel.exists({ _id: data.tournament });
        if (!tournamentExists) {
            throw new AppError("Referenced tournament not found", 404);
        }
    }

    const recipientExists =
        data.recipientType === "Player"
            ? await PlayerModel.exists({ _id: data.recipient })
            : await TeamModel.exists({ _id: data.recipient });

    if (!recipientExists) {
        throw new AppError(`Referenced ${data.recipientType.toLowerCase()} not found`, 404);
    }

    const achievement = await AchievementModel.create({
        title: data.title,
        ...(data.description !== undefined ? { description: data.description } : {}),
        type: data.type,
        year: data.year,
        ...(data.tournament !== undefined ? { tournament: data.tournament } : {}),
        recipientType: data.recipientType,
        recipient: data.recipient,
    });

    return achievement;
};

export const getAchievements = async (query: AchievementQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (typeof query.year === "number") {
        filter.year = query.year;
    }

    if (query.type) {
        validateAchievementType(query.type);
        filter.type = query.type;
    }

    if (query.recipientType) {
        validateRecipientType(query.recipientType);
        filter.recipientType = query.recipientType;
    }

    const [achievements, total] = await Promise.all([
        AchievementModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        AchievementModel.countDocuments(filter),
    ]);

    return {
        data: achievements,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getAchievementById = async (id: string) => {
    assertValidObjectId(id, "Achievement");

    const achievement = await AchievementModel.findById(id);

    if (!achievement) {
        throw new AppError("Achievement not found", 404);
    }

    return achievement;
};

export const updateAchievement = async (id: string, data: Partial<AchievementCreateInput>) => {
    assertValidObjectId(id, "Achievement");

    const achievement = await AchievementModel.findById(id);

    if (!achievement) {
        throw new AppError("Achievement not found", 404);
    }

    if (data.type !== undefined) {
        validateAchievementType(data.type);
    }

    if (data.recipientType !== undefined) {
        validateRecipientType(data.recipientType);
    }

    if (data.recipient !== undefined) {
        assertValidObjectId(data.recipient, "recipient");
    }

    if (data.tournament !== undefined) {
        assertValidObjectId(data.tournament, "tournament");
        const tournamentExists = await TournamentModel.exists({ _id: data.tournament });
        if (!tournamentExists) {
            throw new AppError("Referenced tournament not found", 404);
        }
    }

    const nextRecipientType = data.recipientType ?? achievement.recipientType;
    const nextRecipientId = data.recipient ?? achievement.recipient;
    const recipientExists =
        nextRecipientType === "Player"
            ? await PlayerModel.exists({ _id: nextRecipientId })
            : await TeamModel.exists({ _id: nextRecipientId });

    if (!recipientExists) {
        throw new AppError(`Referenced ${nextRecipientType.toLowerCase()} not found`, 404);
    }

    Object.assign(achievement, data);
    await achievement.save();

    return achievement;
};

export const deleteAchievement = async (id: string) => {
    assertValidObjectId(id, "Achievement");

    const achievement = await AchievementModel.findById(id);

    if (!achievement) {
        throw new AppError("Achievement not found", 404);
    }

    await AchievementModel.findByIdAndDelete(id);
    return achievement;
};
