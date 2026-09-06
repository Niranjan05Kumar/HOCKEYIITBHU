import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, AlertTriangle, RefreshCw } from "lucide-react";
import { getPlayers } from "@/api/players";
import { getTeams } from "@/api/teams";
import { getTournaments, getTournamentEditions } from "@/api/tournaments";
import { getMatches } from "@/api/matches";
import { getAchievements } from "@/api/achievements";
import { getHistoryEvents } from "@/api/history";
import { getGalleryItems } from "@/api/gallery";

interface ArchiveCounts {
    players: number;
    teams: number;
    tournaments: number;
    tournamentEditions: number;
    matches: number;
    achievements: number;
    historyEvents: number;
    galleryItems: number;
    total: number;
}

interface ModuleItem {
    title: string;
    sublabel: string;
    path: string;
    key: keyof Omit<ArchiveCounts, "total">;
}

const MODULES: ModuleItem[] = [
    {
        title: "Players",
        sublabel: "Verified Roster Profiles",
        path: "/admin/players",
        key: "players",
    },
    {
        title: "Teams",
        sublabel: "Varsity & Cohort Squads",
        path: "/admin/teams",
        key: "teams",
    },
    {
        title: "Tournaments",
        sublabel: "Sanctioned Competitions",
        path: "/admin/tournaments",
        key: "tournaments",
    },
    {
        title: "Tournament Editions",
        sublabel: "Documented Seasons",
        path: "/admin/tournament-editions",
        key: "tournamentEditions",
    },
    {
        title: "Matches",
        sublabel: "Logged Scorelines",
        path: "/admin/matches",
        key: "matches",
    },
    {
        title: "Achievements",
        sublabel: "Trophies & Honors",
        path: "/admin/achievements",
        key: "achievements",
    },
    {
        title: "History Events",
        sublabel: "Chronicle Milestones",
        path: "/admin/history",
        key: "historyEvents",
    },
    {
        title: "Gallery Items",
        sublabel: "Digitized Photographs",
        path: "/admin/gallery",
        key: "galleryItems",
    },
];

export default function AdminDashboard() {
    const [counts, setCounts] = useState<ArchiveCounts>({
        players: 0,
        teams: 0,
        tournaments: 0,
        tournamentEditions: 0,
        matches: 0,
        achievements: 0,
        historyEvents: 0,
        galleryItems: 0,
        total: 0,
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCounts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [
                playersRes,
                teamsRes,
                tournamentsRes,
                editionsRes,
                matchesRes,
                achievementsRes,
                historyRes,
                galleryRes,
            ] = await Promise.all([
                getPlayers({ limit: 1 }),
                getTeams({ limit: 1 }),
                getTournaments({ limit: 1 }),
                getTournamentEditions({ limit: 1 }),
                getMatches({ limit: 1 }),
                getAchievements({ limit: 1 }),
                getHistoryEvents({ limit: 1 }),
                getGalleryItems({ limit: 1 }),
            ]);

            const getCount = (res: { meta?: { total: number }; data?: unknown[] }): number => {
                return res?.meta?.total ?? (Array.isArray(res?.data) ? res.data.length : 0);
            };

            const players = getCount(playersRes);
            const teams = getCount(teamsRes);
            const tournaments = getCount(tournamentsRes);
            const tournamentEditions = getCount(editionsRes);
            const matches = getCount(matchesRes);
            const achievements = getCount(achievementsRes);
            const historyEvents = getCount(historyRes);
            const galleryItems = getCount(galleryRes);

            const total =
                players +
                teams +
                tournaments +
                tournamentEditions +
                matches +
                achievements +
                historyEvents +
                galleryItems;

            setCounts({
                players,
                teams,
                tournaments,
                tournamentEditions,
                matches,
                achievements,
                historyEvents,
                galleryItems,
                total,
            });
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load archival records summary from server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat("en-US").format(num);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA]">
            {/* Standardized Admin Page Header */}
            <header className="px-6 md:px-8 py-6 border-b border-[rgba(26,26,26,0.08)] bg-[#FCF9F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-tight">
                        Archival Control &amp; Overview
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1">
                        Comprehensive metrics and archival records ledger summary.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={fetchCounts}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#6B665F] hover:text-[#1A1A1A] border border-[rgba(26,26,26,0.15)] hover:border-[rgba(26,26,26,0.3)] transition-all bg-[#ECE8E1] hover:bg-[#E2DDD4] rounded-full disabled:opacity-50 cursor-pointer tracking-wider uppercase"
                        title="Synchronize records"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>SYNC</span>
                    </button>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Error State Banner */}
                    {error && (
                        <div className="bg-[#ECE8E1] border border-[#7A2E2E]/40 p-6 corner-decor relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-[#7A2E2E] shrink-0" />
                                <div>
                                    <h3 className="text-sm font-semibold text-[#1A1A1A]">
                                        Catalog Synchronization Error
                                    </h3>
                                    <p className="text-xs text-[#6B665F] mt-0.5">{error}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fetchCounts}
                                className="px-4 py-2 bg-[#3d030b] text-[#F4F1EA] text-xs font-semibold uppercase tracking-wider hover:bg-[#5a181e] transition-colors"
                            >
                                Retry Sync
                            </button>
                        </div>
                    )}

                    {/* Prominent Total Archive Card (Wide Horizontal Banner) */}
                    <section className="relative bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 md:p-12 transition-colors corner-decor">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-[#3d030b]" />
                                    <p className="text-xs uppercase tracking-[0.16em] text-[#6B665F] font-semibold">
                                        Total Archive Records
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="h-16 w-48 bg-[#DCDAD3] animate-pulse rounded-xs my-1" />
                                ) : (
                                    <div className="text-5xl sm:text-6xl md:text-7xl font-light text-[#3d030b] tracking-tight tabular-nums leading-none">
                                        {formatNumber(counts.total)}
                                    </div>
                                )}
                            </div>

                            <div className="lg:text-right max-w-md">
                                <p className="text-sm sm:text-[15px] text-[#1A1A1A] font-normal leading-relaxed">
                                    Permanent catalog entries verified across 10 decades of varsity play.
                                </p>
                                <p className="text-[11px] md:text-xs text-[#9C968D] uppercase tracking-widest mt-2 font-medium">
                                    Status: Verified Institutional Catalog
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 8 Module Record Stat Cards in a Balanced 4-Column Layout */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {MODULES.map((mod) => {
                            const count = counts[mod.key];
                            return (
                                <Link
                                    key={mod.path}
                                    to={mod.path}
                                    className="relative bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 hover:bg-[#E2DDD4] transition-colors flex flex-col justify-between corner-decor min-h-[175px] group block"
                                >
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.14em] text-[#6B665F] font-semibold group-hover:text-[#3d030b] transition-colors">
                                            {mod.title}
                                        </p>
                                        {loading ? (
                                            <div className="h-11 w-24 bg-[#DCDAD3] animate-pulse rounded-xs mt-3" />
                                        ) : (
                                            <p className="text-[44px] leading-none font-light tracking-tight text-[#3d030b] mt-3 tabular-nums">
                                                {formatNumber(count)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] mt-6 flex items-center justify-between">
                                        <p className="text-[11px] text-[#9C968D] tracking-wider uppercase font-medium">
                                            {mod.sublabel}
                                        </p>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-[#9C968D] opacity-0 group-hover:opacity-100 group-hover:text-[#3d030b] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                </Link>
                            );
                        })}
                    </section>
                </div>
            </main>
        </div>
    );
}
