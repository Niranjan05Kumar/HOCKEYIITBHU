import mongoose, { Schema, type InferSchemaType } from "mongoose";

const HISTORY_CATEGORIES = ["Major Victory", "Championship", "Medal", "Milestone", "Memorable Performance"] as const;

const historyEventSchema = new Schema(
    {
        year: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        category: {
            type: String,
            required: true,
            enum: HISTORY_CATEGORIES,
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "TournamentEdition",
        },
        achievement: {
            type: Schema.Types.ObjectId,
            ref: "Achievement",
        },
        photo: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        collection: "historyEvents",
    },
);

historyEventSchema.index({ year: 1 });
historyEventSchema.index({ category: 1 });

export type HistoryEvent = InferSchemaType<typeof historyEventSchema>;

const HistoryEventModel = mongoose.model("HistoryEvent", historyEventSchema);

export default HistoryEventModel;
