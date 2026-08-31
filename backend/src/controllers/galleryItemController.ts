import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createGalleryItem,
    deleteGalleryItem,
    getGalleryItemById,
    getGalleryItems,
    updateGalleryItem,
    type GalleryItemCreateInput,
    type GalleryItemQueryInput,
} from "../services/galleryService.js";

export const createGalleryItemController = asyncHandler(async (req: Request, res: Response) => {
    const item = await createGalleryItem(req.body as GalleryItemCreateInput);

    res.status(201).json({
        success: true,
        data: item,
        message: "Gallery item created successfully",
    });
});

export const getGalleryItemsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getGalleryItems(req.query as GalleryItemQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Gallery items fetched successfully",
    });
});

export const getGalleryItemByIdController = asyncHandler(async (req: Request, res: Response) => {
    const item = await getGalleryItemById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: item,
        message: "Gallery item fetched successfully",
    });
});

export const updateGalleryItemController = asyncHandler(async (req: Request, res: Response) => {
    const item = await updateGalleryItem(req.params.id as string, req.body as Partial<GalleryItemCreateInput>);

    res.status(200).json({
        success: true,
        data: item,
        message: "Gallery item updated successfully",
    });
});

export const deleteGalleryItemController = asyncHandler(async (req: Request, res: Response) => {
    await deleteGalleryItem(req.params.id as string);
    res.status(204).send();
});
