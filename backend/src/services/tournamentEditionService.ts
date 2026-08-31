import { isValidObjectId, type SortOrder } from "mongoose";
import TournamentEditionModel from "../models/tournamentEditionModel.js";
import TournamentModel from "../models/tournamentModel.js";
import TeamModel from "../models/teamModel.js";
import PlayerModel from "../models/playerModel.js";
import MatchModel from "../models/matchModel.js";
import AppError from "../utils/appError.js";

export type TournamentEditionCreateInput = {
    tournament: string;
    year: number;
    edition: string;
    team: string;
    hostInstitute?: string;
    participatingTeams?: string[];
    finalPosition?: number;
    captain?: string;
    viceCaptain?: string;
    achievements?: string[];
    awards?: string[];
    photos?: string[];
};

export type TournamentEditionQueryInput = {
    tournament?: string;
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "edition" | "createdAt" | "updatedAt";
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

export const createTournamentEdition = async (data: TournamentEditionCreateInput) => {
    assertValidObjectId(data.tournament, "tournament");
    assertValidObjectId(data.team, "team");

    if (data.captain) {
        assertValidObjectId(data.captain, "captain");
    }

    if (data.viceCaptain) {
        assertValidObjectId(data.viceCaptain, "viceCaptain");
    }

    validateObjectIdList(data.achievements, "achievements");
    validateObjectIdList(data.awards, "awards");
    validateObjectIdList(data.photos, "photos");

    const tournamentExists = await TournamentModel.exists({ _id: data.tournament });
    if (!tournamentExists) {
        throw new AppError("Referenced tournament not found", 404);
    }

    const teamExists = await TeamModel.exists({ _id: data.team });
    if (!teamExists) {
        throw new AppError("Referenced team not found", 404);
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

    const duplicate = await TournamentEditionModel.findOne({
        tournament: data.tournament,
        year: data.year,
        edition: data.edition,
    }).select("_id");

    if (duplicate) {
        throw new AppError("A tournament edition for this tournament, year, and edition already exists", 409);
    }

    const edition = await TournamentEditionModel.create({
        tournament: data.tournament,
        year: data.year,
        edition: data.edition,
        team: data.team,
        ...(data.hostInstitute !== undefined ? { hostInstitute: data.hostInstitute } : {}),
        ...(data.participatingTeams !== undefined ? { participatingTeams: data.participatingTeams } : {}),
        ...(data.finalPosition !== undefined ? { finalPosition: data.finalPosition } : {}),
        ...(data.captain !== undefined ? { captain: data.captain } : {}),
        ...(data.viceCaptain !== undefined ? { viceCaptain: data.viceCaptain } : {}),
        ...(data.achievements !== undefined ? { achievements: data.achievements } : {}),
        ...(data.awards !== undefined ? { awards: data.awards } : {}),
        ...(data.photos !== undefined ? { photos: data.photos } : {}),
    });

    return edition;
};

export const getTournamentEditions = async (query: TournamentEditionQueryInput = {}) => {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sortField = query.sort ?? "createdAt";
    const order: SortOrder = query.order === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {};

    if (query.tournament) {
        assertValidObjectId(query.tournament, "tournament");
        filter.tournament = query.tournament;
    }

    if (typeof query.year === "number") {
        filter.year = query.year;
    }

    const [editions, total] = await Promise.all([
        TournamentEditionModel.find(filter)
            .sort({ [sortField]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        TournamentEditionModel.countDocuments(filter),
    ]);

    return {
        data: editions,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getTournamentEditionById = async (id: string) => {
    assertValidObjectId(id, "TournamentEdition");

    const edition = await TournamentEditionModel.findById(id);

    if (!edition) {
        throw new AppError("Tournament edition not found", 404);
    }

    return edition;
};

export const updateTournamentEdition = async (id: string, data: Partial<TournamentEditionCreateInput>) => {
    assertValidObjectId(id, "TournamentEdition");

    const edition = await TournamentEditionModel.findById(id);

    if (!edition) {
        throw new AppError("Tournament edition not found", 404);
    }

    if (data.tournament !== undefined) {
        assertValidObjectId(data.tournament, "tournament");
        const tournamentExists = await TournamentModel.exists({ _id: data.tournament });
        if (!tournamentExists) {
            throw new AppError("Referenced tournament not found", 404);
        }
    }

    if (data.team !== undefined) {
        assertValidObjectId(data.team, "team");
        const teamExists = await TeamModel.exists({ _id: data.team });
        if (!teamExists) {
            throw new AppError("Referenced team not found", 404);
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

    if (data.awards !== undefined) {
        validateObjectIdList(data.awards, "awards");
    }

    if (data.photos !== undefined) {
        validateObjectIdList(data.photos, "photos");
    }

    if (data.tournament !== undefined || data.year !== undefined || data.edition !== undefined) {
        const duplicate = await TournamentEditionModel.findOne({
            _id: { $ne: id },
            tournament: data.tournament ?? edition.tournament,
            year: data.year ?? edition.year,
            edition: data.edition ?? edition.edition,
        }).select("_id");

        if (duplicate) {
            throw new AppError("A tournament edition for this tournament, year, and edition already exists", 409);
        }
    }

    Object.assign(edition, data);
    await edition.save();

    return edition;
};

export const deleteTournamentEdition = async (id: string) => {
    assertValidObjectId(id, "TournamentEdition");

    const edition = await TournamentEditionModel.findById(id);

    if (!edition) {
        throw new AppError("Tournament edition not found", 404);
    }

    const matchInUse = await MatchModel.findOne({ tournamentEdition: id }).select("_id");
    if (matchInUse) {
        throw new AppError("Cannot delete tournament edition because it has associated matches", 409);
    }

    await TournamentEditionModel.findByIdAndDelete(id);
    return edition;
};
