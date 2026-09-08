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
    Award,
    Image as ImageIcon,
    Shield,
} from "lucide-react";
import {
    getTournamentEditions,
    createTournamentEdition,
    updateTournamentEdition,
    deleteTournamentEdition,
} from "@/api/tournaments";
import {
    getCachedTournaments,
    getCachedTeams,
    getCachedPlayers,
    getCachedAchievements,
    getCachedGalleryItems,
    invalidateCatalog,
} from "@/lib/catalogCache";
import type { Tournament, TournamentEdition, TournamentEditionCreateInput } from "@/types/tournament";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";
import type { GalleryItem } from "@/types/gallery";
import {
    tournamentEditionFormSchema,
    type TournamentEditionFormData,
    PLACEMENT_OPTIONS,
    POPULAR_PARTICIPATING_TEAMS,
} from "@/schemas/tournamentEditionSchema";
import AdminSelect from "@/components/admin/AdminSelect";

const ERA_FILTER_OPTIONS = [
    { value: "all", label: "All Eras (1960–Present)" },
    { value: "modern", label: "Modern Era (2010–Present)" },
    { value: "transition", label: "Transition Era (1990–2009)" },
    { value: "foundational", label: "Foundational Era (1960–1989)" },
];

const PLACEMENT_FILTER_OPTIONS = [
    { value: "all", label: "All Placements" },
    { value: "gold", label: "Champions / Gold Medal (1st)" },
    { value: "silver", label: "Runners-Up / Silver (2nd)" },
    { value: "bronze", label: "Bronze / 3rd Position" },
    { value: "other", label: "Semi-Finalists & Others" },
];

