import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertCircle, RotateCcw, Users } from "lucide-react";
import { getTeams } from "@/api/teams";
import { getPlayers } from "@/api/players";
import { getAchievements } from "@/api/achievements";
import type { Team, TeamQuery } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";

const ERA_FILTERS = [
    { label: "All Eras", value: "ALL" },
    { label: "2020s", value: "2020s", min: 2020, max: 2029 },
    { label: "2010s", value: "2010s", min: 2010, max: 2019 },
    { label: "Historical", value: "HISTORICAL", min: 1900, max: 2009 },
];

// Curated authentic archival imagery from the Stitch Teams Archive design
const ARCHIVAL_FALLBACK_PHOTOS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAvrRtF5EyeI1dzyjAAZ8KqeKWn7pjMdCAirNvlhuXIAFUPjtGD-Ok-365rrxiHPrEL46WlhC4OLeZuTcWculxokU3cBxtIFyIgQaq_p2f_mWkxbrSxxQvhdpHedWmGDn8uUNGy4zkNbp2YQ1Ml5woU8ZcNyB7f5NHgdnUSYBtxZJ9XmJ6nxkEQXUIdEe9ec2B6LTwCafl1wtzuJIuECW_9_Eide11YWfBiNS54GxNhIEY1-1QK0xxp",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBtmSVjJtBuyW4fp3DXlTyilmZ4qWdo5F48Jbl3MJVFfRw7bZnHwi-Fic_pZKpxhQBPWMmU6pV1xC59wP6yOF__5pp05gpi0t4glkLWnZdfG-2D29JieARUKldo6-HGC6mP_sI_TOY6X8ddlKKbHAdBSSxAifWZIQTIknfKUmp6z4dawcEBGnEmgcSbHYx7ZVvAPMI28_b2FlHN_sQUN6KuDiFt10JW6oXfiLHJ7w0yZXXe5JILES89",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB8aQtAAMFbhndigutyeYrl0jDdnpYlKhohFGDsdTraq2QZz4e0kqKxkmgl90Wv0J35_5T_qZrbDARTkJlZE6Rc4ONING3V--192K9OMlynMPYm9LIfAkGRU65iy2uHmjWkcAX7Vsut1TU-aa5zgN-gKlnvm6DLIF3guadaPuh12B2dhLGPo2ZNbO9kbrpB3I5elW3GUm9Zy6QDfudIGOihYUykfFpvP8D98S64B-FK4prFQIECOtQS",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAIVFO5SnSKmpprjm8UJMR0m47INc-LCnEpnuRQmsRoRoo74K2_-EgoafqkhMiQOGax0-YRPNqCvFLk4bVlkNEBxhM1H7ZPTHYTPJLBcDbJqqRoAZQheCp2nUGMwU6RULNrS-jJ4lRiAkPk7_vDKmBmiPi9YyymaqDCu5HP0212vtPEcDcJazDEC6B55-c1b-C1lNPjG5cglBsiij-agTJkJxSXYLJ1qAUVThPvtfsZHcg1hH6WQo4h",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDrULn3QWq7rzqfevj_CsfacfezNx6K-6xNF1xI_dbOKZRK1tOedhTp_0XyXKOE_6dvmKWzQI4AHeuu3PecgkN3Ei3ovp-DRIgFMyw2hg85UnDETCm_K9nxS8Tt9hYnaVj8-aY7yBG_7onjPohgq2uZ2cEIk9qKDJ9e1x5oUxnOLywBwXc_ynbbnYw0H0yhugYKpDrMcWLkGqd6AyaGwx6Oo4PvfC5WEUDjLhgEFXmDu3kjUMMC_M2J",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDejODOGo69W7KUERfCn2kVnq3WixGtdIkrtNvWHfAZZkFqcKzihrk_oIEO1_tOdv5dVR4f3dfZBHzpXKfF_76s_HSD0dIyTb0FhDLbobgjDTFJ9FpB8JVl6cGHMxlYX3J_zEvGL3TFyzYmavhpLE5T4fBZGELTPM6IKzkDREL-R5Wh93f2T5X9MRuJnc96IclQZY1eQNYHzuFkVZTbgCk6AuxgGNoK2z5bs7-_8QVfrZgeWV--UiwB",
];

const ARCHIVAL_FILTERS = [
    "grayscale contrast-125",
    "sepia-[0.3]",
    "grayscale",
    "grayscale contrast-150",
    "sepia-[0.5]",
    "grayscale contrast-110",
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
            const queryParams: TeamQuery = {
                limit: 100,
                sort: "year",
                order: "desc",
            };

            const [teamsRes, playersRes, achievementsRes] = await Promise.all([
                getTeams(queryParams),
                getPlayers({ limit: 100 }).catch(() => ({ data: [] })),
                getAchievements({ limit: 100 }).catch(() => ({ data: [] })),
            ]);

            setTeams(teamsRes.data || []);
            setPlayers(playersRes.data || []);
            setAchievements(achievementsRes.data || []);
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
                    {filteredTeams.map((team, index) => {
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
                                } else {
                                    badgeStyle = "bg-[#5a181e] text-[#ffffff] font-medium";
                                }
                            }
                        }

                        // Curated archival photo fallback cycling through the Stitch design imagery
                        const fallbackIndex =
                            Math.abs(team.year % ARCHIVAL_FALLBACK_PHOTOS.length) ||
                            index % ARCHIVAL_FALLBACK_PHOTOS.length;
                        const photoUrl = team.teamPhoto || ARCHIVAL_FALLBACK_PHOTOS[fallbackIndex];
                        const photoFilter = ARCHIVAL_FILTERS[fallbackIndex % ARCHIVAL_FILTERS.length];

                        return (
                            <Link
                                key={team._id}
                                to={`/teams/${team._id}`}
                                className="bg-[#ECE8E1] rounded-none border border-[rgba(26,26,26,0.08)] hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5a181e]/30"
                            >
                                <div className="p-6 pb-0">
                                    <div className="aspect-[4/3] w-full bg-[#dcdad3] relative overflow-hidden mb-6 border border-[rgba(26,26,26,0.08)]">
                                        <img
                                            src={photoUrl}
                                            alt={`${seasonLabel} IIT (BHU) Hockey Team`}
                                            onError={(e) => {
                                                e.currentTarget.src = ARCHIVAL_FALLBACK_PHOTOS[0];
                                            }}
                                            className={`w-full h-full object-cover filter ${photoFilter} group-hover:scale-105 transition-transform duration-500`}
                                            loading="lazy"
                                        />
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
