import mongoose, { Schema, type InferSchemaType } from "mongoose";

const teamSchema = new Schema(
    {
        year: {
            type: Number,
            required: true,
        },
        players: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Player",
                },
            ],
            required: true,
        },
        captain: {
            type: Schema.Types.ObjectId,
            ref: "Player",
        },
        viceCaptain: {
            type: Schema.Types.ObjectId,
            ref: "Player",
        },
        coach: {
            type: String,
            trim: true,
        },
        teamPhoto: {
            type: String,
            trim: true,
        },
        teamPhotoFileId: {
            type: String,
            trim: true,
        },
        achievements: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Achievement",
                },
            ],
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "teams",
    },
);

teamSchema.index({ year: 1 });

export type Team = InferSchemaType<typeof teamSchema>;

const TeamModel = mongoose.model("Team", teamSchema);

export default TeamModel;
