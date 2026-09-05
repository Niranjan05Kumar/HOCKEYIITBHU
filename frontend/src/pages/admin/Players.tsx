import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Upload,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    User,
    Medal,
    BadgeAlert,
} from "lucide-react";
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from "@/api/players";
import { getAchievements } from "@/api/achievements";
import type { Player, PlayerCreateInput, PlayingPosition, PlayerStatus } from "@/types/player";
import type { Achievement } from "@/types/achievement";
import { playerFormSchema, type PlayerFormData } from "@/schemas/playerSchema";

export default function AdminPlayers() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"all" | PlayerStatus>("all");
    const [positionFilter, setPositionFilter] = useState<"all" | PlayingPosition>("all");
    const [yearFilter, setYearFilter] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Portrait / ImageKit state
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Catalog Achievements for linking
    const [catalogAchievements, setCatalogAchievements] = useState<Achievement[]>([]);
    const [selectedAchievementId, setSelectedAchievementId] = useState<string>("");

    // Destructive Delete State
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
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
        watch,
        setValue,
        formState: { errors },
    } = useForm<PlayerFormData>({
        resolver: zodResolver(playerFormSchema),
        defaultValues: {
            name: "",
            jerseyNumber: undefined,
            playingPosition: "",
            status: "current",
            startYear: undefined,
            endYear: undefined,
            leadershipRole: "",
            matchesCount: undefined,
            goalsCount: undefined,
            assistsCount: undefined,
            cleanSheetsCount: undefined,
            achievementIds: [],
        },
    });

    const currentStatus = watch("status");
    const watchedAchievementIds = watch("achievementIds") || [];

    // -------------------------------------------------------------------------
    // Data Fetching: Players & Achievements
    // -------------------------------------------------------------------------
    const fetchPlayersList = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const query: {
                page: number;
                limit: number;
                status?: PlayerStatus;
                position?: PlayingPosition;
                year?: number;
            } = { page, limit };

            if (statusFilter !== "all") query.status = statusFilter;
            if (positionFilter !== "all") query.position = positionFilter;
            if (yearFilter.trim()) {
                const parsedYear = parseInt(yearFilter.trim(), 10);
                if (!isNaN(parsedYear)) query.year = parsedYear;
            }

            const res = await getPlayers(query);
            setPlayers(res.data);
            setTotalRecords(res.meta?.total ?? res.data.length);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load players directory";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, positionFilter, yearFilter]);

    useEffect(() => {
        fetchPlayersList();
    }, [fetchPlayersList]);

    // Load available achievements once for cross-linking
    useEffect(() => {
        getAchievements({ limit: 100 })
            .then((res) => setCatalogAchievements(res.data))
            .catch(() => setCatalogAchievements([]));
    }, []);

    // -------------------------------------------------------------------------
    // Client-side Search Filtering
    // -------------------------------------------------------------------------
    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return players;
        const q = searchQuery.toLowerCase().trim();
        return players.filter((p) => {
            const matchesName = p.name.toLowerCase().includes(q);
            const matchesJersey = p.jerseyNumber?.toString().includes(q);
            const matchesRole = p.leadershipRoles?.some((r) => r.toLowerCase().includes(q));
            return matchesName || matchesJersey || matchesRole;
        });
    }, [players, searchQuery]);

    // -------------------------------------------------------------------------
    // Form Population on Player Select
    // -------------------------------------------------------------------------
    const selectPlayerForEdit = useCallback(
        (player: Player) => {
            setSelectedPlayer(player);
            setFormSuccess(null);
            setFormError(null);
            setSelectedPhotoFile(null);
            setPhotoPreview(player.profilePhoto || null);
            setMobileTab("form");

            // Compute start and end years from playingYears array
            const years = player.playingYears && player.playingYears.length > 0 ? player.playingYears : [];
            const startYear = years.length > 0 ? Math.min(...years) : undefined;
            const endYear = years.length > 1 ? Math.max(...years) : years.length === 1 ? years[0] : undefined;

            const stats = player.individualStatistics as Record<string, unknown> | undefined;

            reset({
                name: player.name,
                jerseyNumber: player.jerseyNumber ?? undefined,
                playingPosition: player.playingPosition ?? "",
                status: player.status,
                startYear,
                endYear,
                leadershipRole: player.leadershipRoles?.[0] || "",
                matchesCount: (stats?.matches as number) ?? (stats?.matchesPlayed as number) ?? undefined,
                goalsCount: (stats?.goals as number) ?? undefined,
                assistsCount: (stats?.assists as number) ?? undefined,
                cleanSheetsCount: (stats?.cleanSheets as number) ?? undefined,
                achievementIds: player.achievements || [],
            });
        },
        [reset],
    );

    const switchModeToCreate = () => {
        setSelectedPlayer(null);
        setFormSuccess(null);
        setFormError(null);
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setMobileTab("form");
        reset({
            name: "",
            jerseyNumber: undefined,
            playingPosition: "",
            status: "current",
            startYear: undefined,
            endYear: undefined,
            leadershipRole: "",
            matchesCount: undefined,
            goalsCount: undefined,
            assistsCount: undefined,
            cleanSheetsCount: undefined,
            achievementIds: [],
        });
    };

    // -------------------------------------------------------------------------
    // Photo File Selection Handler
    // -------------------------------------------------------------------------
    const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check: 5MB
        if (file.size > 5 * 1024 * 1024) {
            setFormError("Selected photo exceeds the 5MB ImageKit file size limit.");
            return;
        }

        setSelectedPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setFormError(null);
    };

    const handleClearPhoto = () => {
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
    };

    // -------------------------------------------------------------------------
    // Achievement Association Handlers
    // -------------------------------------------------------------------------
    const handleAddAchievement = () => {
        if (!selectedAchievementId) return;
        if (!watchedAchievementIds.includes(selectedAchievementId)) {
            setValue("achievementIds", [...watchedAchievementIds, selectedAchievementId]);
        }
        setSelectedAchievementId("");
    };

    const handleRemoveAchievement = (idToRemove: string) => {
        setValue(
            "achievementIds",
            watchedAchievementIds.filter((id) => id !== idToRemove),
        );
    };

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: PlayerFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            // Build playingYears array from startYear and endYear
            let playingYears: number[] | undefined = undefined;
            if (formData.startYear && formData.endYear) {
                const start = Math.min(formData.startYear, formData.endYear);
                const end = Math.max(formData.startYear, formData.endYear);
                playingYears = [];
                for (let y = start; y <= end; y++) {
                    playingYears.push(y);
                }
            } else if (formData.startYear) {
                playingYears = [formData.startYear];
            }

            // Build leadershipRoles array
            const leadershipRoles = formData.leadershipRole?.trim() ? [formData.leadershipRole.trim()] : undefined;

            // Build individualStatistics object
            const stats: Record<string, unknown> = {};
            if (formData.matchesCount !== undefined) stats.matches = formData.matchesCount;
            if (formData.goalsCount !== undefined) stats.goals = formData.goalsCount;
            if (formData.assistsCount !== undefined) stats.assists = formData.assistsCount;
            if (formData.cleanSheetsCount !== undefined) stats.cleanSheets = formData.cleanSheetsCount;
            const individualStatistics = Object.keys(stats).length > 0 ? stats : undefined;

            const payload: PlayerCreateInput = {
                name: formData.name.trim(),
                status: formData.status,
                playingPosition: formData.playingPosition ? (formData.playingPosition as PlayingPosition) : undefined,
                jerseyNumber: formData.jerseyNumber,
                playingYears,
                leadershipRoles,
                achievements:
                    formData.achievementIds && formData.achievementIds.length > 0 ? formData.achievementIds : undefined,
                individualStatistics,
            };

            if (selectedPlayer) {
                // UPDATE RECORD
                const updated = await updatePlayer(selectedPlayer._id, payload, selectedPhotoFile || undefined);
                setFormSuccess(`Player dossier for "${updated.data.name}" committed successfully.`);
                setSelectedPlayer(updated.data);
                if (updated.data.profilePhoto) {
                    setPhotoPreview(updated.data.profilePhoto);
                }
                setSelectedPhotoFile(null);
            } else {
                // CREATE RECORD
                const created = await createPlayer(payload, selectedPhotoFile || undefined);
                setFormSuccess(`New athlete "${created.data.name}" registered successfully into archive.`);
                setSelectedPlayer(created.data);
                if (created.data.profilePhoto) {
                    setPhotoPreview(created.data.profilePhoto);
                }
                setSelectedPhotoFile(null);
            }

            await fetchPlayersList();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An error occurred while saving player dossier";
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Deletion Handler
    // -------------------------------------------------------------------------
    const confirmDeletePlayer = async () => {
        if (!playerToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await deletePlayer(playerToDelete._id);
            if (selectedPlayer?._id === playerToDelete._id) {
                switchModeToCreate();
            }
            setPlayerToDelete(null);
            await fetchPlayersList();
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Unable to delete player. Ensure no teams or tournaments reference this record.";
            setDeleteError(msg);
        } finally {
            setDeleting(false);
        }
    };

    // Format tenure display
    const formatTenure = (years?: number[], status?: PlayerStatus): string => {
        if (!years || years.length === 0) {
            return status === "current" ? "Active" : "Archival";
        }
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        if (minYear === maxYear) {
            return status === "current" ? `${minYear}–Present` : `${minYear}`;
        }
        return `${minYear}–${maxYear}`;
    };

    // Format initials for avatar
    const getInitials = (name: string): string => {
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA]">
            {/* Page Header matching Stitch Players Management */}
            <header className="border-b border-[rgba(26,26,26,0.08)] px-6 md:px-12 py-8 bg-[#F4F1EA]">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-[11px] md:text-[12px] uppercase tracking-widest font-semibold text-[#9C968D]">
                            Institutional Records Registry
                        </span>
                        <h1 className="text-3xl md:text-[34px] font-medium text-[#3d030b] tracking-tight mt-1">
                            Players Directory &amp; Dossier
                        </h1>
                        <p className="text-xs sm:text-sm text-[#6B665F] mt-1 max-w-3xl leading-relaxed">
                            Manage institutional player records, varsity tenures, leadership honors, and archival
                            portraits in one unified register.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchPlayersList}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs text-[#6B665F] hover:text-[#3d030b] border border-[rgba(26,26,26,0.12)] hover:border-[#3d030b] transition-all bg-[#ECE8E1] disabled:opacity-50"
                            title="Synchronize records"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span className="tracking-tight uppercase font-medium text-[11px]">Sync</span>
                        </button>

                        <button
                            type="button"
                            onClick={switchModeToCreate}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#3d030b] text-[#F4F1EA] hover:bg-[#5a181e] transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Player</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex border-b border-[rgba(26,26,26,0.08)] bg-[#ECE8E1] px-6">
                <button
                    type="button"
                    onClick={() => setMobileTab("list")}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                        mobileTab === "list"
                            ? "border-[#3d030b] text-[#3d030b]"
                            : "border-transparent text-[#6B665F] hover:text-[#1A1A1A]"
                    }`}
                >
                    Directory ({filteredPlayers.length})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab("form")}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                        mobileTab === "form"
                            ? "border-[#3d030b] text-[#3d030b]"
                            : "border-transparent text-[#6B665F] hover:text-[#1A1A1A]"
                    }`}
                >
                    {selectedPlayer ? "Edit Dossier" : "New Dossier"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Container */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Players Directory (~60% width)                */}
                    {/* ========================================================= */}
                    <section
                        className={`w-full lg:w-[58%] flex flex-col space-y-4 ${
                            mobileTab === "form" ? "hidden lg:flex" : "flex"
                        }`}
                    >
                        {/* Filter & Search Console */}
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 flex flex-col gap-4 corner-decor relative">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                {/* Search by Name or Jersey */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or jersey..."
                                        className="w-full pl-9 pr-3 py-2 bg-[#F4F1EA] text-[#1A1A1A] placeholder-[#9C968D] border border-[rgba(26,26,26,0.1)] rounded-full text-xs sm:text-sm focus:outline-none focus:border-[#3d030b]"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-2.5 text-[#9C968D] hover:text-[#1A1A1A]"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* + Add New Player CTA (Mobile/inline) */}
                                <button
                                    type="button"
                                    onClick={switchModeToCreate}
                                    className="shrink-0 bg-[#3d030b] text-white px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-[#5a181e] transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Player</span>
                                </button>
                            </div>

                            {/* Secondary Filter Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(26,26,26,0.08)]">
                                {/* Status Filter Toggle Pills */}
                                <div className="flex items-center space-x-1 bg-[#F4F1EA] p-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter("all");
                                            setPage(1);
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                            statusFilter === "all"
                                                ? "bg-[#3d030b] text-white font-semibold"
                                                : "text-[#6B665F] hover:text-[#1A1A1A]"
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter("current");
                                            setPage(1);
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                            statusFilter === "current"
                                                ? "bg-[#3d030b] text-white font-semibold"
                                                : "text-[#6B665F] hover:text-[#1A1A1A]"
                                        }`}
                                    >
                                        Current
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter("former");
                                            setPage(1);
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                            statusFilter === "former"
                                                ? "bg-[#3d030b] text-white font-semibold"
                                                : "text-[#6B665F] hover:text-[#1A1A1A]"
                                        }`}
                                    >
                                        Former
                                    </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Position Dropdown */}
                                    <select
                                        value={positionFilter}
                                        onChange={(e) => {
                                            setPositionFilter(e.target.value as "all" | PlayingPosition);
                                            setPage(1);
                                        }}
                                        className="bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] rounded px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    >
                                        <option value="all">All Positions</option>
                                        <option value="Forward">Forward</option>
                                        <option value="Midfielder">Midfielder</option>
                                        <option value="Defender">Defender</option>
                                        <option value="Goalkeeper">Goalkeeper</option>
                                    </select>

                                    {/* Year Input */}
                                    <input
                                        type="number"
                                        placeholder="Year (e.g. 2024)"
                                        value={yearFilter}
                                        onChange={(e) => {
                                            setYearFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-28 bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* List Error Banner */}
                        {listError && (
                            <div className="bg-[#ECE8E1] border border-[#7A2E2E]/40 p-4 corner-decor flex items-center justify-between text-xs">
                                <span className="text-[#7A2E2E]">{listError}</span>
                                <button
                                    type="button"
                                    onClick={fetchPlayersList}
                                    className="underline text-[#3d030b] font-semibold ml-3"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Ledger Table / Register */}
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] overflow-hidden corner-decor relative">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[rgba(26,26,26,0.08)] bg-[#E2DDD4] text-[11px] text-[#6B665F] tracking-wider uppercase font-semibold">
                                            <th className="py-3 px-4 w-12 text-center">#</th>
                                            <th className="py-3 px-4">Player Identifier</th>
                                            <th className="py-3 px-4">Position</th>
                                            <th className="py-3 px-4">Tenure / Years</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.06)] text-xs">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, idx) => (
                                                <tr key={idx} className="animate-pulse bg-[#F4F1EA]/50">
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="h-4 w-4 bg-[#DCDAD3] rounded-xs mx-auto" />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-9 h-9 rounded-full bg-[#DCDAD3] shrink-0" />
                                                            <div className="space-y-1.5 flex-1">
                                                                <div className="h-3 w-28 bg-[#DCDAD3] rounded-xs" />
                                                                <div className="h-2 w-20 bg-[#DCDAD3] rounded-xs" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-3 w-16 bg-[#DCDAD3] rounded-xs" />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-3 w-16 bg-[#DCDAD3] rounded-xs" />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-4 w-12 bg-[#DCDAD3] rounded-full" />
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="h-4 w-8 bg-[#DCDAD3] rounded-xs ml-auto" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredPlayers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[#6B665F]">
                                                    <User className="w-8 h-8 text-[#9C968D] mx-auto mb-2 opacity-50" />
                                                    <p className="font-semibold text-sm text-[#1A1A1A]">
                                                        No player records found
                                                    </p>
                                                    <p className="text-xs text-[#9C968D] mt-0.5">
                                                        {searchQuery
                                                            ? `No athletes match the search "${searchQuery}".`
                                                            : "Use '+ Add New Player' in the right panel to record the first player."}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPlayers.map((player) => {
                                                const isSelected = selectedPlayer?._id === player._id;
                                                return (
                                                    <tr
                                                        key={player._id}
                                                        onClick={() => selectPlayerForEdit(player)}
                                                        className={`transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-[#E2DDD4] border-l-4 border-l-[#3d030b]"
                                                                : "hover:bg-[#E2DDD4]/60 bg-[#ECE8E1]"
                                                        }`}
                                                    >
                                                        {/* Jersey Number or Index */}
                                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#3d030b] text-center">
                                                            {player.jerseyNumber !== undefined
                                                                ? String(player.jerseyNumber).padStart(2, "0")
                                                                : "—"}
                                                        </td>

                                                        {/* Player Identifier */}
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center space-x-3">
                                                                {player.profilePhoto ? (
                                                                    <img
                                                                        src={player.profilePhoto}
                                                                        alt={player.name}
                                                                        className="w-9 h-9 rounded-full object-cover border border-[rgba(26,26,26,0.12)] shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] flex items-center justify-center font-bold text-[#3d030b] text-xs shrink-0">
                                                                        {getInitials(player.name)}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                                                                        <span>{player.name}</span>
                                                                        {isSelected && (
                                                                            <span
                                                                                className="inline-block w-1.5 h-1.5 rounded-full bg-[#3d030b]"
                                                                                title="Currently editing in dossier"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-[#6B665F]">
                                                                        {player.leadershipRoles?.[0] ||
                                                                            formatTenure(
                                                                                player.playingYears,
                                                                                player.status,
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Playing Position */}
                                                        <td className="py-3.5 px-4 text-[#1A1A1A] font-medium">
                                                            {player.playingPosition || "—"}
                                                        </td>

                                                        {/* Tenure / Years */}
                                                        <td className="py-3.5 px-4 text-[#6B665F] font-mono text-[11px]">
                                                            {formatTenure(player.playingYears, player.status)}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="py-3.5 px-4">
                                                            {player.status === "current" ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-[#2D5A3D] border border-[#2D5A3D]/20">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.1)]">
                                                                    Alumni
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div
                                                                className="inline-flex items-center space-x-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectPlayerForEdit(player)}
                                                                    className="p-1 rounded text-[#6B665F] hover:text-[#3d030b] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Edit Dossier"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPlayerToDelete(player)}
                                                                    className="p-1 rounded text-[#9C968D] hover:text-[#7A2E2E] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Delete Record"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Ledger Footer / Pagination */}
                            <div className="py-3.5 px-4 border-t border-[rgba(26,26,26,0.08)] bg-[#F4F1EA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B665F]">
                                <span>
                                    Showing {filteredPlayers.length} of {totalRecords} cataloged records
                                </span>
                                <div className="flex items-center space-x-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={page <= 1}
                                        className="px-3 py-1 rounded-full border border-[rgba(26,26,26,0.12)] bg-[#ECE8E1] hover:bg-[#E2DDD4] transition-colors disabled:opacity-40 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                        <span>Prev</span>
                                    </button>
                                    <span className="px-2 font-mono text-[11px] font-semibold text-[#1A1A1A]">
                                        Page {page}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page * limit >= totalRecords}
                                        className="px-3 py-1 rounded-full border border-[rgba(26,26,26,0.12)] bg-[#ECE8E1] hover:bg-[#E2DDD4] transition-colors disabled:opacity-40 flex items-center gap-1"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* RIGHT PANEL: Player Form / Dossier Panel (~42% width)     */}
                    {/* ========================================================= */}
                    <aside
                        className={`w-full lg:w-[42%] lg:sticky lg:top-24 ${
                            mobileTab === "list" ? "hidden lg:block" : "block"
                        }`}
                    >
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 md:p-8 flex flex-col space-y-6 corner-decor relative shadow-xs"
                        >
                            {/* Dossier Form Header */}
                            <div className="border-b border-[rgba(26,26,26,0.08)] pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2DDD4] text-[#3d030b] border border-[#3d030b]/20 tracking-wider uppercase font-mono">
                                        {selectedPlayer
                                            ? `EDITING DOSSIER — ID: ${selectedPlayer._id.slice(-6).toUpperCase()}`
                                            : "NEW RECORD — CREATE DOSSIER"}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={switchModeToCreate}
                                            className="px-3 py-1 rounded-full text-xs border border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                                        >
                                            Clear / Reset
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-1 rounded-full text-xs font-semibold bg-[#3d030b] text-white hover:bg-[#5a181e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                                            <span>Commit Record</span>
                                        </button>
                                    </div>
                                </div>
                                <h2 className="text-lg font-medium text-[#1A1A1A]">Player Dossier</h2>
                                <p className="text-xs text-[#6B665F] mt-0.5">
                                    Amend identity, service timeline, archival portrait, and honors.
                                </p>
                            </div>

                            {/* Notifications / Feedback */}
                            {formSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 text-[#2D5A3D] text-xs flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{formSuccess}</span>
                                </div>
                            )}
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-[#7A2E2E] text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Section 1: Primary Identification */}
                            <div className="space-y-3">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                    1. Primary Identification
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Full Legal Name <span className="text-[#7A2E2E]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register("name")}
                                            placeholder="e.g. Vikram Singh"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                        {errors.name && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-0.5">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Jersey #
                                        </label>
                                        <input
                                            type="number"
                                            {...register("jerseyNumber", { valueAsNumber: true })}
                                            placeholder="e.g. 7"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                        {errors.jerseyNumber && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-0.5">
                                                {errors.jerseyNumber.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Playing Position
                                    </label>
                                    <select
                                        {...register("playingPosition")}
                                        className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    >
                                        <option value="">Select Position (Optional)</option>
                                        <option value="Forward">Forward</option>
                                        <option value="Midfielder">Midfielder</option>
                                        <option value="Defender">Defender</option>
                                        <option value="Goalkeeper">Goalkeeper</option>
                                    </select>
                                    {errors.playingPosition && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-0.5">
                                            {errors.playingPosition.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Service Timeline */}
                            <div className="space-y-3 border-t border-[rgba(26,26,26,0.08)] pt-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                    2. Service Timeline
                                </h3>
                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                                        Roster Status <span className="text-[#7A2E2E]">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label
                                            className={`flex items-center justify-center p-2 rounded cursor-pointer text-xs font-semibold transition-all ${
                                                currentStatus === "current"
                                                    ? "bg-[#3d030b] text-white border border-[#3d030b]"
                                                    : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.12)] hover:bg-[#E2DDD4]"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                value="current"
                                                {...register("status")}
                                                className="sr-only"
                                            />
                                            <span>Active Roster (Current)</span>
                                        </label>

                                        <label
                                            className={`flex items-center justify-center p-2 rounded cursor-pointer text-xs font-semibold transition-all ${
                                                currentStatus === "former"
                                                    ? "bg-[#3d030b] text-white border border-[#3d030b]"
                                                    : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.12)] hover:bg-[#E2DDD4]"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                value="former"
                                                {...register("status")}
                                                className="sr-only"
                                            />
                                            <span>Alumni / Former</span>
                                        </label>
                                    </div>
                                    {errors.status && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-0.5">{errors.status.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Debut Year
                                        </label>
                                        <input
                                            type="number"
                                            {...register("startYear", { valueAsNumber: true })}
                                            placeholder="e.g. 2016"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                        {errors.startYear && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-0.5">
                                                {errors.startYear.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Final Year
                                        </label>
                                        <input
                                            type="number"
                                            {...register("endYear", { valueAsNumber: true })}
                                            placeholder="e.g. 2020"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                        />
                                        {errors.endYear && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-0.5">
                                                {errors.endYear.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Archival Portrait & ImageKit */}
                            <div className="space-y-3 border-t border-[rgba(26,26,26,0.08)] pt-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                    3. Archival Portrait
                                </h3>
                                <div className="flex items-center space-x-4 bg-[#F4F1EA] p-3 border border-[rgba(26,26,26,0.12)]">
                                    <div className="w-16 h-16 bg-[#ECE8E1] border border-[rgba(26,26,26,0.15)] flex items-center justify-center shrink-0 overflow-hidden relative">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Portrait Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-7 h-7 text-[#9C968D]" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col space-y-1">
                                        <span className="text-xs font-semibold text-[#1A1A1A] truncate">
                                            {selectedPhotoFile
                                                ? selectedPhotoFile.name
                                                : selectedPlayer?.profilePhoto
                                                  ? "Archival Portrait On File"
                                                  : "No portrait uploaded"}
                                        </span>
                                        <span className="text-[11px] text-[#9C968D]">
                                            {selectedPhotoFile
                                                ? `${(selectedPhotoFile.size / 1024).toFixed(0)} KB • Ready for sync`
                                                : "Direct ImageKit integration • Max 5MB"}
                                        </span>

                                        <div className="flex items-center gap-3 pt-1">
                                            <label className="text-xs text-[#3d030b] hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                                                <Upload className="w-3 h-3" />
                                                <span>
                                                    {photoPreview || selectedPlayer?.profilePhoto
                                                        ? "Replace Portrait"
                                                        : "Upload Portrait"}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    onChange={handlePhotoFileChange}
                                                    className="sr-only"
                                                />
                                            </label>

                                            {(selectedPhotoFile || photoPreview) && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearPhoto}
                                                    className="text-xs text-[#7A2E2E] hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Leadership & Honors */}
                            <div className="space-y-3 border-t border-[rgba(26,26,26,0.08)] pt-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                    4. Leadership &amp; Statistics
                                </h3>
                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Leadership Role / Citation
                                    </label>
                                    <input
                                        type="text"
                                        {...register("leadershipRole")}
                                        placeholder="e.g. Captain (2018–19)"
                                        className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6B665F] mb-1">
                                            Matches
                                        </label>
                                        <input
                                            type="number"
                                            {...register("matchesCount", { valueAsNumber: true })}
                                            placeholder="42"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-2 py-1 text-xs text-[#1A1A1A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6B665F] mb-1">
                                            Goals
                                        </label>
                                        <input
                                            type="number"
                                            {...register("goalsCount", { valueAsNumber: true })}
                                            placeholder="18"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-2 py-1 text-xs text-[#1A1A1A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6B665F] mb-1">
                                            Assists
                                        </label>
                                        <input
                                            type="number"
                                            {...register("assistsCount", { valueAsNumber: true })}
                                            placeholder="12"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-2 py-1 text-xs text-[#1A1A1A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6B665F] mb-1">
                                            Clean Sheets
                                        </label>
                                        <input
                                            type="number"
                                            {...register("cleanSheetsCount", { valueAsNumber: true })}
                                            placeholder="8"
                                            className="w-full bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-2 py-1 text-xs text-[#1A1A1A]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Achievements & Ledger Summary */}
                            <div className="space-y-3 border-t border-[rgba(26,26,26,0.08)] pt-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                    5. Achievements &amp; Ledger Summary
                                </h3>

                                {watchedAchievementIds.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {watchedAchievementIds.map((achId) => {
                                            const item = catalogAchievements.find((a) => a._id === achId);
                                            const label = item ? `${item.year} ${item.title}` : `Achievement ${achId}`;
                                            return (
                                                <div
                                                    key={achId}
                                                    className="flex items-center justify-between p-2 bg-[#F4F1EA] border border-[rgba(26,26,26,0.08)] text-xs"
                                                >
                                                    <span className="font-medium text-[#1A1A1A] flex items-center gap-1.5">
                                                        <Medal className="w-3.5 h-3.5 text-[#3d030b]" />
                                                        <span>{label}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAchievement(achId)}
                                                        className="text-[#9C968D] hover:text-[#7A2E2E]"
                                                        title="Remove citation"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-[#9C968D] italic">
                                        No catalog achievements linked to this player.
                                    </p>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <select
                                        value={selectedAchievementId}
                                        onChange={(e) => setSelectedAchievementId(e.target.value)}
                                        className="flex-1 bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] rounded px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    >
                                        <option value="">Select Achievement from Registry...</option>
                                        {catalogAchievements
                                            .filter((ach) => !watchedAchievementIds.includes(ach._id))
                                            .map((ach) => (
                                                <option key={ach._id} value={ach._id}>
                                                    {ach.year} — {ach.title} ({ach.type})
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddAchievement}
                                        disabled={!selectedAchievementId}
                                        className="px-3 py-1.5 bg-[#E2DDD4] hover:bg-[#DCDAD3] text-[#1A1A1A] text-xs font-semibold rounded border border-[rgba(26,26,26,0.12)] disabled:opacity-40 transition-colors"
                                    >
                                        Attach
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Action Buttons */}
                            <div className="border-t border-[rgba(26,26,26,0.08)] pt-4 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={switchModeToCreate}
                                    className="px-5 py-2 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.15)] text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#3d030b] text-white hover:bg-[#5a181e] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>
                                        {selectedPlayer ? "Save Changes / Commit Record" : "Register Player Record"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            </main>

            {/* ========================================================= */}
            {/* DESTRUCTIVE DELETE CONFIRMATION MODAL                      */}
            {/* ========================================================= */}
            {playerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-[#ECE8E1] border border-[#7A2E2E]/40 p-6 max-w-md w-full corner-decor relative shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-[#7A2E2E]">
                            <BadgeAlert className="w-6 h-6 shrink-0" />
                            <h3 className="text-base font-bold text-[#1A1A1A]">Delete Player Record</h3>
                        </div>

                        <p className="text-xs text-[#6B665F] leading-relaxed">
                            Are you certain you wish to permanently delete the archive record for{" "}
                            <span className="font-bold text-[#1A1A1A]">"{playerToDelete.name}"</span>?
                        </p>

                        <div className="p-3 bg-[#F4F1EA] border border-[rgba(26,26,26,0.08)] text-[11px] text-[#6B665F] space-y-1">
                            <p>• Associated ImageKit portraits will be automatically pruned.</p>
                            <p>
                                • If this player is referenced in any Team or Tournament roster, deletion will be
                                blocked by institutional constraints.
                            </p>
                        </div>

                        {deleteError && (
                            <div className="p-2.5 bg-red-100 border border-red-300 text-[#7A2E2E] text-xs">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setPlayerToDelete(null);
                                    setDeleteError(null);
                                }}
                                disabled={deleting}
                                className="px-4 py-1.5 rounded-full border border-[rgba(26,26,26,0.15)] text-xs text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeletePlayer}
                                disabled={deleting}
                                className="px-5 py-1.5 rounded-full bg-[#7A2E2E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {deleting && <RefreshCw className="w-3 h-3 animate-spin" />}
                                <span>Confirm Deletion</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
