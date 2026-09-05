import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
    Users,
    Trophy,
    ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/api/teams";
import { getPlayers } from "@/api/players";
import { getAchievements } from "@/api/achievements";
import type { Team, TeamCreateInput } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";
import { teamFormSchema, type TeamFormData } from "@/schemas/teamSchema";

export default function AdminTeams() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [yearFilter, setYearFilter] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Reference Catalogs (Players & Achievements)
    // -------------------------------------------------------------------------
    const [catalogPlayers, setCatalogPlayers] = useState<Player[]>([]);
    const [playersLoading, setPlayersLoading] = useState<boolean>(true);
    const [catalogAchievements, setCatalogAchievements] = useState<Achievement[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Team Photo / ImageKit state
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Squad Selection Search
    const [playerSearchInput, setPlayerSearchInput] = useState<string>("");
    const [playerDropdownOpen, setPlayerDropdownOpen] = useState<boolean>(false);
    const playerDropdownRef = useRef<HTMLDivElement>(null);

    // Achievement Linking
    const [selectedAchievementId, setSelectedAchievementId] = useState<string>("");

    // Destructive Delete State
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
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
    } = useForm<TeamFormData>({
        resolver: zodResolver(teamFormSchema),
        defaultValues: {
            year: new Date().getFullYear(),
            coach: "",
            captain: "",
            viceCaptain: "",
            players: [],
            achievementIds: [],
        },
    });

    const watchedPlayersValue = watch("players");
    const watchedPlayers = useMemo(() => watchedPlayersValue || [], [watchedPlayersValue]);
    const watchedCaptain = watch("captain") || "";
    const watchedViceCaptain = watch("viceCaptain") || "";
    const watchedAchievementIds = watch("achievementIds") || [];
    const watchedYear = watch("year");

    // -------------------------------------------------------------------------
    // Fast ID -> Entity Mappings
    // -------------------------------------------------------------------------
    const playerMap = useMemo(() => {
        const map = new Map<string, Player>();
        for (const player of catalogPlayers) {
            map.set(player._id, player);
        }
        return map;
    }, [catalogPlayers]);

    const achievementMap = useMemo(() => {
        const map = new Map<string, Achievement>();
        for (const ach of catalogAchievements) {
            map.set(ach._id, ach);
        }
        return map;
    }, [catalogAchievements]);

    // -------------------------------------------------------------------------
    // Data Fetching: Teams, Players, Achievements
    // -------------------------------------------------------------------------
    const fetchTeamsList = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const query: {
                page: number;
                limit: number;
                year?: number;
                sort: "year";
                order: "desc";
            } = {
                page,
                limit,
                sort: "year",
                order: "desc",
            };

            if (yearFilter.trim()) {
                const parsedYear = parseInt(yearFilter.trim(), 10);
                if (!isNaN(parsedYear)) query.year = parsedYear;
            }

            const res = await getTeams(query);
            setTeams(res.data);
            setTotalRecords(res.meta?.total ?? res.data.length);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load teams directory";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, yearFilter]);

    useEffect(() => {
        fetchTeamsList();
    }, [fetchTeamsList]);

    // Load available players for squad assignment & captain selection
    useEffect(() => {
        setPlayersLoading(true);
        getPlayers({ limit: 100 })
            .then((res) => setCatalogPlayers(res.data))
            .catch(() => setCatalogPlayers([]))
            .finally(() => setPlayersLoading(false));
    }, []);

    // Load available achievements for cross-linking
    useEffect(() => {
        getAchievements({ limit: 100 })
            .then((res) => setCatalogAchievements(res.data))
            .catch(() => setCatalogAchievements([]));
    }, []);

    // Close player dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (playerDropdownRef.current && !playerDropdownRef.current.contains(event.target as Node)) {
                setPlayerDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // -------------------------------------------------------------------------
    // Client-side Search Filtering
    // -------------------------------------------------------------------------
    const filteredTeams = useMemo(() => {
        if (!searchQuery.trim()) return teams;
        const q = searchQuery.toLowerCase().trim();
        return teams.filter((team) => {
            const matchesYear = team.year.toString().includes(q);
            const matchesCoach = team.coach?.toLowerCase().includes(q);
            const captainObj = team.captain ? playerMap.get(team.captain) : undefined;
            const matchesCaptain = captainObj?.name.toLowerCase().includes(q);
            const vcObj = team.viceCaptain ? playerMap.get(team.viceCaptain) : undefined;
            const matchesVC = vcObj?.name.toLowerCase().includes(q);
            return matchesYear || matchesCoach || matchesCaptain || matchesVC;
        });
    }, [teams, searchQuery, playerMap]);

    // -------------------------------------------------------------------------
    // Available Players for Squad Multi-Select
    // -------------------------------------------------------------------------
    const availablePlayers = useMemo(() => {
        const squadSet = new Set(watchedPlayers);
        return catalogPlayers.filter((p) => {
            if (squadSet.has(p._id)) return false;
            if (!playerSearchInput.trim()) return true;
            const q = playerSearchInput.toLowerCase().trim();
            const matchesName = p.name.toLowerCase().includes(q);
            const matchesJersey = p.jerseyNumber?.toString().includes(q);
            const matchesPos = p.playingPosition?.toLowerCase().includes(q);
            return matchesName || matchesJersey || matchesPos;
        });
    }, [catalogPlayers, watchedPlayers, playerSearchInput]);

    // -------------------------------------------------------------------------
    // Form Population on Team Select
    // -------------------------------------------------------------------------
    const selectTeamForEdit = useCallback(
        (team: Team) => {
            setSelectedTeam(team);
            setFormSuccess(null);
            setFormError(null);
            setSelectedPhotoFile(null);
            setPhotoPreview(team.teamPhoto || null);
            setMobileTab("form");

            reset({
                year: team.year,
                coach: team.coach || "",
                captain: team.captain || "",
                viceCaptain: team.viceCaptain || "",
                players: team.players || [],
                achievementIds: team.achievements || [],
            });
        },
        [reset],
    );

    const switchModeToCreate = () => {
        setSelectedTeam(null);
        setFormSuccess(null);
        setFormError(null);
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setMobileTab("form");
        reset({
            year: new Date().getFullYear(),
            coach: "",
            captain: "",
            viceCaptain: "",
            players: [],
            achievementIds: [],
        });
    };

    // -------------------------------------------------------------------------
    // Team Photo File Selection Handler
    // -------------------------------------------------------------------------
    const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check: 5MB
        if (file.size > 5 * 1024 * 1024) {
            setFormError("Selected photograph exceeds the 5MB ImageKit file size limit.");
            return;
        }

        setSelectedPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setFormError(null);
    };

    const handleClearPhoto = () => {
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // -------------------------------------------------------------------------
    // Squad Assignment Handlers
    // -------------------------------------------------------------------------
    const handleAddPlayerToSquad = (playerId: string) => {
        if (!watchedPlayers.includes(playerId)) {
            setValue("players", [...watchedPlayers, playerId], { shouldValidate: true });
        }
        setPlayerSearchInput("");
        setPlayerDropdownOpen(false);
    };

    const handleRemovePlayerFromSquad = (playerIdToRemove: string) => {
        // If removing someone who is currently selected as captain/viceCaptain, clear those roles
        if (watchedCaptain === playerIdToRemove) {
            setValue("captain", "");
        }
        if (watchedViceCaptain === playerIdToRemove) {
            setValue("viceCaptain", "");
        }
        setValue(
            "players",
            watchedPlayers.filter((id) => id !== playerIdToRemove),
            { shouldValidate: true },
        );
    };

    // Automatically ensure Captain & Vice-Captain are in squad if selected
    const handleCaptainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCaptainId = e.target.value;
        setValue("captain", newCaptainId, { shouldValidate: true });
        if (newCaptainId && !watchedPlayers.includes(newCaptainId)) {
            setValue("players", [...watchedPlayers, newCaptainId], { shouldValidate: true });
        }
    };

    const handleViceCaptainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVCId = e.target.value;
        setValue("viceCaptain", newVCId, { shouldValidate: true });
        if (newVCId && !watchedPlayers.includes(newVCId)) {
            setValue("players", [...watchedPlayers, newVCId], { shouldValidate: true });
        }
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
    const onSubmit = async (formData: TeamFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            const payload: TeamCreateInput = {
                year: Number(formData.year),
                players: formData.players,
                coach: formData.coach?.trim() ? formData.coach.trim() : undefined,
                captain: formData.captain ? formData.captain : undefined,
                viceCaptain: formData.viceCaptain ? formData.viceCaptain : undefined,
                achievements:
                    formData.achievementIds && formData.achievementIds.length > 0 ? formData.achievementIds : undefined,
            };

            if (selectedTeam) {
                // UPDATE RECORD
                const updated = await updateTeam(selectedTeam._id, payload, selectedPhotoFile || undefined);
                setFormSuccess(`Team dossier for season ${updated.data.year} committed successfully.`);
                setSelectedTeam(updated.data);
                if (updated.data.teamPhoto) {
                    setPhotoPreview(updated.data.teamPhoto);
                }
                setSelectedPhotoFile(null);
            } else {
                // CREATE RECORD
                const created = await createTeam(payload, selectedPhotoFile || undefined);
                setFormSuccess(`New varsity squad record for season ${created.data.year} committed successfully.`);
                setSelectedTeam(created.data);
                if (created.data.teamPhoto) {
                    setPhotoPreview(created.data.teamPhoto);
                }
                setSelectedPhotoFile(null);
            }

            await fetchTeamsList();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An error occurred while committing team dossier";
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Deletion Handler
    // -------------------------------------------------------------------------
    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteTeam(teamToDelete._id);
            if (selectedTeam?._id === teamToDelete._id) {
                switchModeToCreate();
            }
            setTeamToDelete(null);
            await fetchTeamsList();
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Unable to delete team. Ensure no tournament editions or achievements reference this record.";
            setDeleteError(msg);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA]">
            {/* Page Header matching Stitch Teams Management */}
            <header className="border-b border-[rgba(26,26,26,0.08)] px-6 md:px-12 py-8 bg-[#F4F1EA]">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-[11px] md:text-[12px] uppercase tracking-widest font-semibold text-[#9C968D]">
                            Institutional Records Registry
                        </span>
                        <h1 className="text-3xl md:text-[34px] font-medium text-[#3d030b] tracking-tight mt-1">
                            Teams Directory &amp; Squad Dossiers
                        </h1>
                        <p className="text-xs sm:text-sm text-[#6B665F] mt-1 max-w-3xl leading-relaxed">
                            Manage institutional varsity squads, appointed captains, coaching staff, and official squad
                            portraits in one unified register.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchTeamsList}
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
                            <span>Add New Team</span>
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
                    Directory ({filteredTeams.length})
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
                    {selectedTeam ? `Edit Squad (${selectedTeam.year})` : "New Team Dossier"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Container */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Teams Directory (~58% width)                  */}
                    {/* ========================================================= */}
                    <section
                        className={`w-full lg:w-[58%] flex flex-col space-y-4 ${
                            mobileTab === "form" ? "hidden lg:flex" : "flex"
                        }`}
                    >
                        {/* Filter & Search Console */}
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 flex flex-col gap-4 corner-decor relative">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                {/* Search by Year, Captain, or Coach */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by year, captain, or coach..."
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

                                {/* Year Filter */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Year (e.g. 2024)"
                                        value={yearFilter}
                                        onChange={(e) => {
                                            setYearFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-32 bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] rounded px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    />
                                    {yearFilter && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setYearFilter("");
                                                setPage(1);
                                            }}
                                            className="px-2 py-1.5 text-xs text-[#6B665F] hover:text-[#3d030b] border border-[rgba(26,26,26,0.1)] rounded bg-[#F4F1EA]"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List Error Banner */}
                        {listError && (
                            <div className="bg-[#ECE8E1] border border-[#7A2E2E]/40 p-4 corner-decor flex items-center justify-between text-xs">
                                <span className="text-[#7A2E2E]">{listError}</span>
                                <button
                                    type="button"
                                    onClick={fetchTeamsList}
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
                                            <th className="py-3 px-3 w-10 text-center">#</th>
                                            <th className="py-3 px-4">Academic Year / Season</th>
                                            <th className="py-3 px-4">Leadership</th>
                                            <th className="py-3 px-4">Head Coach</th>
                                            <th className="py-3 px-3 text-center">Squad Size</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.06)] text-xs">
                                        {loading ? (
                                            Array.from({ length: 4 }).map((_, idx) => (
                                                <tr key={idx} className="animate-pulse">
                                                    <td className="py-4 px-3 text-center">
                                                        <div className="h-3 w-4 bg-[#E2DDD4] rounded mx-auto" />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-12 h-9 bg-[#E2DDD4] rounded" />
                                                            <div className="space-y-1">
                                                                <div className="h-3 w-28 bg-[#E2DDD4] rounded" />
                                                                <div className="h-2 w-16 bg-[#E2DDD4] rounded" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-3 w-24 bg-[#E2DDD4] rounded" />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-3 w-20 bg-[#E2DDD4] rounded" />
                                                    </td>
                                                    <td className="py-4 px-3 text-center">
                                                        <div className="h-4 w-16 bg-[#E2DDD4] rounded mx-auto" />
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="h-4 w-12 bg-[#E2DDD4] rounded ml-auto" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredTeams.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[#6B665F]">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <Users className="w-8 h-8 text-[#9C968D] mx-auto stroke-1" />
                                                        <p className="font-medium text-[#1A1A1A]">
                                                            No team records found
                                                        </p>
                                                        <p className="text-[11px] text-[#9C968D]">
                                                            {searchQuery || yearFilter
                                                                ? "No archived teams match your current search or year filter criteria."
                                                                : "There are no varsity squad records registered in the ledger yet."}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={switchModeToCreate}
                                                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#3d030b] text-white hover:bg-[#5a181e] transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Register First Team</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTeams.map((team, index) => {
                                                const isSelected = selectedTeam?._id === team._id;
                                                const captainObj = team.captain
                                                    ? playerMap.get(team.captain)
                                                    : undefined;
                                                const vcObj = team.viceCaptain
                                                    ? playerMap.get(team.viceCaptain)
                                                    : undefined;
                                                const squadCount = team.players ? team.players.length : 0;

                                                return (
                                                    <tr
                                                        key={team._id}
                                                        onClick={() => selectTeamForEdit(team)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isSelected
                                                                ? "bg-[#E2DDD4] font-medium"
                                                                : "hover:bg-[#EAE5DC]"
                                                        }`}
                                                    >
                                                        {/* Number Index */}
                                                        <td className="py-3.5 px-3 text-center font-mono text-[#9C968D]">
                                                            {String(index + 1).padStart(2, "0")}
                                                        </td>

                                                        {/* Academic Year / Season */}
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-12 h-9 bg-[#DED9CE] border border-[rgba(26,26,26,0.12)] flex-shrink-0 overflow-hidden rounded-xs flex items-center justify-center">
                                                                    {team.teamPhoto ? (
                                                                        <img
                                                                            src={team.teamPhoto}
                                                                            alt={`${team.year} Squad`}
                                                                            className="w-full h-full object-cover"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <Users className="w-5 h-5 text-[#9C968D]" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#1A1A1A]">
                                                                        {team.year}–{team.year + 1} Season
                                                                    </div>
                                                                    <div className="text-[11px] text-[#6B665F]">
                                                                        Official Varsity Squad
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Leadership */}
                                                        <td className="py-3.5 px-4">
                                                            {captainObj ? (
                                                                <div className="text-[#1A1A1A] font-medium">
                                                                    {captainObj.name}{" "}
                                                                    <span className="text-[10px] text-[#3d030b] font-bold">
                                                                        (C)
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[#9C968D] italic">
                                                                    No captain recorded
                                                                </div>
                                                            )}
                                                            {vcObj && (
                                                                <div className="text-[11px] text-[#6B665F]">
                                                                    VC: {vcObj.name}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Head Coach */}
                                                        <td className="py-3.5 px-4 text-[#1A1A1A]">
                                                            {team.coach || (
                                                                <span className="text-[#9C968D] italic">
                                                                    Unrecorded
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Squad Size */}
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className="inline-block px-2.5 py-0.5 rounded bg-[#DED9CE] text-[#1A1A1A] font-mono text-[11px] font-semibold border border-[rgba(26,26,26,0.08)]">
                                                                {squadCount} {squadCount === 1 ? "Player" : "Players"}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div
                                                                className="inline-flex items-center space-x-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectTeamForEdit(team)}
                                                                    className="p-1 rounded text-[#6B665F] hover:text-[#3d030b] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Edit Team Dossier"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTeamToDelete(team)}
                                                                    className="p-1 rounded text-[#9C968D] hover:text-[#7A2E2E] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Delete Team Record"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <Link
                                                                    to={`/teams`}
                                                                    className="p-1 rounded text-[#9C968D] hover:text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="View Public Ledger"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </Link>
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
                                    Showing {filteredTeams.length} of {totalRecords} verified team records
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
                    {/* RIGHT PANEL: Team Dossier Form (~42% width)               */}
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
                                        {selectedTeam
                                            ? `EDITING TEAM — SEASON: ${selectedTeam.year}–${selectedTeam.year + 1}`
                                            : "NEW RECORD — CREATE TEAM"}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={switchModeToCreate}
                                            className="px-3 py-1 rounded-full text-xs border border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                                        >
                                            Cancel
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
                                <h2 className="text-lg font-medium text-[#1A1A1A]">Team Dossier</h2>
                                <p className="text-xs text-[#6B665F] mt-0.5">
                                    Amend seasonal squad, appointed leadership, coaching staff, and verified tournament
                                    distinctions.
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

                            {/* Section 1: Team Information */}
                            <div className="space-y-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    1. TEAM INFORMATION
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Academic Year (e.g. {new Date().getFullYear()}){" "}
                                        <span className="text-[#7A2E2E]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register("year", { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        placeholder="2024"
                                    />
                                    {errors.year && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.year.message}</p>
                                    )}
                                    {watchedYear && (
                                        <p className="text-[11px] text-[#6B665F] mt-1">
                                            Represents the {watchedYear}–{Number(watchedYear) + 1} inter-collegiate
                                            academic sports session.
                                        </p>
                                    )}
                                </div>

                                {/* Official Team Photograph */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Official Team Photograph
                                    </label>
                                    <div className="p-3 bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] flex items-start space-x-3 rounded-xs">
                                        <div className="w-20 h-14 bg-[#DED9CE] border border-[rgba(26,26,26,0.12)] flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {photoPreview ? (
                                                <img
                                                    src={photoPreview}
                                                    alt="Team Archival Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Users className="w-6 h-6 text-[#9C968D]" />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="text-xs font-mono font-medium text-[#1A1A1A] truncate max-w-[200px]">
                                                    {selectedPhotoFile
                                                        ? selectedPhotoFile.name
                                                        : selectedTeam?.teamPhoto
                                                          ? "Archival Photo Linked"
                                                          : "No photograph uploaded"}
                                                </div>
                                                <div className="text-[11px] text-[#6B665F]">
                                                    {selectedPhotoFile
                                                        ? `${(selectedPhotoFile.size / 1024 / 1024).toFixed(2)} MB (Ready for upload)`
                                                        : "Max 5MB (JPEG, PNG, WebP)"}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3 mt-2">
                                                <label className="text-[11px] text-[#3d030b] font-semibold hover:underline cursor-pointer flex items-center space-x-1">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>{photoPreview ? "Replace Photo" : "Upload Photo"}</span>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                                        onChange={handlePhotoFileChange}
                                                        className="hidden"
                                                    />
                                                </label>

                                                {(selectedPhotoFile || photoPreview) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearPhoto}
                                                        className="text-[11px] text-[#7A2E2E] hover:underline"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Leadership & Staff */}
                            <div className="space-y-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    2. LEADERSHIP &amp; STAFF
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Captain Select */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Captain
                                        </label>
                                        <select
                                            value={watchedCaptain}
                                            onChange={handleCaptainChange}
                                            className="w-full px-3 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        >
                                            <option value="">-- None Selected --</option>
                                            {catalogPlayers.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name}{" "}
                                                    {p.jerseyNumber !== undefined ? `(#${p.jerseyNumber})` : ""}{" "}
                                                    {p.playingPosition ? `- ${p.playingPosition}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.captain && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.captain.message}</p>
                                        )}
                                    </div>

                                    {/* Vice-Captain Select */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                            Vice-Captain
                                        </label>
                                        <select
                                            value={watchedViceCaptain}
                                            onChange={handleViceCaptainChange}
                                            className="w-full px-3 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        >
                                            <option value="">-- None Selected --</option>
                                            {catalogPlayers.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name}{" "}
                                                    {p.jerseyNumber !== undefined ? `(#${p.jerseyNumber})` : ""}{" "}
                                                    {p.playingPosition ? `- ${p.playingPosition}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.viceCaptain && (
                                            <p className="text-[11px] text-[#7A2E2E] mt-1">
                                                {errors.viceCaptain.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Head Coach */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Head Coach / Team Manager
                                    </label>
                                    <input
                                        type="text"
                                        {...register("coach")}
                                        className="w-full px-3 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        placeholder="e.g. Rajesh Singh"
                                    />
                                    {errors.coach && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.coach.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Squad Assignment */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold">
                                        3. SQUAD ASSIGNMENT ({watchedPlayers.length} PLAYERS){" "}
                                        <span className="text-[#7A2E2E]">*</span>
                                    </h3>
                                    <span className="text-[11px] text-[#9C968D]">
                                        {playersLoading ? "Loading Roster..." : "Roster Sync: Active"}
                                    </span>
                                </div>

                                {/* Search & Add Player Input Dropdown */}
                                <div className="relative" ref={playerDropdownRef}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={playerSearchInput}
                                            onChange={(e) => {
                                                setPlayerSearchInput(e.target.value);
                                                setPlayerDropdownOpen(true);
                                            }}
                                            onFocus={() => setPlayerDropdownOpen(true)}
                                            placeholder="Search registered player to add to squad..."
                                            className="w-full pl-3 pr-8 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        />
                                        <Users className="w-4 h-4 text-[#9C968D] absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>

                                    {/* Filtered Dropdown Menu */}
                                    {playerDropdownOpen && (
                                        <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-[#F4F1EA] border border-[rgba(26,26,26,0.15)] shadow-md rounded z-30 divide-y divide-[rgba(26,26,26,0.06)]">
                                            {availablePlayers.length === 0 ? (
                                                <div className="p-3 text-xs text-[#9C968D] text-center">
                                                    {playerSearchInput
                                                        ? "No matching available players found"
                                                        : "All registered players are already in this squad"}
                                                </div>
                                            ) : (
                                                availablePlayers.map((player) => (
                                                    <button
                                                        key={player._id}
                                                        type="button"
                                                        onClick={() => handleAddPlayerToSquad(player._id)}
                                                        className="w-full p-2 text-left text-xs hover:bg-[#E2DDD4] flex items-center justify-between transition-colors"
                                                    >
                                                        <div>
                                                            <span className="font-semibold text-[#1A1A1A]">
                                                                {player.name}
                                                            </span>
                                                            <span className="text-[11px] text-[#6B665F] ml-2">
                                                                {player.jerseyNumber !== undefined
                                                                    ? `#${player.jerseyNumber}`
                                                                    : ""}
                                                                {player.playingPosition
                                                                    ? ` • ${player.playingPosition}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-[#3d030b] font-semibold uppercase tracking-wider">
                                                            + Add
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {errors.players && (
                                    <p className="text-[11px] text-[#7A2E2E]">{errors.players.message}</p>
                                )}

                                {/* Tagged Assigned Players Chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1 max-h-48 overflow-y-auto p-1 bg-[#ECE8E1] rounded">
                                    {watchedPlayers.length === 0 ? (
                                        <div className="text-xs text-[#9C968D] italic py-2">
                                            No players assigned yet. Search above to add team members.
                                        </div>
                                    ) : (
                                        watchedPlayers.map((playerId) => {
                                            const player = playerMap.get(playerId);
                                            const isCaptain = watchedCaptain === playerId;
                                            const isViceCaptain = watchedViceCaptain === playerId;

                                            return (
                                                <span
                                                    key={playerId}
                                                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] text-xs text-[#1A1A1A]"
                                                >
                                                    <span className="font-medium">
                                                        {player?.name || "Archival Athlete"}
                                                    </span>
                                                    {player?.jerseyNumber !== undefined && (
                                                        <span className="text-[#6B665F] font-mono text-[10px]">
                                                            #{player.jerseyNumber}
                                                        </span>
                                                    )}
                                                    {isCaptain && (
                                                        <span className="px-1 py-0.2 bg-[#3d030b] text-white text-[9px] font-bold rounded">
                                                            C
                                                        </span>
                                                    )}
                                                    {isViceCaptain && (
                                                        <span className="px-1 py-0.2 bg-[#6B665F] text-white text-[9px] font-bold rounded">
                                                            VC
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePlayerFromSquad(playerId)}
                                                        className="text-[#9C968D] hover:text-[#7A2E2E] ml-1 transition-colors"
                                                        title="Remove from squad"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>

                                <p className="text-[11px] text-[#9C968D] italic">
                                    Note: Players are linked directly from the Players Directory. No manual re-entry
                                    required.
                                </p>
                            </div>

                            {/* Section 4: Achievements & Titles Linked */}
                            <div className="space-y-3">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    4. ACHIEVEMENTS &amp; TITLES LINKED
                                </h3>

                                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {watchedAchievementIds.length === 0 ? (
                                        <div className="text-xs text-[#9C968D] italic">
                                            No tournament honors or championship titles linked to this squad yet.
                                        </div>
                                    ) : (
                                        watchedAchievementIds.map((achId) => {
                                            const ach = achievementMap.get(achId);
                                            return (
                                                <div
                                                    key={achId}
                                                    className="flex items-center justify-between p-2 rounded bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] text-xs"
                                                >
                                                    <div className="flex items-center space-x-2 truncate pr-2">
                                                        <Trophy className="w-3.5 h-3.5 text-[#3d030b] shrink-0" />
                                                        <span className="font-medium text-[#1A1A1A] truncate">
                                                            {ach
                                                                ? `${ach.title} (${ach.year})`
                                                                : "Archival Achievement"}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAchievement(achId)}
                                                        className="text-[#9C968D] hover:text-[#7A2E2E] transition-colors shrink-0"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Link Achievement Selector */}
                                <div className="flex items-center space-x-2 pt-1">
                                    <select
                                        value={selectedAchievementId}
                                        onChange={(e) => setSelectedAchievementId(e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                    >
                                        <option value="">-- Select Existing Achievement --</option>
                                        {catalogAchievements
                                            .filter((a) => !watchedAchievementIds.includes(a._id))
                                            .map((a) => (
                                                <option key={a._id} value={a._id}>
                                                    {a.title} ({a.year}) {a.type ? `• ${a.type}` : ""}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddAchievement}
                                        disabled={!selectedAchievementId}
                                        className="px-3 py-1.5 rounded text-xs font-semibold bg-[#3d030b] text-white hover:bg-[#5a181e] transition-colors disabled:opacity-40"
                                    >
                                        + Link
                                    </button>
                                </div>
                            </div>

                            {/* Sticky Form Action Footer */}
                            <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={switchModeToCreate}
                                    className="px-4 py-2 border border-[rgba(26,26,26,0.12)] rounded-full text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-full bg-[#3d030b] text-white text-xs font-semibold hover:bg-[#5a181e] transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                                >
                                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Save Changes / Commit Record</span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            </main>

            {/* ============================================================= */}
            {/* Destructive Delete Confirmation Modal                         */}
            {/* ============================================================= */}
            {teamToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 max-w-md w-full corner-decor relative space-y-4 shadow-xl">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 rounded bg-red-100 text-[#7A2E2E]">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1A1A1A]">
                                    Delete Team Record ({teamToDelete.year})
                                </h3>
                                <p className="text-xs text-[#6B665F] mt-1 leading-relaxed">
                                    Are you sure you want to permanently delete the {teamToDelete.year}–
                                    {teamToDelete.year + 1} varsity team record? This action will remove the official
                                    squad roster and any associated archival photograph from ImageKit.
                                </p>
                            </div>
                        </div>

                        {deleteError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-[#7A2E2E] text-xs">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setTeamToDelete(null);
                                    setDeleteError(null);
                                }}
                                disabled={deleting}
                                className="px-4 py-2 border border-[rgba(26,26,26,0.12)] rounded-full text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteTeam}
                                disabled={deleting}
                                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#7A2E2E] text-white hover:bg-[#5a181e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>Delete Team Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
