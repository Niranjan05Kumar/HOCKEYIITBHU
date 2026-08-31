import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createTournamentEdition,
    deleteTournamentEdition,
    getTournamentEditionById,
    getTournamentEditions,
    updateTournamentEdition,
    type TournamentEditionCreateInput,
    type TournamentEditionQueryInput,
} from "../services/tournamentEditionService.js";

export const createTournamentEditionController = asyncHandler(async (req: Request, res: Response) => {
    const edition = await createTournamentEdition(req.body as TournamentEditionCreateInput);

    res.status(201).json({
        success: true,
        data: edition,
        message: "Tournament edition created successfully",
    });
});

export const getTournamentEditionsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getTournamentEditions(req.query as TournamentEditionQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Tournament editions fetched successfully",
    });
});

export const getTournamentEditionByIdController = asyncHandler(async (req: Request, res: Response) => {
    const edition = await getTournamentEditionById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: edition,
        message: "Tournament edition fetched successfully",
    });
});

export const updateTournamentEditionController = asyncHandler(async (req: Request, res: Response) => {
    const edition = await updateTournamentEdition(
        req.params.id as string,
        req.body as Partial<TournamentEditionCreateInput>,
    );

    res.status(200).json({
        success: true,
        data: edition,
        message: "Tournament edition updated successfully",
    });
});

export const deleteTournamentEditionController = asyncHandler(async (req: Request, res: Response) => {
    await deleteTournamentEdition(req.params.id as string);
    res.status(204).send();
});
