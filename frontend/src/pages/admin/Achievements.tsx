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
    Image as ImageIcon,
    Users,
    User,
    Award,
    Medal,
    Star,
    Shield,
} from "lucide-react";
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from "@/api/achievements";
import {
    getCachedTournaments,
    getCachedPlayers,
    getCachedTeams,
    getCachedGalleryItems,
    invalidateCatalog,
} from "@/lib/catalogCache";
import type { Achievement, AchievementType, RecipientType, AchievementCreateInput } from "@/types/achievement";
import type { Tournament } from "@/types/tournament";
import type { Player } from "@/types/player";
import type { Team } from "@/types/team";
import type { GalleryItem } from "@/types/gallery";
import { achievementFormSchema, type AchievementFormData, ACHIEVEMENT_TYPES } from "@/schemas/achievementSchema";
import AdminSelect from "@/components/admin/AdminSelect";

const ERA_FILTER_OPTIONS = [
    { value: "all", label: "All Eras (1965 – 2026)" },
    { value: "2020s", label: "2020 – 2026" },
    { value: "2010s", label: "2010 – 2019" },
    { value: "1990s", label: "1990 – 2009" },
    { value: "pre-1990", label: "Pre-1990 Era" },
];

const RECIPIENT_FILTER_OPTIONS = [
    { value: "all", label: "All Types" },
    { value: "Team", label: "Varsity Squad / Team" },
    { value: "Player", label: "Individual Player" },
];

const LIMIT_OPTIONS = [
    { value: "10", label: "10 / page" },
    { value: "20", label: "20 / page" },
    { value: "50", label: "50 / page" },
];

const ACHIEVEMENT_TYPE_FORM_OPTIONS = [
    { value: "Championship", label: "Championship Trophy" },
    { value: "Medal", label: "Medal (Gold / Silver / Bronze)" },
    { value: "Award", label: "Award / Commendation" },
    { value: "Major Victory", label: "Major Victory / Milestone Win" },
    { value: "Individual Achievement", label: "Individual Honor / Distinction" },
];

