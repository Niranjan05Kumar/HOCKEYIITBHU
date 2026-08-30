import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PLAYER_STATUSES = ["current", "former"] as const;
const PLAYING_POSITIONS = ["Forward", "Defender", "Midfielder", "Goalkeeper"] as const;

const playerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        profilePhoto: {
            type: String,
            trim: true,
        },
        playingPosition: {
            type: String,
            enum: PLAYING_POSITIONS,
        },
        status: {
            type: String,
            required: true,
            enum: PLAYER_STATUSES,
        },
        playingYears: {
            type: [Number],
            default: undefined,
        },
        jerseyNumber: {
            type: Number,
            min: 0,
        },
        leadershipRoles: {
            type: [String],
            default: undefined,
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
        individualStatistics: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        collection: "players",
    },
);

playerSchema.index({ status: 1 });
playerSchema.index({ playingPosition: 1 });
playerSchema.index({ playingYears: 1 });

export type PlayingPosition = (typeof PLAYING_POSITIONS)[number];
export type Player = InferSchemaType<typeof playerSchema>;

const PlayerModel = mongoose.model("Player", playerSchema);

export default PlayerModel;
