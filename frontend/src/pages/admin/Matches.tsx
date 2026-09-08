import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Calendar,
} from "lucide-react";
import { getMatches, createMatch, updateMatch, deleteMatch } from "@/api/matches";
import type { Match, MatchCreateInput, MatchResult } from "@/types/match";
import type { Tournament, TournamentEdition } from "@/types/tournament";
import { getCachedTournamentEditions, getCachedTournaments, invalidateCatalog } from "@/lib/catalogCache";
import { matchFormSchema, type MatchFormData, ROUND_STAGE_OPTIONS } from "@/schemas/matchSchema";
import AdminSelect from "@/components/admin/AdminSelect";

const RESULT_FILTER_OPTIONS = [
    { value: "all", label: "All Results" },
    { value: "Win", label: "Win (W)" },
    { value: "Loss", label: "Loss (L)" },
    { value: "Draw", label: "Draw (D)" },
];

const ERA_FILTER_OPTIONS = [
    { value: "all", label: "All Eras" },
    { value: "modern", label: "2010s – 2020s (Modern)" },
    { value: "1990s", label: "1990s – 2000s" },
    { value: "1970s", label: "1970s – 1980s" },
    { value: "1960s", label: "1960s (Foundational)" },
];

export default function AdminMatches() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
    const [selectedEditionFilter, setSelectedEditionFilter] = useState<string>("all");
    const [resultFilter, setResultFilter] = useState<string>("all");
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [eraFilter, setEraFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Relational Catalogues (Tournament Editions & Tournaments)
    // -------------------------------------------------------------------------
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Destructive Delete State
    const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Mobile View Toggle
    const [mobileTab, setMobileTab] = useState<"list" | "form">("list");

    // -------------------------------------------------------------------------
    // React Hook Form Setup
    // -------------------------------------------------------------------------
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<MatchFormData>({
        resolver: zodResolver(matchFormSchema),
        defaultValues: {
            tournamentEdition: "",
            date: "",
            opponent: "",
            round: "Group Stage",
            iitBhuScore: undefined,
            opponentScore: undefined,
            result: undefined,
        },
    });

    const watchedEdition = watch("tournamentEdition");
    const watchedResult = watch("result");
    const watchedBhuScore = watch("iitBhuScore");
    const watchedOpponentScore = watch("opponentScore");

    // Auto-suggest match result based on scores if scores change and result is not manually set
    useEffect(() => {
        if (
            watchedBhuScore !== undefined &&
            watchedBhuScore !== null &&
            watchedOpponentScore !== undefined &&
            watchedOpponentScore !== null &&
            !Number.isNaN(Number(watchedBhuScore)) &&
            !Number.isNaN(Number(watchedOpponentScore))
        ) {
            const bScore = Number(watchedBhuScore);
            const oScore = Number(watchedOpponentScore);
            let calculatedResult: MatchResult = "Draw";
            if (bScore > oScore) calculatedResult = "Win";
            else if (bScore < oScore) calculatedResult = "Loss";

            if (!watchedResult) {
                setValue("result", calculatedResult, { shouldValidate: true });
            }
        }
    }, [watchedBhuScore, watchedOpponentScore, watchedResult, setValue]);

    // -------------------------------------------------------------------------
    // Dictionaries for Fast Relational Lookups
    // -------------------------------------------------------------------------
    const tournamentMap = useMemo(() => {
        const map = new Map<string, Tournament>();
        for (const t of tournaments) {
            map.set(t._id, t);
        }
        return map;
    }, [tournaments]);

    const editionMap = useMemo(() => {
        const map = new Map<string, TournamentEdition>();
        for (const ed of editions) {
            map.set(ed._id, ed);
        }
        return map;
    }, [editions]);

    const editionFilterOptions = useMemo(
        () => [
            { value: "all", label: "All Editions" },
            ...editions.map((ed) => ({
                value: ed._id,
                label: `${ed.edition} (${ed.year})`,
            })),
        ],
        [editions],
    );

    const stageFilterOptions = useMemo(
        () => [
            { value: "all", label: "All Stages" },
            ...ROUND_STAGE_OPTIONS.map((stg) => ({
                value: stg,
                label: stg,
            })),
        ],
        [],
    );

    const formEditionOptions = useMemo(
        () => [
            { value: "", label: "Select Tournament Edition..." },
            ...editions.map((ed) => {
                const tour = tournamentMap.get(ed.tournament);
                return {
                    value: ed._id,
                    label: `${ed.edition} (${ed.year})`,
                    sublabel: `${tour?.name || "Tournament"}${ed.hostInstitute ? ` • ${ed.hostInstitute}` : ""}`,
                };
            }),
        ],
        [editions, tournamentMap],
    );

    // -------------------------------------------------------------------------
    const fetchCatalogs = useCallback(async (force = false) => {
        try {
            const [edRes, tourRes] = await Promise.allSettled([
                getCachedTournamentEditions(force),
                getCachedTournaments(force),
            ]);

            if (edRes.status === "fulfilled") setEditions(edRes.value);
            if (tourRes.status === "fulfilled") setTournaments(tourRes.value);
        } catch {
            // Catalogs failed gracefully
        }
    }, []);

    // -------------------------------------------------------------------------
    // Fetch Matches List (with backend tournamentEditionId filter where supported)
    // -------------------------------------------------------------------------
    const fetchMatchesList = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const query: {
                page: number;
                limit: number;
                tournamentEditionId?: string;
                sort: "date";
                order: "desc";
            } = {
                page,
                limit,
                sort: "date",
                order: "desc",
            };

            if (selectedEditionFilter !== "all") {
                query.tournamentEditionId = selectedEditionFilter;
            }

            const res = await getMatches(query);
            setMatches(res.data);
            setTotalRecords(res.meta?.total ?? res.data.length);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load matches from server";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, limit, selectedEditionFilter]);

    useEffect(() => {
        fetchCatalogs();
    }, [fetchCatalogs]);

    useEffect(() => {
        fetchMatchesList();
    }, [fetchMatchesList]);

    // -------------------------------------------------------------------------
    // Client-side Filters: Search, Competition, Result, Stage, and Era
    // -------------------------------------------------------------------------
    const filteredMatches = useMemo(() => {
        return matches.filter((m) => {
            const edition = editionMap.get(m.tournamentEdition);
            const tournament = edition ? tournamentMap.get(edition.tournament) : undefined;

            const opponentName = m.opponent.toLowerCase();
            const editionName = edition?.edition?.toLowerCase() || "";
            const tournamentName = tournament?.name?.toLowerCase() || "";
            const roundName = m.round?.toLowerCase() || "";
            const query = searchQuery.trim().toLowerCase();

            // Search Filter
            const matchesSearch =
                !query ||
                opponentName.includes(query) ||
                editionName.includes(query) ||
                tournamentName.includes(query) ||
                roundName.includes(query);

            if (!matchesSearch) return false;

            // Competition / Tournament Filter
            if (selectedCompetition !== "all") {
                if (!edition || edition.tournament !== selectedCompetition) {
                    return false;
                }
            }

            // Result Filter
            if (resultFilter !== "all" && m.result !== resultFilter) {
                return false;
            }

            // Stage / Round Filter
            if (stageFilter !== "all") {
                if (!m.round || !m.round.toLowerCase().includes(stageFilter.toLowerCase())) {
                    return false;
                }
            }

            // Era Filter based on Match Date or Edition Year
            if (eraFilter !== "all") {
                const matchYear = m.date ? new Date(m.date).getFullYear() : edition?.year;

                if (matchYear) {
                    if (eraFilter === "modern" && matchYear < 2010) return false;
                    if (eraFilter === "1990s" && (matchYear < 1990 || matchYear > 2009)) return false;
                    if (eraFilter === "1970s" && (matchYear < 1970 || matchYear > 1989)) return false;
                    if (eraFilter === "1960s" && matchYear > 1969) return false;
                }
            }

            return true;
        });
    }, [matches, searchQuery, selectedCompetition, resultFilter, stageFilter, eraFilter, editionMap, tournamentMap]);

    // -------------------------------------------------------------------------
    // Selection & Form Mode Switching
    // -------------------------------------------------------------------------
    const selectMatchForEdit = (match: Match) => {
        setSelectedMatch(match);
        setFormSuccess(null);
        setFormError(null);
        setMobileTab("form");

        const formattedDate = match.date ? new Date(match.date).toISOString().slice(0, 10) : "";

        reset({
            tournamentEdition: match.tournamentEdition,
            date: formattedDate,
            opponent: match.opponent,
            round: match.round || "",
            iitBhuScore: match.iitBhuScore ?? undefined,
            opponentScore: match.opponentScore ?? undefined,
            result: match.result || undefined,
        });
    };

    const switchModeToCreate = () => {
        setSelectedMatch(null);
        setFormSuccess(null);
        setFormError(null);
        setMobileTab("form");

        const defaultEdition = editions[0]?._id || "";

        reset({
            tournamentEdition: defaultEdition,
            date: new Date().toISOString().slice(0, 10),
            opponent: "",
            round: "Group Stage",
            iitBhuScore: undefined,
            opponentScore: undefined,
            result: undefined,
        });
    };

    const handleReset = () => {
        setFormSuccess(null);
        setFormError(null);
        if (selectedMatch) {
            selectMatchForEdit(selectedMatch);
        } else {
            switchModeToCreate();
        }
    };

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: MatchFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            // Build strictly validated payload matching backend validator
            const payload: MatchCreateInput = {
                tournamentEdition: formData.tournamentEdition,
                opponent: formData.opponent.trim(),
            };

            if (formData.date && formData.date.trim()) {
                payload.date = formData.date.trim();
            }

            if (formData.round && formData.round.trim()) {
                payload.round = formData.round.trim();
            }

            if (formData.iitBhuScore !== undefined && !Number.isNaN(Number(formData.iitBhuScore))) {
                payload.iitBhuScore = Number(formData.iitBhuScore);
            }

            if (formData.opponentScore !== undefined && !Number.isNaN(Number(formData.opponentScore))) {
                payload.opponentScore = Number(formData.opponentScore);
            }

            if (formData.result) {
                payload.result = formData.result;
            }

            if (selectedMatch) {
                // UPDATE RECORD
                const updated = await updateMatch(selectedMatch._id, payload);
                invalidateCatalog("matches");
                setFormSuccess(`Match fixture against "${updated.data.opponent}" updated successfully.`);
                setSelectedMatch(updated.data);
                fetchMatchesList();
            } else {
                // CREATE RECORD
                const created = await createMatch(payload);
                invalidateCatalog("matches");
                setFormSuccess(`New match fixture against "${created.data.opponent}" created successfully.`);
                setSelectedMatch(created.data);
                fetchMatchesList();
            }
        } catch (err: unknown) {
            let errorMsg = "An unexpected error occurred while saving match record.";
            if (err && typeof err === "object" && "response" in err) {
                const axiosErr = err as {
                    response?: {
                        status: number;
                        data?: {
                            message?: string;
                            error?: { issues?: Array<{ message: string }> };
                        };
                    };
                };
                if (axiosErr.response?.data?.message) {
                    errorMsg = axiosErr.response.data.message;
                } else if (axiosErr.response?.data?.error?.issues?.[0]?.message) {
                    errorMsg = axiosErr.response.data.error.issues[0].message;
                }
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            setFormError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Deletion Handler
    // -------------------------------------------------------------------------
    const confirmDeleteMatch = async () => {
        if (!matchToDelete) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteMatch(matchToDelete._id);
            invalidateCatalog("matches");
            setMatchToDelete(null);

            if (selectedMatch?._id === matchToDelete._id) {
                switchModeToCreate();
            }

            fetchMatchesList();
        } catch (err: unknown) {
            let errorMsg = "Failed to delete match record.";
            if (err && typeof err === "object" && "response" in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                if (axiosErr.response?.data?.message) {
                    errorMsg = axiosErr.response.data.message;
                }
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            setDeleteError(errorMsg);
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Formatters & UI Helpers
    // -------------------------------------------------------------------------
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Archival Record";
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const renderResultBadge = (result?: MatchResult) => {
        if (!result) {
            return <span className="text-[#9C968D] text-xs italic">-</span>;
        }
        if (result === "Win") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2D5A3D]/10 text-[#2D5A3D] border border-[#2D5A3D]/30">
                    WIN
                </span>
            );
        }
        if (result === "Loss") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A2E2E]/10 text-[#7A2E2E] border border-[#7A2E2E]/30">
                    LOSS
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7D7871]/10 text-[#7D7871] border border-[#7D7871]/30">
                DRAW
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#FCF9F2] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#3d030b] selection:text-white">
            {/* Standardized Admin Page Header */}
            <header className="px-6 md:px-8 py-6 border-b border-[rgba(26,26,26,0.08)] bg-[#FCF9F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-tight">
                        Matches Directory &amp; Score Register
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1">Manage fixtures, scores, and results.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            invalidateCatalog("matches");
                            invalidateCatalog("tournaments");
                            invalidateCatalog("tournamentEditions");
                            void fetchMatchesList();
                            void fetchCatalogs(true);
                        }}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#6B665F] hover:text-[#1A1A1A] border border-[rgba(26,26,26,0.15)] hover:border-[rgba(26,26,26,0.3)] transition-all bg-[#ECE8E1] hover:bg-[#E2DDD4] rounded-full disabled:opacity-50 cursor-pointer tracking-wider uppercase"
                        title="Synchronize records"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>SYNC</span>
                    </button>

                    <button
                        type="button"
                        onClick={switchModeToCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3d030b] hover:bg-[#5a181e] text-[#F4F1EA] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Match</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="xl:hidden flex border-b border-[rgba(26,26,26,0.08)] bg-[#ECE8E1] px-6">
                <button
                    type="button"
                    onClick={() => setMobileTab("list")}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                        mobileTab === "list"
                            ? "border-[#3d030b] text-[#3d030b]"
                            : "border-transparent text-[#6B665F] hover:text-[#1A1A1A]"
                    }`}
                >
                    Fixtures Ledger ({filteredMatches.length})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab("form")}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                        mobileTab === "form"
                            ? "border-[#3d030b] text-[#3d030b]"
                            : "border-transparent text-[#6B665F] hover:text-[#1A1A1A]"
                    }`}
                >
                    {selectedMatch ? "Edit Match Dossier" : "New Match Dossier"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Grid */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Matches Directory & Ledger (7/12)             */}
                    {/* ========================================================= */}
                    <div
                        className={`col-span-12 xl:col-span-7 space-y-4 ${
                            mobileTab === "form" ? "hidden xl:block" : "block"
                        }`}
                    >
                        {/* Filters & Search Console */}
                        <div className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] space-y-3.5">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search match by opponent, tournament, edition, or stage..."
                                    className="w-full pl-9 pr-8 py-2 bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-xs sm:text-sm text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-2.5 text-[#9C968D] hover:text-[#1A1A1A] cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Competition Filter Pills matching Stitch */}
                            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[rgba(26,26,26,0.06)]">
                                <div className="flex items-center gap-1.5 overflow-x-auto select-none pb-0.5 text-xs">
                                    <span className="text-[11px] font-semibold tracking-wider text-[#6B665F] uppercase mr-1">
                                        Competition:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCompetition("all")}
                                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                                            selectedCompetition === "all"
                                                ? "bg-[#3d030b] text-white"
                                                : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                        }`}
                                    >
                                        All
                                    </button>
                                    {tournaments.map((t) => (
                                        <button
                                            key={t._id}
                                            type="button"
                                            onClick={() => setSelectedCompetition(t._id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                                                selectedCompetition === t._id
                                                    ? "bg-[#3d030b] text-white"
                                                    : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Verified Count Chip */}
                                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FCF9F2] border border-[rgba(26,26,26,0.1)] shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#765a1a]"></span>
                                    <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider uppercase">
                                        {totalRecords} VERIFIED FIXTURES
                                    </span>
                                </div>
                            </div>

                            {/* Secondary Filter Controls Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[rgba(26,26,26,0.06)] text-xs">
                                {/* Tournament Edition Selector (Backend Query Filter) */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-semibold text-[#6B665F]">
                                        Tournament Edition
                                    </label>
                                    <AdminSelect
                                        value={selectedEditionFilter}
                                        onChange={(val) => {
                                            setSelectedEditionFilter(val);
                                            setPage(1);
                                        }}
                                        options={editionFilterOptions}
                                        placeholder="All Editions"
                                        searchable={true}
                                    />
                                </div>

                                {/* Result Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-semibold text-[#6B665F]">Result</label>
                                    <AdminSelect
                                        value={resultFilter}
                                        onChange={(val) => setResultFilter(val)}
                                        options={RESULT_FILTER_OPTIONS}
                                        placeholder="All Results"
                                    />
                                </div>

                                {/* Round / Stage Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-semibold text-[#6B665F]">
                                        Stage / Round
                                    </label>
                                    <AdminSelect
                                        value={stageFilter}
                                        onChange={(val) => setStageFilter(val)}
                                        options={stageFilterOptions}
                                        placeholder="All Stages"
                                        searchable={true}
                                    />
                                </div>

                                {/* Decade / Era Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-semibold text-[#6B665F]">
                                        Decade / Era
                                    </label>
                                    <AdminSelect
                                        value={eraFilter}
                                        onChange={(val) => setEraFilter(val)}
                                        options={ERA_FILTER_OPTIONS}
                                        placeholder="All Eras"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Archival Match Ledger Table */}
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] overflow-hidden">
                            {listError && (
                                <div className="p-4 bg-[#ffdad6] text-[#93000a] text-xs flex items-center gap-2 border-b border-[rgba(26,26,26,0.08)]">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{listError}</span>
                                </div>
                            )}

                            {loading ? (
                                <div className="py-16 text-center text-[#6B665F] space-y-2 bg-[#FCF9F2]">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3d030b]" />
                                    <p className="text-xs uppercase tracking-wider font-semibold">
                                        Loading matches ledger...
                                    </p>
                                </div>
                            ) : filteredMatches.length === 0 ? (
                                <div className="py-16 text-center text-[#6B665F] space-y-2 bg-[#FCF9F2]">
                                    <Trophy className="w-8 h-8 mx-auto text-[#9C968D]" />
                                    <p className="text-sm font-medium text-[#1A1A1A]">No matches found</p>
                                    <p className="text-xs text-[#6B665F]">
                                        {searchQuery || resultFilter !== "all" || selectedEditionFilter !== "all"
                                            ? "Try clearing your filters or search terms."
                                            : "No match records exist yet in the archive."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={switchModeToCreate}
                                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3d030b] text-white text-xs font-semibold hover:bg-[#5a181e] cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add First Match</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider">
                                                <th className="py-3 px-3 w-8 text-center">#</th>
                                                <th className="py-3 px-3">Date</th>
                                                <th className="py-3 px-3">Tournament Edition</th>
                                                <th className="py-3 px-3">Opponent</th>
                                                <th className="py-3 px-3 text-center">Score (BHU - OPP)</th>
                                                <th className="py-3 px-3 text-center">Result</th>
                                                <th className="py-3 px-3">Stage / Round</th>
                                                <th className="py-3 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgba(26,26,26,0.06)] bg-[#FCF9F2]">
                                            {filteredMatches.map((m, idx) => {
                                                const ed = editionMap.get(m.tournamentEdition);
                                                const tour = ed ? tournamentMap.get(ed.tournament) : undefined;
                                                const isSelected = selectedMatch?._id === m._id;

                                                return (
                                                    <tr
                                                        key={m._id}
                                                        onClick={() => selectMatchForEdit(m)}
                                                        className={`hover:bg-[#E2DDD4]/60 transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-[#E2DDD4]/80 border-l-4 border-l-[#3d030b]"
                                                                : ""
                                                        }`}
                                                    >
                                                        <td className="py-3 px-3 font-mono text-[11px] text-[#9C968D] text-center">
                                                            {String(idx + 1).padStart(2, "0")}
                                                        </td>
                                                        <td className="py-3 px-3 text-[#1A1A1A] font-medium whitespace-nowrap">
                                                            {formatDate(m.date)}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-semibold text-[#1A1A1A]">
                                                                {ed?.edition || "Tournament Edition"}
                                                            </div>
                                                            <div className="text-[10px] text-[#6B665F]">
                                                                {ed
                                                                    ? `${ed.year}${ed.hostInstitute ? `, ${ed.hostInstitute}` : ""}`
                                                                    : ""}
                                                                {tour ? ` • ${tour.name}` : ""}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-[#1A1A1A] whitespace-nowrap">
                                                            {m.opponent}
                                                        </td>
                                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                                            <span className="font-bold text-sm text-[#3d030b]">
                                                                {m.iitBhuScore ?? "-"} – {m.opponentScore ?? "-"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            {renderResultBadge(m.result)}
                                                        </td>
                                                        <td className="py-3 px-3 text-[#6B665F] whitespace-nowrap">
                                                            {m.round || "Fixture"}
                                                        </td>
                                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                                            <div
                                                                className="flex items-center justify-end gap-1 text-[#6B665F]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectMatchForEdit(m)}
                                                                    className="p-1.5 hover:text-[#3d030b] hover:bg-[#ECE8E1] rounded transition-colors cursor-pointer"
                                                                    title="Edit Match Record"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMatchToDelete(m);
                                                                        setDeleteError(null);
                                                                    }}
                                                                    className="p-1.5 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                                    title="Delete Match Record"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Bar */}
                            <div className="p-3 bg-[#ECE8E1] border-t border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs text-[#6B665F]">
                                <span>
                                    Showing {filteredMatches.length} of {totalRecords} verified fixtures
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={page <= 1 || loading}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="px-2.5 py-1 rounded bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:bg-[#E2DDD4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                        <span>Prev</span>
                                    </button>
                                    <span className="px-2 font-mono font-medium text-[#1A1A1A]">Page {page}</span>
                                    <button
                                        type="button"
                                        disabled={page * limit >= totalRecords || loading}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="px-2.5 py-1 rounded bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:bg-[#E2DDD4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* RIGHT PANEL: Persistent Match Dossier Form (5/12)          */}
                    {/* ========================================================= */}
                    <div
                        className={`col-span-12 xl:col-span-5 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] ${
                            mobileTab === "list" ? "hidden xl:block" : "block"
                        }`}
                    >
                        {selectedMatch && (
                            <div className="p-4 bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2DDD4] text-[#3d030b] border border-[#3d030b]/20 tracking-wider uppercase font-mono">
                                    EDITING MATCH — VS {selectedMatch.opponent.toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Section Header */}
                        <div className="p-4 bg-[#FCF9F2] border-b border-[rgba(26,26,26,0.06)]">
                            <h2 className="text-lg font-serif text-[#1A1A1A] tracking-tight">Match Dossier</h2>
                            <p className="text-xs text-[#6B665F] mt-0.5">
                                Record fixture scoreline, opponent institution, sanctioned tournament edition, and
                                official match outcome.
                            </p>
                        </div>

                        {/* Success / Error Alerts */}
                        {formSuccess && (
                            <div className="p-3.5 m-4 mb-0 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{formSuccess}</span>
                            </div>
                        )}

                        {formError && (
                            <div className="p-3.5 m-4 mb-0 bg-[#ffdad6] border border-red-200 text-[#93000a] text-xs rounded flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-[#93000a] shrink-0 mt-0.5" />
                                <span className="flex-1">{formError}</span>
                            </div>
                        )}

                        {/* Form Body */}
                        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
                            {/* SECTION 1: TOURNAMENT & FIXTURE CONTEXT */}
                            <div className="p-4 bg-[#FCF9F2] border border-[rgba(26,26,26,0.1)] space-y-3">
                                <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-[#3d030b]" />
                                    <span>Tournament &amp; Fixture Context</span>
                                </span>

                                {/* Tournament Edition Searchable Selector */}
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                        Tournament Edition *
                                    </label>
                                    <AdminSelect
                                        value={watchedEdition || ""}
                                        onChange={(val) => setValue("tournamentEdition", val, { shouldValidate: true })}
                                        options={formEditionOptions}
                                        placeholder="Select Tournament Edition..."
                                        searchable={true}
                                        error={Boolean(errors.tournamentEdition)}
                                    />
                                    {errors.tournamentEdition && (
                                        <p className="text-[11px] text-red-600 mt-1">
                                            {errors.tournamentEdition.message}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Match Date */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Match Date
                                        </label>
                                        <input
                                            type="date"
                                            {...register("date")}
                                            className="w-full bg-white border border-[rgba(26,26,26,0.15)] rounded px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                    </div>

                                    {/* Round / Stage */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Round / Stage
                                        </label>
                                        <input
                                            type="text"
                                            list="rounds-datalist"
                                            {...register("round")}
                                            placeholder="e.g. Final, Semi-Final"
                                            className="w-full bg-white border border-[rgba(26,26,26,0.15)] rounded px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                        <datalist id="rounds-datalist">
                                            {ROUND_STAGE_OPTIONS.map((stg) => (
                                                <option key={stg} value={stg} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: OPPONENT INSTITUTION */}
                            <div className="p-4 bg-[#FCF9F2] border border-[rgba(26,26,26,0.1)] space-y-3">
                                <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold flex items-center gap-1.5">
                                    <Trophy className="w-4 h-4 text-[#3d030b]" />
                                    <span>Opponent Institution</span>
                                </span>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                        Opponent Institution / Team Name *
                                    </label>
                                    <input
                                        type="text"
                                        {...register("opponent")}
                                        placeholder="e.g. IIT Roorkee, Aligarh Muslim University, Delhi University"
                                        className="w-full bg-white border border-[rgba(26,26,26,0.15)] rounded px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    />
                                    {errors.opponent && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.opponent.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 3: SCORELINES & VERIFIED OUTCOME */}
                            <div className="p-4 bg-[#FCF9F2] border border-[rgba(26,26,26,0.1)] space-y-3.5">
                                <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-[#3d030b]"></span>
                                    <span>Scorelines &amp; Verified Outcome</span>
                                </span>

                                {/* Split Score Inputs matching Stitch */}
                                <div className="grid grid-cols-2 gap-3 items-center">
                                    <div className="p-3 bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded text-center">
                                        <span className="text-[11px] uppercase font-semibold text-[#6B665F] block mb-1">
                                            IIT (BHU) Score
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            {...register("iitBhuScore")}
                                            placeholder="0"
                                            className="w-20 mx-auto text-center text-3xl font-bold text-[#3d030b] bg-transparent border-b border-[#3d030b]/40 focus:outline-none focus:border-[#3d030b]"
                                        />
                                    </div>

                                    <div className="p-3 bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded text-center">
                                        <span className="text-[11px] uppercase font-semibold text-[#6B665F] block mb-1">
                                            Opponent Score
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            {...register("opponentScore")}
                                            placeholder="0"
                                            className="w-20 mx-auto text-center text-3xl font-bold text-[#1A1A1A] bg-transparent border-b border-[rgba(26,26,26,0.3)] focus:outline-none focus:border-[#3d030b]"
                                        />
                                    </div>
                                </div>

                                {/* Segmented Match Result Selection matching Stitch */}
                                <div className="space-y-1 pt-1">
                                    <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] font-semibold">
                                        Result Classification
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setValue("result", "Win", { shouldValidate: true })}
                                            className={`py-2 px-3 text-center rounded border text-xs uppercase font-bold transition-all cursor-pointer ${
                                                watchedResult === "Win"
                                                    ? "bg-[#2D5A3D] text-white border-[#2D5A3D] shadow-xs"
                                                    : "bg-white text-[#6B665F] border-[rgba(26,26,26,0.15)] hover:bg-[#ECE8E1]"
                                            }`}
                                        >
                                            WIN
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setValue("result", "Loss", { shouldValidate: true })}
                                            className={`py-2 px-3 text-center rounded border text-xs uppercase font-bold transition-all cursor-pointer ${
                                                watchedResult === "Loss"
                                                    ? "bg-[#7A2E2E] text-white border-[#7A2E2E] shadow-xs"
                                                    : "bg-white text-[#6B665F] border-[rgba(26,26,26,0.15)] hover:bg-[#ECE8E1]"
                                            }`}
                                        >
                                            LOSS
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setValue("result", "Draw", { shouldValidate: true })}
                                            className={`py-2 px-3 text-center rounded border text-xs uppercase font-bold transition-all cursor-pointer ${
                                                watchedResult === "Draw"
                                                    ? "bg-[#7D7871] text-white border-[#7D7871] shadow-xs"
                                                    : "bg-white text-[#6B665F] border-[rgba(26,26,26,0.15)] hover:bg-[#ECE8E1]"
                                            }`}
                                        >
                                            DRAW
                                        </button>
                                    </div>
                                    {errors.result && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.result.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Form Action Footer */}
                            <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={switchModeToCreate}
                                    className="px-4 py-2 border border-[rgba(26,26,26,0.15)] rounded-full text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] bg-[#F4F1EA] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2 border border-[rgba(26,26,26,0.15)] rounded-full text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] bg-[#F4F1EA] transition-colors cursor-pointer"
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-full bg-[#3d030b] text-white text-xs font-semibold hover:bg-[#5a181e] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{selectedMatch ? "Save Changes" : "Commit Record"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* ----------------------------------------------------------------- */}
            {/* DESTRUCTIVE DELETE CONFIRMATION MODAL                             */}
            {/* ----------------------------------------------------------------- */}
            {matchToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[#FCF9F2] border border-red-200 rounded-lg max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-700">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#1A1A1A]">Permanently Purge Match Fixture?</h3>
                                <p className="text-xs text-[#6B665F] leading-relaxed">
                                    You are about to delete the match record against{" "}
                                    <span className="font-semibold text-[#1A1A1A]">"{matchToDelete.opponent}"</span> (
                                    {matchToDelete.date ? formatDate(matchToDelete.date) : "Undated fixture"}).
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-50/70 border border-red-100 rounded text-xs text-red-800 leading-relaxed">
                            <span className="font-semibold">Notice:</span> This action is permanent and cannot be
                            undone. The fixture scoreline and archival result will be removed from the public matches
                            ledger.
                        </div>

                        {deleteError && (
                            <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs rounded">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setMatchToDelete(null)}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.2)] text-xs font-medium text-[#1A1A1A] hover:bg-[#ECE8E1] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDeleteMatch}
                                className="px-4 py-2 rounded-full bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>Confirm Deletion</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
