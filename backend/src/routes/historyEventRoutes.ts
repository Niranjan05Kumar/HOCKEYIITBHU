import { Router } from "express";
import {
    createHistoryEventController,
    deleteHistoryEventController,
    getHistoryEventByIdController,
    getHistoryEventsController,
    updateHistoryEventController,
} from "../controllers/historyEventController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateHistoryBody,
    validateHistoryParams,
    validateHistoryQuery,
    validateHistoryUpdate,
} from "../validators/historyValidator.js";

const router = Router();

router.get("/", validateHistoryQuery, getHistoryEventsController);
router.get("/:id", validateHistoryParams, getHistoryEventByIdController);
router.post("/", validateHistoryBody, authMiddleware, createHistoryEventController);
router.patch("/:id", validateHistoryParams, validateHistoryUpdate, authMiddleware, updateHistoryEventController);
router.delete("/:id", validateHistoryParams, authMiddleware, deleteHistoryEventController);

export default router;
