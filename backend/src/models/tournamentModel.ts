import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tournamentSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        type: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        collection: "tournaments",
    },
);

tournamentSchema.index({ name: 1 });

export type Tournament = InferSchemaType<typeof tournamentSchema>;

const TournamentModel = mongoose.model("Tournament", tournamentSchema);

export default TournamentModel;
