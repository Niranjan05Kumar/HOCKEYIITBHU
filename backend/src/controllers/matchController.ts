import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createMatch,
    deleteMatch,
    getMatchById,
    getMatches,
    updateMatch,
    type MatchCreateInput,
    type MatchQueryInput,
} from "../services/matchService.js";

export const createMatchController = asyncHandler(async (req: Request, res: Response) => {
    const match = await createMatch(req.body as MatchCreateInput);

    res.status(201).json({
        success: true,
        data: match,
        message: "Match created successfully",
    });
});

export const getMatchesController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getMatches(req.query as MatchQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Matches fetched successfully",
    });
});

export const getMatchByIdController = asyncHandler(async (req: Request, res: Response) => {
    const match = await getMatchById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: match,
        message: "Match fetched successfully",
    });
});

export const updateMatchController = asyncHandler(async (req: Request, res: Response) => {
    const match = await updateMatch(req.params.id as string, req.body as Partial<MatchCreateInput>);

    res.status(200).json({
        success: true,
        data: match,
        message: "Match updated successfully",
    });
});

export const deleteMatchController = asyncHandler(async (req: Request, res: Response) => {
    await deleteMatch(req.params.id as string);
    res.status(204).send();
});
