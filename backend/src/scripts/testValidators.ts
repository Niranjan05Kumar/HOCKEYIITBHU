import { z } from "zod";

import { loginSchema } from "../validators/authValidator.js";
import {
    achievementBodySchema,
    achievementParamsSchema,
    achievementQuerySchema,
    achievementUpdateSchema,
} from "../validators/achievementValidator.js";
import {
    galleryBodySchema,
    galleryParamsSchema,
    galleryQuerySchema,
    galleryUpdateSchema,
} from "../validators/galleryValidator.js";
import {
    historyBodySchema,
    historyParamsSchema,
    historyQuerySchema,
    historyUpdateSchema,
} from "../validators/historyValidator.js";
import {
    matchBodySchema,
    matchParamsSchema,
    matchQuerySchema,
    matchUpdateSchema,
} from "../validators/matchValidator.js";
import {
    playerBodySchema,
    playerParamsSchema,
    playerQuerySchema,
    playerUpdateSchema,
} from "../validators/playerValidator.js";
import { teamBodySchema, teamParamsSchema, teamQuerySchema, teamUpdateSchema } from "../validators/teamValidator.js";
import {
    tournamentBodySchema,
    tournamentParamsSchema,
    tournamentQuerySchema,
    tournamentUpdateSchema,
} from "../validators/tournamentValidator.js";
import {
    tournamentEditionBodySchema,
    tournamentEditionParamsSchema,
    tournamentEditionQuerySchema,
    tournamentEditionUpdateSchema,
} from "../validators/tournamentEditionValidator.js";

const validObjectId = "507f1f77bcf86cd799439011";
const secondValidObjectId = "60f1d3d3b2b5f0e5d8c2a1a2";
const invalidObjectId = "not-a-valid-mongodb-objectid";

const validPlayerBody = {
    name: "Aman Singh",
    profilePhoto: "https://images.example.com/players/aman.jpg",
    playingPosition: "Midfielder",
    status: "current",
    playingYears: [2022, 2023, 2024],
    jerseyNumber: 7,
    leadershipRoles: ["Captain"],
    achievements: [validObjectId],
    individualStatistics: { goals: 12, assists: 8 },
} as const;

const validTeamBody = {
    year: 2025,
    players: [validObjectId, secondValidObjectId],
    captain: validObjectId,
    viceCaptain: secondValidObjectId,
    coach: "Coach Sharma",
    teamPhoto: "https://images.example.com/teams/2025.jpg",
    achievements: [validObjectId],
} as const;

const validTournamentBody = {
    name: "SPARDHA",
    type: "SPARDHA",
    description: "Annual sports festival of IIT (BHU)",
    logo: "https://images.example.com/tournaments/spardha.png",
} as const;

const validTournamentEditionBody = {
    tournament: validObjectId,
    year: 2025,
    edition: "SPARDHA 2025",
    team: validObjectId,
    hostInstitute: "IIT (BHU)",
    participatingTeams: ["IIT Delhi", "IIT Kanpur"],
    finalPosition: 2,
    captain: validObjectId,
    viceCaptain: secondValidObjectId,
    achievements: [validObjectId],
    awards: [secondValidObjectId],
    photos: [validObjectId],
} as const;

const validMatchBody = {
    tournamentEdition: validObjectId,
    date: "2025-10-10",
    opponent: "IIT Delhi",
    iitBhuScore: 3,
    opponentScore: 2,
    result: "Win",
    round: "Quarter Final",
} as const;

const validAchievementBody = {
    title: "Player of the Tournament",
    description: "Outstanding contribution in the final match",
    type: "Award",
    year: 2025,
    tournament: validObjectId,
    recipientType: "Player",
    recipient: validObjectId,
} as const;

const validHistoryBody = {
    year: 2025,
    title: "Historic victory",
    description: "IIT (BHU) won the hockey final by a dramatic finish.",
    category: "Major Victory",
    tournament: validObjectId,
    achievement: validObjectId,
    photo: "https://images.example.com/history/final.jpg",
} as const;

const validGalleryBody = {
    imageUrl: "https://images.example.com/gallery/gallery-1.jpg",
    year: 2025,
    category: "Match Photos",
    tournament: validObjectId,
    eventName: "Semi Final",
    caption: "Team celebration after win",
    description: "A memorable moment from the semifinal.",
    taggedPlayers: [validObjectId, secondValidObjectId],
} as const;

