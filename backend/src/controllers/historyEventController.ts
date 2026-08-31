import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
    createHistoryEvent,
    deleteHistoryEvent,
    getHistoryEventById,
    getHistoryEvents,
    updateHistoryEvent,
    type HistoryEventCreateInput,
    type HistoryEventQueryInput,
} from "../services/historyService.js";

export const createHistoryEventController = asyncHandler(async (req: Request, res: Response) => {
    const event = await createHistoryEvent(req.body as HistoryEventCreateInput);

    res.status(201).json({
        success: true,
        data: event,
        message: "History event created successfully",
    });
});

export const getHistoryEventsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getHistoryEvents(req.query as HistoryEventQueryInput);

    res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        message: "History events fetched successfully",
    });
});

export const getHistoryEventByIdController = asyncHandler(async (req: Request, res: Response) => {
    const event = await getHistoryEventById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: event,
        message: "History event fetched successfully",
    });
});

export const updateHistoryEventController = asyncHandler(async (req: Request, res: Response) => {
    const event = await updateHistoryEvent(req.params.id as string, req.body as Partial<HistoryEventCreateInput>);

    res.status(200).json({
        success: true,
        data: event,
        message: "History event updated successfully",
    });
});

export const deleteHistoryEventController = asyncHandler(async (req: Request, res: Response) => {
    await deleteHistoryEvent(req.params.id as string);
    res.status(204).send();
});
