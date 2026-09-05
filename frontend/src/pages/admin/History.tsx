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
    Download,
    Check,
    Info,
    Image as ImageIcon,
    BookOpen,
} from "lucide-react";
import { getHistoryEvents, createHistoryEvent, updateHistoryEvent, deleteHistoryEvent } from "@/api/history";
import { getTournaments, getTournamentEditions } from "@/api/tournaments";
import { getAchievements } from "@/api/achievements";
import { getGalleryItems } from "@/api/gallery";
import type { HistoryEvent, HistoryEventCreateInput, HistoryCategory } from "@/types/history";
import type { Tournament, TournamentEdition } from "@/types/tournament";
import type { Achievement } from "@/types/achievement";
import type { GalleryItem } from "@/types/gallery";
import { historyFormSchema, type HistoryFormData, HISTORY_CATEGORIES } from "@/schemas/historySchema";

export default function AdminHistory() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [events, setEvents] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [decadeFilter, setDecadeFilter] = useState<string>("all");
    const [tournamentFilter, setTournamentFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Relational Catalogues (Tournaments, Editions, Achievements, Gallery)
    // -------------------------------------------------------------------------
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Gallery Picker Modal State
    const [openGalleryModal, setOpenGalleryModal] = useState<boolean>(false);
    const [gallerySearch, setGallerySearch] = useState<string>("");
    const [customPhotoUrl, setCustomPhotoUrl] = useState<string>("");

    // Destructive Delete State
    const [eventToDelete, setEventToDelete] = useState<HistoryEvent | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Mobile View Toggle
    const [mobileTab, setMobileTab] = useState<"list" | "form">("list");

    // Interactive Archival Tags
    const [archivalTags, setArchivalTags] = useState<string[]>(["Inter-IIT", "Collegiate", "Heritage"]);
    const [newTagInput, setNewTagInput] = useState<string>("");
    const [showTagInput, setShowTagInput] = useState<boolean>(false);

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
    } = useForm<HistoryFormData>({
        resolver: zodResolver(historyFormSchema),
        defaultValues: {
            year: new Date().getFullYear(),
            title: "",
            description: "",
            category: "Milestone",
            tournament: "",
            achievement: "",
            photo: "",
        },
    });

    const watchedDescription = watch("description") || "";
    const watchedPhoto = watch("photo");

    // -------------------------------------------------------------------------
    // Load Relational Catalogues
    // -------------------------------------------------------------------------
    const fetchCatalogues = useCallback(async () => {
        try {
            const [tRes, edRes, achRes, galRes] = await Promise.all([
                getTournaments({ limit: 100 }),
                getTournamentEditions({ limit: 100 }),
                getAchievements({ limit: 100 }),
                getGalleryItems({ limit: 100 }),
            ]);

            setTournaments(tRes.data || []);
            setEditions(edRes.data || []);
            setAchievements(achRes.data || []);
            setGalleryItems(galRes.data || []);
        } catch (err) {
            console.error("Failed to load relational catalogues for history management:", err);
        }
    }, []);

    useEffect(() => {
        fetchCatalogues();
    }, [fetchCatalogues]);

    // -------------------------------------------------------------------------
    // Fetch History Events from Backend API
    // -------------------------------------------------------------------------
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const queryParams: Record<string, string | number> = {
                page,
                limit,
                sort: "year",
                order: "desc",
            };

            if (categoryFilter !== "all") {
                queryParams.category = categoryFilter as HistoryCategory;
            }

            const response = await getHistoryEvents(queryParams);
            setEvents(response.data || []);
            setTotalRecords(response.meta?.total || response.data?.length || 0);
        } catch (err: unknown) {
            const errorMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Failed to load historical timeline events from server.")
                    : "Unable to reach the history API service.";
            setListError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // -------------------------------------------------------------------------
    // Client-side Filtering Over Loaded Dataset
    // -------------------------------------------------------------------------
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            // Search query across title, description, year, category
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = ev.title.toLowerCase().includes(q);
                const descMatch = ev.description.toLowerCase().includes(q);
                const yearMatch = ev.year.toString().includes(q);
                const catMatch = ev.category.toLowerCase().includes(q);

                // Check resolved tournament / edition
                let tourneyMatch = false;
                if (ev.tournament) {
                    const matchEd = editions.find((ed) => ed._id === ev.tournament);
                    if (matchEd) {
                        const matchT = tournaments.find((t) => t._id === matchEd.tournament);
                        if (matchEd.edition.toLowerCase().includes(q) || matchT?.name.toLowerCase().includes(q)) {
                            tourneyMatch = true;
                        }
                    } else {
                        const directT = tournaments.find((t) => t._id === ev.tournament);
                        if (directT?.name.toLowerCase().includes(q)) {
                            tourneyMatch = true;
                        }
                    }
                }

                if (!titleMatch && !descMatch && !yearMatch && !catMatch && !tourneyMatch) {
                    return false;
                }
            }

            // Decade filter
            if (decadeFilter !== "all") {
                const dec = parseInt(decadeFilter, 10);
                if (Number.isInteger(dec)) {
                    if (ev.year < dec || ev.year >= dec + 10) {
                        return false;
                    }
                }
            }

            // Tournament / Context filter
            if (tournamentFilter !== "all") {
                if (!ev.tournament) return false;
                const matchEd = editions.find((ed) => ed._id === ev.tournament);
                const tourneyId = matchEd ? matchEd.tournament : ev.tournament;
                if (tourneyId !== tournamentFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [events, searchQuery, decadeFilter, tournamentFilter, editions, tournaments]);

    // -------------------------------------------------------------------------
    // Helper: Resolve Related Entities
    // -------------------------------------------------------------------------
    const resolveTournamentContext = useCallback(
        (tournamentRefId?: string): string => {
            if (!tournamentRefId) return "General Archival Milestone";

            // Check if it's an Edition ID
            const foundEdition = editions.find((ed) => ed._id === tournamentRefId);
            if (foundEdition) {
                const parentTournament = tournaments.find((t) => t._id === foundEdition.tournament);
                const tourneyName = parentTournament ? parentTournament.name : "Tournament";
                return `${tourneyName} — ${foundEdition.edition} (${foundEdition.year})`;
            }

            // Check if it's directly a Tournament ID
            const foundTournament = tournaments.find((t) => t._id === tournamentRefId);
            if (foundTournament) {
                return `${foundTournament.name} (${foundTournament.type})`;
            }

            return `Archival Ref: ${tournamentRefId.substring(0, 8)}...`;
        },
        [editions, tournaments],
    );

    const resolveAchievementName = useCallback(
        (achievementId?: string): string | null => {
            if (!achievementId) return null;
            const found = achievements.find((a) => a._id === achievementId);
            return found ? `${found.year} ${found.title} (${found.type})` : null;
        },
        [achievements],
    );

    // -------------------------------------------------------------------------
    // Selection Handler (Load into Right Panel)
    // -------------------------------------------------------------------------
    const handleSelectEvent = (event: HistoryEvent) => {
        setSelectedEvent(event);
        setFormSuccess(null);
        setFormError(null);

        reset({
            year: event.year,
            title: event.title,
            description: event.description,
            category: event.category,
            tournament: event.tournament || "",
            achievement: event.achievement || "",
            photo: event.photo || "",
        });

        // Set contextual tags
        const tags = [event.category, `${event.year}`];
        if (event.tournament) tags.push("Tournament Link");
        if (event.achievement) tags.push("Medal/Honor");
        setArchivalTags(Array.from(new Set(tags)));

        setMobileTab("form");
    };

    // -------------------------------------------------------------------------
    // Reset to Create Mode
    // -------------------------------------------------------------------------
    const handleAddNew = () => {
        setSelectedEvent(null);
        setFormSuccess(null);
        setFormError(null);
        reset({
            year: new Date().getFullYear(),
            title: "",
            description: "",
            category: "Milestone",
            tournament: "",
            achievement: "",
            photo: "",
        });
        setArchivalTags(["Inter-IIT", "Collegiate", "Heritage"]);
        setMobileTab("form");
    };

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: HistoryFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            const payload: HistoryEventCreateInput = {
                year: Number(formData.year),
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
            };

            if (formData.tournament && formData.tournament.trim().length > 0) {
                payload.tournament = formData.tournament.trim();
            }

            if (formData.achievement && formData.achievement.trim().length > 0) {
                payload.achievement = formData.achievement.trim();
            }

            if (formData.photo && formData.photo.trim().length > 0) {
                payload.photo = formData.photo.trim();
            }

            if (selectedEvent) {
                // Update
                const response = await updateHistoryEvent(selectedEvent._id, payload);
                setFormSuccess(`Chronicle milestone "${response.data.title}" updated successfully.`);
                setSelectedEvent(response.data);
            } else {
                // Create
                const response = await createHistoryEvent(payload);
                setFormSuccess(`Chronicle milestone "${response.data.title}" committed to the permanent archive.`);
                setSelectedEvent(response.data);
            }

            // Refresh directory list
            await fetchEvents();
        } catch (err: unknown) {
            console.error("Failed to save history event:", err);
            const errMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Error saving chronicle milestone. Please check required fields.")
                    : "An unexpected error occurred while saving the chronicle milestone.";
            setFormError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Delete Handler
    // -------------------------------------------------------------------------
    const handleDeleteClick = (e: React.MouseEvent, ev: HistoryEvent) => {
        e.stopPropagation();
        setEventToDelete(ev);
        setDeleteError(null);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteHistoryEvent(eventToDelete._id);

            // If active in editor, clear it
            if (selectedEvent?._id === eventToDelete._id) {
                handleAddNew();
            }

            setEventToDelete(null);
            await fetchEvents();
        } catch (err: unknown) {
            console.error("Failed to delete chronicle milestone:", err);
            const errMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Failed to purge record from database.")
                    : "Could not purge chronicle milestone. Please try again.";
            setDeleteError(errMsg);
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Export Timeline as CSV
    // -------------------------------------------------------------------------
    const exportCSV = () => {
        if (filteredEvents.length === 0) return;

        const headers = ["Year", "Title", "Category", "Description", "Tournament Context", "Achievement Ref", "Photo"];
        const rows = filteredEvents.map((ev) => [
            `"${ev.year}"`,
            `"${ev.title.replace(/"/g, '""')}"`,
            `"${ev.category}"`,
            `"${ev.description.replace(/"/g, '""')}"`,
            `"${resolveTournamentContext(ev.tournament).replace(/"/g, '""')}"`,
            `"${ev.achievement || ""}"`,
            `"${ev.photo || ""}"`,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `IIT_BHU_Hockey_Historical_Timeline_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // -------------------------------------------------------------------------
    // Tag Helpers
    // -------------------------------------------------------------------------
    const handleAddTag = () => {
        if (!newTagInput.trim()) return;
        if (!archivalTags.includes(newTagInput.trim())) {
            setArchivalTags([...archivalTags, newTagInput.trim()]);
        }
        setNewTagInput("");
        setShowTagInput(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setArchivalTags(archivalTags.filter((t) => t !== tagToRemove));
    };

    // -------------------------------------------------------------------------
    // Category Badge Styler
    // -------------------------------------------------------------------------
    const getCategoryBadgeClass = (category: string) => {
        switch (category) {
            case "Major Victory":
                return "bg-[#5a181e]/10 text-[#3d030b] border-[#5a181e]/30";
            case "Championship":
                return "bg-[#fed88b]/40 text-[#765a1a] border-[#fed88b]";
            case "Medal":
                return "bg-[#a1d2ad]/30 text-[#00210e] border-[#a1d2ad]/60";
            case "Memorable Performance":
                return "bg-[#2D5A3D]/10 text-[#2D5A3D] border-[#2D5A3D]/30";
            case "Milestone":
            default:
                return "bg-[#E2DDD4] text-[#6B665F] border-[#d9c1c0]";
        }
    };

    // Word & Character count calculation
    const wordCount = watchedDescription.trim() ? watchedDescription.trim().split(/\s+/).length : 0;
    const charCount = watchedDescription.length;

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F1EA]">
            {/* ================================================================= */}
            {/* TOP BREADCRUMB & HEADER                                          */}
            {/* ================================================================= */}
            <header className="h-14 px-4 md:px-8 flex items-center justify-between bg-[#FCF9F2]/70 backdrop-blur-sm sticky top-0 z-30 border-b border-[rgba(26,26,26,0.06)]">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-[#6B665F] uppercase">
                    <span>ARCHIVE ADMIN</span>
                    <span className="text-[#9C968D]">/</span>
                    <span className="text-[#3d030b] font-semibold">HISTORICAL CHRONOLOGY &amp; TIMELINE</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECE8E1] text-[#6B665F] text-[11px] font-medium border border-[rgba(26,26,26,0.08)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3D]"></span>
                        MongoDB Ledger Synced
                    </span>
                    <button
                        onClick={fetchEvents}
                        disabled={loading}
                        className="p-1.5 rounded-full text-[#6B665F] hover:text-[#3d030b] hover:bg-[#E2DDD4] transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </header>

            {/* ================================================================= */}
            {/* PAGE TITLE BAR                                                   */}
            {/* ================================================================= */}
            <section className="px-4 md:px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B665F] font-semibold block mb-1">
                        BHU ATHLETICS ARCHIVAL COMPENDIUM
                    </span>
                    <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                        History &amp; Chronology Ledger
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1 max-w-2xl leading-relaxed">
                        Manage historical timeline events, epoch milestones, institutional chronicles, and varsity
                        narratives across generations since 1928.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={exportCSV}
                        disabled={filteredEvents.length === 0}
                        className="px-3.5 py-1.5 rounded-full border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] hover:bg-[#E2DDD4] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export Timeline (.CSV)
                    </button>
                    <button
                        type="button"
                        onClick={handleAddNew}
                        className="px-4 py-1.5 rounded-full bg-[#3d030b] text-[#ffffff] hover:bg-[#5a181e] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-none"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add History Event
                    </button>
                </div>
            </section>

            {/* Mobile Tab Switcher */}
            <div className="px-4 md:px-8 pb-3 lg:hidden flex gap-2">
                <button
                    type="button"
                    onClick={() => setMobileTab("list")}
                    className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                        mobileTab === "list"
                            ? "bg-[#3d030b] text-[#ffffff]"
                            : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4]"
                    }`}
                >
                    Milestones Directory ({filteredEvents.length})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab("form")}
                    className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                        mobileTab === "form"
                            ? "bg-[#3d030b] text-[#ffffff]"
                            : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4]"
                    }`}
                >
                    {selectedEvent ? "Edit Milestone" : "New Milestone"}
                </button>
            </div>

            {/* ================================================================= */}
            {/* MAIN TWO-PANEL WORKSPACE (12 Cols: 7 Left, 5 Right)              */}
            {/* ================================================================= */}
            <main className="px-4 md:px-8 pb-12 grid grid-cols-12 gap-6 items-start">
                {/* ============================================================= */}
                {/* LEFT PANEL: HISTORY DIRECTORY & ARCHIVAL LEDGER (7 Cols)      */}
                {/* ============================================================= */}
                <div
                    className={`col-span-12 lg:col-span-7 flex flex-col gap-4 ${
                        mobileTab === "form" ? "hidden lg:flex" : "flex"
                    }`}
                >
                    {/* Search Toolbar & Filters */}
                    <div className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] flex flex-col gap-3">
                        {/* Primary Search Bar */}
                        <div className="relative w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C968D]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search historical events by title, year, or keyword..."
                                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C968D] hover:text-[#1A1A1A]"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[rgba(26,26,26,0.06)]">
                            <span className="text-[11px] uppercase tracking-wider text-[#9C968D] mr-1 font-medium">
                                Filter:
                            </span>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("all")}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    categoryFilter === "all"
                                        ? "bg-[#3d030b] text-[#ffffff]"
                                        : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                }`}
                            >
                                All ({events.length})
                            </button>
                            {HISTORY_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        categoryFilter === cat
                                            ? "bg-[#3d030b] text-[#ffffff]"
                                            : "bg-[#FCF9F2] hover:bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Secondary Filters Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(26,26,26,0.06)] text-xs">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Decade Filter */}
                                <div className="flex items-center gap-1.5 text-[#6B665F]">
                                    <span className="text-[11px] uppercase text-[#9C968D] font-medium">Decade:</span>
                                    <select
                                        value={decadeFilter}
                                        onChange={(e) => setDecadeFilter(e.target.value)}
                                        className="py-1 px-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    >
                                        <option value="all">All Decades</option>
                                        <option value="1960">1960s (1960–1969)</option>
                                        <option value="1970">1970s (1970–1979)</option>
                                        <option value="1980">1980s (1980–1989)</option>
                                        <option value="1990">1990s (1990–1999)</option>
                                        <option value="2000">2000s (2000–2009)</option>
                                        <option value="2010">2010s (2010–2019)</option>
                                        <option value="2020">2020s (2020–Present)</option>
                                    </select>
                                </div>

                                {/* Tournament Context Filter */}
                                <div className="flex items-center gap-1.5 text-[#6B665F]">
                                    <span className="text-[11px] uppercase text-[#9C968D] font-medium">
                                        Competition:
                                    </span>
                                    <select
                                        value={tournamentFilter}
                                        onChange={(e) => setTournamentFilter(e.target.value)}
                                        className="py-1 px-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b] max-w-[160px] truncate"
                                    >
                                        <option value="all">All Competitions</option>
                                        {tournaments.map((t) => (
                                            <option key={t._id} value={t._id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <span className="text-[11px] text-[#9C968D] font-medium">
                                Showing {filteredEvents.length} of {totalRecords} milestones
                            </span>
                        </div>
                    </div>

                    {/* Ledger Table Container */}
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.08)] overflow-hidden">
                        {listError ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <AlertTriangle className="w-8 h-8 text-[#ba1a1a]" />
                                <span className="text-xs font-semibold text-[#ba1a1a]">{listError}</span>
                                <button
                                    type="button"
                                    onClick={fetchEvents}
                                    className="mt-2 px-3 py-1 bg-[#ECE8E1] hover:bg-[#E2DDD4] text-xs font-medium rounded text-[#1A1A1A]"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                                <RefreshCw className="w-6 h-6 animate-spin text-[#3d030b]" />
                                <span className="text-xs text-[#6B665F]">
                                    Loading historical milestones from archive...
                                </span>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                                <BookOpen className="w-8 h-8 text-[#9C968D]" />
                                <h3 className="text-sm font-semibold text-[#1A1A1A]">No Chronicle Milestones Found</h3>
                                <p className="text-xs text-[#6B665F] max-w-sm">
                                    {searchQuery ||
                                    categoryFilter !== "all" ||
                                    decadeFilter !== "all" ||
                                    tournamentFilter !== "all"
                                        ? "No historical events match the active search criteria or filters."
                                        : "No historical milestones are currently recorded in the database."}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddNew}
                                    className="mt-3 px-4 py-1.5 bg-[#3d030b] text-[#ffffff] rounded-full text-xs font-medium hover:bg-[#5a181e]"
                                >
                                    + Add First Event
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-[#ECE8E1]/60 border-b border-[rgba(26,26,26,0.08)] text-[#6B665F] font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="py-3 px-3 w-8">#</th>
                                            <th className="py-3 px-3 w-16">YEAR</th>
                                            <th className="py-3 px-4">EVENT TITLE &amp; SUMMARY</th>
                                            <th className="py-3 px-3">CATEGORY</th>
                                            <th className="py-3 px-3">CONTEXT / TOURNAMENT</th>
                                            <th className="py-3 px-3 text-center">RELATIONS</th>
                                            <th className="py-3 px-3 text-right">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.06)]">
                                        {filteredEvents.map((ev, index) => {
                                            const isSelected = selectedEvent?._id === ev._id;
                                            const seq = String(index + 1 + (page - 1) * limit).padStart(2, "0");
                                            const contextLabel = resolveTournamentContext(ev.tournament);
                                            const achievementTitle = resolveAchievementName(ev.achievement);

                                            return (
                                                <tr
                                                    key={ev._id}
                                                    onClick={() => handleSelectEvent(ev)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#ECE8E1] border-l-4 border-[#3d030b]"
                                                            : "hover:bg-[#ECE8E1]/50"
                                                    }`}
                                                >
                                                    <td className="py-3.5 px-3 font-mono text-[#9C968D] font-bold text-[11px]">
                                                        {seq}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-[#3d030b] text-sm">
                                                        {ev.year}
                                                    </td>
                                                    <td className="py-3.5 px-4 max-w-[260px]">
                                                        <div className="font-semibold text-[#1A1A1A] text-xs">
                                                            {ev.title}
                                                        </div>
                                                        <p className="text-[#6B665F] text-[11px] leading-relaxed line-clamp-2 mt-0.5">
                                                            {ev.description}
                                                        </p>
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${getCategoryBadgeClass(
                                                                ev.category,
                                                            )}`}
                                                        >
                                                            {ev.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-[#6B665F] text-[11px] max-w-[160px] truncate">
                                                        {contextLabel}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {ev.achievement && (
                                                                <span
                                                                    className="p-1 rounded bg-[#fed88b]/30 text-[#765a1a]"
                                                                    title={`Linked Achievement: ${achievementTitle || ev.achievement}`}
                                                                >
                                                                    <Trophy className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                            {ev.photo && (
                                                                <span
                                                                    className="p-1 rounded bg-[#3d030b]/10 text-[#3d030b]"
                                                                    title="Archival Primary Photo Plate Attached"
                                                                >
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                            {!ev.achievement && !ev.photo && (
                                                                <span className="text-[#9C968D] text-[11px]">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectEvent(ev);
                                                                }}
                                                                className="p-1 rounded text-[#3d030b] hover:bg-[#E2DDD4] transition-colors"
                                                                title="Edit Record"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteClick(e, ev)}
                                                                className="p-1 rounded text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                                                                title="Delete Record"
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

                        {/* Archival Pagination Bar */}
                        <div className="p-3 bg-[#ECE8E1]/50 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs text-[#6B665F]">
                            <span className="text-[11px] text-[#9C968D]">
                                Showing {filteredEvents.length > 0 ? (page - 1) * limit + 1 : 0}-
                                {Math.min(page * limit, totalRecords)} of {totalRecords} verified milestones
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-2.5 py-1 rounded border border-[rgba(26,26,26,0.12)] hover:bg-[#E2DDD4] text-[#6B665F] disabled:opacity-40 flex items-center gap-0.5"
                                >
                                    <ChevronLeft className="w-3 h-3" /> Prev
                                </button>
                                <span className="px-2 py-1 font-mono font-medium text-[#1A1A1A]">{page}</span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page * limit >= totalRecords}
                                    className="px-2.5 py-1 rounded border border-[rgba(26,26,26,0.12)] hover:bg-[#E2DDD4] text-[#6B665F] disabled:opacity-40 flex items-center gap-0.5"
                                >
                                    Next <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Archival Protocol Rule Notice Box */}
                    <div className="p-4 bg-[#ECE8E1]/70 border border-[rgba(26,26,26,0.08)] flex items-start gap-3">
                        <Info className="w-4 h-4 text-[#3d030b] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#6B665F] leading-relaxed">
                            <span className="font-semibold text-[#1A1A1A]">Archival Protocol Rule: </span>
                            All timeline milestones dated prior to 1975 must contain at least one verifiable external
                            citation, physical match scorecard reference, or Gymkhana verified seal before publication
                            to the permanent public record.
                        </div>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* RIGHT PANEL: HISTORY EVENT DOSSIER FORM (5 Cols)             */}
                {/* ============================================================= */}
                <div
                    className={`col-span-12 lg:col-span-5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.08)] flex flex-col ${
                        mobileTab === "list" ? "hidden lg:flex" : "flex"
                    }`}
                >
                    {/* Dossier Header */}
                    <div className="p-4 bg-[#ECE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {selectedEvent ? (
                                <span className="px-2.5 py-1 rounded-full bg-[#fed88b]/40 text-[#765a1a] border border-[#fed88b] text-[10px] uppercase font-bold tracking-wider">
                                    EDITING MILESTONE — {selectedEvent.year}
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full bg-[#2D5A3D]/10 text-[#2D5A3D] border border-[#2D5A3D]/30 text-[10px] uppercase font-bold tracking-wider">
                                    NEW MILESTONE DOSSIER — CREATE MODE
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAddNew}
                                className="px-3 py-1 text-xs text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] rounded-full transition-colors font-medium"
                            >
                                {selectedEvent ? "Clear / New" : "Reset"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={submitting}
                                className="px-3.5 py-1 text-xs bg-[#3d030b] text-[#ffffff] rounded-full hover:bg-[#5a181e] font-medium transition-colors flex items-center gap-1.5 shadow-none disabled:opacity-50"
                            >
                                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                                {selectedEvent ? "Save Changes" : "Publish Record"}
                            </button>
                        </div>
                    </div>

                    {/* Dossier Subtitle Section */}
                    <div className="px-6 pt-5 pb-3 border-b border-[rgba(26,26,26,0.06)]">
                        <h2 className="text-lg font-semibold text-[#1A1A1A] tracking-tight">
                            Chronicle Milestone Dossier
                        </h2>
                        <p className="text-xs text-[#6B665F] mt-0.5">
                            Record historical narratives, milestone context, and primary source citations.
                        </p>
                    </div>

                    {/* Feedback Banners */}
                    {formSuccess && (
                        <div className="mx-6 mt-4 p-3 rounded bg-[#2D5A3D]/10 border border-[#2D5A3D]/20 text-[#2D5A3D] text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{formSuccess}</span>
                        </div>
                    )}
                    {formError && (
                        <div className="mx-6 mt-4 p-3 rounded bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-6">
                        {/* ----------------------------------------------------- */}
                        {/* SECTION 1: EVENT IDENTIFICATION                       */}
                        {/* ----------------------------------------------------- */}
                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] uppercase tracking-wider text-[#1A1A1A] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                Section 1: Event Identification
                            </span>

                            {/* Event Title */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                    Event / Milestone Title <span className="text-[#ba1a1a]">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register("title")}
                                    placeholder="e.g. Historic First Inter-IIT Gold"
                                    className="w-full px-3 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                                />
                                {errors.title && (
                                    <span className="text-[11px] text-[#ba1a1a] font-medium">
                                        {errors.title.message}
                                    </span>
                                )}
                            </div>

                            {/* Year & Category 2-Col */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                        Year / Date <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register("year", { valueAsNumber: true })}
                                        placeholder="e.g. 1968"
                                        className="w-full px-3 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                                    />
                                    {errors.year && (
                                        <span className="text-[11px] text-[#ba1a1a] font-medium">
                                            {errors.year.message}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                        Category <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <select
                                        {...register("category")}
                                        className="w-full px-3 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                    >
                                        {HISTORY_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <span className="text-[11px] text-[#ba1a1a] font-medium">
                                            {errors.category.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 2: HISTORICAL NARRATIVE & ARCHIVAL TEXT       */}
                        {/* ----------------------------------------------------- */}
                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] uppercase tracking-wider text-[#1A1A1A] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                Section 2: Historical Narrative &amp; Archival Text
                            </span>

                            <div className="border border-[rgba(26,26,26,0.15)] rounded bg-[#FCF9F2] overflow-hidden">
                                {/* Editorial Formatting Ribbon Bar */}
                                <div className="p-1.5 bg-[#ECE8E1]/80 border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1 text-[#6B665F]">
                                        <span className="px-1.5 py-0.5 rounded font-bold text-xs">B</span>
                                        <span className="px-1.5 py-0.5 rounded italic text-xs">I</span>
                                        <div className="h-3 w-[1px] bg-[rgba(26,26,26,0.15)] mx-1"></div>
                                        <span className="text-[11px] font-mono">Narrative Ledger Mode</span>
                                    </div>
                                    <span className="text-[10px] text-[#9C968D] font-mono">
                                        Standard v2.4 (Archival Plaintext)
                                    </span>
                                </div>

                                <textarea
                                    {...register("description")}
                                    rows={6}
                                    placeholder="Provide detailed historical account, tactical formation, notable goals/moments, and primary source citations..."
                                    className="w-full p-3 text-xs bg-[#FCF9F2] text-[#1A1A1A] focus:outline-none resize-y leading-relaxed border-none font-sans"
                                />
                            </div>

                            <div className="flex justify-between items-center text-[#9C968D] text-[11px]">
                                <span>Citations &amp; source Gazette entries recommended</span>
                                <span>
                                    {wordCount} words / {charCount} characters
                                </span>
                            </div>
                            {errors.description && (
                                <span className="text-[11px] text-[#ba1a1a] font-medium">
                                    {errors.description.message}
                                </span>
                            )}
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 3: ARCHIVAL LINKAGES & CROSS-REFERENCES       */}
                        {/* ----------------------------------------------------- */}
                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] uppercase tracking-wider text-[#1A1A1A] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                Section 3: Archival Linkages &amp; Cross-References
                            </span>

                            {/* Related Tournament / Edition Selector */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                    Related Tournament / Edition
                                </label>
                                <select
                                    {...register("tournament")}
                                    className="w-full px-3 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                >
                                    <option value="">None (Standalone Milestone)</option>
                                    <optgroup label="Tournament Editions">
                                        {editions.map((ed) => {
                                            const parent = tournaments.find((t) => t._id === ed.tournament);
                                            const tName = parent ? parent.name : "Tournament";
                                            return (
                                                <option key={ed._id} value={ed._id}>
                                                    {tName} — {ed.edition} ({ed.year})
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                    <optgroup label="General Tournaments">
                                        {tournaments.map((t) => (
                                            <option key={t._id} value={t._id}>
                                                {t.name} ({t.type})
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                <span className="text-[10px] text-[#9C968D]">
                                    Directly links milestone to an active tournament or edition record.
                                </span>
                            </div>

                            {/* Related Achievement Selector */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                    Related Achievement / Medal
                                </label>
                                <select
                                    {...register("achievement")}
                                    className="w-full px-3 py-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                >
                                    <option value="">None (Standalone Milestone)</option>
                                    {achievements.map((ach) => (
                                        <option key={ach._id} value={ach._id}>
                                            {ach.year} — {ach.title} ({ach.type})
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[10px] text-[#9C968D]">
                                    Cross-references existing distinction records without duplicating data.
                                </span>
                            </div>

                            {/* Related Primary Gallery Plate / Photo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] uppercase text-[#6B665F] font-medium">
                                    Related Primary Gallery Plate / Photo
                                </label>

                                {watchedPhoto ? (
                                    <div className="p-3 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded flex items-center gap-3">
                                        <div className="w-16 h-16 bg-[#E2DDD4] shrink-0 flex items-center justify-center border border-[rgba(26,26,26,0.12)] overflow-hidden relative">
                                            <img
                                                src={watchedPhoto}
                                                alt="Archival Plate Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src =
                                                        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200";
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-semibold text-xs text-[#1A1A1A] truncate">
                                                {watchedPhoto.split("/").pop() || "Archival Plate"}
                                            </span>
                                            <span className="text-[11px] text-[#6B665F] truncate max-w-xs mt-0.5">
                                                {watchedPhoto}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenGalleryModal(true)}
                                                    className="text-[10px] text-[#3d030b] uppercase font-bold hover:underline"
                                                >
                                                    Change Plate
                                                </button>
                                                <span className="text-[#9C968D] text-xs">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setValue("photo", "")}
                                                    className="text-[10px] text-[#ba1a1a] uppercase font-bold hover:underline"
                                                >
                                                    Detach
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-[#ECE8E1]/50 border border-dashed border-[rgba(26,26,26,0.15)] rounded flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                        <div className="flex items-center gap-2.5 text-[#6B665F] text-xs">
                                            <ImageIcon className="w-4 h-4 text-[#9C968D]" />
                                            <span>No primary archival photo plate attached</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOpenGalleryModal(true)}
                                                className="px-3 py-1 bg-[#FCF9F2] hover:bg-[#E2DDD4] text-xs font-medium rounded border border-[rgba(26,26,26,0.12)] text-[#1A1A1A] transition-colors"
                                            >
                                                Select from Vault
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {errors.photo && (
                                    <span className="text-[11px] text-[#ba1a1a] font-medium">
                                        {errors.photo.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 4: ARCHIVAL INDEX TAGS                        */}
                        {/* ----------------------------------------------------- */}
                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] uppercase tracking-wider text-[#1A1A1A] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                Section 4: Archival Index Tags
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {archivalTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E2DDD4] text-[#1A1A1A] text-xs border border-[rgba(26,26,26,0.08)]"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="text-[#9C968D] hover:text-[#1A1A1A]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}

                                {showTagInput ? (
                                    <div className="inline-flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                            }}
                                            placeholder="Enter tag..."
                                            autoFocus
                                            className="px-2 py-0.5 text-xs bg-[#FCF9F2] border border-[#3d030b] rounded-full text-[#1A1A1A] focus:outline-none w-24"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="p-1 rounded-full bg-[#3d030b] text-[#ffffff] hover:bg-[#5a181e]"
                                        >
                                            <Check className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTagInput(false)}
                                            className="p-1 text-[#9C968D] hover:text-[#1A1A1A]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowTagInput(true)}
                                        className="px-2.5 py-1 rounded-full border border-dashed border-[rgba(26,26,26,0.2)] text-[#6B665F] hover:text-[#1A1A1A] text-xs flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Tag
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 5: FORM ACTIONS                               */}
                        {/* ----------------------------------------------------- */}
                        <div className="pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleAddNew}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.15)] text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] text-xs font-medium transition-colors"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 rounded-full bg-[#3d030b] text-[#ffffff] hover:bg-[#5a181e] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-none disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        Committing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        {selectedEvent ? "Save Milestone Changes" : "Publish to Permanent Archive"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ================================================================= */}
            {/* GALLERY VAULT PICKER MODAL                                        */}
            {/* ================================================================= */}
            {openGalleryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-4 bg-[#ECE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-[#3d030b]" />
                                <h3 className="font-semibold text-sm text-[#1A1A1A]">Select Archival Photo Plate</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpenGalleryModal(false)}
                                className="p-1 rounded text-[#9C968D] hover:text-[#1A1A1A] hover:bg-[#E2DDD4]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search & Custom URL input */}
                        <div className="p-4 border-b border-[rgba(26,26,26,0.08)] flex flex-col gap-3">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C968D]" />
                                <input
                                    type="text"
                                    value={gallerySearch}
                                    onChange={(e) => setGallerySearch(e.target.value)}
                                    placeholder="Search archival photos by caption, tournament, or category..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={customPhotoUrl}
                                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                                    placeholder="Or paste direct external image URL..."
                                    className="flex-1 px-3 py-1.5 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] placeholder:text-[#9C968D] focus:outline-none focus:border-[#3d030b]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (customPhotoUrl.trim()) {
                                            setValue("photo", customPhotoUrl.trim());
                                            setOpenGalleryModal(false);
                                            setCustomPhotoUrl("");
                                        }
                                    }}
                                    disabled={!customPhotoUrl.trim()}
                                    className="px-3 py-1.5 bg-[#3d030b] text-[#ffffff] rounded text-xs font-medium hover:bg-[#5a181e] disabled:opacity-40"
                                >
                                    Attach URL
                                </button>
                            </div>
                        </div>

                        {/* Gallery Grid */}
                        <div className="p-4 overflow-y-auto max-h-[50vh]">
                            {galleryItems.length === 0 ? (
                                <div className="text-center py-8 text-xs text-[#6B665F]">
                                    No gallery photos currently loaded in database.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {galleryItems
                                        .filter((item) =>
                                            gallerySearch.trim()
                                                ? (item.caption &&
                                                      item.caption
                                                          .toLowerCase()
                                                          .includes(gallerySearch.toLowerCase())) ||
                                                  item.category.toLowerCase().includes(gallerySearch.toLowerCase())
                                                : true,
                                        )
                                        .map((item) => (
                                            <div
                                                key={item._id}
                                                onClick={() => {
                                                    setValue("photo", item.imageUrl);
                                                    setOpenGalleryModal(false);
                                                }}
                                                className="group cursor-pointer p-2 bg-[#ECE8E1] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)] rounded flex flex-col gap-2 transition-all hover:border-[#3d030b]"
                                            >
                                                <div className="w-full h-24 bg-[#FCF9F2] overflow-hidden rounded relative">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.caption}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-[11px] text-[#1A1A1A] truncate">
                                                        {item.caption || "Archival Photo"}
                                                    </span>
                                                    <span className="text-[10px] text-[#6B665F] truncate">
                                                        {item.category}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* DESTRUCTIVE DELETE CONFIRMATION MODAL                             */}
            {/* ================================================================= */}
            {eventToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-[#ba1a1a]">
                            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-[#1A1A1A]">Purge Chronicle Milestone</h3>
                                <span className="text-xs text-[#6B665F]">Permanent archival deletion</span>
                            </div>
                        </div>

                        <p className="text-xs text-[#6B665F] leading-relaxed">
                            Are you sure you want to permanently remove{" "}
                            <strong className="text-[#1A1A1A]">"{eventToDelete.title}"</strong> ({eventToDelete.year})
                            from the institutional historical ledger? This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded text-[#ba1a1a] text-xs">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setEventToDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-full border border-[rgba(26,26,26,0.15)] text-xs font-medium text-[#6B665F] hover:bg-[#ECE8E1]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-5 py-2 rounded-full bg-[#ba1a1a] text-[#ffffff] text-xs font-medium hover:bg-[#93000a] flex items-center gap-1.5"
                            >
                                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archival Ledger Footer Bar */}
            <footer className="mt-auto px-4 md:px-8 py-3 bg-[#ECE8E1]/80 border-t border-[rgba(26,26,26,0.08)] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B665F]">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2D5A3D]"></span>
                    <span>
                        Physical Repository Ledger Link: Central Library Wing B, Box #14-H (Sports Historiography)
                    </span>
                </div>
                <div className="text-[11px] text-[#9C968D] uppercase font-mono mt-1 sm:mt-0">
                    INDIAN INSTITUTE OF TECHNOLOGY (BHU) VARANASI — SPORTS ARCHIVES SYSTEM
                </div>
            </footer>
        </div>
    );
}
