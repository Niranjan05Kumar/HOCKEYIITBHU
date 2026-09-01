import mongoose, { Schema, type InferSchemaType } from "mongoose";

const GALLERY_CATEGORIES = [
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

const galleryItemSchema = new Schema(
    {
        imageUrl: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        imageFileId: {
            type: String,
            trim: true,
        },
        year: {
            type: Number,
        },
        category: {
            type: String,
            required: true,
            enum: GALLERY_CATEGORIES,
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "TournamentEdition",
        },
        eventName: {
            type: String,
            trim: true,
        },
        caption: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        taggedPlayers: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Player",
                },
            ],
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "galleryItems",
    },
);

galleryItemSchema.index({ year: 1, category: 1 });
galleryItemSchema.index({ tournament: 1 });
galleryItemSchema.index({ taggedPlayers: 1 });

export type GalleryItem = InferSchemaType<typeof galleryItemSchema>;

const GalleryItemModel = mongoose.model("GalleryItem", galleryItemSchema);

export default GalleryItemModel;
