import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createTournament,
    deleteTournament,
    getTournamentById,
    getTournaments,
    updateTournament,
    type TournamentCreateInput,
    type TournamentQueryInput,
} from "../services/tournamentService.js";

export const createTournamentController = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await createTournament(req.body as TournamentCreateInput);

    res.status(201).json({
        success: true,
        data: tournament,
        message: "Tournament created successfully",
    });
});

export const getTournamentsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getTournaments(req.query as TournamentQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Tournaments fetched successfully",
    });
});

export const getTournamentByIdController = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await getTournamentById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: tournament,
        message: "Tournament fetched successfully",
    });
});

export const updateTournamentController = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await updateTournament(req.params.id as string, req.body as Partial<TournamentCreateInput>);

    res.status(200).json({
        success: true,
        data: tournament,
        message: "Tournament updated successfully",
    });
});

export const deleteTournamentController = asyncHandler(async (req: Request, res: Response) => {
    await deleteTournament(req.params.id as string);
    res.status(204).send();
});
