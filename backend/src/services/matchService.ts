import { isValidObjectId, type SortOrder } from "mongoose";
import MatchModel from "../models/matchModel.js";
import TournamentEditionModel from "../models/tournamentEditionModel.js";
import AppError from "../utils/appError.js";

const MATCH_RESULTS = ["Win", "Loss", "Draw"] as const;

export type MatchCreateInput = {
    tournamentEdition: string;
    date?: Date | string;
    opponent: string;
    iitBhuScore?: number;
    opponentScore?: number;
    result?: (typeof MATCH_RESULTS)[number];
    round?: string;
};

export type MatchQueryInput = {
    tournamentEditionId?: string;
    page?: number;
    limit?: number;
    sort?: "date" | "opponent" | "createdAt" | "updatedAt";
    order?: SortOrder;
};

const assertValidObjectId = (id: string, label: string): void => {
    if (!isValidObjectId(id)) {
        throw new AppError(`${label} must be a valid MongoDB ObjectId`, 400);
    }
};

const validateMatchResult = (value: string | undefined): void => {
    if (value !== undefined && !MATCH_RESULTS.includes(value as (typeof MATCH_RESULTS)[number])) {
        throw new AppError("result must be one of: Win, Loss, Draw", 400);
    }
};

export const createMatch = async (data: MatchCreateInput) => {
    assertValidObjectId(data.tournamentEdition, "tournamentEdition");
    validateMatchResult(data.result);

    const editionExists = await TournamentEditionModel.exists({ _id: data.tournamentEdition });
    if (!editionExists) {
        throw new AppError("Referenced tournament edition not found", 404);
    }

    if (data.iitBhuScore !== undefined && data.iitBhuScore < 0) {
        throw new AppError("iitBhuScore cannot be negative", 400);
    }

    if (data.opponentScore !== undefined && data.opponentScore < 0) {
        throw new AppError("opponentScore cannot be negative", 400);
    }

    const match = await MatchModel.create({
        tournamentEdition: data.tournamentEdition,
        opponent: data.opponent,
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(data.iitBhuScore !== undefined ? { iitBhuScore: data.iitBhuScore } : {}),
        ...(data.opponentScore !== undefined ? { opponentScore: data.opponentScore } : {}),
        ...(data.result !== undefined ? { result: data.result } : {}),
        ...(data.round !== undefined ? { round: data.round } : {}),
    });

    return match;
};

export const getMatches = async (query: MatchQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (query.tournamentEditionId) {
        assertValidObjectId(query.tournamentEditionId, "tournamentEditionId");
        filter.tournamentEdition = query.tournamentEditionId;
    }

    const [matches, total] = await Promise.all([
        MatchModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        MatchModel.countDocuments(filter),
    ]);

    return {
        data: matches,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getMatchById = async (id: string) => {
    assertValidObjectId(id, "Match");

    const match = await MatchModel.findById(id);

    if (!match) {
        throw new AppError("Match not found", 404);
    }

    return match;
};

export const updateMatch = async (id: string, data: Partial<MatchCreateInput>) => {
    assertValidObjectId(id, "Match");

    const match = await MatchModel.findById(id);

    if (!match) {
        throw new AppError("Match not found", 404);
    }

    if (data.tournamentEdition !== undefined) {
        assertValidObjectId(data.tournamentEdition, "tournamentEdition");
        const editionExists = await TournamentEditionModel.exists({ _id: data.tournamentEdition });
        if (!editionExists) {
            throw new AppError("Referenced tournament edition not found", 404);
        }
    }

    if (data.result !== undefined) {
        validateMatchResult(data.result);
    }

    if (data.iitBhuScore !== undefined && data.iitBhuScore < 0) {
        throw new AppError("iitBhuScore cannot be negative", 400);
    }

    if (data.opponentScore !== undefined && data.opponentScore < 0) {
        throw new AppError("opponentScore cannot be negative", 400);
    }

    Object.assign(match, data, { date: data.date ? new Date(data.date) : match.date });
    await match.save();

    return match;
};

export const deleteMatch = async (id: string) => {
    assertValidObjectId(id, "Match");

    const match = await MatchModel.findById(id);

    if (!match) {
        throw new AppError("Match not found", 404);
    }

    await MatchModel.findByIdAndDelete(id);
    return match;
};
