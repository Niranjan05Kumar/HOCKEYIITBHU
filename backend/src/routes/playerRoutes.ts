import { Router } from "express";
import {
    createPlayerController,
    deletePlayerController,
    getPlayerByIdController,
    getPlayersController,
    updatePlayerController,
} from "../controllers/playerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachUploadedImage } from "../middleware/imageUploadMiddleware.js";
import {
    validatePlayerBody,
    validatePlayerParams,
    validatePlayerQuery,
    validatePlayerUpdate,
} from "../validators/playerValidator.js";

const router = Router();

router.get("/", validatePlayerQuery, getPlayersController);
router.get("/:id", validatePlayerParams, getPlayerByIdController);
router.post(
    "/",
    authMiddleware,
    attachUploadedImage("profilePhotoFile", "profilePhoto", "profilePhotoFileId"),
    validatePlayerBody,
    createPlayerController,
);
router.patch(
    "/:id",
    authMiddleware,
    attachUploadedImage("profilePhotoFile", "profilePhoto", "profilePhotoFileId"),
    validatePlayerParams,
    validatePlayerUpdate,
    updatePlayerController,
);
router.delete("/:id", validatePlayerParams, authMiddleware, deletePlayerController);

export default router;
