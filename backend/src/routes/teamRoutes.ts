import { Router } from "express";
import {
    createTeamController,
    deleteTeamController,
    getTeamByIdController,
    getTeamsController,
    updateTeamController,
} from "../controllers/teamController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateTeamBody,
    validateTeamParams,
    validateTeamQuery,
    validateTeamUpdate,
} from "../validators/teamValidator.js";

const router = Router();

router.get("/", validateTeamQuery, getTeamsController);
router.get("/:id", validateTeamParams, getTeamByIdController);
router.post("/", validateTeamBody, authMiddleware, createTeamController);
router.patch("/:id", validateTeamParams, validateTeamUpdate, authMiddleware, updateTeamController);
router.delete("/:id", validateTeamParams, authMiddleware, deleteTeamController);

export default router;
