import "dotenv/config";
import AdminModel from "../models/adminModel.js";
import connectDB from "../config/database.js";
import { disconnectDB } from "../config/database.js";
import argon2 from "argon2";

const adminName = process.env.ADMIN_NAME;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

connectDB();

const createAdmin = async () => {
    try {

        if (!adminEmail) {
            console.error("Admin email not provided, please set ADMIN_EMAIL in the backend .env file");
            await disconnectDB();
            return;
        }

        const existingAdmin = await AdminModel.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Admin already exists");
            await disconnectDB();
            return;
        }

        const hashedPassword = await argon2.hash(adminPassword || "");
        const admin = new AdminModel({
            name: adminName,
            email: adminEmail,
            passwordHash: hashedPassword,
            role: "admin",
        });
        await admin.save();
        console.log("Admin created successfully");
        await disconnectDB();
    } catch (error) {
        console.error("Error creating admin:", error);
        await disconnectDB();
    }
};

createAdmin();