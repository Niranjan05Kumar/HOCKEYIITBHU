import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ACHIEVEMENT_TYPES = ["Championship", "Medal", "Award", "Major Victory", "Individual Achievement"] as const;
const RECIPIENT_TYPES = ["Player", "Team"] as const;

const achievementSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ACHIEVEMENT_TYPES,
        },
        year: {
            type: Number,
            required: true,
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "TournamentEdition",
        },
        recipientType: {
            type: String,
            required: true,
            enum: RECIPIENT_TYPES,
        },
        recipient: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "recipientType",
        },
    },
    {
        timestamps: true,
        collection: "achievements",
    },
);

achievementSchema.index({ year: 1 });
achievementSchema.index({ recipientType: 1, recipient: 1 });

export type Achievement = InferSchemaType<typeof achievementSchema>;

const AchievementModel = mongoose.model("Achievement", achievementSchema);

export default AchievementModel;
