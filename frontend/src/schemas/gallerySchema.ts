import { z } from "zod";

export const GALLERY_CATEGORIES = [
    "SPARDHA",
    "Inter-IIT",
    "GC",
    "Out Fest",
    "Team Photos",
    "Match Photos",
    "Awards & Medal Celebrations",
    "Old/Archive Memories",
    "Other Memorable Moments",
] as const;

export const galleryFormSchema = z.object({
    imageUrl: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || val.length === 0 || /^https?:\/\/.+/i.test(val), "Must be a valid URL")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    imageFileId: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || /^[a-zA-Z0-9_-]+$/.test(val), "Invalid ImageKit file ID")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    year: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z
            .number()
            .int("Year must be an integer")
            .min(1900, "Year must be 1900 or later")
            .max(new Date().getFullYear() + 1, "Year cannot be too far in the future")
            .optional(),
    ),
    category: z.enum(GALLERY_CATEGORIES, {
        errorMap: () => ({
            message:
                "Category must be one of: SPARDHA, Inter-IIT, GC, Out Fest, Team Photos, Match Photos, Awards & Medal Celebrations, Old/Archive Memories, Other Memorable Moments",
        }),
    }),
    tournament: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || /^[a-fA-F0-9]{24}$/.test(val), "Tournament reference must be a valid 24-character ID")
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    eventName: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    caption: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    description: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    taggedPlayers: z.array(z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid player reference ID")).optional(),
});

export type GalleryFormData = z.input<typeof galleryFormSchema>;
export type GalleryFormParsedData = z.output<typeof galleryFormSchema>;
