import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createAchievement,
    deleteAchievement,
    getAchievementById,
    getAchievements,
    updateAchievement,
    type AchievementCreateInput,
    type AchievementQueryInput,
} from "../services/achievementService.js";

export const createAchievementController = asyncHandler(async (req: Request, res: Response) => {
    const achievement = await createAchievement(req.body as AchievementCreateInput);

    res.status(201).json({
        success: true,
        data: achievement,
        message: "Achievement created successfully",
    });
});

export const getAchievementsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getAchievements(req.query as AchievementQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Achievements fetched successfully",
    });
});

export const getAchievementByIdController = asyncHandler(async (req: Request, res: Response) => {
    const achievement = await getAchievementById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: achievement,
        message: "Achievement fetched successfully",
    });
});

export const updateAchievementController = asyncHandler(async (req: Request, res: Response) => {
    const achievement = await updateAchievement(req.params.id as string, req.body as Partial<AchievementCreateInput>);

    res.status(200).json({
        success: true,
        data: achievement,
        message: "Achievement updated successfully",
    });
});

export const deleteAchievementController = asyncHandler(async (req: Request, res: Response) => {
    await deleteAchievement(req.params.id as string);
    res.status(204).send();
});
