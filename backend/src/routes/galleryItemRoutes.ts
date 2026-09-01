import { Router } from "express";
import {
    createGalleryItemController,
    deleteGalleryItemController,
    getGalleryItemByIdController,
    getGalleryItemsController,
    updateGalleryItemController,
} from "../controllers/galleryItemController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachUploadedImage } from "../middleware/imageUploadMiddleware.js";
import {
    validateGalleryBody,
    validateGalleryParams,
    validateGalleryQuery,
    validateGalleryUpdate,
} from "../validators/galleryValidator.js";

const router = Router();

router.get("/", validateGalleryQuery, getGalleryItemsController);
router.get("/:id", validateGalleryParams, getGalleryItemByIdController);
router.post(
    "/",
    authMiddleware,
    attachUploadedImage("imageFile", "imageUrl", "imageFileId"),
    validateGalleryBody,
    createGalleryItemController,
);
router.patch(
    "/:id",
    authMiddleware,
    attachUploadedImage("imageFile", "imageUrl", "imageFileId"),
    validateGalleryParams,
    validateGalleryUpdate,
    updateGalleryItemController,
);
router.delete("/:id", validateGalleryParams, authMiddleware, deleteGalleryItemController);

export default router;
