import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tournamentEditionSchema = new Schema(
    {
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        edition: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
            required: true,
        },
        hostInstitute: {
            type: String,
            trim: true,
        },
        participatingTeams: {
            type: [String],
            default: undefined,
        },
        finalPosition: {
            type: Number,
            min: 1,
        },
        captain: {
            type: Schema.Types.ObjectId,
            ref: "Player",
        },
        viceCaptain: {
            type: Schema.Types.ObjectId,
            ref: "Player",
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
        awards: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Achievement",
                },
            ],
            default: undefined,
        },
        photos: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "GalleryItem",
                },
            ],
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "tournamentEditions",
    },
);

tournamentEditionSchema.index({ tournament: 1, year: 1 });
tournamentEditionSchema.index({ year: 1 });

export type TournamentEdition = InferSchemaType<typeof tournamentEditionSchema>;

const TournamentEditionModel = mongoose.model("TournamentEdition", tournamentEditionSchema);

export default TournamentEditionModel;
