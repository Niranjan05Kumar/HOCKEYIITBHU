import { z } from "zod";

export const HISTORY_CATEGORIES = [
    "Major Victory",
    "Championship",
    "Medal",
    "Milestone",
    "Memorable Performance",
] as const;

export const historyFormSchema = z.object({
    year: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z
            .number({ required_error: "Year is required" })
            .int("Year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year cannot be too far in the future"),
    ),
    title: z.string({ required_error: "Event title is required" }).trim().min(1, "Event title is required"),
    description: z
        .string({ required_error: "Historical narrative/description is required" })
        .trim()
        .min(1, "Historical narrative/description is required"),
    category: z.enum(HISTORY_CATEGORIES, {
        errorMap: () => ({
            message: "Category must be one of: Major Victory, Championship, Medal, Milestone, Memorable Performance",
        }),
    }),
    tournament: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || /^[a-fA-F0-9]{24}$/.test(val), "Tournament reference must be a valid 24-character ID")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    achievement: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || /^[a-fA-F0-9]{24}$/.test(val), "Achievement reference must be a valid 24-character ID")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    photo: z
        .string()
        .trim()
        .optional()
        .refine((val) => {
            if (!val || val.length === 0) return true;
            try {
                new URL(val);
                return true;
            } catch {
                return false;
            }
        }, "Photo reference must be a valid URL")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export type HistoryFormData = z.input<typeof historyFormSchema>;
export type HistoryFormParsedData = z.output<typeof historyFormSchema>;
