import { Router } from "express";
import {
    createTournamentEditionController,
    deleteTournamentEditionController,
    getTournamentEditionByIdController,
    getTournamentEditionsController,
    updateTournamentEditionController,
} from "../controllers/tournamentEditionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateTournamentEditionBody,
    validateTournamentEditionParams,
    validateTournamentEditionQuery,
    validateTournamentEditionUpdate,
} from "../validators/tournamentEditionValidator.js";

const router = Router();

router.get("/", validateTournamentEditionQuery, getTournamentEditionsController);
router.get("/:id", validateTournamentEditionParams, getTournamentEditionByIdController);
router.post("/", validateTournamentEditionBody, authMiddleware, createTournamentEditionController);
router.patch(
    "/:id",
    validateTournamentEditionParams,
    validateTournamentEditionUpdate,
    authMiddleware,
    updateTournamentEditionController,
);
router.delete("/:id", validateTournamentEditionParams, authMiddleware, deleteTournamentEditionController);

export default router;