type TestCase = {
    validator: string;
    caseName: string;
    schema: z.ZodTypeAny;
    input: unknown;
    expectedPass: boolean;
};

const formatIssues = (issues: z.ZodIssue[]) =>
    issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
        message: issue.message,
    }));

const runTest = (test: TestCase): boolean => {
    const result = test.schema.safeParse(test.input);
    const actualPass = result.success;
    const passed = actualPass === test.expectedPass;

    if (passed) {
        console.log(`PASS — ${test.validator} ${test.caseName}`);
        return true;
    }

    console.error(`FAIL — ${test.validator} ${test.caseName}`);
    console.error(`Expected result: ${test.expectedPass ? "pass" : "reject"}`);
    console.error(`Actual result: ${actualPass ? "pass" : "reject"}`);
    console.error(
        `Validation issues: ${JSON.stringify(result.success ? [] : formatIssues(result.error.issues), null, 2)}`,
    );
    return false;
};

const tests: TestCase[] = [
    // Auth
    {
        validator: "loginSchema",
        caseName: "valid input",
        schema: loginSchema,
        input: { email: "admin@example.com", password: "SecurePass123" },
        expectedPass: true,
    },
    {
        validator: "loginSchema",
        caseName: "missing password rejected",
        schema: loginSchema,
        input: { email: "admin@example.com" },
        expectedPass: false,
    },
    {
        validator: "loginSchema",
        caseName: "invalid email rejected",
        schema: loginSchema,
        input: { email: "not-an-email", password: "SecurePass123" },
        expectedPass: false,
    },
    {
        validator: "loginSchema",
        caseName: "wrong password type rejected",
        schema: loginSchema,
        input: { email: "admin@example.com", password: 123 },
        expectedPass: false,
    },

    // Player
    {
        validator: "playerBodySchema",
        caseName: "valid input",
        schema: playerBodySchema,
        input: validPlayerBody,
        expectedPass: true,
    },
    {
        validator: "playerBodySchema",
        caseName: "missing required name rejected",
        schema: playerBodySchema,
        input: { ...validPlayerBody, name: undefined },
        expectedPass: false,
    },
    {
        validator: "playerBodySchema",
        caseName: "invalid status rejected",
        schema: playerBodySchema,
        input: { ...validPlayerBody, status: "active" },
        expectedPass: false,
    },
    {
        validator: "playerBodySchema",
        caseName: "invalid playingPosition rejected",
        schema: playerBodySchema,
        input: { ...validPlayerBody, playingPosition: "Striker" },
        expectedPass: false,
    },
    {
        validator: "playerBodySchema",
        caseName: "invalid achievement ObjectId rejected",
        schema: playerBodySchema,
        input: { ...validPlayerBody, achievements: [invalidObjectId] },
        expectedPass: false,
    },
    {
        validator: "playerBodySchema",
        caseName: "optional historical fields omitted passes",
        schema: playerBodySchema,
        input: { name: "Rohit Sharma", status: "former" },
        expectedPass: true,
    },
    {
        validator: "playerUpdateSchema",
        caseName: "valid partial update",
        schema: playerUpdateSchema,
        input: { status: "former", playingPosition: "Forward" },
        expectedPass: true,
    },
    {
        validator: "playerUpdateSchema",
        caseName: "invalid status rejected",
        schema: playerUpdateSchema,
        input: { status: "retired" },
        expectedPass: false,
    },
    {
        validator: "playerParamsSchema",
        caseName: "valid ObjectId",
        schema: playerParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "playerParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: playerParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "playerQuerySchema",
        caseName: "valid query",
        schema: playerQuerySchema,
        input: {
            status: "current",
            position: "Goalkeeper",
            year: "2025",
            page: "1",
            limit: "20",
            sort: "name",
            order: "asc",
        },
        expectedPass: true,
    },
    {
        validator: "playerQuerySchema",
        caseName: "invalid status rejected",
        schema: playerQuerySchema,
        input: { status: "retired" },
        expectedPass: false,
    },
    {
        validator: "playerQuerySchema",
        caseName: "invalid position rejected",
        schema: playerQuerySchema,
        input: { position: "Striker" },
        expectedPass: false,
    },
    {
        validator: "playerQuerySchema",
        caseName: "invalid page rejected",
        schema: playerQuerySchema,
        input: { page: "0" },
        expectedPass: false,
    },

    // Team
    {
        validator: "teamBodySchema",
        caseName: "valid input",
        schema: teamBodySchema,
        input: validTeamBody,
        expectedPass: true,
    },
    {
        validator: "teamBodySchema",
        caseName: "missing required players rejected",
        schema: teamBodySchema,
        input: { ...validTeamBody, players: undefined },
        expectedPass: false,
    },
    {
        validator: "teamBodySchema",
        caseName: "invalid year type rejected",
        schema: teamBodySchema,
        input: { ...validTeamBody, year: "2025" },
        expectedPass: false,
    },
    {
        validator: "teamBodySchema",
        caseName: "invalid player ObjectId rejected",
        schema: teamBodySchema,
        input: { ...validTeamBody, players: [invalidObjectId] },
        expectedPass: false,
    },
    {
        validator: "teamUpdateSchema",
        caseName: "valid partial update",
        schema: teamUpdateSchema,
        input: { year: 2024 },
        expectedPass: true,
    },
    {
        validator: "teamParamsSchema",
        caseName: "valid ObjectId",
        schema: teamParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "teamParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: teamParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "teamQuerySchema",
        caseName: "valid query",
        schema: teamQuerySchema,
        input: { year: "2025", page: "1", limit: "20", sort: "year", order: "desc" },
        expectedPass: true,
    },
    {
        validator: "teamQuerySchema",
        caseName: "invalid sort rejected",
        schema: teamQuerySchema,
        input: { sort: "invalid" },
        expectedPass: false,
    },

    // Tournaments
    {
        validator: "tournamentBodySchema",
        caseName: "valid input",
        schema: tournamentBodySchema,
        input: validTournamentBody,
        expectedPass: true,
    },
    {
        validator: "tournamentBodySchema",
        caseName: "missing required type rejected",
        schema: tournamentBodySchema,
        input: { ...validTournamentBody, type: undefined },
        expectedPass: false,
    },
    {
        validator: "tournamentBodySchema",
        caseName: "invalid enum rejected",
        schema: tournamentBodySchema,
        input: { ...validTournamentBody, type: "Random Cup" },
        expectedPass: false,
    },
    {
        validator: "tournamentBodySchema",
        caseName: "optional description omitted passes",
        schema: tournamentBodySchema,
        input: { name: "GC", type: "GC" },
        expectedPass: true,
    },
    {
        validator: "tournamentUpdateSchema",
        caseName: "valid partial update",
        schema: tournamentUpdateSchema,
        input: { description: "Updated description" },
        expectedPass: true,
    },
    {
        validator: "tournamentParamsSchema",
        caseName: "valid ObjectId",
        schema: tournamentParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "tournamentParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: tournamentParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "tournamentQuerySchema",
        caseName: "valid query",
        schema: tournamentQuerySchema,
        input: { name: "SPARDHA", type: "SPARDHA", page: "1", limit: "20", sort: "name", order: "asc" },
        expectedPass: true,
    },
    {
        validator: "tournamentQuerySchema",
        caseName: "invalid type rejected",
        schema: tournamentQuerySchema,
        input: { type: "Not a tournament" },
        expectedPass: false,
    },

    // Tournament editions
    {
        validator: "tournamentEditionBodySchema",
        caseName: "valid input",
        schema: tournamentEditionBodySchema,
        input: validTournamentEditionBody,
        expectedPass: true,
    },
    {
        validator: "tournamentEditionBodySchema",
        caseName: "missing required edition rejected",
        schema: tournamentEditionBodySchema,
        input: { ...validTournamentEditionBody, edition: undefined },
        expectedPass: false,
    },
    {
        validator: "tournamentEditionBodySchema",
        caseName: "invalid tournament ObjectId rejected",
        schema: tournamentEditionBodySchema,
        input: { ...validTournamentEditionBody, tournament: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "tournamentEditionBodySchema",
        caseName: "invalid finalPosition rejected",
        schema: tournamentEditionBodySchema,
        input: { ...validTournamentEditionBody, finalPosition: 0 },
        expectedPass: false,
    },
    {
        validator: "tournamentEditionUpdateSchema",
        caseName: "valid partial update",
        schema: tournamentEditionUpdateSchema,
        input: { finalPosition: 1 },
        expectedPass: true,
    },
    {
        validator: "tournamentEditionParamsSchema",
        caseName: "valid ObjectId",
        schema: tournamentEditionParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "tournamentEditionParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: tournamentEditionParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "tournamentEditionQuerySchema",
        caseName: "valid query",
        schema: tournamentEditionQuerySchema,
        input: { tournament: validObjectId, year: "2025", page: "1", limit: "20", sort: "year", order: "asc" },
        expectedPass: true,
    },
    {
        validator: "tournamentEditionQuerySchema",
        caseName: "invalid tournament ObjectId rejected",
        schema: tournamentEditionQuerySchema,
        input: { tournament: invalidObjectId },
        expectedPass: false,
    },

    // Matches
    {
        validator: "matchBodySchema",
        caseName: "valid input",
        schema: matchBodySchema,
        input: validMatchBody,
        expectedPass: true,
    },
    {
        validator: "matchBodySchema",
        caseName: "missing required opponent rejected",
        schema: matchBodySchema,
        input: { ...validMatchBody, opponent: undefined },
        expectedPass: false,
    },
    {
        validator: "matchBodySchema",
        caseName: "invalid result enum rejected",
        schema: matchBodySchema,
        input: { ...validMatchBody, result: "Tie" },
        expectedPass: false,
    },
    {
        validator: "matchBodySchema",
        caseName: "invalid score type rejected",
        schema: matchBodySchema,
        input: { ...validMatchBody, iitBhuScore: -1 },
        expectedPass: false,
    },
    {
        validator: "matchBodySchema",
        caseName: "optional historical fields omitted pass",
        schema: matchBodySchema,
        input: { tournamentEdition: validObjectId, opponent: "IIT Delhi" },
        expectedPass: true,
    },
    {
        validator: "matchUpdateSchema",
        caseName: "valid partial update",
        schema: matchUpdateSchema,
        input: { result: "Loss" },
        expectedPass: true,
    },
    {
        validator: "matchParamsSchema",
        caseName: "valid ObjectId",
        schema: matchParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "matchParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: matchParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "matchQuerySchema",
        caseName: "valid query",
        schema: matchQuerySchema,
        input: { tournamentEditionId: validObjectId, page: "1", limit: "10", sort: "date", order: "desc" },
        expectedPass: true,
    },
    {
        validator: "matchQuerySchema",
        caseName: "invalid tournamentEditionId rejected",
        schema: matchQuerySchema,
        input: { tournamentEditionId: invalidObjectId },
        expectedPass: false,
    },

    // Achievements
    {
        validator: "achievementBodySchema",
        caseName: "valid input",
        schema: achievementBodySchema,
        input: validAchievementBody,
        expectedPass: true,
    },
    {
        validator: "achievementBodySchema",
        caseName: "missing required title rejected",
        schema: achievementBodySchema,
        input: { ...validAchievementBody, title: undefined },
        expectedPass: false,
    },
    {
        validator: "achievementBodySchema",
        caseName: "invalid type rejected",
        schema: achievementBodySchema,
        input: { ...validAchievementBody, type: "Olympic Medal" },
        expectedPass: false,
    },
    {
        validator: "achievementBodySchema",
        caseName: "invalid recipientType rejected",
        schema: achievementBodySchema,
        input: { ...validAchievementBody, recipientType: "Institution" },
        expectedPass: false,
    },
    {
        validator: "achievementUpdateSchema",
        caseName: "valid partial update",
        schema: achievementUpdateSchema,
        input: { year: 2024 },
        expectedPass: true,
    },
    {
        validator: "achievementParamsSchema",
        caseName: "valid ObjectId",
        schema: achievementParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "achievementParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: achievementParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "achievementQuerySchema",
        caseName: "valid query",
        schema: achievementQuerySchema,
        input: { year: "2025", type: "Award", recipientType: "Player", page: "1", limit: "20", sort: "year" },
        expectedPass: true,
    },
    {
        validator: "achievementQuerySchema",
        caseName: "invalid recipientType rejected",
        schema: achievementQuerySchema,
        input: { recipientType: "Coach" },
        expectedPass: false,
    },

    // History
    {
        validator: "historyBodySchema",
        caseName: "valid input",
        schema: historyBodySchema,
        input: validHistoryBody,
        expectedPass: true,
    },
    {
        validator: "historyBodySchema",
        caseName: "missing required description rejected",
        schema: historyBodySchema,
        input: { ...validHistoryBody, description: undefined },
        expectedPass: false,
    },
    {
        validator: "historyBodySchema",
        caseName: "invalid category rejected",
        schema: historyBodySchema,
        input: { ...validHistoryBody, category: "Rally" },
        expectedPass: false,
    },
    {
        validator: "historyBodySchema",
        caseName: "optional fields omitted pass",
        schema: historyBodySchema,
        input: {
            year: 2024,
            title: "Semifinal comeback",
            description: "The team came back from behind to win.",
            category: "Memorable Performance",
        },
        expectedPass: true,
    },
    {
        validator: "historyUpdateSchema",
        caseName: "valid partial update",
        schema: historyUpdateSchema,
        input: { title: "Updated title" },
        expectedPass: true,
    },
    {
        validator: "historyParamsSchema",
        caseName: "valid ObjectId",
        schema: historyParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "historyParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: historyParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "historyQuerySchema",
        caseName: "valid query",
        schema: historyQuerySchema,
        input: { year: "2025", category: "Championship", page: "1", limit: "10", sort: "year", order: "asc" },
        expectedPass: true,
    },
    {
        validator: "historyQuerySchema",
        caseName: "invalid category rejected",
        schema: historyQuerySchema,
        input: { category: "Hostile" },
        expectedPass: false,
    },

    // Gallery
    {
        validator: "galleryBodySchema",
        caseName: "valid input",
        schema: galleryBodySchema,
        input: validGalleryBody,
        expectedPass: true,
    },
    {
        validator: "galleryBodySchema",
        caseName: "missing required imageUrl rejected",
        schema: galleryBodySchema,
        input: { ...validGalleryBody, imageUrl: undefined },
        expectedPass: false,
    },
    {
        validator: "galleryBodySchema",
        caseName: "invalid category rejected",
        schema: galleryBodySchema,
        input: { ...validGalleryBody, category: "Random" },
        expectedPass: false,
    },
    {
        validator: "galleryBodySchema",
        caseName: "invalid taggedPlayers ObjectId rejected",
        schema: galleryBodySchema,
        input: { ...validGalleryBody, taggedPlayers: [invalidObjectId] },
        expectedPass: false,
    },
    {
        validator: "galleryBodySchema",
        caseName: "optional fields omitted pass",
        schema: galleryBodySchema,
        input: {
            imageUrl: "https://images.example.com/gallery/season-archive.jpg",
            category: "Old/Archive Memories",
        },
        expectedPass: true,
    },
    {
        validator: "galleryUpdateSchema",
        caseName: "valid partial update",
        schema: galleryUpdateSchema,
        input: { caption: "Updated caption" },
        expectedPass: true,
    },
    {
        validator: "galleryParamsSchema",
        caseName: "valid ObjectId",
        schema: galleryParamsSchema,
        input: { id: validObjectId },
        expectedPass: true,
    },
    {
        validator: "galleryParamsSchema",
        caseName: "invalid ObjectId rejected",
        schema: galleryParamsSchema,
        input: { id: invalidObjectId },
        expectedPass: false,
    },
    {
        validator: "galleryQuerySchema",
        caseName: "valid query",
        schema: galleryQuerySchema,
        input: {
            year: "2025",
            category: "Match Photos",
            tournament: validObjectId,
            player: validObjectId,
            page: "1",
            limit: "20",
            sort: "year",
            order: "asc",
        },
        expectedPass: true,
    },
    {
        validator: "galleryQuerySchema",
        caseName: "invalid tournament ObjectId rejected",
        schema: galleryQuerySchema,
        input: { tournament: invalidObjectId },
        expectedPass: false,
    },
];

const validatorsTested = [...new Set(tests.map((test) => test.validator))];
const totalTests = tests.length;
const passedTests = tests.filter((test) => runTest(test)).length;
const failedTests = totalTests - passedTests;

console.log("\n--- Validation Test Summary ---");
console.log(`Validators tested: ${validatorsTested.join(", ")}`);
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
    process.exitCode = 1;
}
