import { z } from "zod";

export const PLACEMENT_OPTIONS = [
    { label: "Champions / Gold Medal (1st)", value: 1 },
    { label: "Runners-Up / Silver Medal (2nd)", value: 2 },
    { label: "Bronze Medal / 3rd Place", value: 3 },
    { label: "4th Place / Semi-Finalist", value: 4 },
    { label: "5th Place", value: 5 },
    { label: "6th Place", value: 6 },
    { label: "7th Place", value: 7 },
    { label: "8th Place", value: 8 },
] as const;

export const POPULAR_PARTICIPATING_TEAMS = [
    "IIT Bombay",
    "IIT Delhi",
    "IIT Madras",
    "IIT Kanpur",
    "IIT Kharagpur",
    "IIT Roorkee",
    "IIT Guwahati",
    "IIT (BHU) Varanasi",
    "IIT Hyderabad",
    "IIT Gandhinagar",
    "IIT Indore",
    "IIT Ropar",
    "IIT Patna",
    "IIT Bhubaneswar",
    "IIT Jodhpur",
    "IIT Mandi",
    "IIT (ISM) Dhanbad",
    "IIT Tirupati",
    "IIT Palakkad",
    "BITS Pilani",
    "AMU Aligarh",
    "BHU Combined",
] as const;

export const tournamentEditionFormSchema = z.object({
    tournament: z
        .string({ required_error: "Tournament selection is required" })
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/, "Please select a valid tournament"),
    year: z.coerce
        .number({ required_error: "Year is required", invalid_type_error: "Year must be a valid number" })
        .int("Year must be an integer")
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1, "Year is too far in the future"),
    edition: z.string().trim().min(1, "Edition name/title is required"),
    team: z
        .string({ required_error: "IIT (BHU) team selection is required" })
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/, "Please select an IIT (BHU) team cohort"),
    hostInstitute: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    participatingTeams: z.array(z.string().trim().min(1)).optional().default([]),
    finalPosition: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined || Number.isNaN(Number(val))) {
            return undefined;
        }
        return Number(val);
    }, z.number().int("Placement must be an integer").min(1, "Placement must be at least 1").optional()),
    captain: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && /^[a-fA-F0-9]{24}$/.test(val) ? val : undefined)),
    viceCaptain: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && /^[a-fA-F0-9]{24}$/.test(val) ? val : undefined)),
    achievements: z
        .array(z.string().regex(/^[a-fA-F0-9]{24}$/))
        .optional()
        .default([]),
    awards: z
        .array(z.string().regex(/^[a-fA-F0-9]{24}$/))
        .optional()
        .default([]),
    photos: z
        .array(z.string().regex(/^[a-fA-F0-9]{24}$/))
        .optional()
        .default([]),
});

export type TournamentEditionFormData = z.input<typeof tournamentEditionFormSchema>;
export type TournamentEditionFormParsedData = z.output<typeof tournamentEditionFormSchema>;
