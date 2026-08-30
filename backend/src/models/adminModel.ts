import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ADMIN_ROLES = ["admin"] as const;

const adminSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            required: true,
            enum: ADMIN_ROLES,
            default: "admin",
        },
    },
    {
        timestamps: true,
        collection: "admins",
    },
);

export type Admin = InferSchemaType<typeof adminSchema>;

const AdminModel = mongoose.model("Admin", adminSchema);

export default AdminModel;
