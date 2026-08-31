import { isValidObjectId, type SortOrder } from "mongoose";
import TournamentModel from "../models/tournamentModel.js";
import TournamentEditionModel from "../models/tournamentEditionModel.js";
import AppError from "../utils/appError.js";

const TOURNAMENT_TYPES = [
    "SPARDHA",
    "Inter-IIT",
    "Inter-IIT Sports Meet",
    "GC",
    "General Championship (GC)",
    "Out Fest",
    "Sports Out Fests",
    "institute_sports_fest",
] as const;

export type TournamentCreateInput = {
    name: string;
    type: (typeof TOURNAMENT_TYPES)[number];
    description?: string;
    logo?: string;
};

export type TournamentQueryInput = {
    name?: string;
    type?: (typeof TOURNAMENT_TYPES)[number];
    page?: number;
    limit?: number;
    sort?: "name" | "type" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const assertValidObjectId = (id: string, label: string): void => {
    if (!isValidObjectId(id)) {
        throw new AppError(`${label} must be a valid MongoDB ObjectId`, 400);
    }
};

const validateTournamentType = (value: string | undefined): void => {
    if (value !== undefined && !TOURNAMENT_TYPES.includes(value as (typeof TOURNAMENT_TYPES)[number])) {
        throw new AppError(
            "type must match a supported tournament category: SPARDHA, Inter-IIT, GC, Out Fest, or a documented equivalent",
            400,
        );
    }
};

export const createTournament = async (data: TournamentCreateInput) => {
    validateTournamentType(data.type);

    const duplicate = await TournamentModel.findOne({ name: data.name.trim(), type: data.type }).select("_id");
    if (duplicate) {
        throw new AppError("A tournament with this name and type already exists", 409);
    }

    const tournament = await TournamentModel.create({
        name: data.name,
        type: data.type,
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.logo !== undefined ? { logo: data.logo } : {}),
    });

    return tournament;
};

export const getTournaments = async (query: TournamentQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (query.name) {
        filter.name = { $regex: query.name.trim(), $options: "i" };
    }

    if (query.type) {
        validateTournamentType(query.type);
        filter.type = query.type;
    }

    const [tournaments, total] = await Promise.all([
        TournamentModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        TournamentModel.countDocuments(filter),
    ]);

    return {
        data: tournaments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getTournamentById = async (id: string) => {
    assertValidObjectId(id, "Tournament");

    const tournament = await TournamentModel.findById(id);

    if (!tournament) {
        throw new AppError("Tournament not found", 404);
    }

    return tournament;
};

export const updateTournament = async (id: string, data: Partial<TournamentCreateInput>) => {
    assertValidObjectId(id, "Tournament");

    const tournament = await TournamentModel.findById(id);

    if (!tournament) {
        throw new AppError("Tournament not found", 404);
    }

    if (data.type !== undefined) {
        validateTournamentType(data.type);
    }

    if (data.name !== undefined || data.type !== undefined) {
        const duplicate = await TournamentModel.findOne({
            _id: { $ne: id },
            name: (data.name ?? tournament.name).trim(),
            type: data.type ?? tournament.type,
        }).select("_id");

        if (duplicate) {
            throw new AppError("A tournament with this name and type already exists", 409);
        }
    }

    Object.assign(tournament, data);
    await tournament.save();

    return tournament;
};

export const deleteTournament = async (id: string) => {
    assertValidObjectId(id, "Tournament");

    const tournament = await TournamentModel.findById(id);

    if (!tournament) {
        throw new AppError("Tournament not found", 404);
    }

    const editionInUse = await TournamentEditionModel.findOne({ tournament: id }).select("_id");
    if (editionInUse) {
        throw new AppError("Cannot delete tournament because it has associated editions", 409);
    }

    await TournamentModel.findByIdAndDelete(id);
    return tournament;
};
