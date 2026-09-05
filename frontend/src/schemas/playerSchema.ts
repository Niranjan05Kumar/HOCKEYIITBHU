import { z } from "zod";

const currentYear = new Date().getFullYear();

export const playerFormSchema = z
    .object({
        name: z.string().trim().min(1, "Full legal name is required"),
        jerseyNumber: z
            .union([z.number().int("Must be an integer").min(0, "Cannot be negative"), z.nan()])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        playingPosition: z
            .enum(["Forward", "Defender", "Midfielder", "Goalkeeper", ""])
            .optional()
            .transform((val) => (val === "" ? undefined : val)),
        status: z.enum(["current", "former"], {
            message: "Status must be either 'current' or 'former'",
        }),
        startYear: z
            .union([
                z
                    .number()
                    .int("Must be an integer")
                    .min(1900, "Year must be 1900 or later")
                    .max(currentYear + 1, "Year cannot be in the future"),
                z.nan(),
            ])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        endYear: z
            .union([
                z
                    .number()
                    .int("Must be an integer")
                    .min(1900, "Year must be 1900 or later")
                    .max(currentYear + 1, "Year cannot be in the future"),
                z.nan(),
            ])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        leadershipRole: z.string().trim().optional(),
        matchesCount: z
            .union([z.number().int("Must be an integer").min(0, "Cannot be negative"), z.nan()])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        goalsCount: z
            .union([z.number().int("Must be an integer").min(0, "Cannot be negative"), z.nan()])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        assistsCount: z
            .union([z.number().int("Must be an integer").min(0, "Cannot be negative"), z.nan()])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        cleanSheetsCount: z
            .union([z.number().int("Must be an integer").min(0, "Cannot be negative"), z.nan()])
            .optional()
            .transform((val) => (typeof val === "number" && !isNaN(val) ? val : undefined)),
        achievementIds: z.array(z.string()).default([]),
    })
    .refine(
        (data) => {
            if (data.startYear && data.endYear) {
                return data.endYear >= data.startYear;
            }
            return true;
        },
        {
            message: "Final year must be greater than or equal to debut year",
            path: ["endYear"],
        },
    );

export type PlayerFormData = z.input<typeof playerFormSchema>;
export type PlayerFormParsedData = z.output<typeof playerFormSchema>;
