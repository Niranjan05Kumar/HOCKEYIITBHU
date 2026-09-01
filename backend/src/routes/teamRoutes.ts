import { Router } from "express";
import {
    createTeamController,
    deleteTeamController,
    getTeamByIdController,
    getTeamsController,
    updateTeamController,
} from "../controllers/teamController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachUploadedImage } from "../middleware/imageUploadMiddleware.js";
import {
    validateTeamBody,
    validateTeamParams,
    validateTeamQuery,
    validateTeamUpdate,
} from "../validators/teamValidator.js";

const router = Router();

router.get("/", validateTeamQuery, getTeamsController);
router.get("/:id", validateTeamParams, getTeamByIdController);
router.post(
    "/",
    authMiddleware,
    attachUploadedImage("teamPhotoFile", "teamPhoto", "teamPhotoFileId"),
    validateTeamBody,
    createTeamController,
);
router.patch(
    "/:id",
    authMiddleware,
    attachUploadedImage("teamPhotoFile", "teamPhoto", "teamPhotoFileId"),
    validateTeamParams,
    validateTeamUpdate,
    updateTeamController,
);
router.delete("/:id", validateTeamParams, authMiddleware, deleteTeamController);

export default router;
