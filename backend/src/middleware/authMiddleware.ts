import type { NextFunction, Request, Response } from "express";
import AdminModel from "../models/adminModel.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";

const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const adminId = req.session?.adminId;

    if (!adminId) {
        throw new AppError("Authentication required", 401);
    }

    const admin = await AdminModel.findById(adminId);

    if (!admin) {
        req.session?.destroy(() => {
            // Session cleanup handled here.
        });
        throw new AppError("Authentication invalid or expired", 401);
    }

    req.admin = {
        _id: admin._id.toString(),
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
    };

    next();
});

export default authMiddleware;
