import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MATCH_RESULTS = ["Win", "Loss", "Draw"] as const;

const matchSchema = new Schema(
    {
        tournamentEdition: {
            type: Schema.Types.ObjectId,
            ref: "TournamentEdition",
            required: true,
        },
        date: {
            type: Date,
        },
        opponent: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        iitBhuScore: {
            type: Number,
            min: 0,
        },
        opponentScore: {
            type: Number,
            min: 0,
        },
        result: {
            type: String,
            enum: MATCH_RESULTS,
        },
        round: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        collection: "matches",
    },
);

matchSchema.index({ tournamentEdition: 1 });

export type Match = InferSchemaType<typeof matchSchema>;

const MatchModel = mongoose.model("Match", matchSchema);

export default MatchModel;
