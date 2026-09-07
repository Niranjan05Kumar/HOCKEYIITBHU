import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, Calendar, AlertCircle, RotateCcw, Trophy, Users } from "lucide-react";
import { getPlayerById } from "@/api/players";
import { getCachedTeams, getCachedAchievements, getCachedTournamentEditions } from "@/lib/catalogCache";
import type { Player } from "@/types/player";
import type { Team } from "@/types/team";
import type { Achievement } from "@/types/achievement";
import type { TournamentEdition } from "@/types/tournament";

// Curated archival portrait fallbacks from Stitch Player Profile designs
const ARCHIVAL_PORTRAIT_FALLBACKS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCZJzNp01acfsO58fbGqO_qdO_wkh83yLvmCYdmvTPBHL0CaSRyOUlJiAr1XVCkK_q5ccP6WRFZG_qwrEvBH8kAYCeSWqrVaTLX5YBZWkSo6FaEE_rnJQfjxMv54ahOGZIhsBPt0eUk_jvE7Iix9gDC0kIyt0ge4GEtDYWyX7vQd8Vu628vHhEKIhwdzC8W1bM5KABS2HU-lN1N-Y0Yn6FV51s2gRzCjGdMYhhL2MOuB8TcoLI1-bYX",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBl6_gEypZm9cvzdQ1zA9Y1IIjBErshii7sTnsxyjggcUsqZhv418HJzzUor60L7UbXTWRRzlUY_XHBAuj480GvXEcIHC4eQINWonVOeHq6bZVgr2tqDEVml021SFEwt9yaJ5-EYaJ_6NxB0FyaXfWBSExDQu9O6RKmD1Cyz30TrBS5scFGL2j1lsaKnHbbF_6c_Pl3F1pFFjnzbCw2deyOsGkDXeiVUAl6_DjJaGxOsJPyYutmxYHB",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBRsN0PtOXYO6TTEGjGjqn8scJWGhftTnMzfaJ8dyFNe0Dm61J4p7MRgRgzscS_1i7aQssw-DUfGsnC11T4-INAkHkz3UZs0n7aHkKEOTeIJZLv1qRkVep8SZ9mMdWDC7ehYY1-Vw0DtV5AiBVZVcAaOPIQBioui5pY_3qIuGvCqjtAwPSNdANfifo9HldC_nWWvoPFGItE4vJi097BHqEoqOZXS0DYjYNSg-o1oCXY3hQVutSmRvs6",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAjWXJpVxLrGbs50aORqo80FMyQFzugc0ruul6IC4hjOE1Xk_2-zd_7G42TpUhd5Shj1rV8EDMd456cyM3MVn6Hei2UVTODh1lts8aBnuNoqWijUsVLAlC4Tg3JW2xc0DHcdg_O4vnvvrsbsozVV7-5DJvXRbSeoLXSIFjyyfO0nogHH6Uo8j55tbsej4pZBs5gIp43jfKTfJr6agYO0Cv6D7WVtm6r3OFoUAQ0Zb27jwOG8N8ur9H8",
];

function formatActiveYears(player: Player): string {
    if (!player.playingYears || player.playingYears.length === 0) {
        return player.status === "current" ? "Active Squad Member" : "Distinguished Alumnus";
    }

    const sortedYears = [...player.playingYears].sort((a, b) => a - b);
    const minYear = sortedYears[0];
    const maxYear = sortedYears[sortedYears.length - 1];

    if (player.status === "current") {
        return `${minYear} – Present`;
    }

    if (minYear === maxYear) {
        return `${minYear}`;
    }

    return `${minYear} – ${maxYear}`;
}

