import { z } from "zod";
import type { AchievementType, RecipientType } from "@/types/achievement";

export const ACHIEVEMENT_TYPES: readonly [AchievementType, ...AchievementType[]] = [
    "Championship",
    "Medal",
    "Award",
    "Major Victory",
    "Individual Achievement",
];

export const RECIPIENT_TYPES: readonly [RecipientType, ...RecipientType[]] = ["Player", "Team"];

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const achievementFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    type: z.enum(ACHIEVEMENT_TYPES, {
        errorMap: () => ({
            message: "Achievement type must be Championship, Medal, Award, Major Victory, or Individual Achievement",
        }),
    }),
    year: z.coerce
        .number({ invalid_type_error: "Year is required and must be a number" })
        .int("Year must be a whole integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year cannot exceed next calendar year"),
    tournament: z
        .string()
        .trim()
        .refine((val) => val === "" || objectIdRegex.test(val), {
            message: "Referenced tournament must be a valid MongoDB ObjectId",
        })
        .optional(),
    recipientType: z.enum(RECIPIENT_TYPES, {
        errorMap: () => ({ message: "Recipient type must be either 'Player' or 'Team'" }),
    }),
    recipient: z
        .string()
        .trim()
        .min(1, "Recipient entity is required")
        .regex(objectIdRegex, "Referenced recipient must be a valid MongoDB ObjectId"),
});

export type AchievementFormData = z.infer<typeof achievementFormSchema>;