export default function AdminTournamentEditions() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [tournamentFilter, setTournamentFilter] = useState<string>("all");
    const [eraFilter, setEraFilter] = useState<string>("all");
    const [placementFilter, setPlacementFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Relational Catalogues for Reference Resolution & Selectors
    // -------------------------------------------------------------------------
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedEdition, setSelectedEdition] = useState<TournamentEdition | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Destructive Delete State
    const [editionToDelete, setEditionToDelete] = useState<TournamentEdition | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Mobile View Toggle
    const [mobileTab, setMobileTab] = useState<"list" | "form">("list");

    // Modal pickers for multi-selects
    const [showAchievementPicker, setShowAchievementPicker] = useState<boolean>(false);
    const [achievementSearch, setAchievementSearch] = useState<string>("");
    const [showGalleryPicker, setShowGalleryPicker] = useState<boolean>(false);
    const [gallerySearch, setGallerySearch] = useState<string>("");

    // Custom Participating Team Input
    const [customTeamInput, setCustomTeamInput] = useState<string>("");

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
    } = useForm<TournamentEditionFormData>({
        resolver: zodResolver(tournamentEditionFormSchema),
        defaultValues: {
            tournament: "",
            year: new Date().getFullYear(),
            edition: "",
            team: "",
            hostInstitute: "",
            participatingTeams: [],
            finalPosition: undefined,
            captain: "",
            viceCaptain: "",
            achievements: [],
            awards: [],
            photos: [],
        },
    });

    const watchedTournament = watch("tournament");
    const watchedTeam = watch("team");
    const watchedCaptain = watch("captain");
    const watchedViceCaptain = watch("viceCaptain");
    const watchedFinalPosition = watch("finalPosition");
    const watchedParticipatingTeams = watch("participatingTeams") || [];
    const watchedAchievements = watch("achievements") || [];
    const watchedPhotos = watch("photos") || [];

    const tournamentOptions = useMemo(
        () => [
            { value: "", label: "Select Tournament Circuit..." },
            ...tournaments.map((t) => ({
                value: t._id,
                label: `${t.name} (${t.type})`,
            })),
        ],
        [tournaments],
    );

    const teamOptions = useMemo(
        () => [
            { value: "", label: "Select Fielded Varsity Team..." },
            ...teams.map((tm) => ({
                value: tm._id,
                label: `IIT (BHU) Varsity Squad ${tm.year} (Players: ${tm.players.length || 0})${tm.coach ? ` • Coach: ${tm.coach}` : ""}`,
            })),
        ],
        [teams],
    );

    const captainOptions = useMemo(
        () => [
            { value: "", label: "None / Not Appointed" },
            ...players.map((p) => ({
                value: p._id,
                label: `${p.name} (#${p.jerseyNumber ?? "N/A"})`,
                sublabel: p.playingPosition || "Squad Member",
            })),
        ],
        [players],
    );

    // -------------------------------------------------------------------------
    // Catalog Dictionaries for Fast Lookups
    // -------------------------------------------------------------------------
    const tournamentMap = useMemo(() => {
        const map = new Map<string, Tournament>();
        for (const t of tournaments) {
            map.set(t._id, t);
        }
        return map;
    }, [tournaments]);

    const teamMap = useMemo(() => {
        const map = new Map<string, Team>();
        for (const tm of teams) {
            map.set(tm._id, tm);
        }
        return map;
    }, [teams]);

    const playerMap = useMemo(() => {
        const map = new Map<string, Player>();
        for (const p of players) {
            map.set(p._id, p);
        }
        return map;
    }, [players]);

    const achievementMap = useMemo(() => {
        const map = new Map<string, Achievement>();
        for (const a of achievements) {
            map.set(a._id, a);
        }
        return map;
    }, [achievements]);

    const galleryMap = useMemo(() => {
        const map = new Map<string, GalleryItem>();
        for (const g of galleryItems) {
            map.set(g._id, g);
        }
        return map;
    }, [galleryItems]);

    // -------------------------------------------------------------------------
    // Initial Load: Fetch Catalogs & Tournament Editions
    // -------------------------------------------------------------------------
    const fetchCatalogs = useCallback(async (force = false) => {
        try {
            const [tourList, teamList, playerList, achList, galList] = await Promise.allSettled([
                getCachedTournaments(force),
                getCachedTeams(force),
                getCachedPlayers(force),
                getCachedAchievements(force),
                getCachedGalleryItems(force),
            ]);

            if (tourList.status === "fulfilled") setTournaments(tourList.value);
            if (teamList.status === "fulfilled") setTeams(teamList.value);
            if (playerList.status === "fulfilled") setPlayers(playerList.value);
            if (achList.status === "fulfilled") setAchievements(achList.value);
            if (galList.status === "fulfilled") setGalleryItems(galList.value);
        } catch {
            // Catalogs handled gracefully
        }
    }, []);

    const fetchEditionsList = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const query: {
                page: number;
                limit: number;
                tournament?: string;
                sort: "year";
                order: "desc";
            } = {
                page,
                limit,
                sort: "year",
                order: "desc",
            };

            if (tournamentFilter !== "all") {
                query.tournament = tournamentFilter;
            }

            const res = await getTournamentEditions(query);
            setEditions(res.data);
            setTotalRecords(res.meta?.total ?? res.data.length);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load tournament editions directory";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, limit, tournamentFilter]);

    useEffect(() => {
        fetchCatalogs();
    }, [fetchCatalogs]);

    useEffect(() => {
        fetchEditionsList();
    }, [fetchEditionsList]);

    // -------------------------------------------------------------------------
    // Filtered Editions (Client-side Search, Era, and Placement)
    // -------------------------------------------------------------------------
    const filteredEditions = useMemo(() => {
        return editions.filter((ed) => {
            const tour = tournamentMap.get(ed.tournament);
            const tourName = tour?.name?.toLowerCase() || "";
            const tourType = tour?.type?.toLowerCase() || "";
            const editionText = ed.edition?.toLowerCase() || "";
            const host = ed.hostInstitute?.toLowerCase() || "";
            const cap = ed.captain ? playerMap.get(ed.captain)?.name?.toLowerCase() || "" : "";
            const query = searchQuery.trim().toLowerCase();

            const matchesSearch =
                !query ||
                editionText.includes(query) ||
                tourName.includes(query) ||
                tourType.includes(query) ||
                host.includes(query) ||
                cap.includes(query) ||
                String(ed.year).includes(query);

            if (!matchesSearch) return false;

            // Era Filter
            if (eraFilter === "modern" && ed.year < 2010) return false;
            if (eraFilter === "transition" && (ed.year < 1990 || ed.year > 2009)) return false;
            if (eraFilter === "foundational" && ed.year > 1989) return false;

            // Placement Filter
            if (placementFilter === "gold" && ed.finalPosition !== 1) return false;
            if (placementFilter === "silver" && ed.finalPosition !== 2) return false;
            if (placementFilter === "bronze" && ed.finalPosition !== 3) return false;
            if (placementFilter === "other" && (!ed.finalPosition || ed.finalPosition <= 3)) return false;

            return true;
        });
    }, [editions, searchQuery, eraFilter, placementFilter, tournamentMap, playerMap]);

    // -------------------------------------------------------------------------
    // Selection & Mode Switching Handlers
    // -------------------------------------------------------------------------
    const selectEditionForEdit = (edition: TournamentEdition) => {
        setSelectedEdition(edition);
        setFormSuccess(null);
        setFormError(null);
        setMobileTab("form");

        reset({
            tournament: edition.tournament || "",
            year: edition.year,
            edition: edition.edition || "",
            team: edition.team || "",
            hostInstitute: edition.hostInstitute || "",
            participatingTeams: edition.participatingTeams || [],
            finalPosition: edition.finalPosition ?? undefined,
            captain: edition.captain || "",
            viceCaptain: edition.viceCaptain || "",
            achievements: edition.achievements || [],
            awards: edition.awards || [],
            photos: edition.photos || [],
        });
    };

    const switchModeToCreate = () => {
        setSelectedEdition(null);
        setFormSuccess(null);
        setFormError(null);
        setMobileTab("form");

        const defaultTournament = tournaments[0]?._id || "";
        const defaultTeam = teams[0]?._id || "";

        reset({
            tournament: defaultTournament,
            year: new Date().getFullYear(),
            edition: "",
            team: defaultTeam,
            hostInstitute: "",
            participatingTeams: [],
            finalPosition: undefined,
            captain: "",
            viceCaptain: "",
            achievements: [],
            awards: [],
            photos: [],
        });
    };

    const handleReset = () => {
        setFormSuccess(null);
        setFormError(null);
        if (selectedEdition) {
            selectEditionForEdit(selectedEdition);
        } else {
            switchModeToCreate();
        }
    };

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: TournamentEditionFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            // Strictly match backend validator constraints
            const payload: TournamentEditionCreateInput = {
                tournament: formData.tournament,
                year: Number(formData.year),
                edition: formData.edition.trim(),
                team: formData.team,
            };

            if (formData.hostInstitute?.trim()) {
                payload.hostInstitute = formData.hostInstitute.trim();
            }

            if (formData.participatingTeams && formData.participatingTeams.length > 0) {
                payload.participatingTeams = formData.participatingTeams;
            }

            if (formData.finalPosition !== undefined && !Number.isNaN(Number(formData.finalPosition))) {
                payload.finalPosition = Number(formData.finalPosition);
            }

            if (formData.captain && /^[a-fA-F0-9]{24}$/.test(formData.captain)) {
                payload.captain = formData.captain;
            }

            if (formData.viceCaptain && /^[a-fA-F0-9]{24}$/.test(formData.viceCaptain)) {
                payload.viceCaptain = formData.viceCaptain;
            }

            if (formData.achievements && formData.achievements.length > 0) {
                payload.achievements = formData.achievements;
            }

            if (formData.awards && formData.awards.length > 0) {
                payload.awards = formData.awards;
            }

            if (formData.photos && formData.photos.length > 0) {
                payload.photos = formData.photos;
            }

            if (selectedEdition) {
                // UPDATE RECORD
                const updated = await updateTournamentEdition(selectedEdition._id, payload);
                setFormSuccess(
                    `Edition dossier "${updated.data.edition}" (${updated.data.year}) committed successfully.`,
                );
                setSelectedEdition(updated.data);
                invalidateCatalog("tournamentEditions");
                fetchEditionsList();
            } else {
                // CREATE RECORD
                const created = await createTournamentEdition(payload);
                setFormSuccess(`New tournament edition "${created.data.edition}" created successfully.`);
                setSelectedEdition(created.data);
                invalidateCatalog("tournamentEditions");
                fetchEditionsList();
            }
        } catch (err: unknown) {
            let errorMsg = "An unexpected error occurred while saving tournament edition.";
            if (err && typeof err === "object" && "response" in err) {
                const axiosErr = err as {
                    response?: {
                        status: number;
                        data?: {
                            message?: string;
                            errors?: Array<{ message: string }>;
                            error?: { issues?: Array<{ message: string }> };
                        };
                    };
                };
                if (axiosErr.response?.status === 409) {
                    errorMsg = "A tournament edition for this tournament, year, and edition title already exists.";
                } else if (axiosErr.response?.data?.message) {
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
    const confirmDeleteEdition = async () => {
        if (!editionToDelete) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteTournamentEdition(editionToDelete._id);
            setEditionToDelete(null);

            if (selectedEdition?._id === editionToDelete._id) {
                switchModeToCreate();
            }

            invalidateCatalog("tournamentEditions");
            fetchEditionsList();
        } catch (err: unknown) {
            let errorMsg = "Failed to delete tournament edition.";
            if (err && typeof err === "object" && "response" in err) {
                const axiosErr = err as {
                    response?: {
                        status: number;
                        data?: { message?: string };
                    };
                };
                if (axiosErr.response?.status === 409) {
                    errorMsg =
                        axiosErr.response.data?.message ||
                        "Cannot delete tournament edition because it has associated match fixtures recorded in the archive.";
                } else if (axiosErr.response?.data?.message) {
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
    // Multi-Select Helpers
    // -------------------------------------------------------------------------
    const handleAddParticipatingTeam = (teamName: string) => {
        const trimmed = teamName.trim();
        if (!trimmed) return;
        if (watchedParticipatingTeams.includes(trimmed)) return;
        setValue("participatingTeams", [...watchedParticipatingTeams, trimmed]);
        setCustomTeamInput("");
    };

    const handleRemoveParticipatingTeam = (teamName: string) => {
        setValue(
            "participatingTeams",
            watchedParticipatingTeams.filter((t) => t !== teamName),
        );
    };

    const handleToggleAchievement = (achId: string) => {
        if (watchedAchievements.includes(achId)) {
            setValue(
                "achievements",
                watchedAchievements.filter((id) => id !== achId),
            );
        } else {
            setValue("achievements", [...watchedAchievements, achId]);
        }
    };

    const handleTogglePhoto = (photoId: string) => {
        if (watchedPhotos.includes(photoId)) {
            setValue(
                "photos",
                watchedPhotos.filter((id) => id !== photoId),
            );
        } else {
            setValue("photos", [...watchedPhotos, photoId]);
        }
    };

    // -------------------------------------------------------------------------
    // Placement Badge Renderer
    // -------------------------------------------------------------------------
    const renderPlacementBadge = (pos?: number) => {
        if (!pos) {
            return <span className="text-[#9C968D] text-xs italic">-</span>;
        }
        if (pos === 1) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#9A7B38]/15 text-[#73581B] border border-[#9A7B38]/30 font-medium text-xs">
                    <Trophy className="w-3.5 h-3.5 text-[#9A7B38]" />
                    <span>Gold (1st)</span>
                </span>
            );
        }
        if (pos === 2) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 border border-slate-300 font-medium text-xs">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Silver (2nd)</span>
                </span>
            );
        }
        if (pos === 3) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-800 border border-amber-700/25 font-medium text-xs">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>Bronze (3rd)</span>
                </span>
            );
        }
        if (pos === 4) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECE8E1] text-[#6B665F] border border-[rgba(26,26,26,0.12)] text-xs">
                    <span>Semi-Finalist</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ECE8E1] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] text-xs">
                <span>Position #{pos}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#FCF9F2] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#3d030b] selection:text-white">
            {/* Standardized Admin Page Header */}
            <header className="px-6 md:px-8 py-6 border-b border-[rgba(26,26,26,0.08)] bg-[#FCF9F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-tight">
                        Tournament Editions &amp; Campaigns
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1">
                        Manage yearly tournament editions and results.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            invalidateCatalog("tournamentEditions");
                            invalidateCatalog("tournaments");
                            invalidateCatalog("teams");
                            invalidateCatalog("players");
                            invalidateCatalog("achievements");
                            invalidateCatalog("gallery");
                            void fetchEditionsList();
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
                        <span>Add New Edition</span>
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
                    Editions Ledger ({filteredEditions.length})
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
                    {selectedEdition ? "Edit Dossier" : "New Edition Dossier"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Grid */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Tournament Editions Directory & Ledger (7/12) */}
                    {/* ========================================================= */}
                    <div
                        className={`col-span-12 xl:col-span-7 space-y-4 ${
                            mobileTab === "form" ? "hidden xl:block" : "block"
                        }`}
                    >
                        {/* Filter and Search Console */}
                        <div className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search editions by tournament, year, host, or captain..."
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
                            </div>

                            {/* Tournament Filter Pills matching Stitch */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-[rgba(26,26,26,0.06)] overflow-x-auto select-none pb-0.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setTournamentFilter("all")}
                                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                                        tournamentFilter === "all"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                    }`}
                                >
                                    All ({totalRecords})
                                </button>
                                {tournaments.map((t) => (
                                    <button
                                        key={t._id}
                                        type="button"
                                        onClick={() => setTournamentFilter(t._id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                                            tournamentFilter === t._id
                                                ? "bg-[#3d030b] text-white"
                                                : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                        }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>

                            {/* Secondary Filters Row: Era & Placements */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B665F] pt-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B665F]">
                                        Era Bracket:
                                    </span>
                                    <AdminSelect
                                        value={eraFilter}
                                        onChange={(val) => setEraFilter(val)}
                                        options={ERA_FILTER_OPTIONS}
                                        placeholder="All Eras"
                                        className="w-[180px]"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B665F]">
                                        Placement:
                                    </span>
                                    <AdminSelect
                                        value={placementFilter}
                                        onChange={(val) => setPlacementFilter(val)}
                                        options={PLACEMENT_FILTER_OPTIONS}
                                        placeholder="All Placements"
                                        className="w-[180px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Archival Table Ledger */}
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
                                        Loading editions ledger...
                                    </p>
                                </div>
                            ) : filteredEditions.length === 0 ? (
                                <div className="py-16 text-center text-[#6B665F] space-y-2 bg-[#FCF9F2]">
                                    <Shield className="w-8 h-8 mx-auto text-[#9C968D]" />
                                    <p className="text-sm font-medium text-[#1A1A1A]">No tournament editions found</p>
                                    <p className="text-xs text-[#6B665F]">
                                        {searchQuery || eraFilter !== "all" || placementFilter !== "all"
                                            ? "Try clearing your filters or search terms."
                                            : "No tournament campaign records exist yet in the archive."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={switchModeToCreate}
                                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3d030b] text-white text-xs font-semibold hover:bg-[#5a181e] cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add First Edition</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider">
                                                <th className="py-3 px-3 w-8">#</th>
                                                <th className="py-3 px-3">Tournament &amp; Circuit</th>
                                                <th className="py-3 px-3">Edition &amp; Year</th>
                                                <th className="py-3 px-3">Host Venue</th>
                                                <th className="py-3 px-3">Fielded Squad</th>
                                                <th className="py-3 px-3">Placement</th>
                                                <th className="py-3 px-3">Captain</th>
                                                <th className="py-3 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgba(26,26,26,0.06)] bg-[#FCF9F2]">
                                            {filteredEditions.map((ed, idx) => {
                                                const tour = tournamentMap.get(ed.tournament);
                                                const teamRecord = teamMap.get(ed.team);
                                                const capRecord = ed.captain ? playerMap.get(ed.captain) : undefined;
                                                const isSelected = selectedEdition?._id === ed._id;

                                                return (
                                                    <tr
                                                        key={ed._id}
                                                        onClick={() => selectEditionForEdit(ed)}
                                                        className={`hover:bg-[#E2DDD4]/60 transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-[#E2DDD4]/80 border-l-4 border-l-[#3d030b]"
                                                                : ""
                                                        }`}
                                                    >
                                                        <td className="py-3 px-3 font-mono text-[11px] text-[#9C968D]">
                                                            {String(idx + 1).padStart(2, "0")}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-semibold text-[#1A1A1A]">
                                                                {tour?.name || "Tournament"}
                                                            </div>
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-secondary/15 text-[#765a1a] uppercase font-semibold">
                                                                {tour?.type || "Sanctioned Circuit"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-semibold text-[#1A1A1A]">
                                                                {ed.edition}
                                                            </div>
                                                            <div className="text-[11px] text-[#6B665F] font-mono">
                                                                {ed.year}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-[#6B665F]">
                                                            {ed.hostInstitute || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 text-[#1A1A1A] font-medium">
                                                            {teamRecord
                                                                ? `Varsity Squad ${teamRecord.year}`
                                                                : `Squad ${ed.year}`}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            {renderPlacementBadge(ed.finalPosition)}
                                                        </td>
                                                        <td className="py-3 px-3 text-[#6B665F]">
                                                            {capRecord ? (
                                                                <span>
                                                                    {capRecord.name}{" "}
                                                                    {capRecord.jerseyNumber !== undefined && (
                                                                        <span className="text-[#9C968D]">
                                                                            (#{capRecord.jerseyNumber})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[#9C968D] italic">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <div
                                                                className="flex items-center justify-end gap-1 text-[#6B665F]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectEditionForEdit(ed)}
                                                                    className="p-1.5 hover:text-[#3d030b] hover:bg-[#ECE8E1] rounded transition-colors cursor-pointer"
                                                                    title="Edit Edition Dossier"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditionToDelete(ed);
                                                                        setDeleteError(null);
                                                                    }}
                                                                    className="p-1.5 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                                    title="Delete Edition Record"
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
                                    Showing {filteredEditions.length} of {totalRecords} verified editions
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
                    {/* RIGHT PANEL: Persistent Edition Dossier Form (5/12)        */}
                    {/* ========================================================= */}
                    <div
                        className={`col-span-12 xl:col-span-5 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] ${
                            mobileTab === "list" ? "hidden xl:block" : "block"
                        }`}
                    >
                        {selectedEdition && (
                            <div className="p-4 bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2DDD4] text-[#3d030b] border border-[#3d030b]/20 tracking-wider uppercase font-mono">
                                    EDITING EDITION — {selectedEdition.edition.toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Dossier Subtitle Banner */}
                        <div className="p-4 bg-[#FCF9F2] border-b border-[rgba(26,26,26,0.06)]">
                            <h2 className="text-lg font-serif text-[#1A1A1A] tracking-tight">Edition Dossier</h2>
                            <p className="text-xs text-[#6B665F] mt-0.5">
                                Record sanctioned edition metadata, fielded varsity cohort, appointed captains, and
                                final campaign honors.
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

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-6">
                            {/* ------------------------------------------------------------- */}
                            {/* SECTION 01: BASIC EDITION INFORMATION                         */}
                            {/* ------------------------------------------------------------- */}
                            <div>
                                <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,26,0.08)] mb-3">
                                    <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold">
                                        01. Basic Edition Information
                                    </span>
                                    <span className="text-[11px] text-[#9C968D]">Mandatory Record</span>
                                </div>

                                <div className="space-y-3.5">
                                    {/* Tournament Circuit Searchable Selector */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Tournament Circuit / Host Championship *
                                        </label>
                                        <AdminSelect
                                            value={watchedTournament || ""}
                                            onChange={(val) => setValue("tournament", val, { shouldValidate: true })}
                                            options={tournamentOptions}
                                            placeholder="Select Tournament Circuit..."
                                            searchable={true}
                                            error={Boolean(errors.tournament)}
                                        />
                                        {errors.tournament && (
                                            <p className="text-[11px] text-red-600 mt-1">{errors.tournament.message}</p>
                                        )}
                                    </div>

                                    {/* Edition Name & Year Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                                Edition Name / Number *
                                            </label>
                                            <input
                                                type="text"
                                                {...register("edition")}
                                                placeholder="e.g. 54th Inter-IIT Sports Meet"
                                                className="w-full bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                            />
                                            {errors.edition && (
                                                <p className="text-[11px] text-red-600 mt-1">
                                                    {errors.edition.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                                Year / Calendar *
                                            </label>
                                            <input
                                                type="number"
                                                {...register("year")}
                                                placeholder="e.g. 2026"
                                                className="w-full bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                            />
                                            {errors.year && (
                                                <p className="text-[11px] text-red-600 mt-1">{errors.year.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* IIT (BHU) Team Cohort Searchable Selector */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            IIT (BHU) Team Cohort *
                                        </label>
                                        <AdminSelect
                                            value={watchedTeam || ""}
                                            onChange={(val) => setValue("team", val, { shouldValidate: true })}
                                            options={teamOptions}
                                            placeholder="Select Fielded Varsity Team..."
                                            searchable={true}
                                            error={Boolean(errors.team)}
                                        />
                                        {errors.team && (
                                            <p className="text-[11px] text-red-600 mt-1">{errors.team.message}</p>
                                        )}
                                    </div>

                                    {/* Host Venue & Final Placement */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                                Host Institute / Venue
                                            </label>
                                            <input
                                                type="text"
                                                {...register("hostInstitute")}
                                                placeholder="e.g. IIT Kharagpur"
                                                className="w-full bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                                Final Position / Ranking
                                            </label>
                                            <AdminSelect
                                                value={watchedFinalPosition ? String(watchedFinalPosition) : ""}
                                                onChange={(val) =>
                                                    setValue("finalPosition", val ? Number(val) : undefined, {
                                                        shouldValidate: true,
                                                    })
                                                }
                                                options={PLACEMENT_OPTIONS.map((opt) => ({
                                                    value: String(opt.value),
                                                    label: opt.label,
                                                }))}
                                                placeholder="Unspecified / In Progress"
                                                allowClear={true}
                                                clearLabel="Unspecified / In Progress"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ------------------------------------------------------------- */}
                            {/* SECTION 02: SQUAD LEADERSHIP & APPOINTMENTS                   */}
                            {/* ------------------------------------------------------------- */}
                            <div>
                                <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,26,0.08)] mb-3">
                                    <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold">
                                        02. Squad Leadership &amp; Appointments
                                    </span>
                                    <span className="text-[11px] text-[#9C968D]">Fielded Roster</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Fielded Captain Searchable Selector */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Fielded Captain
                                        </label>
                                        <AdminSelect
                                            value={watchedCaptain || ""}
                                            onChange={(val) => setValue("captain", val, { shouldValidate: true })}
                                            options={captainOptions}
                                            placeholder="None / Not Appointed"
                                            searchable={true}
                                            allowClear={true}
                                            clearLabel="None / Not Appointed"
                                        />
                                    </div>

                                    {/* Vice-Captain Searchable Selector */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Vice-Captain
                                        </label>
                                        <AdminSelect
                                            value={watchedViceCaptain || ""}
                                            onChange={(val) => setValue("viceCaptain", val, { shouldValidate: true })}
                                            options={captainOptions}
                                            placeholder="None / Not Appointed"
                                            searchable={true}
                                            allowClear={true}
                                            clearLabel="None / Not Appointed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ------------------------------------------------------------- */}
                            {/* SECTION 03: PARTICIPATION & LINKED RECORDS                    */}
                            {/* ------------------------------------------------------------- */}
                            <div>
                                <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,26,0.08)] mb-3">
                                    <span className="text-xs uppercase tracking-wider text-[#3d030b] font-bold">
                                        03. Participation &amp; Linked Records
                                    </span>
                                    <span className="text-[11px] text-[#9C968D]">Heritage Relational</span>
                                </div>

                                <div className="space-y-4">
                                    {/* Participating Teams Multi-Select Chips */}
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-wider text-[#6B665F] mb-1 font-semibold">
                                            Participating Teams ({watchedParticipatingTeams.length})
                                        </label>

                                        {/* Selected Team Tags */}
                                        <div className="p-2.5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded min-h-[42px] flex flex-wrap gap-1.5 items-center mb-2">
                                            {watchedParticipatingTeams.length === 0 ? (
                                                <span className="text-xs text-[#9C968D] italic">
                                                    No participating institutions selected. Pick from suggestions below
                                                    or type a custom institute name.
                                                </span>
                                            ) : (
                                                watchedParticipatingTeams.map((tName) => (
                                                    <span
                                                        key={tName}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ECE8E1] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] text-xs"
                                                    >
                                                        <span>{tName}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveParticipatingTeam(tName)}
                                                            className="text-[#9C968D] hover:text-red-700 cursor-pointer"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        {/* Custom Input & Add button */}
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={customTeamInput}
                                                onChange={(e) => setCustomTeamInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddParticipatingTeam(customTeamInput);
                                                    }
                                                }}
                                                placeholder="Add custom participating institution/team..."
                                                className="flex-1 bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddParticipatingTeam(customTeamInput)}
                                                disabled={!customTeamInput.trim()}
                                                className="px-3 py-1.5 bg-[#FCF9F2] hover:bg-[#ECE8E1] border border-[rgba(26,26,26,0.15)] rounded text-xs font-medium text-[#1A1A1A] disabled:opacity-40 cursor-pointer"
                                            >
                                                + Add Team
                                            </button>
                                        </div>

                                        {/* Quick Pick Popular Sister Teams */}
                                        <div className="flex flex-wrap items-center gap-1 pt-1">
                                            <span className="text-[10px] uppercase tracking-wider text-[#6B665F] mr-1">
                                                Quick suggestions:
                                            </span>
                                            {POPULAR_PARTICIPATING_TEAMS.slice(0, 8).map((pTeam) => {
                                                const isAdded = watchedParticipatingTeams.includes(pTeam);
                                                return (
                                                    <button
                                                        key={pTeam}
                                                        type="button"
                                                        onClick={() =>
                                                            isAdded
                                                                ? handleRemoveParticipatingTeam(pTeam)
                                                                : handleAddParticipatingTeam(pTeam)
                                                        }
                                                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                                                            isAdded
                                                                ? "bg-[#3d030b] text-white border-[#3d030b]"
                                                                : "bg-[#FCF9F2] hover:bg-[#ECE8E1] text-[#6B665F] border-[rgba(26,26,26,0.1)]"
                                                        }`}
                                                    >
                                                        {isAdded ? `✓ ${pTeam}` : `+ ${pTeam}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Linked Achievements Multi-Select */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[11px] uppercase tracking-wider text-[#6B665F] font-semibold">
                                                Linked Trophy / Institutional Achievements ({watchedAchievements.length}
                                                )
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowAchievementPicker(true)}
                                                className="text-[11px] text-[#3d030b] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Link Achievement</span>
                                            </button>
                                        </div>

                                        <div className="p-2.5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded space-y-2">
                                            {watchedAchievements.length === 0 ? (
                                                <div className="py-2 text-center text-xs text-[#9C968D] italic">
                                                    No achievements linked to this tournament campaign yet.
                                                </div>
                                            ) : (
                                                watchedAchievements.map((achId) => {
                                                    const ach = achievementMap.get(achId);
                                                    return (
                                                        <div
                                                            key={achId}
                                                            className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-[rgba(26,26,26,0.08)] rounded"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Trophy className="w-4 h-4 text-[#73581B] shrink-0" />
                                                                <div className="truncate">
                                                                    <span className="text-xs font-medium text-[#1A1A1A]">
                                                                        {ach?.title || "Archival Trophy"}
                                                                    </span>
                                                                    {ach?.year && (
                                                                        <span className="text-[11px] text-[#6B665F] ml-1.5 font-mono">
                                                                            ({ach.year})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAchievement(achId)}
                                                                className="text-[#9C968D] hover:text-red-700 cursor-pointer p-1"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setShowAchievementPicker(true)}
                                                className="w-full py-1.5 border border-dashed border-[rgba(26,26,26,0.2)] rounded text-xs text-[#6B665F] hover:text-[#3d030b] hover:border-[#3d030b] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Link Another Achievement</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Linked Archival Photo Plates Multi-Select */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[11px] uppercase tracking-wider text-[#6B665F] font-semibold">
                                                Archival Photo Plates / Plates Mount ({watchedPhotos.length})
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowGalleryPicker(true)}
                                                className="text-[11px] text-[#3d030b] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Link Photo Plate</span>
                                            </button>
                                        </div>

                                        <div className="p-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded space-y-2.5">
                                            {watchedPhotos.length === 0 ? (
                                                <div className="py-2 text-center text-xs text-[#9C968D] italic">
                                                    No gallery photos linked to this edition.
                                                </div>
                                            ) : (
                                                watchedPhotos.map((photoId) => {
                                                    const item = galleryMap.get(photoId);
                                                    return (
                                                        <div
                                                            key={photoId}
                                                            className="flex items-center justify-between gap-3 p-2 bg-white border border-[rgba(26,26,26,0.08)] rounded"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-12 h-12 bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] rounded overflow-hidden shrink-0">
                                                                    {item?.imageUrl ? (
                                                                        <img
                                                                            src={item.imageUrl}
                                                                            alt={item.caption || "Archival photo plate"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[#9C968D]">
                                                                            <ImageIcon className="w-4 h-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="truncate">
                                                                    <div className="text-xs font-medium text-[#1A1A1A] truncate">
                                                                        {item?.caption || "Untitled Photo Plate"}
                                                                    </div>
                                                                    <div className="text-[10px] text-[#9C968D]">
                                                                        {item?.category || "Archival Media"} •{" "}
                                                                        {item?.year
                                                                            ? item.year
                                                                            : item?.createdAt
                                                                              ? new Date(item.createdAt).getFullYear()
                                                                              : "Vintage"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleTogglePhoto(photoId)}
                                                                className="text-[#9C968D] hover:text-red-700 cursor-pointer p-1"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setShowGalleryPicker(true)}
                                                className="w-full py-1.5 border border-dashed border-[rgba(26,26,26,0.2)] rounded text-xs text-[#6B665F] hover:text-[#3d030b] hover:border-[#3d030b] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Link Archival Photo Plate</span>
                                            </button>
                                        </div>
                                    </div>
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
                                    <span>{selectedEdition ? "Save Changes" : "Commit Record"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* ----------------------------------------------------------------- */}
            {/* LINK ACHIEVEMENT PICKER MODAL                                     */}
            {/* ----------------------------------------------------------------- */}
            {showAchievementPicker && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-4 bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#73581B]" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                                    Link Institutional Achievement
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAchievementPicker(false)}
                                className="text-[#9C968D] hover:text-[#1A1A1A] cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={achievementSearch}
                                    onChange={(e) => setAchievementSearch(e.target.value)}
                                    placeholder="Search trophies by title or tournament..."
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(26,26,26,0.12)] rounded text-xs focus:outline-none focus:border-[#3d030b]"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-[rgba(26,26,26,0.04)]">
                                {achievements.length === 0 ? (
                                    <p className="text-xs text-[#6B665F] py-4 text-center">
                                        No achievements found in archive.
                                    </p>
                                ) : (
                                    achievements
                                        .filter(
                                            (a) =>
                                                a.title.toLowerCase().includes(achievementSearch.toLowerCase()) ||
                                                (a.tournament &&
                                                    a.tournament
                                                        .toLowerCase()
                                                        .includes(achievementSearch.toLowerCase())),
                                        )
                                        .map((a) => {
                                            const isLinked = watchedAchievements.includes(a._id);
                                            return (
                                                <div
                                                    key={a._id}
                                                    onClick={() => handleToggleAchievement(a._id)}
                                                    className={`pt-1.5 p-2 rounded text-xs flex items-center justify-between cursor-pointer hover:bg-[#ECE8E1] transition-colors ${
                                                        isLinked
                                                            ? "bg-[#ECE8E1] font-semibold text-[#3d030b]"
                                                            : "text-[#1A1A1A]"
                                                    }`}
                                                >
                                                    <div>
                                                        <div>{a.title}</div>
                                                        <div className="text-[10px] text-[#6B665F]">
                                                            {a.year} • {a.type}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded ${
                                                            isLinked
                                                                ? "bg-[#3d030b] text-white"
                                                                : "bg-white border border-[rgba(26,26,26,0.1)] text-[#6B665F]"
                                                        }`}
                                                    >
                                                        {isLinked ? "Linked ✓" : "+ Link"}
                                                    </span>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-[#EBE8E1] border-t border-[rgba(26,26,26,0.08)] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowAchievementPicker(false)}
                                className="px-4 py-1.5 bg-[#3d030b] text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-[#5a181e]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* LINK GALLERY PLATE PICKER MODAL                                   */}
            {/* ----------------------------------------------------------------- */}
            {showGalleryPicker && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-4 bg-[#EBE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-[#3d030b]" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                                    Link Archival Photo Plate
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGalleryPicker(false)}
                                className="text-[#9C968D] hover:text-[#1A1A1A] cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={gallerySearch}
                                    onChange={(e) => setGallerySearch(e.target.value)}
                                    placeholder="Search gallery plates by caption..."
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(26,26,26,0.12)] rounded text-xs focus:outline-none focus:border-[#3d030b]"
                                />
                            </div>

                            <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
                                {galleryItems.length === 0 ? (
                                    <p className="col-span-2 text-xs text-[#6B665F] py-4 text-center">
                                        No gallery plates in archive.
                                    </p>
                                ) : (
                                    galleryItems
                                        .filter(
                                            (g) =>
                                                (g.caption || "").toLowerCase().includes(gallerySearch.toLowerCase()) ||
                                                (g.category || "").toLowerCase().includes(gallerySearch.toLowerCase()),
                                        )
                                        .map((g) => {
                                            const isLinked = watchedPhotos.includes(g._id);
                                            return (
                                                <div
                                                    key={g._id}
                                                    onClick={() => handleTogglePhoto(g._id)}
                                                    className={`border rounded p-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                                                        isLinked
                                                            ? "border-[#3d030b] bg-[#3d030b]/5 ring-2 ring-[#3d030b]"
                                                            : "border-[rgba(26,26,26,0.1)] bg-white hover:border-[#3d030b]"
                                                    }`}
                                                >
                                                    <div className="w-full h-24 bg-[#ECE8E1] rounded overflow-hidden mb-1.5">
                                                        <img
                                                            src={g.imageUrl}
                                                            alt={g.caption || "Archival Plate"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-medium text-[#1A1A1A] line-clamp-1">
                                                            {g.caption || "Untitled"}
                                                        </p>
                                                        <p className="text-[9px] text-[#6B665F] uppercase tracking-wider">
                                                            {g.category}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                                        <span
                                                            className={
                                                                isLinked ? "text-[#3d030b] font-bold" : "text-[#9C968D]"
                                                            }
                                                        >
                                                            {isLinked ? "Selected ✓" : "Select"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-[#EBE8E1] border-t border-[rgba(26,26,26,0.08)] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowGalleryPicker(false)}
                                className="px-4 py-1.5 bg-[#3d030b] text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-[#5a181e]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* DESTRUCTIVE DELETE CONFIRMATION MODAL                             */}
            {/* ----------------------------------------------------------------- */}
            {editionToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[#FCF9F2] border border-red-200 rounded-lg max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-700">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#1A1A1A]">
                                    Permanently Delete Edition Dossier?
                                </h3>
                                <p className="text-xs text-[#6B665F] leading-relaxed">
                                    You are about to purge{" "}
                                    <span className="font-semibold text-[#1A1A1A]">
                                        "{editionToDelete.edition}" ({editionToDelete.year})
                                    </span>{" "}
                                    from the institutional archives.
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-50/70 border border-red-100 rounded text-xs text-red-800 leading-relaxed">
                            <span className="font-semibold">Notice:</span> This action is permanent and cannot be
                            undone. If any match fixtures are associated with this tournament edition in the database,
                            deletion will be blocked to maintain archive referential integrity.
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
                                onClick={() => setEditionToDelete(null)}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.2)] text-xs font-medium text-[#1A1A1A] hover:bg-[#ECE8E1] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDeleteEdition}
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
