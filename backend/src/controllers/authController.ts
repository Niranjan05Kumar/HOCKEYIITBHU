import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { getCurrentAdmin, loginAdmin } from "../services/authService.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
    const admin = await loginAdmin(req.body);
    req.session.adminId = admin.id;

    await new Promise<void>((resolve, reject) => {
        req.session.save((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });

    res.status(200).json({
        success: true,
        data: { admin },
        message: "Login successful",
    });
});

export const getCurrentAdminController = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.session?.adminId;

    if (!adminId) {
        throw new AppError("Authentication required", 401);
    }

    const admin = await getCurrentAdmin(adminId);

    res.status(200).json({
        success: true,
        data: { admin },
        message: "Current admin fetched successfully",
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    if (req.session) {
        await new Promise<void>((resolve, reject) => {
            req.session.destroy((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    res.clearCookie(process.env.SESSION_NAME || "hockey_iitbhu_sid");
    res.status(200).json({
        success: true,
        message: "Logout successful",
    });
});
