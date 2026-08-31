import { Router } from "express";
import {
    createPlayerController,
    deletePlayerController,
    getPlayerByIdController,
    getPlayersController,
    updatePlayerController,
} from "../controllers/playerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validatePlayerBody,
    validatePlayerParams,
    validatePlayerQuery,
    validatePlayerUpdate,
} from "../validators/playerValidator.js";

const router = Router();

router.get("/", validatePlayerQuery, getPlayersController);
router.get("/:id", validatePlayerParams, getPlayerByIdController);
router.post("/", validatePlayerBody, authMiddleware, createPlayerController);
router.patch("/:id", validatePlayerParams, validatePlayerUpdate, authMiddleware, updatePlayerController);
router.delete("/:id", validatePlayerParams, authMiddleware, deletePlayerController);

export default router;
