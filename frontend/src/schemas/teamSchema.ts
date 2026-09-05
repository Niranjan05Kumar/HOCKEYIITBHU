import { z } from "zod";

const currentYear = new Date().getFullYear();

export const teamFormSchema = z
    .object({
        year: z.coerce
            .number({ message: "Year is required" })
            .int("Year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(currentYear + 1, "Year cannot be in the future"),
        coach: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val === "" ? undefined : val)),
        captain: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val === "" ? undefined : val)),
        viceCaptain: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val === "" ? undefined : val)),
        players: z.array(z.string()).min(1, "At least one registered player is required in the squad roster"),
        achievementIds: z.array(z.string()).default([]),
    })
    .refine(
        (data) => {
            if (data.captain && data.viceCaptain && data.captain === data.viceCaptain) {
                return false;
            }
            return true;
        },
        {
            message: "Captain and Vice-Captain cannot be the same player",
            path: ["viceCaptain"],
        },
    );

export type TeamFormData = z.input<typeof teamFormSchema>;
export type TeamFormParsedData = z.output<typeof teamFormSchema>;
