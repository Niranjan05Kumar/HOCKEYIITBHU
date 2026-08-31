import { Router } from "express";
import {
    createGalleryItemController,
    deleteGalleryItemController,
    getGalleryItemByIdController,
    getGalleryItemsController,
    updateGalleryItemController,
} from "../controllers/galleryItemController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    validateGalleryBody,
    validateGalleryParams,
    validateGalleryQuery,
    validateGalleryUpdate,
} from "../validators/galleryValidator.js";

const router = Router();

router.get("/", validateGalleryQuery, getGalleryItemsController);
router.get("/:id", validateGalleryParams, getGalleryItemByIdController);
router.post("/", validateGalleryBody, authMiddleware, createGalleryItemController);
router.patch("/:id", validateGalleryParams, validateGalleryUpdate, authMiddleware, updateGalleryItemController);
router.delete("/:id", validateGalleryParams, authMiddleware, deleteGalleryItemController);

export default router;
