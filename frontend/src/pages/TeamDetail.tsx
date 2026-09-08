import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Users,
    Trophy,
    Calendar,
    AlertCircle,
    RotateCcw,
    Shield,
    Award,
    Medal,
} from "lucide-react";
import { getTeamById } from "@/api/teams";
import { getPlayerById } from "@/api/players";
import {
    getCachedPlayers,
    getCachedAchievements,
    getCachedTournamentEditions,
    getCachedTournaments,
} from "@/lib/catalogCache";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";
import type { TournamentEdition, Tournament } from "@/types/tournament";

function formatSeasonYear(year: number): string {
    const nextYearShort = String((year + 1) % 100).padStart(2, "0");
    return `${year}–${nextYearShort}`;
}

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

export default function TeamDetail() {
    const { id } = useParams<{ id: string }>();

    const [team, setTeam] = useState<Team | null>(null);
    const [captain, setCaptain] = useState<Player | null>(null);
    const [viceCaptain, setViceCaptain] = useState<Player | null>(null);
    const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [campaigns, setCampaigns] = useState<Array<{ edition: TournamentEdition; tournament?: Tournament }>>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);

    const fetchTeamData = useCallback(async () => {
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            // 1. Fetch team by ID from backend
            const teamRes = await getTeamById(id);
            const teamData = teamRes.data;

            if (!teamData) {
                setNotFound(true);
                return;
            }

            setTeam(teamData);

            // 2. Fetch shared catalogs concurrently
            const [cachedPlayersList, cachedAchievementsList, cachedEditionsList, cachedTournamentsList] =
                await Promise.all([
                    getCachedPlayers().catch(() => []),
                    getCachedAchievements().catch(() => []),
                    getCachedTournamentEditions().catch(() => []),
                    getCachedTournaments().catch(() => []),
                ]);

            const playersMap = new Map<string, Player>(cachedPlayersList.map((p) => [p._id, p]));
            const tournamentsMap = new Map<string, Tournament>(cachedTournamentsList.map((t) => [t._id, t]));

            // 3. Resolve Captain
            if (teamData.captain) {
                const captId =
                    typeof teamData.captain === "string" ? teamData.captain : (teamData.captain as Player)._id;
                let resolvedCaptain = playersMap.get(captId);
                if (!resolvedCaptain) {
                    try {
                        const captRes = await getPlayerById(captId);
                        resolvedCaptain = captRes.data;
                    } catch {
                        resolvedCaptain = undefined;
                    }
                }
                setCaptain(resolvedCaptain || null);
            } else {
                setCaptain(null);
            }

            // 4. Resolve Vice-Captain
            if (teamData.viceCaptain) {
                const vcId =
                    typeof teamData.viceCaptain === "string"
                        ? teamData.viceCaptain
                        : (teamData.viceCaptain as Player)._id;
                let resolvedVc = playersMap.get(vcId);
                if (!resolvedVc) {
                    try {
                        const vcRes = await getPlayerById(vcId);
                        resolvedVc = vcRes.data;
                    } catch {
                        resolvedVc = undefined;
                    }
                }
                setViceCaptain(resolvedVc || null);
            } else {
                setViceCaptain(null);
            }

            // 5. Resolve Squad Players
            const rawPlayerIds = teamData.players || [];
            const resolvedPlayers: Player[] = [];
            const missingIds: string[] = [];

            for (const item of rawPlayerIds) {
                const pId = typeof item === "string" ? item : (item as Player)._id;
                const cached = playersMap.get(pId);
                if (cached) {
                    resolvedPlayers.push(cached);
                } else {
                    missingIds.push(pId);
                }
            }

            if (missingIds.length > 0) {
                const fetchedMissing = await Promise.all(
                    missingIds.map(async (mId) => {
                        try {
                            const res = await getPlayerById(mId);
                            return res.data;
                        } catch {
                            return null;
                        }
                    }),
                );
                for (const p of fetchedMissing) {
                    if (p) {
                        resolvedPlayers.push(p);
                    }
                }
            }

            setSquadPlayers(resolvedPlayers);

            // 6. Resolve Achievements linked to this team or season
            const matchedAchievements = cachedAchievementsList.filter((ach) => {
                if (teamData.achievements && teamData.achievements.some((aId) => String(aId) === String(ach._id))) {
                    return true;
                }
                if (ach.recipientType === "Team" && String(ach.recipient) === String(teamData._id)) {
                    return true;
                }
                if (ach.recipientType === "Team" && ach.year === teamData.year) {
                    return true;
                }
                return false;
            });
            setAchievements(matchedAchievements);

            // 7. Resolve Tournament Campaigns for this team
            const matchedEditions = cachedEditionsList
                .filter((ed) => String(ed.team) === String(teamData._id) || ed.year === teamData.year)
                .map((ed) => ({
                    edition: ed,
                    tournament: tournamentsMap.get(ed.tournament),
                }));
            setCampaigns(matchedEditions);
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { status?: number; data?: { error?: { code?: string; message?: string } } };
                message?: string;
            };
            const status = errorObj.response?.status;
            const code = errorObj.response?.data?.error?.code;
            const msg = errorObj.message || errorObj.response?.data?.error?.message || "";

            if (
                status === 404 ||
                status === 400 ||
                code === "NOT_FOUND" ||
                code === "VALIDATION_ERROR" ||
                msg.toLowerCase().includes("not found") ||
                msg.toLowerCase().includes("objectid")
            ) {
                setNotFound(true);
            } else {
                setError(msg || "Failed to retrieve team record from server.");
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchTeamData();
    }, [fetchTeamData]);

    const seasonLabel = useMemo(() => {
        if (!team) return "";
        return formatSeasonYear(team.year);
    }, [team]);

    // Loading State Skeleton
    if (loading) {
        return (
            <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-screen-2xl mx-auto w-full bg-[#F4F1EA]">
                <div className="h-4 bg-[#dcdad3] rounded w-44 mb-8 animate-pulse" />
                <div className="space-y-8 animate-pulse">
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 md:p-12 h-96" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] h-44" />
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] h-44" />
                    </div>
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] h-72" />
                </div>
            </main>
        );
    }

    // Not Found (404) State
    if (notFound) {
        return (
            <main className="flex-grow pt-16 pb-20 px-4 md:px-16 max-w-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-10 sm:p-12 border border-[rgba(26,26,26,0.12)] text-center space-y-4 my-12">
                    <Users className="w-12 h-12 text-[#5a181e] mx-auto opacity-70" />
                    <h2 className="text-2xl font-medium text-[#1A1A1A] tracking-tight">Team Record Not Found</h2>
                    <p className="text-sm text-[#6B665F] leading-relaxed">
                        The requested squad archive could not be found in the IIT (BHU) Hockey records or the ID
                        provided is invalid.
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/teams"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA] hover:bg-[#3d030b] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Teams Archive
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // API Error State
    if (error || !team) {
        return (
            <main className="flex-grow pt-16 pb-20 px-4 md:px-16 max-w-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-10 sm:p-12 border border-[rgba(26,26,26,0.12)] text-center space-y-4 my-12">
                    <AlertCircle className="w-12 h-12 text-[#5a181e] mx-auto opacity-80" />
                    <h2 className="text-2xl font-medium text-[#1A1A1A] tracking-tight">Unable to Load Team Details</h2>
                    <p className="text-sm text-[#6B665F] leading-relaxed">
                        {error || "An unexpected error occurred while fetching the team record."}
                    </p>
                    <div className="pt-4 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => void fetchTeamData()}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry Connection
                        </button>
                        <Link
                            to="/teams"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA] hover:bg-[#3d030b] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Teams Archive
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-screen-2xl mx-auto w-full bg-[#F4F1EA]">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-8 text-[#6B665F] text-xs font-medium">
                <Link to="/teams" className="hover:text-[#3d030b] transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Teams Archive
                </Link>
                <span>/</span>
                <span className="text-[#1A1A1A] font-medium">{seasonLabel} Squad</span>
            </div>

            {/* Team Overview Hero Banner */}
            <section className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 sm:p-8 md:p-10 mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Info Column */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA] tracking-wide">
                                Season {seasonLabel}
                            </span>
                            {achievements.length > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2D5A3D] text-white flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5" />
                                    {achievements[0].title}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#1A1A1A] leading-tight">
                                {seasonLabel} Varsity Squad
                            </h1>
                            <p className="mt-3 text-sm sm:text-base text-[#6B665F] max-w-xl leading-relaxed">
                                Official roster and varsity delegation representing Indian Institute of Technology (BHU)
                                Varanasi in collegiate, Inter-IIT, and regional tournaments during the {seasonLabel}{" "}
                                athletic season.
                            </p>
                        </div>

                        {/* Metadata Badges & Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[rgba(26,26,26,0.08)]">
                            <div>
                                <span className="block text-[11px] uppercase tracking-wider text-[#9C968D] font-medium mb-1">
                                    Squad Strength
                                </span>
                                <span className="text-base font-medium text-[#1A1A1A] flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-[#5a181e]" />
                                    {squadPlayers.length} Athletes
                                </span>
                            </div>

                            <div>
                                <span className="block text-[11px] uppercase tracking-wider text-[#9C968D] font-medium mb-1">
                                    Head Coach / Staff
                                </span>
                                <span className="text-base font-medium text-[#1A1A1A] truncate block">
                                    {team.coach && team.coach !== "Not Assigned" ? team.coach : "Archival Record"}
                                </span>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <span className="block text-[11px] uppercase tracking-wider text-[#9C968D] font-medium mb-1">
                                    Academic Year
                                </span>
                                <span className="text-base font-medium text-[#1A1A1A] flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-[#5a181e]" />
                                    {team.year}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Team Portrait Column */}
                    <div className="lg:col-span-6">
                        <div className="aspect-[16/10] w-full bg-[#dcdad3] relative overflow-hidden border border-[rgba(26,26,26,0.12)] flex items-center justify-center">
                            {team.teamPhoto ? (
                                <img
                                    src={team.teamPhoto}
                                    alt={`${seasonLabel} IIT (BHU) Hockey Team`}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#6B665F]">
                                    <Users className="w-14 h-14 mb-3 text-[#5a181e]/40" />
                                    <span className="text-xs uppercase tracking-widest font-semibold text-[#1A1A1A]">
                                        {seasonLabel} Official Squad Portrait
                                    </span>
                                    <span className="text-[11px] text-[#9C968D] mt-1">
                                        Archival team portrait on file
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Squad Leadership Spotlight */}
            <section className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1A1A1A]">Team Leadership</h2>
                        <p className="text-xs text-[#6B665F] mt-1">
                            Captains guiding the varsity lineup for this season
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Captain Card */}
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA]">
                                    Team Captain
                                </span>
                                <Shield className="w-4 h-4 text-[#5a181e]" />
                            </div>

                            {captain ? (
                                <Link
                                    to={`/roster/${captain._id}`}
                                    className="group flex gap-4 items-center hover:opacity-90 transition-opacity"
                                >
                                    <div className="w-16 h-20 bg-[#dcdad3] border border-[rgba(26,26,26,0.1)] shrink-0 overflow-hidden flex items-center justify-center">
                                        {captain.profilePhoto ? (
                                            <img
                                                src={captain.profilePhoto}
                                                alt={captain.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Users className="w-8 h-8 text-[#5a181e]/40" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#5a181e] transition-colors truncate">
                                            {captain.name}
                                        </h3>
                                        <p className="text-xs text-[#6B665F] uppercase tracking-wider font-medium mt-0.5">
                                            {captain.playingPosition || "Varsity Athlete"}
                                        </p>
                                        {captain.jerseyNumber !== undefined && (
                                            <p className="text-xs text-[#9C968D] font-mono mt-1">
                                                Jersey #{captain.jerseyNumber}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <div className="py-4 text-[#6B665F] text-sm">
                                    <span>To be appointed / Not documented in archive</span>
                                </div>
                            )}
                        </div>

                        {captain && (
                            <div className="pt-4 mt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                <span>{formatActiveYears(captain)}</span>
                                <Link
                                    to={`/roster/${captain._id}`}
                                    className="text-[#5a181e] font-medium hover:underline flex items-center gap-1"
                                >
                                    View Dossier <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Vice-Captain Card */}
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#3d030b] text-[#F4F1EA]">
                                    Vice-Captain
                                </span>
                                <Shield className="w-4 h-4 text-[#3d030b]" />
                            </div>

                            {viceCaptain ? (
                                <Link
                                    to={`/roster/${viceCaptain._id}`}
                                    className="group flex gap-4 items-center hover:opacity-90 transition-opacity"
                                >
                                    <div className="w-16 h-20 bg-[#dcdad3] border border-[rgba(26,26,26,0.1)] shrink-0 overflow-hidden flex items-center justify-center">
                                        {viceCaptain.profilePhoto ? (
                                            <img
                                                src={viceCaptain.profilePhoto}
                                                alt={viceCaptain.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Users className="w-8 h-8 text-[#5a181e]/40" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#5a181e] transition-colors truncate">
                                            {viceCaptain.name}
                                        </h3>
                                        <p className="text-xs text-[#6B665F] uppercase tracking-wider font-medium mt-0.5">
                                            {viceCaptain.playingPosition || "Varsity Athlete"}
                                        </p>
                                        {viceCaptain.jerseyNumber !== undefined && (
                                            <p className="text-xs text-[#9C968D] font-mono mt-1">
                                                Jersey #{viceCaptain.jerseyNumber}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <div className="py-4 text-[#6B665F] text-sm">
                                    <span>To be appointed / Not documented in archive</span>
                                </div>
                            )}
                        </div>

                        {viceCaptain && (
                            <div className="pt-4 mt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                <span>{formatActiveYears(viceCaptain)}</span>
                                <Link
                                    to={`/roster/${viceCaptain._id}`}
                                    className="text-[#5a181e] font-medium hover:underline flex items-center gap-1"
                                >
                                    View Dossier <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Coaching Staff Card */}
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]">
                                    Team Management
                                </span>
                                <Users className="w-4 h-4 text-[#6B665F]" />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-[#9C968D] font-medium block">
                                        Head Coach / In-Charge
                                    </span>
                                    <p className="text-lg font-medium text-[#1A1A1A] mt-0.5">
                                        {team.coach && team.coach !== "Not Assigned"
                                            ? team.coach
                                            : "Varsity Athletic Council"}
                                    </p>
                                </div>
                                <p className="text-xs text-[#6B665F] leading-relaxed">
                                    Overseeing training sessions, tactical preparations, and tournament squad selection
                                    for IIT (BHU) Hockey Club.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                            <span>Season {seasonLabel}</span>
                            <span className="text-[#9C968D] font-medium">IIT (BHU) Varanasi</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Official Squad Roster Grid */}
            <section className="mb-14">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1A1A1A]">
                                Official Squad Roster
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]">
                                {squadPlayers.length} Athletes
                            </span>
                        </div>
                        <p className="text-xs text-[#6B665F] mt-1">
                            Registered student-athletes representing IIT (BHU) in {seasonLabel}
                        </p>
                    </div>
                </div>

                {squadPlayers.length === 0 ? (
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-8">
                        <Users className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-40" />
                        <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Roster Entries Recorded</h3>
                        <p className="text-sm text-[#6B665F] leading-relaxed">
                            No individual player dossiers have been attached to this team record yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 auto-rows-fr items-stretch">
                        {squadPlayers.map((player) => {
                            const isCaptain = team.captain && String(team.captain) === String(player._id);
                            const isViceCaptain = team.viceCaptain && String(team.viceCaptain) === String(player._id);

                            return (
                                <Link
                                    key={player._id}
                                    to={`/roster/${player._id}`}
                                    className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] hover:border-[rgba(26,26,26,0.25)] rounded-none overflow-hidden group hover:bg-[#E2DDD4] transition-colors cursor-pointer flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-[#5a181e]/30"
                                >
                                    {/* Photo Mount Frame */}
                                    <div className="relative w-full aspect-[3/4] bg-[#dcdad3] p-3 sm:p-4 md:p-5 lg:p-6 flex items-center justify-center shrink-0">
                                        {player.profilePhoto ? (
                                            <img
                                                src={player.profilePhoto}
                                                alt={player.name}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                                className="w-full h-full object-cover transition-all duration-500 border border-[rgba(26,26,26,0.1)]"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#dcdad3] flex flex-col items-center justify-center p-3 sm:p-4 text-center text-[#6B665F] border border-[rgba(26,26,26,0.1)]">
                                                <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-1.5 sm:mb-2 text-[#5a181e]/40" />
                                                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate max-w-full">
                                                    {player.playingPosition || "Squad Athlete"}
                                                </span>
                                            </div>
                                        )}

                                        {/* Leadership / Status Pill Badge */}
                                        {(isCaptain || isViceCaptain) && (
                                            <div
                                                className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 md:top-4 md:right-4 px-2 py-0.5 sm:px-2.5 sm:py-0.5 md:px-3 md:py-1 rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-medium uppercase tracking-wider ${
                                                    isCaptain ? "bg-[#5a181e] text-white" : "bg-[#3d030b] text-white"
                                                }`}
                                            >
                                                {isCaptain ? "Captain" : "Vice-Capt"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Player Card Details */}
                                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between border-t border-[rgba(26,26,26,0.08)] min-w-0">
                                        <div className="min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-1.5 min-w-0">
                                                <h3 className="text-sm sm:text-base font-medium text-[#1A1A1A] group-hover:text-[#5a181e] transition-colors truncate min-w-0 flex-1">
                                                    {player.name}
                                                </h3>
                                                {player.jerseyNumber !== undefined && (
                                                    <span className="text-xs sm:text-sm font-medium text-[#9C968D] shrink-0 font-mono">
                                                        #{player.jerseyNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-[#6B665F] uppercase tracking-wider mb-2 sm:mb-3 font-medium truncate">
                                                {player.playingPosition || "Squad Member"}
                                            </p>
                                        </div>

                                        {/* Active Period & Arrow CTA */}
                                        <div className="pt-2.5 sm:pt-3 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-[11px] sm:text-xs text-[#6B665F] min-w-0 mt-auto">
                                            <span className="truncate mr-1 min-w-0">{formatActiveYears(player)}</span>
                                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9C968D] group-hover:text-[#5a181e] group-hover:translate-x-1 transition-all shrink-0" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Honors & Distinctions Section */}
            {achievements.length > 0 && (
                <section className="mb-14">
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1A1A1A]">
                            Honors & Distinctions
                        </h2>
                        <p className="text-xs text-[#6B665F] mt-1">Titles and medals secured during this season</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {achievements.map((ach) => (
                            <div
                                key={ach._id}
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2D5A3D] text-white">
                                            {ach.type}
                                        </span>
                                        <Medal className="w-5 h-5 text-[#2D5A3D]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">{ach.title}</h3>
                                    {ach.description && (
                                        <p className="text-xs text-[#6B665F] leading-relaxed line-clamp-3">
                                            {ach.description}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 mt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                    <span>Season {ach.year}</span>
                                    <span className="font-medium text-[#1A1A1A]">{ach.recipientType} Honor</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Tournament Campaigns Section */}
            {campaigns.length > 0 && (
                <section className="mb-8">
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1A1A1A]">
                            Tournament Campaigns
                        </h2>
                        <p className="text-xs text-[#6B665F] mt-1">
                            Tournaments and championship meets contested by this team
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map(({ edition, tournament }) => (
                            <Link
                                key={edition._id}
                                to={
                                    tournament
                                        ? `/tournaments/${tournament._id}/editions/${edition._id}`
                                        : `/tournament-editions/${edition._id}`
                                }
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 hover:border-[rgba(26,26,26,0.25)] hover:bg-[#E2DDD4] transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA]">
                                            {edition.edition}
                                        </span>
                                        <Award className="w-4 h-4 text-[#5a181e]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#5a181e] transition-colors mb-1">
                                        {tournament?.name || `Championship ${edition.year}`}
                                    </h3>
                                    {edition.hostInstitute && (
                                        <p className="text-xs text-[#6B665F]">Host: {edition.hostInstitute}</p>
                                    )}
                                    {edition.finalPosition !== undefined && (
                                        <p className="text-xs font-medium text-[#2D5A3D] mt-2">
                                            Finish:{" "}
                                            {edition.finalPosition === 1
                                                ? "Champions (1st Place)"
                                                : edition.finalPosition === 2
                                                  ? "Runners-up (2nd Place)"
                                                  : edition.finalPosition === 3
                                                    ? "3rd Place"
                                                    : `${edition.finalPosition}th Place`}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 mt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                    <span>Year {edition.year}</span>
                                    <span className="text-[#5a181e] font-medium flex items-center gap-1 group-hover:underline">
                                        View Campaign <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
