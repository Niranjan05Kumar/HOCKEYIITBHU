import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertCircle, RotateCcw, Users } from "lucide-react";
import { getCachedTeams, getCachedPlayers, getCachedAchievements } from "@/lib/catalogCache";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";

const ERA_FILTERS = [
    { label: "All Eras", value: "ALL" },
    { label: "2020s", value: "2020s", min: 2020, max: 2029 },
    { label: "2010s", value: "2010s", min: 2010, max: 2019 },
    { label: "Historical", value: "HISTORICAL", min: 1900, max: 2009 },
];

function formatSeasonYear(year: number): string {
    if (!year) return "";
    const nextYearTwoDigits = ((year + 1) % 100).toString().padStart(2, "0");
    return `${year}-${nextYearTwoDigits}`;
}

export default function Teams() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedEra, setSelectedEra] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchTeamsData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [teamsRes, playersRes, achievementsRes] = await Promise.allSettled([
                getCachedTeams(),
                getCachedPlayers(),
                getCachedAchievements(),
            ]);

            if (teamsRes.status === "fulfilled") setTeams(teamsRes.value);
            if (playersRes.status === "fulfilled") setPlayers(playersRes.value);
            if (achievementsRes.status === "fulfilled") setAchievements(achievementsRes.value);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load teams archive from server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTeamsData();
    }, [fetchTeamsData]);

    // Map players by ID for fast name lookup
    const playersMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const p of players) {
            map.set(p._id, p.name);
        }
        return map;
    }, [players]);

    // Map achievements by ID for fast title and type lookup
    const achievementsMap = useMemo(() => {
        const map = new Map<string, { title: string; type: string }>();
        for (const a of achievements) {
            map.set(a._id, { title: a.title, type: a.type });
        }
        return map;
    }, [achievements]);

    // Filter teams by selected era and search query
    const filteredTeams = useMemo(() => {
        return teams.filter((team) => {
            // Era filter
            if (selectedEra !== "ALL") {
                const eraConfig = ERA_FILTERS.find((e) => e.value === selectedEra);
                if (eraConfig && eraConfig.min !== undefined && eraConfig.max !== undefined) {
                    if (team.year < eraConfig.min || team.year > eraConfig.max) {
                        return false;
                    }
                }
            }

            // Search query filter (year, coach, or captain name)
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const yearStr = team.year.toString();
                const seasonStr = formatSeasonYear(team.year).toLowerCase();
                const coachStr = (team.coach || "").toLowerCase();

                let captainStr = "";
                if (team.captain) {
                    if (typeof team.captain === "object") {
                        captainStr = ((team.captain as { name?: string }).name || "").toLowerCase();
                    } else {
                        captainStr = (playersMap.get(team.captain) || "").toLowerCase();
                    }
                }

                const matchesYear = yearStr.includes(query) || seasonStr.includes(query);
                const matchesCoach = coachStr.includes(query);
                const matchesCaptain = captainStr.includes(query);

                if (!matchesYear && !matchesCoach && !matchesCaptain) {
                    return false;
                }
            }

            return true;
        });
    }, [teams, selectedEra, searchQuery, playersMap]);

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Header Section */}
            <header className="mb-10 sm:mb-14 border-b border-[rgba(26,26,26,0.08)] pb-8">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-[#3d030b] mb-4">
                    Teams Archive
                </h1>
                <p className="text-sm sm:text-base text-[#6B665F] max-w-2xl leading-relaxed">
                    A chronological record of the squads that have represented IIT (BHU) Hockey over the years.
                    Preserving our legacy, one season at a time.
                </p>
            </header>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10 pb-6 border-b border-[rgba(26,26,26,0.08)]">
                {/* Era Filter Chips */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 w-full lg:w-auto scrollbar-none">
                    {ERA_FILTERS.map((era) => (
                        <button
                            key={era.value}
                            type="button"
                            onClick={() => setSelectedEra(era.value)}
                            className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedEra === era.value
                                    ? "bg-[#5a181e] text-[#F4F1EA] shadow-sm"
                                    : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)]"
                            }`}
                        >
                            {era.label}
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by year or captain..."
                        aria-label="Search teams by year or captain"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded-full text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#5a181e] transition-colors"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 animate-pulse flex flex-col justify-between"
                        >
                            <div className="aspect-[4/3] w-full bg-[#dcdad3] mb-6 border border-[rgba(26,26,26,0.08)]" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-7 bg-[#dcdad3] rounded w-28" />
                                <div className="h-6 bg-[#dcdad3] rounded-full w-24" />
                            </div>
                            <div className="border-t border-[rgba(26,26,26,0.08)] pt-4 flex justify-between items-center">
                                <div className="h-4 bg-[#dcdad3] rounded w-16" />
                                <div className="h-4 bg-[#dcdad3] rounded w-28" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-12 text-center max-w-xl mx-auto my-12">
                    <AlertCircle className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Unable to Load Teams Archive</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchTeamsData}
                        className="px-6 py-2.5 border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredTeams.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-12">
                    <Users className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Squad Records Found</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">
                        {searchQuery || selectedEra !== "ALL"
                            ? "No team records matched your filter criteria. Try selecting another era or clearing the search."
                            : "No team records are currently documented in the database."}
                    </p>
                    {(searchQuery || selectedEra !== "ALL") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedEra("ALL");
                                setSearchQuery("");
                            }}
                            className="px-6 py-2.5 border border-[rgba(26,26,26,0.25)] hover:border-[#5a181e] rounded-full text-xs font-medium text-[#1A1A1A] hover:text-[#5a181e] hover:bg-[#E2DDD4] transition-colors"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            )}

            {/* Chronological Grid */}
            {!loading && !error && filteredTeams.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map((team) => {
                        const seasonLabel = formatSeasonYear(team.year);

                        // Resolve Captain Name
                        let captainName = "To be appointed";
                        if (team.captain) {
                            if (typeof team.captain === "object" && team.captain !== null) {
                                captainName = (team.captain as { name?: string }).name || "Varsity Captain";
                            } else if (typeof team.captain === "string") {
                                captainName = playersMap.get(team.captain) || "Varsity Captain";
                            }
                        }

                        // Resolve Achievement or Status Badge
                        let badgeText = "Varsity Squad";
                        let badgeStyle = "bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)] font-medium";

                        if (team.achievements && team.achievements.length > 0) {
                            const firstAchId = team.achievements[0];
                            const achievementInfo = achievementsMap.get(firstAchId);
                            if (achievementInfo) {
                                badgeText = achievementInfo.title;
                                const titleLower = achievementInfo.title.toLowerCase();
                                if (
                                    titleLower.includes("gold") ||
                                    titleLower.includes("champion") ||
                                    titleLower.includes("winner")
                                ) {
                                    badgeStyle = "bg-[#2D5A3D] text-[#ffffff] font-medium";
                                } else if (
                                    titleLower.includes("silver") ||
                                    titleLower.includes("bronze") ||
                                    titleLower.includes("runner")
                                ) {
                                    badgeStyle = "bg-[#7D7871] text-[#ffffff] font-medium";
                                }
                            }
                        }

                        return (
                            <Link
                                key={team._id}
                                to={`/teams/${team._id}`}
                                className="bg-[#ECE8E1] rounded-none border border-[rgba(26,26,26,0.08)] hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5a181e]/30"
                            >
                                <div className="p-6 pb-0">
                                    <div className="aspect-[4/3] w-full bg-[#dcdad3] relative overflow-hidden mb-6 border border-[rgba(26,26,26,0.08)] flex items-center justify-center">
                                        {team.teamPhoto ? (
                                            <img
                                                src={team.teamPhoto}
                                                alt={`${seasonLabel} IIT (BHU) Hockey Team`}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#6B665F]">
                                                <Users className="w-10 h-10 mb-2 text-[#5a181e]/40" />
                                                <span className="text-xs uppercase tracking-widest font-semibold">
                                                    {seasonLabel} Official Squad
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 pt-0 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#1A1A1A]">
                                            {seasonLabel}
                                        </h2>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${badgeStyle}`}
                                        >
                                            {badgeText}
                                        </span>
                                    </div>
                                    <div className="mt-auto space-y-2">
                                        <div className="border-t border-[rgba(26,26,26,0.08)] pt-4 flex justify-between items-center group-hover:border-[rgba(26,26,26,0.25)] transition-colors">
                                            <span className="text-xs uppercase tracking-wider text-[#9C968D] font-medium">
                                                Captain
                                            </span>
                                            <span className="text-sm font-medium text-[#1A1A1A]">{captainName}</span>
                                        </div>
                                        {team.coach && (
                                            <div className="flex justify-between items-center text-xs text-[#6B665F]">
                                                <span className="uppercase tracking-wider text-[#9C968D] text-[11px]">
                                                    Coach
                                                </span>
                                                <span className="font-normal">{team.coach}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