export default function AdminAchievements() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [eraFilter, setEraFilter] = useState<string>("all");
    const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [totalRecords, setTotalRecords] = useState<number>(0);

    // -------------------------------------------------------------------------
    // Relational Catalogues (Tournaments, Players, Teams, Gallery)
    // -------------------------------------------------------------------------
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Recipient Entity Picker Dropdown open/close state
    const [isChangingRecipient, setIsChangingRecipient] = useState<boolean>(false);

    // Associated Media Reference (from Gallery)
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
    const [openGalleryModal, setOpenGalleryModal] = useState<boolean>(false);
    const [gallerySearch, setGallerySearch] = useState<string>("");

    // Destructive Delete State
    const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Mobile View Toggle
    const [mobileTab, setMobileTab] = useState<"ledger" | "form">("ledger");

    // -------------------------------------------------------------------------
    // React Hook Form Configuration
    // -------------------------------------------------------------------------
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AchievementFormData>({
        resolver: zodResolver(achievementFormSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "Championship",
            year: new Date().getFullYear(),
            tournament: "",
            recipientType: "Team",
            recipient: "",
        },
    });

    const watchedRecipientType = watch("recipientType");
    const watchedRecipient = watch("recipient");
    const watchedType = watch("type");
    const watchedTournament = watch("tournament");

    // Fast Lookup Dictionaries
    const tournamentsMap = useMemo(() => new Map(tournaments.map((t) => [t._id, t])), [tournaments]);
    const playersMap = useMemo(() => new Map(players.map((p) => [p._id, p])), [players]);
    const teamsMap = useMemo(() => new Map(teams.map((t) => [t._id, t])), [teams]);

    const tournamentSelectOptions = useMemo(
        () => [
            { value: "", label: "None / Non-Tournament Distinction" },
            ...tournaments.map((t) => ({
                value: t._id,
                label: `${t.name} (${t.type || "Varsity Circuit"})`,
            })),
        ],
        [tournaments],
    );

    const recipientEntityOptions = useMemo(() => {
        if (watchedRecipientType === "Player") {
            return players.map((player) => ({
                value: player._id,
                label: player.name,
                sublabel: `${player.playingPosition || "Squad Member"}${player.jerseyNumber ? ` • #${player.jerseyNumber}` : ""}`,
            }));
        } else {
            return teams.map((team) => {
                const capt = team.captain ? playersMap.get(team.captain)?.name : null;
                return {
                    value: team._id,
                    label: `Men's Varsity Team (${team.year})`,
                    sublabel: `${capt ? `Capt. ${capt} • ` : ""}${team.players ? `${team.players.length} players` : ""}`,
                };
            });
        }
    }, [watchedRecipientType, players, teams, playersMap]);

    // -------------------------------------------------------------------------
    // Fetch Relational Catalogues
    // -------------------------------------------------------------------------
    const loadCatalogues = useCallback(async (force = false) => {
        try {
            const [tournamentsRes, playersRes, teamsRes, galleryRes] = await Promise.allSettled([
                getCachedTournaments(force),
                getCachedPlayers(force),
                getCachedTeams(force),
                getCachedGalleryItems(force),
            ]);

            if (tournamentsRes.status === "fulfilled") setTournaments(tournamentsRes.value);
            if (playersRes.status === "fulfilled") setPlayers(playersRes.value);
            if (teamsRes.status === "fulfilled") setTeams(teamsRes.value);
            if (galleryRes.status === "fulfilled") setGalleryItems(galleryRes.value);
        } catch (err) {
            console.error("Failed to load relational catalogues", err);
        }
    }, []);

    useEffect(() => {
        loadCatalogues();
    }, [loadCatalogues]);

    // -------------------------------------------------------------------------
    // Fetch Achievements Directory List
    // -------------------------------------------------------------------------
    const fetchAchievementsList = useCallback(async () => {
        try {
            setLoading(true);
            setListError(null);

            const query: Record<string, unknown> = {
                page,
                limit,
                sort: "year",
                order: "desc",
            };

            if (typeFilter !== "all") {
                query.type = typeFilter;
            }

            if (recipientTypeFilter !== "all") {
                query.recipientType = recipientTypeFilter;
            }

            const response = await getAchievements(query);
            let items = response.data || [];

            // Apply Era / Year range filtering if selected
            if (eraFilter !== "all") {
                if (eraFilter === "2020s") {
                    items = items.filter((a) => a.year >= 2020);
                } else if (eraFilter === "2010s") {
                    items = items.filter((a) => a.year >= 2010 && a.year <= 2019);
                } else if (eraFilter === "1990s") {
                    items = items.filter((a) => a.year >= 1990 && a.year <= 2009);
                } else if (eraFilter === "pre-1990") {
                    items = items.filter((a) => a.year < 1990);
                }
            }

            // Client-side text search (title, description, recipient name, tournament name)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                items = items.filter((item) => {
                    const matchTitle = item.title.toLowerCase().includes(q);
                    const matchDesc = item.description?.toLowerCase().includes(q);
                    const tournamentName = item.tournament
                        ? tournamentsMap.get(item.tournament)?.name.toLowerCase()
                        : "";
                    const matchTournament = tournamentName?.includes(q);
                    let matchRecipient = false;
                    if (item.recipientType === "Player") {
                        const p = playersMap.get(item.recipient);
                        matchRecipient = p ? p.name.toLowerCase().includes(q) : false;
                    } else {
                        const t = teamsMap.get(item.recipient);
                        matchRecipient = t ? String(t.year).includes(q) : false;
                    }
                    return matchTitle || matchDesc || matchTournament || matchRecipient;
                });
            }

            setAchievements(items);
            setTotalRecords(response.meta?.total ?? items.length);
        } catch (err: unknown) {
            console.error("Failed to load achievements", err);
            const msg =
                err instanceof Error ? err.message : "Failed to load achievements. Please check backend connection.";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, limit, typeFilter, eraFilter, recipientTypeFilter, searchQuery, tournamentsMap, playersMap, teamsMap]);

    useEffect(() => {
        fetchAchievementsList();
    }, [fetchAchievementsList]);

    // -------------------------------------------------------------------------
    // Selection & Form Population
    // -------------------------------------------------------------------------
    const handleSelectAchievement = useCallback(
        (achievement: Achievement) => {
            setSelectedAchievement(achievement);
            setFormSuccess(null);
            setFormError(null);
            setIsChangingRecipient(false);

            setValue("title", achievement.title);
            setValue("description", achievement.description || "");
            setValue("type", achievement.type);
            setValue("year", achievement.year);
            setValue("tournament", achievement.tournament || "");
            setValue("recipientType", achievement.recipientType);
            setValue("recipient", achievement.recipient);

            // Attempt to find a matching gallery item for preview if description notes reference one
            const matchGallery = galleryItems.find(
                (g) =>
                    (achievement.tournament && g.tournament === achievement.tournament) ||
                    g.year === achievement.year ||
                    (g.caption && g.caption.toLowerCase().includes(achievement.title.toLowerCase())),
            );
            setSelectedGalleryItem(matchGallery || null);

            setMobileTab("form");
        },
        [setValue, galleryItems],
    );

    const handleStartCreate = useCallback(() => {
        setSelectedAchievement(null);
        setFormSuccess(null);
        setFormError(null);
        setIsChangingRecipient(false);
        setSelectedGalleryItem(null);

        // Pick initial default recipient from current catalogues
        const defaultRecipient = teams.length > 0 ? teams[0]._id : players.length > 0 ? players[0]._id : "";

        reset({
            title: "",
            description: "",
            type: "Championship",
            year: new Date().getFullYear(),
            tournament: "",
            recipientType: "Team",
            recipient: defaultRecipient,
        });

        setMobileTab("form");
    }, [reset, teams, players]);

    const handleReset = () => {
        setFormSuccess(null);
        setFormError(null);
        if (selectedAchievement) {
            handleSelectAchievement(selectedAchievement);
        } else {
            handleStartCreate();
        }
    };

    // When changing recipientType, adjust selected recipient if current one is invalid
    const handleRecipientTypeChange = (newType: RecipientType) => {
        setValue("recipientType", newType, { shouldValidate: true });
        setIsChangingRecipient(false);
        if (newType === "Team") {
            const firstTeam = teams[0]?._id || "";
            setValue("recipient", firstTeam, { shouldValidate: true });
        } else {
            const firstPlayer = players[0]?._id || "";
            setValue("recipient", firstPlayer, { shouldValidate: true });
        }
    };

    // -------------------------------------------------------------------------
    // Form Submit Handler (Create or Update)
    // -------------------------------------------------------------------------
    const onSubmit = async (data: AchievementFormData) => {
        try {
            setSubmitting(true);
            setFormSuccess(null);
            setFormError(null);

            const payload: AchievementCreateInput = {
                title: data.title.trim(),
                description: data.description?.trim() ? data.description.trim() : undefined,
                type: data.type,
                year: Number(data.year),
                recipientType: data.recipientType,
                recipient: data.recipient.trim(),
            };

            if (data.tournament && data.tournament.trim()) {
                payload.tournament = data.tournament.trim();
            }

            if (selectedAchievement) {
                // Update
                const res = await updateAchievement(selectedAchievement._id, payload);
                invalidateCatalog("achievements");
                setFormSuccess(`Achievement "${res.data.title}" updated successfully in the archive.`);
                setSelectedAchievement(res.data);
            } else {
                // Create
                const res = await createAchievement(payload);
                invalidateCatalog("achievements");
                setFormSuccess(`New achievement "${res.data.title}" ingested into the archive register.`);
                setSelectedAchievement(res.data);
            }

            await fetchAchievementsList();
        } catch (err: unknown) {
            console.error("Achievement save error:", err);
            let message = "Failed to save achievement. Please verify all required fields.";
            if (typeof err === "object" && err !== null && "response" in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                if (axiosErr.response?.data?.message) {
                    message = axiosErr.response.data.message;
                }
            } else if (err instanceof Error) {
                message = err.message;
            }
            setFormError(message);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Delete Handler
    // -------------------------------------------------------------------------
    const handleConfirmDelete = async () => {
        if (!achievementToDelete) return;
        try {
            setDeleting(true);
            setDeleteError(null);
            await deleteAchievement(achievementToDelete._id);
            invalidateCatalog("achievements");

            if (selectedAchievement?._id === achievementToDelete._id) {
                handleStartCreate();
            }

            setAchievementToDelete(null);
            await fetchAchievementsList();
        } catch (err: unknown) {
            console.error("Delete achievement error:", err);
            const msg = err instanceof Error ? err.message : "Failed to delete achievement. Please check server logs.";
            setDeleteError(msg);
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Type Styling Helper
    // -------------------------------------------------------------------------
    const renderTypeBadge = (type: AchievementType) => {
        switch (type) {
            case "Championship":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ffdea0] text-[#261a00] border border-[#ffdea0]/60">
                        <Trophy className="w-3 h-3 text-[#765a1a]" />
                        <span>Championship</span>
                    </span>
                );
            case "Medal":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECE8E1] text-[#1A1A1A] border border-[rgba(26,26,26,0.12)]">
                        <Medal className="w-3 h-3 text-[#765a1a]" />
                        <span>Medal</span>
                    </span>
                );
            case "Award":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e5e2db] text-[#3d030b] border border-[#d9c1c0]">
                        <Award className="w-3 h-3 text-[#5a181e]" />
                        <span>Award</span>
                    </span>
                );
            case "Major Victory":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#bceec8] text-[#00210f] border border-[#a1d2ad]">
                        <Shield className="w-3 h-3 text-[#2D5A3D]" />
                        <span>Major Victory</span>
                    </span>
                );
            case "Individual Achievement":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ebe8e1] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)]">
                        <Star className="w-3 h-3 text-[#765a1a]" />
                        <span>Individual Distinction</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#e5e2db] text-[#1A1A1A]">
                        <span>{type}</span>
                    </span>
                );
        }
    };

    // Currently selected recipient summary
    const selectedRecipientDisplay = useMemo(() => {
        if (!watchedRecipient) return null;
        if (watchedRecipientType === "Player") {
            const player = playersMap.get(watchedRecipient);
            return {
                title: player?.name || "Player (" + watchedRecipient.slice(-6) + ")",
                subtitle: `${player?.playingPosition || "Squad Member"}${player?.jerseyNumber ? ` • Jersey #${player.jerseyNumber}` : ""}${player?.status ? ` • ${player.status === "current" ? "Active" : "Veteran"}` : ""}`,
                icon: User,
            };
        } else {
            const team = teamsMap.get(watchedRecipient);
            const captName = team?.captain ? playersMap.get(team.captain)?.name : null;
            return {
                title: `Men's Varsity Squad ${team ? `${team.year}–${String(team.year + 1).slice(-2)}` : ""}`,
                subtitle: `Roster: ${team?.players?.length || 0} Players${captName ? ` • Capt. ${captName}` : ""}`,
                icon: Users,
            };
        }
    }, [watchedRecipient, watchedRecipientType, playersMap, teamsMap]);

    return (
        <div className="flex flex-col min-h-screen bg-[#fcf9f2] text-[#1A1A1A]">
            {/* Standardized Admin Page Header */}
            <header className="px-6 md:px-8 py-6 border-b border-[rgba(26,26,26,0.08)] bg-[#FCF9F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-tight">
                        Achievements Register &amp; Honors
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1">Manage awards, honors, and distinctions.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            invalidateCatalog("achievements");
                            invalidateCatalog("tournaments");
                            invalidateCatalog("players");
                            invalidateCatalog("teams");
                            invalidateCatalog("gallery");
                            void fetchAchievementsList();
                            void loadCatalogues(true);
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
                        onClick={handleStartCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3d030b] hover:bg-[#5a181e] text-[#F4F1EA] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Achievement</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="xl:hidden flex border-b border-[rgba(26,26,26,0.08)] bg-[#ECE8E1] px-6">
                <button
                    type="button"
                    onClick={() => setMobileTab("ledger")}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                        mobileTab === "ledger"
                            ? "border-[#3d030b] text-[#3d030b]"
                            : "border-transparent text-[#6B665F] hover:text-[#1A1A1A]"
                    }`}
                >
                    Archival Ledger ({totalRecords})
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
                    {selectedAchievement ? "Edit Dossier" : "New Dossier"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Grid */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Achievements Directory / Ledger (7 Columns)   */}
                    {/* ========================================================= */}
                    <section
                        className={`col-span-12 xl:col-span-7 flex flex-col bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] shadow-sm ${
                            mobileTab === "form" ? "hidden xl:flex" : "flex"
                        }`}
                    >
                        {/* Directory Header & Toolbar */}
                        <div className="p-6 border-b border-[rgba(26,26,26,0.08)] bg-[#f6f3ec] flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-[#3d030b]" />
                                    <h2 className="text-base font-serif font-semibold text-[#1A1A1A]">
                                        Archival Ledger
                                    </h2>
                                </div>
                                <span className="font-mono text-xs uppercase tracking-wider text-[#6B665F] bg-[#fcf9f2] px-3 py-1 rounded border border-[rgba(26,26,26,0.08)]">
                                    {totalRecords} Verified Entries
                                </span>
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-[#9C968D]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search achievements by title, recipient, or tournament..."
                                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
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

                            {/* Quick Type Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setTypeFilter("all")}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        typeFilter === "all"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#fcf9f2] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    All Accolades
                                </button>
                                {ACHIEVEMENT_TYPES.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTypeFilter(t)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                            typeFilter === t
                                                ? "bg-[#3d030b] text-white"
                                                : "bg-[#fcf9f2] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Secondary Filters Row: Year Range, Recipient Type, Reset */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(26,26,26,0.08)] text-xs">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <label className="font-mono text-[11px] text-[#6B665F] uppercase">
                                            ERA / YEAR:
                                        </label>
                                        <AdminSelect
                                            value={eraFilter}
                                            onChange={(val) => {
                                                setEraFilter(val);
                                                setPage(1);
                                            }}
                                            options={ERA_FILTER_OPTIONS}
                                            className="w-[180px]"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <label className="font-mono text-[11px] text-[#6B665F] uppercase">
                                            RECIPIENT:
                                        </label>
                                        <AdminSelect
                                            value={recipientTypeFilter}
                                            onChange={(val) => {
                                                setRecipientTypeFilter(val);
                                                setPage(1);
                                            }}
                                            options={RECIPIENT_FILTER_OPTIONS}
                                            className="w-[160px]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setTypeFilter("all");
                                        setEraFilter("all");
                                        setRecipientTypeFilter("all");
                                        setPage(1);
                                    }}
                                    className="text-xs text-[#6B665F] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Reset Filters</span>
                                </button>
                            </div>
                        </div>

                        {/* Table Area */}
                        <div className="overflow-x-auto min-h-[360px]">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <RefreshCw className="w-8 h-8 text-[#3d030b] animate-spin mb-3" />
                                    <p className="text-xs font-medium text-[#6B665F]">
                                        Consulting Archival Database...
                                    </p>
                                </div>
                            ) : listError ? (
                                <div className="p-12 text-center text-[#ba1a1a]">
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#ba1a1a]" />
                                    <p className="text-sm font-semibold">{listError}</p>
                                    <button
                                        type="button"
                                        onClick={fetchAchievementsList}
                                        className="mt-3 text-xs underline font-medium"
                                    >
                                        Retry Ingestion Query
                                    </button>
                                </div>
                            ) : achievements.length === 0 ? (
                                <div className="p-16 text-center text-[#6B665F]">
                                    <Trophy className="w-10 h-10 mx-auto mb-3 text-[#9C968D] opacity-40" />
                                    <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
                                        No Achievements Found
                                    </h3>
                                    <p className="text-xs mt-1 max-w-sm mx-auto">
                                        {searchQuery ||
                                        typeFilter !== "all" ||
                                        eraFilter !== "all" ||
                                        recipientTypeFilter !== "all"
                                            ? "No verified records match your active query filters. Try resetting filters."
                                            : "No honors or championships are currently recorded. Click '+ Add New Achievement' to ingest the first entry."}
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[rgba(26,26,26,0.08)] bg-[#f1eee7] font-mono text-[11px] text-[#6B665F] uppercase tracking-wider">
                                            <th className="py-3 px-4 w-12 text-center">#</th>
                                            <th className="py-3 px-4">Title &amp; Distinction</th>
                                            <th className="py-3 px-4">Type</th>
                                            <th className="py-3 px-4">Year</th>
                                            <th className="py-3 px-4">Recipient</th>
                                            <th className="py-3 px-4">Tournament / Circuit</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.08)] text-xs bg-[#ECE8E1]">
                                        {achievements.map((achievement, index) => {
                                            const isSelected = selectedAchievement?._id === achievement._id;
                                            const tournamentObj = achievement.tournament
                                                ? tournamentsMap.get(achievement.tournament)
                                                : null;

                                            return (
                                                <tr
                                                    key={achievement._id}
                                                    onClick={() => handleSelectAchievement(achievement)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#E2DDD4] border-l-4 border-l-[#3d030b]"
                                                            : "hover:bg-[#E2DDD4]/60"
                                                    }`}
                                                >
                                                    {/* # Index */}
                                                    <td className="py-3.5 px-4 font-mono text-[#6B665F] text-center text-[11px]">
                                                        {String((page - 1) * limit + index + 1).padStart(2, "0")}
                                                    </td>

                                                    {/* Title & Distinction */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-semibold text-[#1A1A1A] block text-xs">
                                                            {achievement.title}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-[#6B665F]">
                                                            Ref ID: ACH-{achievement._id.slice(-6).toUpperCase()}
                                                        </span>
                                                    </td>

                                                    {/* Type Badge */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderTypeBadge(achievement.type)}
                                                    </td>

                                                    {/* Year */}
                                                    <td className="py-3.5 px-4 font-mono font-medium text-[#1A1A1A]">
                                                        {achievement.year}
                                                    </td>

                                                    {/* Recipient */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {achievement.recipientType === "Team" ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-[#f1eee7] border border-[rgba(26,26,26,0.1)] text-[#1A1A1A]">
                                                                <Users className="w-3.5 h-3.5 text-[#3d030b]" />
                                                                <span>
                                                                    {(() => {
                                                                        const t = teamsMap.get(achievement.recipient);
                                                                        return t
                                                                            ? `Men's Varsity Squad (${t.year})`
                                                                            : "Varsity Team";
                                                                    })()}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-[#f1eee7] border border-[rgba(26,26,26,0.1)] text-[#1A1A1A]">
                                                                <User className="w-3.5 h-3.5 text-[#2D5A3D]" />
                                                                <span>
                                                                    {(() => {
                                                                        const p = playersMap.get(achievement.recipient);
                                                                        return p
                                                                            ? `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ""}`
                                                                            : "Individual Player";
                                                                    })()}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Tournament / Circuit */}
                                                    <td className="py-3.5 px-4 text-[#6B665F] text-xs">
                                                        {tournamentObj ? (
                                                            <span className="font-medium text-[#1A1A1A]">
                                                                {tournamentObj.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#9C968D] italic">
                                                                Institutional Distinction
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Row Actions */}
                                                    <td
                                                        className="py-3.5 px-4 text-right whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectAchievement(achievement)}
                                                                className={`p-1.5 rounded transition-colors ${
                                                                    isSelected
                                                                        ? "bg-[#3d030b] text-white"
                                                                        : "text-[#6B665F] hover:bg-[#fcf9f2] hover:text-[#3d030b]"
                                                                }`}
                                                                title="Inspect / Edit Achievement"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAchievementToDelete(achievement)}
                                                                className="p-1.5 rounded text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors"
                                                                title="Delete Achievement"
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
                            )}
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-4 border-t border-[rgba(26,26,26,0.08)] bg-[#fcf9f2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <span className="font-mono text-[11px] text-[#6B665F]">
                                Showing {achievements.length > 0 ? (page - 1) * limit + 1 : 0} –{" "}
                                {Math.min(page * limit, totalRecords)} of {totalRecords} verified records
                            </span>

                            <div className="flex items-center gap-2">
                                <AdminSelect
                                    value={String(limit)}
                                    onChange={(val) => {
                                        setLimit(Number(val));
                                        setPage(1);
                                    }}
                                    options={LIMIT_OPTIONS}
                                    className="w-[110px]"
                                />

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded border border-[rgba(26,26,26,0.12)] bg-[#fcf9f2] hover:bg-[#E2DDD4] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A]"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2.5 py-1 rounded bg-[#3d030b] text-white font-mono text-xs font-semibold">
                                        {page}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page * limit >= totalRecords}
                                        className="p-1.5 rounded border border-[rgba(26,26,26,0.12)] bg-[#fcf9f2] hover:bg-[#E2DDD4] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A]"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* RIGHT PANEL: Achievement Dossier Form (5 Columns)         */}
                    {/* ========================================================= */}
                    <section
                        className={`col-span-12 xl:col-span-5 bg-[#fcf9f2] border border-[rgba(26,26,26,0.08)] flex flex-col shadow-sm ${
                            mobileTab === "ledger" ? "hidden xl:flex" : "flex"
                        }`}
                    >
                        {selectedAchievement && (
                            <div className="p-4 border-b border-[rgba(26,26,26,0.08)] bg-[#f1eee7] flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2DDD4] text-[#3d030b] border border-[#3d030b]/20 tracking-wider uppercase font-mono">
                                    EDITING ACHIEVEMENT — {selectedAchievement.title.toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Feedback Messages */}
                        {formSuccess && (
                            <div className="mx-6 mt-6 p-3 bg-[#bceec8]/50 border border-[#a1d2ad] text-[#00210f] rounded flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-[#2D5A3D] flex-shrink-0" />
                                <span>{formSuccess}</span>
                            </div>
                        )}
                        {formError && (
                            <div className="mx-6 mt-6 p-3 bg-[#ffdad6]/60 border border-[#ba1a1a]/30 text-[#93000a] rounded flex items-center gap-2 text-xs">
                                <AlertTriangle className="w-4 h-4 text-[#ba1a1a] flex-shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Form Container */}
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-6">
                            {/* Dossier Title Header */}
                            <div className="border-b border-[rgba(26,26,26,0.08)] pb-4">
                                <h2 className="text-lg font-serif text-[#1A1A1A] tracking-tight">
                                    Achievement Dossier
                                </h2>
                                <p className="text-xs text-[#6B665F] mt-0.5">
                                    Record verified varsity honors, medals, and individual accolades for institutional
                                    history.
                                </p>
                            </div>

                            {/* SECTION 01: Distinction Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#3d030b] font-semibold">
                                        01 / Distinction Details
                                    </span>
                                    <div className="flex-1 h-[1px] bg-[rgba(26,26,26,0.08)]"></div>
                                </div>

                                {/* Achievement Title */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-xs text-[#1A1A1A] font-medium flex items-center justify-between">
                                        <span>
                                            ACHIEVEMENT TITLE <span className="text-[#ba1a1a]">*</span>
                                        </span>
                                        {errors.title && (
                                            <span className="text-[#ba1a1a] text-[11px] font-sans">
                                                {errors.title.message}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        {...register("title")}
                                        placeholder="e.g. 54th Inter-IIT Sports Meet — Champions"
                                        className={`w-full text-xs px-3 py-2 bg-[#fcf9f2] border rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b] ${
                                            errors.title ? "border-[#ba1a1a]" : "border-[rgba(26,26,26,0.12)]"
                                        }`}
                                    />
                                </div>

                                {/* Type & Year (2 Columns) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-mono text-xs text-[#1A1A1A] font-medium flex items-center justify-between">
                                            <span>
                                                ACHIEVEMENT TYPE <span className="text-[#ba1a1a]">*</span>
                                            </span>
                                            {errors.type && (
                                                <span className="text-[#ba1a1a] text-[11px] font-sans">
                                                    {errors.type.message}
                                                </span>
                                            )}
                                        </label>
                                        <AdminSelect
                                            value={watchedType}
                                            onChange={(val) =>
                                                setValue("type", val as AchievementFormData["type"], {
                                                    shouldValidate: true,
                                                })
                                            }
                                            options={ACHIEVEMENT_TYPE_FORM_OPTIONS}
                                            error={Boolean(errors.type)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-mono text-xs text-[#1A1A1A] font-medium flex items-center justify-between">
                                            <span>
                                                YEAR <span className="text-[#ba1a1a]">*</span>
                                            </span>
                                            {errors.year && (
                                                <span className="text-[#ba1a1a] text-[11px] font-sans">
                                                    {errors.year.message}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="number"
                                            {...register("year")}
                                            placeholder="YYYY (e.g. 2019)"
                                            className={`w-full text-xs px-3 py-2 bg-[#fcf9f2] border rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b] ${
                                                errors.year ? "border-[#ba1a1a]" : "border-[rgba(26,26,26,0.12)]"
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Tournament / Circuit Reference */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-xs text-[#1A1A1A] font-medium">
                                        TOURNAMENT / CIRCUIT (OPTIONAL)
                                    </label>
                                    <AdminSelect
                                        value={watchedTournament || ""}
                                        onChange={(val) => setValue("tournament", val, { shouldValidate: true })}
                                        options={tournamentSelectOptions}
                                        placeholder="None / Non-Tournament Distinction"
                                        searchable={true}
                                    />
                                </div>
                            </div>

                            {/* SECTION 02: Recipient Specification */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#3d030b] font-semibold">
                                        02 / Recipient Specification
                                    </span>
                                    <div className="flex-1 h-[1px] bg-[rgba(26,26,26,0.08)]"></div>
                                </div>

                                {/* Recipient Category (Radio Pills) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-xs text-[#1A1A1A] font-medium">
                                        RECIPIENT CATEGORY <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRecipientTypeChange("Team")}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                                                watchedRecipientType === "Team"
                                                    ? "bg-[#E2DDD4] border-[#3d030b] text-[#3d030b]"
                                                    : "bg-[#fcf9f2] border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:bg-[#E2DDD4]"
                                            }`}
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            <span>Team Award</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRecipientTypeChange("Player")}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                                                watchedRecipientType === "Player"
                                                    ? "bg-[#E2DDD4] border-[#3d030b] text-[#3d030b]"
                                                    : "bg-[#fcf9f2] border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:bg-[#E2DDD4]"
                                            }`}
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            <span>Individual Player</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Selected Recipient Entity Card & Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-xs text-[#1A1A1A] font-medium flex items-center justify-between">
                                        <span>
                                            SELECTED RECIPIENT ENTITY <span className="text-[#ba1a1a]">*</span>
                                        </span>
                                        {errors.recipient && (
                                            <span className="text-[#ba1a1a] text-[11px] font-sans">
                                                {errors.recipient.message}
                                            </span>
                                        )}
                                    </label>

                                    {selectedRecipientDisplay && !isChangingRecipient ? (
                                        <div className="p-3 bg-[#f1eee7] rounded border border-[rgba(26,26,26,0.1)] flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-[#fcf9f2] flex items-center justify-center text-[#3d030b] border border-[rgba(26,26,26,0.1)] flex-shrink-0">
                                                    <selectedRecipientDisplay.icon className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-xs font-semibold text-[#1A1A1A] block truncate">
                                                        {selectedRecipientDisplay.title}
                                                    </span>
                                                    <span className="text-[10px] text-[#6B665F] block truncate">
                                                        {selectedRecipientDisplay.subtitle}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsChangingRecipient(true)}
                                                className="text-xs text-[#3d030b] hover:underline font-mono px-2 py-1 flex-shrink-0 cursor-pointer"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <AdminSelect
                                                value={watchedRecipient || ""}
                                                onChange={(val) => {
                                                    setValue("recipient", val, { shouldValidate: true });
                                                    setIsChangingRecipient(false);
                                                }}
                                                options={recipientEntityOptions}
                                                placeholder={`Select ${watchedRecipientType === "Player" ? "player" : "team"}...`}
                                                searchable={true}
                                                error={Boolean(errors.recipient)}
                                            />
                                            {selectedRecipientDisplay && (
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsChangingRecipient(false)}
                                                        className="text-xs text-[#6B665F] hover:text-[#1A1A1A] px-2 py-1 font-mono cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 03: Archival Narrative & Description */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#3d030b] font-semibold">
                                        03 / Archival Narrative &amp; Description
                                    </span>
                                    <div className="flex-1 h-[1px] bg-[rgba(26,26,26,0.08)]"></div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-xs text-[#1A1A1A] font-medium">
                                        NARRATIVE CITATION NOTES (OPTIONAL)
                                    </label>
                                    <textarea
                                        {...register("description")}
                                        rows={3}
                                        placeholder="Enter verified citation notes, final match scoreline, standout performances, or historical remarks..."
                                        className="w-full text-xs p-3 bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b] resize-none"
                                    />
                                </div>
                            </div>

                            {/* SECTION 04: Associated Media Reference */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs uppercase tracking-wider text-[#3d030b] font-semibold">
                                        04 / Associated Media Reference
                                    </span>
                                    <div className="flex-1 h-[1px] bg-[rgba(26,26,26,0.08)]"></div>
                                </div>

                                <div className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] rounded flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-14 h-14 bg-[#E2DDD4] border border-[rgba(26,26,26,0.12)] overflow-hidden flex-shrink-0 flex items-center justify-center rounded">
                                            {selectedGalleryItem?.imageUrl ? (
                                                <img
                                                    src={selectedGalleryItem.imageUrl}
                                                    alt={selectedGalleryItem.caption || "Achievement plate"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-[#9C968D]" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="font-mono text-xs font-semibold text-[#1A1A1A] block truncate">
                                                {selectedGalleryItem?.caption || "No gallery plate attached"}
                                            </span>
                                            <span className="font-mono text-[10px] text-[#6B665F] block truncate">
                                                {selectedGalleryItem
                                                    ? `${selectedGalleryItem.category} • Year: ${selectedGalleryItem.year || "N/A"}`
                                                    : "Browse real gallery plates to enrich visual context"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {selectedGalleryItem && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedGalleryItem(null)}
                                                className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded"
                                                title="Clear media link"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setOpenGalleryModal(true)}
                                            className="px-3 py-1.5 rounded-full border border-[rgba(26,26,26,0.12)] text-xs bg-[#fcf9f2] hover:bg-[#E2DDD4] text-[#1A1A1A] font-medium flex items-center gap-1.5 transition-colors"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-[#3d030b]" />
                                            <span>Select from Gallery</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Form Action Footer */}
                            <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleStartCreate}
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
                                    <span>{selectedAchievement ? "Save Changes" : "Commit Record"}</span>
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>

            {/* ========================================================= */}
            {/* MODAL 1: Destructive Deletion Confirmation                */}
            {/* ========================================================= */}
            {achievementToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-[#ba1a1a]">
                            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                            </div>
                            <div>
                                <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">
                                    Confirm Achievement Deletion
                                </h3>
                                <p className="text-xs text-[#6B665F]">This action cannot be reversed.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-[#f1eee7] rounded text-xs space-y-1">
                            <p className="font-semibold text-[#1A1A1A]">{achievementToDelete.title}</p>
                            <p className="text-[#6B665F]">
                                Year: <span className="font-mono text-[#1A1A1A]">{achievementToDelete.year}</span> •
                                Type: <span className="font-medium text-[#1A1A1A]">{achievementToDelete.type}</span>
                            </p>
                        </div>

                        {deleteError && (
                            <p className="text-xs text-[#ba1a1a] bg-[#ffdad6]/60 p-2 rounded">{deleteError}</p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setAchievementToDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.12)] text-xs text-[#6B665F] hover:bg-[#E2DDD4]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="px-5 py-2 rounded-full bg-[#ba1a1a] text-white text-xs font-medium hover:bg-[#93000a] disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>Delete Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: Select from Gallery Browser                      */}
            {/* ========================================================= */}
            {openGalleryModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded-lg max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] pb-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-[#3d030b]" />
                                <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">
                                    Archival Gallery Catalogue
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpenGalleryModal(false)}
                                className="p-1 text-[#6B665F] hover:text-[#1A1A1A]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search in Gallery */}
                        <div className="py-4">
                            <input
                                type="text"
                                value={gallerySearch}
                                onChange={(e) => setGallerySearch(e.target.value)}
                                placeholder="Search gallery by caption, event, or category..."
                                className="w-full text-xs px-3 py-2 bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                            />
                        </div>

                        {/* Gallery Grid */}
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                            {galleryItems
                                .filter((item) => {
                                    if (!gallerySearch.trim()) return true;
                                    const q = gallerySearch.toLowerCase();
                                    return (
                                        item.caption?.toLowerCase().includes(q) ||
                                        item.eventName?.toLowerCase().includes(q) ||
                                        item.category.toLowerCase().includes(q) ||
                                        (item.year && String(item.year).includes(q))
                                    );
                                })
                                .map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => {
                                            setSelectedGalleryItem(item);
                                            setOpenGalleryModal(false);
                                        }}
                                        className="group border border-[rgba(26,26,26,0.1)] rounded overflow-hidden cursor-pointer hover:border-[#3d030b] bg-[#ECE8E1] transition-all"
                                    >
                                        <div className="h-28 bg-[#E2DDD4] overflow-hidden">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.caption || "Archival photo"}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-2 text-[11px]">
                                            <span className="font-semibold text-[#1A1A1A] block truncate">
                                                {item.caption || item.eventName || "Untitled Plate"}
                                            </span>
                                            <span className="text-[10px] text-[#6B665F] font-mono">
                                                {item.category} • {item.year || "Year N/A"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setOpenGalleryModal(false)}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.12)] text-xs text-[#6B665F] hover:bg-[#E2DDD4]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
