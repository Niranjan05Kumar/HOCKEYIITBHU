import { Router } from "express";
import {
    createHistoryEventController,
    deleteHistoryEventController,
    getHistoryEventByIdController,
    getHistoryEventsController,
    updateHistoryEventController,
} from "../controllers/historyEventController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachUploadedImage } from "../middleware/imageUploadMiddleware.js";
import {
    validateHistoryBody,
    validateHistoryParams,
    validateHistoryQuery,
    validateHistoryUpdate,
} from "../validators/historyValidator.js";

const router = Router();

router.get("/", validateHistoryQuery, getHistoryEventsController);
router.get("/:id", validateHistoryParams, getHistoryEventByIdController);
router.post(
    "/",
    authMiddleware,
    attachUploadedImage("photoFile", "photo", "photoFileId"),
    validateHistoryBody,
    createHistoryEventController,
);
router.patch(
    "/:id",
    authMiddleware,
    attachUploadedImage("photoFile", "photo", "photoFileId"),
    validateHistoryParams,
    validateHistoryUpdate,
    updateHistoryEventController,
);
router.delete("/:id", validateHistoryParams, authMiddleware, deleteHistoryEventController);

export default router;
