import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createPlayer,
    deletePlayer,
    getPlayerById,
    getPlayers,
    updatePlayer,
    type PlayerCreateInput,
    type PlayerQueryInput,
} from "../services/playerService.js";

export const createPlayerController = asyncHandler(async (req: Request, res: Response) => {
    const player = await createPlayer(req.body as PlayerCreateInput);

    res.status(201).json({
        success: true,
        data: player,
        message: "Player created successfully",
    });
});

export const getPlayersController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getPlayers(req.query as PlayerQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Players fetched successfully",
    });
});

export const getPlayerByIdController = asyncHandler(async (req: Request, res: Response) => {
    const player = await getPlayerById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: player,
        message: "Player fetched successfully",
    });
});

export const updatePlayerController = asyncHandler(async (req: Request, res: Response) => {
    const player = await updatePlayer(req.params.id as string, req.body as Partial<PlayerCreateInput>);

    res.status(200).json({
        success: true,
        data: player,
        message: "Player updated successfully",
    });
});

export const deletePlayerController = asyncHandler(async (req: Request, res: Response) => {
    await deletePlayer(req.params.id as string);
    res.status(204).send();
});
