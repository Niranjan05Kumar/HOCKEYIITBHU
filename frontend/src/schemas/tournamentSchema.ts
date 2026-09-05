import { z } from "zod";

export const TOURNAMENT_TYPE_OPTIONS = [
    { label: "SPARDHA, IIT BHU", value: "SPARDHA" },
    { label: "Inter-IIT Sports Meet", value: "Inter-IIT Sports Meet" },
    { label: "General Championship (GC)", value: "General Championship (GC)" },
    { label: "Sports Out Fests", value: "Sports Out Fests" },
] as const;

export const tournamentFormSchema = z.object({
    name: z.string().trim().min(1, "Tournament name is required"),
    type: z.string().trim().min(1, "Tournament category is required"),
    description: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
    logo: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
            message: "Logo must be a valid HTTP or HTTPS URL",
        }),
});

export type TournamentFormData = z.input<typeof tournamentFormSchema>;
export type TournamentFormParsedData = z.output<typeof tournamentFormSchema>;
