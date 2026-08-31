import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createTeam,
    deleteTeam,
    getTeamById,
    getTeams,
    updateTeam,
    type TeamCreateInput,
    type TeamQueryInput,
} from "../services/teamService.js";

export const createTeamController = asyncHandler(async (req: Request, res: Response) => {
    const team = await createTeam(req.body as TeamCreateInput);

    res.status(201).json({
        success: true,
        data: team,
        message: "Team created successfully",
    });
});

export const getTeamsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getTeams(req.query as TeamQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Teams fetched successfully",
    });
});

export const getTeamByIdController = asyncHandler(async (req: Request, res: Response) => {
    const team = await getTeamById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: team,
        message: "Team fetched successfully",
    });
});

export const updateTeamController = asyncHandler(async (req: Request, res: Response) => {
    const team = await updateTeam(req.params.id as string, req.body as Partial<TeamCreateInput>);

    res.status(200).json({
        success: true,
        data: team,
        message: "Team updated successfully",
    });
});

export const deleteTeamController = asyncHandler(async (req: Request, res: Response) => {
    await deleteTeam(req.params.id as string);
    res.status(204).send();
});