export default function PlayerProfile() {
    const { id } = useParams<{ id: string }>();

    const [player, setPlayer] = useState<Player | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [editions, setEditions] = useState<TournamentEdition[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);

    const fetchPlayerData = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            // Fetch individual player record
            const playerRes = await getPlayerById(id);
            if (!playerRes.data) {
                setNotFound(true);
                return;
            }
            setPlayer(playerRes.data);

            // Fetch related context concurrently from shared cache
            const [teamsList, achievementsList, editionsList] = await Promise.all([
                getCachedTeams().catch(() => []),
                getCachedAchievements().catch(() => []),
                getCachedTournamentEditions().catch(() => []),
            ]);

            setTeams(teamsList);
            setAchievements(achievementsList);
            setEditions(editionsList);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load player profile from server";
            if (errorMessage.toLowerCase().includes("not found") || errorMessage.includes("404")) {
                setNotFound(true);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchPlayerData();
    }, [fetchPlayerData]);

    // Filter achievements that belong to this player
    const playerAchievements = useMemo(() => {
        if (!player) return [];
        return achievements.filter((ach) => {
            if (ach.recipient && String(ach.recipient) === String(player._id)) {
                return true;
            }
            if (player.achievements && player.achievements.some((aId) => String(aId) === String(ach._id))) {
                return true;
            }
            return false;
        });
    }, [achievements, player]);

    // Build participation campaigns from teams and tournament editions
    const participationRecords = useMemo(() => {
        if (!player) return [];

        const records: Array<{
            id: string;
            campaignName: string;
            year: number;
            role: string;
            result: string;
            type: "tournament" | "team";
        }> = [];

        // Tournament editions
        for (const ed of editions) {
            const isCaptain = ed.captain && String(ed.captain) === String(player._id);
            const isViceCaptain = ed.viceCaptain && String(ed.viceCaptain) === String(player._id);

            // Check if player's team contested this edition
            const relatedTeam = teams.find((t) => String(t._id) === String(ed.team));
            const isTeamMember =
                relatedTeam &&
                relatedTeam.players &&
                relatedTeam.players.some((pId) => String(pId) === String(player._id));

            if (isCaptain || isViceCaptain || isTeamMember) {
                let role = "Squad Member";
                if (isCaptain) role = "Captain";
                else if (isViceCaptain) role = "Vice-Captain";

                let result = "Contested";
                if (ed.finalPosition === 1) result = "Gold • 1st Place";
                else if (ed.finalPosition === 2) result = "Silver • 2nd Place";
                else if (ed.finalPosition === 3) result = "Bronze • 3rd Place";
                else if (ed.finalPosition) result = `Position #${ed.finalPosition}`;

                records.push({
                    id: ed._id,
                    campaignName: ed.edition,
                    year: ed.year,
                    role,
                    result,
                    type: "tournament",
                });
            }
        }

        // Teams where player represented the varsity squad
        for (const team of teams) {
            const isCaptain = team.captain && String(team.captain) === String(player._id);
            const isViceCaptain = team.viceCaptain && String(team.viceCaptain) === String(player._id);
            const isMember = team.players && team.players.some((pId) => String(pId) === String(player._id));

            if (isCaptain || isViceCaptain || isMember) {
                // Check if already documented via tournament edition
                const alreadyCovered = records.some((r) => r.year === team.year);
                if (!alreadyCovered) {
                    let role = "Squad Member";
                    if (isCaptain) role = "Captain";
                    else if (isViceCaptain) role = "Vice-Captain";

                    records.push({
                        id: team._id,
                        campaignName: `Varsity Hockey Squad ${team.year}`,
                        year: team.year,
                        role,
                        result: team.coach ? `Coached by ${team.coach}` : "Varsity Representative",
                        type: "team",
                    });
                }
            }
        }

        // Sort chronologically (newest first)
        return records.sort((a, b) => b.year - a.year);
    }, [player, editions, teams]);

    // Loading State Skeleton
    if (loading) {
        return (
            <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-screen-2xl mx-auto w-full bg-[#F4F1EA]">
                <div className="h-4 bg-[#dcdad3] rounded w-40 mb-8 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] aspect-[3/4]" />
                        <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] h-48" />
                    </div>
                    <div className="lg:col-span-8 space-y-10">
                        <div className="h-8 bg-[#dcdad3] rounded w-64 mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] h-36" />
                            <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] h-36" />
                        </div>
                        <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] h-64" />
                    </div>
                </div>
            </main>
        );
    }

    // Not Found State
    if (notFound) {
        return (
            <main className="flex-grow pt-16 pb-20 px-4 md:px-16 max-w-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-10 sm:p-12 border border-[rgba(26,26,26,0.12)] text-center space-y-4">
                    <Users className="w-12 h-12 text-[#5a181e] mx-auto opacity-70" />
                    <h2 className="text-2xl font-medium text-[#1A1A1A] tracking-tight">Player Record Not Found</h2>
                    <p className="text-sm text-[#6B665F] leading-relaxed">
                        The requested athlete profile does not exist in the IIT (BHU) Hockey Archive or may have been
                        reclassified.
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/roster"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA] hover:bg-[#3d030b] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return to Roster Directory
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // API Error State
    if (error || !player) {
        return (
            <main className="flex-grow pt-16 pb-20 px-4 md:px-16 max-w-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-10 sm:p-12 border border-[rgba(26,26,26,0.12)] text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-[#5a181e] mx-auto opacity-80" />
                    <h2 className="text-2xl font-medium text-[#1A1A1A] tracking-tight">Profile Unavailable</h2>
                    <p className="text-sm text-[#6B665F] leading-relaxed">
                        {error || "An unexpected error occurred while fetching the player dossier."}
                    </p>
                    <div className="pt-4 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={fetchPlayerData}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry Connection
                        </button>
                        <Link
                            to="/roster"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-[#ECE8E1] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] transition-colors"
                        >
                            Back to Roster
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Resolving photo URL (supports direct image url or fallback to curated archival asset)
    const fallbackPhoto = ARCHIVAL_PORTRAIT_FALLBACKS[0];
    const photoUrl = player.profilePhoto || fallbackPhoto;

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-screen-2xl mx-auto w-full bg-[#F4F1EA]">
            {/* Breadcrumb Navigation */}
            <div className="mb-8">
                <Link
                    to="/roster"
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#6B665F] hover:text-[#3d030b] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Roster Directory
                </Link>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Identity Sidebar (4 Columns) */}
                <aside className="lg:col-span-4 flex flex-col gap-6">
                    {/* Archival Portrait Frame */}
                    <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] rounded-none relative group">
                        <div className="w-full aspect-[3/4] bg-[#dcdad3] relative overflow-hidden border border-[rgba(26,26,26,0.12)]">
                            <img
                                src={photoUrl}
                                alt={player.name}
                                onError={(e) => {
                                    e.currentTarget.src = ARCHIVAL_PORTRAIT_FALLBACKS[0];
                                }}
                                className="w-full h-full object-cover transition-all duration-500"
                            />
                        </div>

                        {/* Floating Identification Plate */}
                        <div className="absolute bottom-6 left-6 right-6 bg-[#fcf9f2]/95 backdrop-blur-sm p-4 border-t border-[rgba(26,26,26,0.12)] shadow-xs">
                            <h1 className="text-xl sm:text-2xl font-bold text-[#3d030b] tracking-tight font-serif">
                                {player.name}
                            </h1>
                            <div className="text-xs text-[#6B665F] mt-1.5 flex justify-between items-center font-medium">
                                <span className="uppercase tracking-wider">
                                    {player.playingPosition || "Squad Member"}
                                </span>
                                {player.jerseyNumber !== undefined && (
                                    <span className="bg-[#E2DDD4] px-2.5 py-0.5 rounded-full text-[#1A1A1A] font-semibold border border-[rgba(26,26,26,0.08)]">
                                        #{player.jerseyNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Dossier */}
                    <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] space-y-3.5 text-xs sm:text-sm">
                        <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                            <span className="text-[#9C968D] uppercase tracking-wider text-xs font-medium">Status</span>
                            <span
                                className={`font-semibold ${
                                    player.status === "current" ? "text-[#2D5A3D]" : "text-[#3d030b]"
                                }`}
                            >
                                {player.status === "current" ? "Active Varsity Squad" : "Distinguished Alumni"}
                            </span>
                        </div>

                        <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                            <span className="text-[#9C968D] uppercase tracking-wider text-xs font-medium">
                                Active Years
                            </span>
                            <span className="text-[#1A1A1A] font-medium">{formatActiveYears(player)}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                            <span className="text-[#9C968D] uppercase tracking-wider text-xs font-medium">
                                Primary Position
                            </span>
                            <span className="text-[#1A1A1A] font-medium">{player.playingPosition || "Unassigned"}</span>
                        </div>

                        {player.jerseyNumber !== undefined && (
                            <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                                <span className="text-[#9C968D] uppercase tracking-wider text-xs font-medium">
                                    Jersey Number
                                </span>
                                <span className="text-[#1A1A1A] font-medium">#{player.jerseyNumber}</span>
                            </div>
                        )}

                        {player.leadershipRoles && player.leadershipRoles.length > 0 && (
                            <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                                <span className="text-[#9C968D] uppercase tracking-wider text-xs font-medium">
                                    Leadership
                                </span>
                                <span className="text-[#3d030b] font-semibold">
                                    {player.leadershipRoles.join(", ")}
                                </span>
                            </div>
                        )}

                        {/* Individual Statistics (from player model) */}
                        {player.individualStatistics && Object.keys(player.individualStatistics).length > 0 && (
                            <div className="pt-2">
                                <span className="text-[#9C968D] uppercase tracking-wider text-[11px] font-semibold block mb-2">
                                    Career Match Statistics
                                </span>
                                <div className="space-y-1.5 bg-[#F4F1EA] p-3 border border-[rgba(26,26,26,0.08)]">
                                    {Object.entries(player.individualStatistics).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-xs py-0.5">
                                            <span className="text-[#6B665F] capitalize">
                                                {key.replace(/([A-Z])/g, " $1").trim()}
                                            </span>
                                            <span className="font-semibold text-[#1A1A1A]">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area (8 Columns) */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Section 1: Achievement Ledger */}
                    <section>
                        <div className="mb-6 flex items-center justify-between border-b-2 border-[#3d030b] pb-2">
                            <h2 className="text-xl sm:text-2xl font-medium text-[#3d030b] flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[#5a181e]" />
                                Achievement Ledger
                            </h2>
                            <span className="text-xs text-[#6B665F]">
                                {playerAchievements.length} Documented Honors
                            </span>
                        </div>

                        {playerAchievements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {playerAchievements.map((ach) => (
                                    <div
                                        key={ach._id}
                                        className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] hover:border-[rgba(26,26,26,0.25)] transition-colors flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="text-base font-semibold text-[#1A1A1A] leading-snug">
                                                    {ach.title}
                                                </h3>
                                                <span className="bg-[#2D5A3D] text-white text-xs px-3 py-1 rounded-full font-medium shrink-0">
                                                    {ach.year}
                                                </span>
                                            </div>
                                            {ach.description && (
                                                <p className="text-xs text-[#6B665F] leading-relaxed mb-4">
                                                    {ach.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#9C968D]">
                                            <span className="flex items-center gap-1">
                                                <Award className="w-3.5 h-3.5 text-[#5a181e]" />
                                                {ach.type}
                                            </span>
                                            <span className="font-medium text-[#3d030b]">
                                                {ach.recipientType} Honor
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#ECE8E1] p-8 border border-[rgba(26,26,26,0.08)] text-center text-xs sm:text-sm text-[#6B665F]">
                                No individual award citations currently cataloged for this athlete.
                            </div>
                        )}
                    </section>

                    {/* Section 2: Tournament & Varsity Participation */}
                    <section>
                        <div className="mb-6 flex items-center justify-between border-b-2 border-[rgba(26,26,26,0.2)] pb-2">
                            <h2 className="text-xl sm:text-2xl font-medium text-[#3d030b] flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#5a181e]" />
                                Tournament & Varsity Campaigns
                            </h2>
                            <span className="text-xs text-[#6B665F]">
                                {participationRecords.length} Documented Campaigns
                            </span>
                        </div>

                        {participationRecords.length > 0 ? (
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[rgba(26,26,26,0.08)] bg-[#E2DDD4]">
                                            <th className="p-4 font-semibold text-[#1A1A1A]">Campaign</th>
                                            <th className="p-4 font-semibold text-[#1A1A1A]">Year</th>
                                            <th className="p-4 font-semibold text-[#1A1A1A]">Role</th>
                                            <th className="p-4 font-semibold text-[#1A1A1A]">Result / Standing</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.08)] font-normal">
                                        {participationRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-[#E2DDD4]/60 transition-colors">
                                                <td className="p-4 font-medium text-[#1A1A1A]">
                                                    {record.campaignName}
                                                </td>
                                                <td className="p-4 text-[#6B665F] font-medium">{record.year}</td>
                                                <td className="p-4">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            record.role === "Captain"
                                                                ? "bg-[#5a181e] text-white"
                                                                : record.role === "Vice-Captain"
                                                                  ? "bg-[#7D7871] text-white"
                                                                  : "bg-[#fcf9f2] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                                        }`}
                                                    >
                                                        {record.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-[#1A1A1A]">
                                                    {record.result.includes("Gold") ? (
                                                        <span className="bg-[#2D5A3D] text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                            {record.result}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#6B665F]">{record.result}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-[#ECE8E1] p-8 border border-[rgba(26,26,26,0.08)] text-center text-xs sm:text-sm text-[#6B665F]">
                                Active playing years: {formatActiveYears(player)}. Individual match sheets and
                                tournament entries will appear as archival scores are synchronized.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
