import { isValidObjectId, type SortOrder } from "mongoose";
import TeamModel from "../models/teamModel.js";
import PlayerModel from "../models/playerModel.js";
import TournamentEditionModel from "../models/tournamentEditionModel.js";
import AchievementModel from "../models/achievementModel.js";
import { deleteImage } from "../services/imageService.js";
import AppError from "../utils/appError.js";

export type TeamCreateInput = {
    year: number;
    players: string[];
    captain?: string;
    viceCaptain?: string;
    coach?: string;
    teamPhoto?: string;
    teamPhotoFileId?: string;
    achievements?: string[];
};

export type TeamQueryInput = {
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const assertValidObjectId = (id: string, label: string): void => {
    if (!isValidObjectId(id)) {
        throw new AppError(`${label} must be a valid MongoDB ObjectId`, 400);
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

export const createTeam = async (data: TeamCreateInput) => {
    if (data.year < 1900 || data.year > new Date().getFullYear() + 1) {
        throw new AppError("Year must be within a valid range", 400);
    }

    validateObjectIdList(data.players, "players");
    validateObjectIdList(data.achievements, "achievements");

    if (data.captain) {
        assertValidObjectId(data.captain, "captain");
    }

    if (data.viceCaptain) {
        assertValidObjectId(data.viceCaptain, "viceCaptain");
    }

    if (data.players.length === 0) {
        throw new AppError("At least one player reference is required", 400);
    }

    const existingYearTeam = await TeamModel.findOne({ year: data.year }).select("_id");
    if (existingYearTeam) {
        throw new AppError("A team already exists for this year", 409);
    }

    const existingPlayers = await PlayerModel.find({ _id: { $in: data.players } }).select("_id");
    if (existingPlayers.length !== data.players.length) {
        throw new AppError("One or more player references are invalid", 400);
    }

    if (data.captain) {
        const captainExists = await PlayerModel.exists({ _id: data.captain });
        if (!captainExists) {
            throw new AppError("Captain must reference an existing player", 400);
        }
    }

    if (data.viceCaptain) {
        const viceCaptainExists = await PlayerModel.exists({ _id: data.viceCaptain });
        if (!viceCaptainExists) {
            throw new AppError("Vice-captain must reference an existing player", 400);
        }
    }

    const team = await TeamModel.create({
        ...data,
        ...(data.teamPhotoFileId !== undefined ? { teamPhotoFileId: data.teamPhotoFileId } : {}),
    });
    return team;
};

export const getTeams = async (query: TeamQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (typeof query.year === "number") {
        filter.year = query.year;
    }

    const [teams, total] = await Promise.all([
        TeamModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        TeamModel.countDocuments(filter),
    ]);

    return {
        data: teams,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getTeamById = async (id: string) => {
    assertValidObjectId(id, "Team");

    const team = await TeamModel.findById(id);

    if (!team) {
        throw new AppError("Team not found", 404);
    }

    return team;
};

export const updateTeam = async (id: string, data: Partial<TeamCreateInput>) => {
    assertValidObjectId(id, "Team");

    const team = await TeamModel.findById(id);

    if (!team) {
        throw new AppError("Team not found", 404);
    }

    if (data.year !== undefined) {
        if (data.year < 1900 || data.year > new Date().getFullYear() + 1) {
            throw new AppError("Year must be within a valid range", 400);
        }

        const yearConflict = await TeamModel.findOne({ year: data.year, _id: { $ne: id } }).select("_id");
        if (yearConflict) {
            throw new AppError("A team already exists for this year", 409);
        }
    }

    if (data.players) {
        validateObjectIdList(data.players, "players");
        const existingPlayers = await PlayerModel.find({ _id: { $in: data.players } }).select("_id");
        if (existingPlayers.length !== data.players.length) {
            throw new AppError("One or more player references are invalid", 400);
        }
    }

    if (data.captain !== undefined) {
        assertValidObjectId(data.captain, "captain");
    }

    if (data.viceCaptain !== undefined) {
        assertValidObjectId(data.viceCaptain, "viceCaptain");
    }

    if (data.achievements !== undefined) {
        validateObjectIdList(data.achievements, "achievements");
    }

    if (data.teamPhoto !== undefined && data.teamPhoto !== team.teamPhoto && team.teamPhotoFileId) {
        await deleteImage(team.teamPhotoFileId);
    }

    if (data.teamPhotoFileId !== undefined && data.teamPhotoFileId !== team.teamPhotoFileId) {
        if (team.teamPhotoFileId && data.teamPhoto === undefined) {
            await deleteImage(team.teamPhotoFileId);
        }
    }

    Object.assign(team, data);
    await team.save();

    return team;
};

export const deleteTeam = async (id: string) => {
    assertValidObjectId(id, "Team");

    const team = await TeamModel.findById(id);

    if (!team) {
        throw new AppError("Team not found", 404);
    }

    const editionInUse = await TournamentEditionModel.findOne({ team: id }).select("_id");
    if (editionInUse) {
        throw new AppError("Cannot delete team because it is linked to tournament editions", 409);
    }

    const achievementInUse = await AchievementModel.findOne({
        $and: [{ recipientType: "Team" }, { recipient: id }],
    }).select("_id");
    if (achievementInUse) {
        throw new AppError("Cannot delete team because it is referenced by achievement records", 409);
    }

    if (team.teamPhotoFileId) {
        await deleteImage(team.teamPhotoFileId);
    }

    await TeamModel.findByIdAndDelete(id);
    return team;
};
