import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Swords,
    Trophy,
    Calendar,
    Search,
    AlertCircle,
    RotateCcw,
    ArrowRight,
    Filter,
    X,
    TrendingUp,
    Shield,
    ExternalLink,
} from "lucide-react";
import { getMatches } from "@/api/matches";
import { getTournamentEditions } from "@/api/tournaments";
import type { Match, MatchResult } from "@/types/match";
import type { TournamentEdition } from "@/types/tournament";
import CustomSelect from "@/components/common/CustomSelect";

const RESULT_FILTERS: { label: string; value: "ALL" | MatchResult }[] = [
    { label: "All Results", value: "ALL" },
    { label: "Wins", value: "Win" },
    { label: "Draws", value: "Draw" },
    { label: "Losses", value: "Loss" },
];

export default function Matches() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlEditionId = searchParams.get("tournamentEditionId") || "";

    const [matches, setMatches] = useState<Match[]>([]);
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedEditionId, setSelectedEditionId] = useState<string>(urlEditionId);
    const [selectedResult, setSelectedResult] = useState<"ALL" | MatchResult>("ALL");
    const [selectedStage, setSelectedStage] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Sync selected edition when URL param changes
    useEffect(() => {
        setSelectedEditionId(urlEditionId);
    }, [urlEditionId]);

    // Fetch matches and editions
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [matchesRes, editionsRes] = await Promise.all([
                getMatches({ limit: 100, sort: "date", order: "desc" }),
                getTournamentEditions({ limit: 100, sort: "year", order: "desc" }),
            ]);

            setMatches(matchesRes.data || []);
            setEditions(editionsRes.data || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load matches archive from server";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Map edition ID to edition for fast lookup
    const editionsMap = useMemo(() => {
        const map = new Map<string, TournamentEdition>();
        for (const ed of editions) {
            map.set(ed._id, ed);
        }
        return map;
    }, [editions]);

    // Active filtered edition object if filtering by edition
    const activeEdition = useMemo(() => {
        return selectedEditionId ? editionsMap.get(selectedEditionId) : null;
    }, [selectedEditionId, editionsMap]);

    // Unique stage options collected from matches
    const availableStages = useMemo(() => {
        const set = new Set<string>();
        for (const m of matches) {
            if (m.round && m.round.trim()) {
                set.add(m.round.trim());
            }
        }
        return Array.from(set).sort();
    }, [matches]);

    const editionOptions = useMemo(
        () => [
            { value: "", label: "All Tournament Editions" },
            ...editions.map((ed) => ({
                value: ed._id,
                label: `${ed.edition} (${ed.year})`,
            })),
        ],
        [editions],
    );

    const stageOptions = useMemo(
        () => [
            { value: "ALL", label: "All Stages" },
            ...availableStages.map((stage) => ({
                value: stage,
                label: stage,
            })),
        ],
        [availableStages],
    );

    // Filtered matches
    const filteredMatches = useMemo(() => {
        return matches.filter((match) => {
            // 1. Edition filter
            if (selectedEditionId && match.tournamentEdition !== selectedEditionId) {
                return false;
            }

            // 2. Result filter
            if (selectedResult !== "ALL") {
                const matchRes = match.result;
                // Calculate result if not explicitly populated
                const computedRes: MatchResult | undefined =
                    matchRes ||
                    (match.iitBhuScore !== undefined && match.opponentScore !== undefined
                        ? match.iitBhuScore > match.opponentScore
                            ? "Win"
                            : match.iitBhuScore < match.opponentScore
                              ? "Loss"
                              : "Draw"
                        : undefined);

                if (computedRes !== selectedResult) {
                    return false;
                }
            }

            // 3. Stage filter
            if (selectedStage !== "ALL") {
                if (!match.round || match.round.toLowerCase() !== selectedStage.toLowerCase()) {
                    return false;
                }
            }

            // 4. Search query (opponent or round or edition title)
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const opponentMatch = match.opponent.toLowerCase().includes(q);
                const roundMatch = (match.round || "").toLowerCase().includes(q);
                const edObj = editionsMap.get(match.tournamentEdition);
                const edMatch = (edObj?.edition || "").toLowerCase().includes(q);

                if (!opponentMatch && !roundMatch && !edMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [matches, selectedEditionId, selectedResult, selectedStage, searchQuery, editionsMap]);

    // Calculated Aggregate Statistics for the visible/filtered dataset
    const stats = useMemo(() => {
        let played = 0;
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let scored = 0;
        let conceded = 0;

        for (const m of filteredMatches) {
            played++;

            const isWin =
                m.result === "Win" ||
                (m.iitBhuScore !== undefined && m.opponentScore !== undefined && m.iitBhuScore > m.opponentScore);
            const isDraw =
                m.result === "Draw" ||
                (m.iitBhuScore !== undefined && m.opponentScore !== undefined && m.iitBhuScore === m.opponentScore);

            if (isWin) wins++;
            else if (isDraw) draws++;
            else losses++;

            if (typeof m.iitBhuScore === "number") scored += m.iitBhuScore;
            if (typeof m.opponentScore === "number") conceded += m.opponentScore;
        }

        const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

        return { played, wins, draws, losses, scored, conceded, winRate };
    }, [filteredMatches]);

    // Handler to clear or update edition in query string
    const handleEditionChange = (edId: string) => {
        setSelectedEditionId(edId);
        if (edId) {
            setSearchParams({ tournamentEditionId: edId });
        } else {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("tournamentEditionId");
            setSearchParams(nextParams);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedEditionId("");
        setSelectedResult("ALL");
        setSelectedStage("ALL");
        setSearchQuery("");
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("tournamentEditionId");
        setSearchParams(nextParams);
    };

    return (
        <main className="flex-grow pt-8 md:pt-12 pb-16 px-4 md:px-12 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Contextual Active Edition Notice Banner if filtered from Tournament Edition */}
            {activeEdition && (
                <div className="mb-8 p-4 md:p-5 bg-[#ECE8E1] border-l-4 border-l-[#5A181E] border border-[rgba(26,26,26,0.12)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#5A181E] shrink-0" />
                        <div>
                            <p className="text-xs uppercase tracking-widest font-semibold text-[#5A181E]">
                                Tournament Edition Filter Active
                            </p>
                            <p className="text-sm font-semibold text-[#1A1A1A]">
                                Showing fixtures for {activeEdition.edition} ({activeEdition.year})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Link
                            to={`/tournament-editions/${activeEdition._id}`}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-[#5A181E] text-[#5A181E] hover:bg-[#5A181E] hover:text-white transition-colors inline-flex items-center gap-1.5"
                        >
                            <span>Back to Tournament Edition</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => handleEditionChange("")}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.2)] text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors inline-flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear Filter</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Header Title Section */}
            <div className="border-b border-[rgba(26,26,26,0.12)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-[#3d030b] mb-4 tracking-tight">
                        Matches Directory &amp; Score
                    </h1>
                    <p className="text-base text-base text-[#6B665F] max-w-2xl leading-relaxed">
                        Official fixtures, verified scorelines, tournament stages, and varsity hockey outcomes across
                        sanctioned championship campaigns.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] text-[#1A1A1A] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2D5A3D]" />
                        <span>
                            {loading
                                ? "Loading..."
                                : `${filteredMatches.length} Verified Fixture${filteredMatches.length === 1 ? "" : "s"}`}
                        </span>
                    </span>
                </div>
            </div>

            {/* Quick Metrics Ribbon */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B665F] block mb-1">
                        Matches Played
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{loading ? "-" : stats.played}</span>
                </div>
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2D5A3D] block mb-1">
                        Victories (Wins)
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#2D5A3D]">{loading ? "-" : stats.wins}</span>
                </div>
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7D7871] block mb-1">
                        Draws
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#7D7871]">{loading ? "-" : stats.draws}</span>
                </div>
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A2E2E] block mb-1">
                        Losses
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#7A2E2E]">{loading ? "-" : stats.losses}</span>
                </div>
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B665F] block mb-1">
                        Goals (Scored / Conceded)
                    </span>
                    <span className="font-serif text-xl font-bold text-[#1A1A1A]">
                        {loading ? "-" : `${stats.scored} / ${stats.conceded}`}
                    </span>
                </div>
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 rounded-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A181E] block mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Win Rate</span>
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#5A181E]">
                        {loading ? "-" : `${stats.winRate}%`}
                    </span>
                </div>
            </section>

            {/* Filter and Search Bar */}
            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-4 md:p-5 mb-8 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Result Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase font-semibold tracking-wider text-[#6B665F] mr-1 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" />
                            <span>Outcome:</span>
                        </span>
                        {RESULT_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setSelectedResult(f.value)}
                                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    selectedResult === f.value
                                        ? "bg-[#5A181E] text-white"
                                        : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4] hover:text-[#1A1A1A]"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B665F]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search opponent or stage..."
                            aria-label="Search opponent or tournament stage"
                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.15)] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#5A181E]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B665F] hover:text-[#1A1A1A]"
                                aria-label="Clear search query"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Secondary Filter Dropdowns */}
                <div className="pt-3 border-t border-[rgba(26,26,26,0.08)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Tournament Edition Dropdown */}
                    <div>
                        <label
                            htmlFor="matches-edition-select"
                            className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B665F] mb-1"
                        >
                            Tournament Edition
                        </label>
                        <CustomSelect
                            id="matches-edition-select"
                            value={selectedEditionId}
                            onChange={(val) => handleEditionChange(val)}
                            options={editionOptions}
                            searchable={editions.length > 5}
                            placeholder="All Tournament Editions"
                        />
                    </div>

                    {/* Round / Stage Dropdown */}
                    <div>
                        <label
                            htmlFor="matches-stage-select"
                            className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B665F] mb-1"
                        >
                            Round / Stage
                        </label>
                        <CustomSelect
                            id="matches-stage-select"
                            value={selectedStage}
                            onChange={(val) => setSelectedStage(val)}
                            options={stageOptions}
                            searchable={availableStages.length > 5}
                            placeholder="All Stages"
                        />
                    </div>

                    {/* Reset Filters CTA */}
                    <div className="flex items-end">
                        {(selectedEditionId || selectedResult !== "ALL" || selectedStage !== "ALL" || searchQuery) && (
                            <button
                                type="button"
                                onClick={handleClearAllFilters}
                                className="text-xs text-[#5A181E] hover:underline flex items-center gap-1 py-1.5"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Active Filters</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-[#ECE8E1] border-l-4 border-l-[#7A2E2E] border border-[rgba(26,26,26,0.12)] p-6 mb-8 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-[#7A2E2E] mx-auto" />
                    <h2 className="text-base font-semibold text-[#1A1A1A]">Unable to Load Matches Archive</h2>
                    <p className="text-xs text-[#6B665F] max-w-md mx-auto">{error}</p>
                    <button
                        type="button"
                        onClick={() => void fetchData()}
                        className="px-5 py-2 rounded-full text-xs font-medium bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-8 h-6 bg-[rgba(26,26,26,0.08)]" />
                                <div className="space-y-2 flex-1 md:w-64">
                                    <div className="h-3 w-28 bg-[rgba(26,26,26,0.08)]" />
                                    <div className="h-4 w-44 bg-[rgba(26,26,26,0.08)]" />
                                </div>
                            </div>
                            <div className="h-8 w-24 bg-[rgba(26,26,26,0.08)]" />
                            <div className="h-8 w-20 rounded-full bg-[rgba(26,26,26,0.08)]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredMatches.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] p-12 text-center space-y-4 max-w-xl mx-auto my-8">
                    <Swords className="w-10 h-10 text-[#6B665F] mx-auto opacity-70" />
                    <h2 className="font-serif text-xl text-[#1A1A1A] font-medium">No Matches Found</h2>
                    <p className="text-xs text-[#6B665F] leading-relaxed">
                        No match fixtures match your current filter parameters or search criteria. Try modifying your
                        outcome selection, stage filter, or tournament edition.
                    </p>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="px-5 py-2 rounded-full text-xs font-medium bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Matches List / Ledger */}
            {!loading && !error && filteredMatches.length > 0 && (
                <div className="space-y-3">
                    {filteredMatches.map((match, idx) => {
                        const edition = editionsMap.get(match.tournamentEdition);
                        const isFinal =
                            match.round?.toLowerCase().includes("final") &&
                            !match.round?.toLowerCase().includes("semi") &&
                            !match.round?.toLowerCase().includes("quarter");

                        const isWin =
                            match.result === "Win" ||
                            (match.iitBhuScore !== undefined &&
                                match.opponentScore !== undefined &&
                                match.iitBhuScore > match.opponentScore);

                        const isDraw =
                            match.result === "Draw" ||
                            (match.iitBhuScore !== undefined &&
                                match.opponentScore !== undefined &&
                                match.iitBhuScore === match.opponentScore);

                        const resultLabel = match.result?.toUpperCase() || (isWin ? "WIN" : isDraw ? "DRAW" : "LOSS");

                        return (
                            <div
                                key={match._id}
                                className={`bg-[#ECE8E1] border p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-[#E2DDD4] transition-all duration-150 group relative ${
                                    isFinal ? "border-2 border-[#3d030b]" : "border-[rgba(26,26,26,0.12)]"
                                }`}
                            >
                                {isFinal && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3d030b]" />}

                                {/* Match Identity & Context */}
                                <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0 pl-1 flex-1">
                                    <span className="font-mono text-xs text-[#6B665F] font-semibold w-7 text-right pt-0.5 md:pt-0">
                                        {String(idx + 1).padStart(2, "0")}
                                    </span>

                                    <div className="space-y-1 flex-1">
                                        {/* Stage, Date, Edition Tag */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`text-[11px] uppercase font-bold tracking-wider ${
                                                    isFinal ? "text-[#5A181E]" : "text-[#6B665F]"
                                                }`}
                                            >
                                                {match.round || "Fixture"}
                                            </span>

                                            {match.date && (
                                                <>
                                                    <span className="text-[#9C968D]">•</span>
                                                    <span className="text-[11px] text-[#6B665F] flex items-center gap-1 font-mono">
                                                        <Calendar className="w-3 h-3 text-[#6B665F]" />
                                                        {new Date(match.date).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </>
                                            )}

                                            {edition && (
                                                <>
                                                    <span className="text-[#9C968D]">•</span>
                                                    <Link
                                                        to={`/tournament-editions/${edition._id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[11px] font-medium text-[#5A181E] hover:underline flex items-center gap-1"
                                                    >
                                                        <span>
                                                            {edition.edition} ({edition.year})
                                                        </span>
                                                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                                    </Link>
                                                </>
                                            )}
                                        </div>

                                        {/* Opponent & Match Title */}
                                        <div className="flex items-center gap-2">
                                            <p className="text-base md:text-lg font-semibold text-[#1A1A1A]">
                                                vs {match.opponent}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Score & Result Badge & Action */}
                                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(26,26,26,0.08)]">
                                    {/* Score display */}
                                    <div className="text-center font-mono">
                                        <span
                                            className={`text-2xl md:text-3xl font-bold tracking-tight ${
                                                isWin ? "text-[#2D5A3D]" : "text-[#3d030b]"
                                            }`}
                                        >
                                            {match.iitBhuScore ?? "-"}
                                            <span className="mx-1.5 text-[#6B665F] text-xl font-normal">-</span>
                                            {match.opponentScore ?? "-"}
                                        </span>
                                    </div>

                                    {/* Outcome Badge */}
                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full w-20 text-center uppercase tracking-wider ${
                                            isWin
                                                ? "bg-[#2D5A3D] text-white"
                                                : isDraw
                                                  ? "bg-[#7D7871] text-white"
                                                  : "bg-[#7A2E2E] text-white"
                                        }`}
                                    >
                                        {resultLabel}
                                    </span>

                                    {/* Link to Match Detail */}
                                    <Link
                                        to={`/matches/${match._id}`}
                                        className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.2)] text-[#1A1A1A] hover:bg-[#5A181E] hover:text-white hover:border-[#5A181E] transition-colors flex items-center gap-1"
                                    >
                                        <span>Details</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Archival Note Footer */}
            <div className="mt-12 p-4 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#5A181E] shrink-0 mt-0.5" />
                <div className="text-xs text-[#6B665F] leading-relaxed">
                    <span className="font-semibold text-[#1A1A1A] uppercase tracking-wider mr-1">
                        Archival Verification Protocol:
                    </span>
                    All scorelines and tournament fixtures documented herein are cross-referenced with institutional
                    physical sports ledgers and authorized tournament reports. Older records where scores were
                    unrecorded remain preserved as verified match outcomes.
                </div>
            </div>
        </main>
    );
}
