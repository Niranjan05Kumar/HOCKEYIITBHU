import argon2 from "argon2";
import type { HydratedDocument } from "mongoose";
import AdminModel, { type Admin as AdminDocument } from "../models/adminModel.js";
import AppError from "../utils/appError.js";

type SafeAdmin = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
};

const sanitizeAdmin = (admin: HydratedDocument<AdminDocument>): SafeAdmin => ({
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
});

export const loginAdmin = async ({ email, password }: { email: string; password: string }): Promise<SafeAdmin> => {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await AdminModel.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (!admin || !(await argon2.verify(admin.passwordHash, password))) {
        throw new AppError("Invalid email or password", 401);
    }

    return sanitizeAdmin(admin);
};

export const getCurrentAdmin = async (adminId: string): Promise<SafeAdmin> => {
    const admin = await AdminModel.findById(adminId);

    if (!admin) {
        throw new AppError("Authentication invalid or expired", 401);
    }

    return sanitizeAdmin(admin);
};

export const logoutAdmin = async (): Promise<void> => {
    // Session destruction is handled by the route/controller layer.
};
