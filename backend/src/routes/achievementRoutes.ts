import { Router } from "express";
import {
    createAchievementController,
    deleteAchievementController,
    getAchievementByIdController,
    getAchievementsController,
    updateAchievementController,
} from "../controllers/achievementController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateAchievementBody,
    validateAchievementParams,
    validateAchievementQuery,
    validateAchievementUpdate,
} from "../validators/achievementValidator.js";

const router = Router();

router.get("/", validateAchievementQuery, getAchievementsController);
router.get("/:id", validateAchievementParams, getAchievementByIdController);
router.post("/", validateAchievementBody, authMiddleware, createAchievementController);
router.patch("/:id", validateAchievementParams, validateAchievementUpdate, authMiddleware, updateAchievementController);
router.delete("/:id", validateAchievementParams, authMiddleware, deleteAchievementController);

export default router;
