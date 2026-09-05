import { z } from "zod";

export const MATCH_RESULTS = ["Win", "Loss", "Draw"] as const;

export const ROUND_STAGE_OPTIONS = [
    "Final",
    "Semi-Final",
    "Quarter-Final",
    "Bronze Playoff",
    "3rd Place Playoff",
    "Group Stage",
    "League Round",
    "Preliminary Round",
] as const;

export const matchFormSchema = z.object({
    tournamentEdition: z
        .string({ required_error: "Tournament Edition selection is required" })
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/, "Please select a valid tournament edition"),
    date: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    opponent: z.string().trim().min(1, "Opponent institution or team name is required"),
    iitBhuScore: z.preprocess(
        (val) =>
            val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val),
        z.number().int("IIT (BHU) score must be an integer").min(0, "Score cannot be negative").optional(),
    ),
    opponentScore: z.preprocess(
        (val) =>
            val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val),
        z.number().int("Opponent score must be an integer").min(0, "Score cannot be negative").optional(),
    ),
    result: z.enum(MATCH_RESULTS, { errorMap: () => ({ message: "Result must be Win, Loss, or Draw" }) }).optional(),
    round: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export type MatchFormData = z.input<typeof matchFormSchema>;
export type MatchFormParsedData = z.output<typeof matchFormSchema>;
