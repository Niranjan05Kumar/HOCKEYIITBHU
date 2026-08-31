import { isValidObjectId, type SortOrder } from "mongoose";
import PlayerModel from "../models/playerModel.js";
import TeamModel from "../models/teamModel.js";
import TournamentEditionModel from "../models/tournamentEditionModel.js";
import AchievementModel from "../models/achievementModel.js";
import AppError from "../utils/appError.js";

const PLAYER_STATUSES = ["current", "former"] as const;
const PLAYING_POSITIONS = ["Forward", "Defender", "Midfielder", "Goalkeeper"] as const;

export type PlayerCreateInput = {
    name: string;
    profilePhoto?: string;
    playingPosition?: (typeof PLAYING_POSITIONS)[number];
    status: (typeof PLAYER_STATUSES)[number];
    playingYears?: number[];
    jerseyNumber?: number;
    leadershipRoles?: string[];
    achievements?: string[];
    individualStatistics?: Record<string, unknown>;
};

export type PlayerQueryInput = {
    status?: (typeof PLAYER_STATUSES)[number];
    position?: (typeof PLAYING_POSITIONS)[number];
    year?: number;
    page?: number;
    limit?: number;
    sort?: "name" | "status" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const assertValidObjectId = (id: string, label: string): void => {
    if (!isValidObjectId(id)) {
        throw new AppError(`${label} must be a valid MongoDB ObjectId`, 400);
    }
};

const validatePlayerStatus = (value: string | undefined, fieldName = "status"): void => {
    if (value !== undefined && !PLAYER_STATUSES.includes(value as (typeof PLAYER_STATUSES)[number])) {
        throw new AppError(`${fieldName} must be either 'current' or 'former'`, 400);
    }
};

const validatePlayingPosition = (value: string | undefined): void => {
    if (value !== undefined && !PLAYING_POSITIONS.includes(value as (typeof PLAYING_POSITIONS)[number])) {
        throw new AppError("playingPosition must be one of: Forward, Defender, Midfielder, Goalkeeper", 400);
    }
};

const validateObjectIdList = (ids: string[] | undefined, fieldName: string): void => {
    if (!ids) {
        return;
    }

    for (const id of ids) {
        assertValidObjectId(id, `${fieldName} item`);
    }
};

export const createPlayer = async (data: PlayerCreateInput) => {
    validatePlayerStatus(data.status);
    validatePlayingPosition(data.playingPosition);
    validateObjectIdList(data.achievements, "achievements");

    const player = await PlayerModel.create({
        name: data.name,
        ...(data.profilePhoto !== undefined ? { profilePhoto: data.profilePhoto } : {}),
        ...(data.playingPosition !== undefined ? { playingPosition: data.playingPosition } : {}),
        status: data.status,
        ...(data.playingYears !== undefined ? { playingYears: data.playingYears } : {}),
        ...(data.jerseyNumber !== undefined ? { jerseyNumber: data.jerseyNumber } : {}),
        ...(data.leadershipRoles !== undefined ? { leadershipRoles: data.leadershipRoles } : {}),
        ...(data.achievements !== undefined ? { achievements: data.achievements } : {}),
        ...(data.individualStatistics !== undefined ? { individualStatistics: data.individualStatistics } : {}),
    });

    return player;
};

export const getPlayers = async (query: PlayerQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (query.status) {
        validatePlayerStatus(query.status);
        filter.status = query.status;
    }

    if (query.position) {
        validatePlayingPosition(query.position);
        filter.playingPosition = query.position;
    }

    if (typeof query.year === "number") {
        filter.playingYears = query.year;
    }

    const [players, total] = await Promise.all([
        PlayerModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        PlayerModel.countDocuments(filter),
    ]);

    return {
        data: players,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getPlayerById = async (id: string) => {
    assertValidObjectId(id, "Player");

    const player = await PlayerModel.findById(id);

    if (!player) {
        throw new AppError("Player not found", 404);
    }

    return player;
};

export const updatePlayer = async (id: string, data: Partial<PlayerCreateInput>) => {
    assertValidObjectId(id, "Player");

    const player = await PlayerModel.findById(id);

    if (!player) {
        throw new AppError("Player not found", 404);
    }

    if (data.status !== undefined) {
        validatePlayerStatus(data.status);
    }

    if (data.playingPosition !== undefined) {
        validatePlayingPosition(data.playingPosition);
    }

    if (data.achievements !== undefined) {
        validateObjectIdList(data.achievements, "achievements");
    }

    Object.assign(player, data);
    await player.save();

    return player;
};

export const deletePlayer = async (id: string) => {
    assertValidObjectId(id, "Player");

    const player = await PlayerModel.findById(id);

    if (!player) {
        throw new AppError("Player not found", 404);
    }

    const [teamReferences, editionReferences, achievementReferences] = await Promise.all([
        TeamModel.findOne({
            $or: [{ players: id }, { captain: id }, { viceCaptain: id }],
        }).select("_id"),
        TournamentEditionModel.findOne({
            $or: [{ captain: id }, { viceCaptain: id }],
        }).select("_id"),
        AchievementModel.findOne({
            $and: [{ recipientType: "Player" }, { recipient: id }],
        }).select("_id"),
    ]);

    if (teamReferences || editionReferences || achievementReferences) {
        throw new AppError("Cannot delete player because it is referenced by other records", 409);
    }

    await PlayerModel.findByIdAndDelete(id);
    return player;
};
