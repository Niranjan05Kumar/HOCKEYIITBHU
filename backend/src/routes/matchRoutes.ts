import { Router } from "express";
import {
    createMatchController,
    deleteMatchController,
    getMatchByIdController,
    getMatchesController,
    updateMatchController,
} from "../controllers/matchController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateMatchBody,
    validateMatchParams,
    validateMatchQuery,
    validateMatchUpdate,
} from "../validators/matchValidator.js";

const router = Router();

router.get("/", validateMatchQuery, getMatchesController);
router.get("/:id", validateMatchParams, getMatchByIdController);
router.post("/", validateMatchBody, authMiddleware, createMatchController);
router.patch("/:id", validateMatchParams, validateMatchUpdate, authMiddleware, updateMatchController);
router.delete("/:id", validateMatchParams, authMiddleware, deleteMatchController);

export default router;
