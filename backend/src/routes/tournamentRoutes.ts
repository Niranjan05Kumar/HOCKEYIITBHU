import { Router } from "express";
import {
    createTournamentController,
    deleteTournamentController,
    getTournamentByIdController,
    getTournamentsController,
    updateTournamentController,
} from "../controllers/tournamentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateTournamentBody,
    validateTournamentParams,
    validateTournamentQuery,
    validateTournamentUpdate,
} from "../validators/tournamentValidator.js";

const router = Router();

router.get("/", validateTournamentQuery, getTournamentsController);
router.get("/:id", validateTournamentParams, getTournamentByIdController);
router.post("/", validateTournamentBody, authMiddleware, createTournamentController);
router.patch("/:id", validateTournamentParams, validateTournamentUpdate, authMiddleware, updateTournamentController);
router.delete("/:id", validateTournamentParams, authMiddleware, deleteTournamentController);

export default router;
