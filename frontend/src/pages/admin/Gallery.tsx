import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
    Check,
    Info,
    Image as ImageIcon,
    UploadCloud,
    Maximize2,
    UserCheck,
} from "lucide-react";
import { getGalleryItems, createGalleryItem, updateGalleryItem, deleteGalleryItem } from "@/api/gallery";
import { getTournaments, getTournamentEditions } from "@/api/tournaments";
import { getPlayers } from "@/api/players";
import type { GalleryItem, GalleryItemCreateInput, GalleryCategory } from "@/types/gallery";
import type { Tournament, TournamentEdition } from "@/types/tournament";
import type { Player } from "@/types/player";
import { galleryFormSchema, type GalleryFormData, GALLERY_CATEGORIES } from "@/schemas/gallerySchema";

export default function AdminGallery() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [eraFilter, setEraFilter] = useState<string>("all");
    const [tournamentFilter, setTournamentFilter] = useState<string>("all");
    const [playerFilter, setPlayerFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Relational Catalogues (Tournaments, Editions, Players)
    // -------------------------------------------------------------------------
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Image Upload & Preview States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tagged Players State (in form)
    const [taggedPlayerIds, setTaggedPlayerIds] = useState<string[]>([]);
    const [playerSearchQuery, setPlayerSearchQuery] = useState<string>("");
    const [showPlayerDropdown, setShowPlayerDropdown] = useState<boolean>(false);

    // Full Plate Zoom Modal
    const [zoomItem, setZoomItem] = useState<GalleryItem | null>(null);

    // Destructive Delete State
    const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Mobile View Toggle
    const [mobileTab, setMobileTab] = useState<"list" | "form">("list");

    // -------------------------------------------------------------------------
    // React Hook Form Configuration
    // -------------------------------------------------------------------------
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<GalleryFormData>({
        resolver: zodResolver(galleryFormSchema),
        defaultValues: {
            imageUrl: "",
            imageFileId: "",
            year: new Date().getFullYear(),
            category: "Match Photos",
            tournament: "",
            eventName: "",
            caption: "",
            description: "",
            taggedPlayers: [],
        },
    });

    // -------------------------------------------------------------------------
    // Load Relational Catalogues
    // -------------------------------------------------------------------------
    const fetchCatalogues = useCallback(async () => {
        try {
            const [tRes, edRes, pRes] = await Promise.all([
                getTournaments({ limit: 100 }),
                getTournamentEditions({ limit: 100 }),
                getPlayers({ limit: 100 }),
            ]);

            setTournaments(tRes.data || []);
            setEditions(edRes.data || []);
            setPlayers(pRes.data || []);
        } catch (err) {
            console.error("Failed to load relational catalogues for gallery management:", err);
        }
    }, []);

    useEffect(() => {
        fetchCatalogues();
    }, [fetchCatalogues]);

    // -------------------------------------------------------------------------
    // Fetch Gallery Items from Backend API
    // -------------------------------------------------------------------------
    const fetchItems = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const queryParams: Record<string, string | number> = {
                page,
                limit,
                sort: "createdAt",
                order: "desc",
            };

            if (categoryFilter !== "all") {
                queryParams.category = categoryFilter as GalleryCategory;
            }

            const response = await getGalleryItems(queryParams);
            setItems(response.data || []);
            setTotalRecords(response.meta?.total || response.data?.length || 0);
        } catch (err: unknown) {
            const errorMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Failed to load gallery items from archive.")
                    : "Unable to reach the gallery API service.";
            setListError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // -------------------------------------------------------------------------
    // Client-side Filtering Over Loaded Dataset
    // -------------------------------------------------------------------------
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search query across caption, eventName, description, year, category
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const captionMatch = item.caption?.toLowerCase().includes(q);
                const eventMatch = item.eventName?.toLowerCase().includes(q);
                const descMatch = item.description?.toLowerCase().includes(q);
                const yearMatch = item.year?.toString().includes(q);
                const catMatch = item.category.toLowerCase().includes(q);

                // Check tagged player names
                let playerMatch = false;
                if (item.taggedPlayers && item.taggedPlayers.length > 0) {
                    playerMatch = item.taggedPlayers.some((pId) => {
                        const p = players.find((pl) => pl._id === pId);
                        return p ? p.name.toLowerCase().includes(q) : false;
                    });
                }

                if (!captionMatch && !eventMatch && !descMatch && !yearMatch && !catMatch && !playerMatch) {
                    return false;
                }
            }

            // Era filter
            if (eraFilter !== "all") {
                const [startStr, endStr] = eraFilter.split("-");
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (item.year !== undefined) {
                    if (item.year < start || item.year > end) {
                        return false;
                    }
                }
            }

            // Tournament / Context filter
            if (tournamentFilter !== "all") {
                if (!item.tournament) return false;
                const matchEd = editions.find((ed) => ed._id === item.tournament);
                const tourneyId = matchEd ? matchEd.tournament : item.tournament;
                if (tourneyId !== tournamentFilter && item.tournament !== tournamentFilter) {
                    return false;
                }
            }

            // Tagged Player filter
            if (playerFilter !== "all") {
                if (!item.taggedPlayers || !item.taggedPlayers.includes(playerFilter)) {
                    return false;
                }
            }

            return true;
        });
    }, [items, searchQuery, eraFilter, tournamentFilter, playerFilter, players, editions]);

    // -------------------------------------------------------------------------
    // Helper: Resolve Related Entities
    // -------------------------------------------------------------------------
    const resolveTournamentContext = useCallback(
        (tournamentRefId?: string): string => {
            if (!tournamentRefId) return "General Archive";

            const foundEdition = editions.find((ed) => ed._id === tournamentRefId);
            if (foundEdition) {
                const parentTournament = tournaments.find((t) => t._id === foundEdition.tournament);
                const tourneyName = parentTournament ? parentTournament.name : "Tournament";
                return `${tourneyName} (${foundEdition.edition}, ${foundEdition.year})`;
            }

            const foundTournament = tournaments.find((t) => t._id === tournamentRefId);
            if (foundTournament) {
                return `${foundTournament.name} (${foundTournament.type})`;
            }

            return `Ref: ${tournamentRefId.substring(0, 8)}...`;
        },
        [editions, tournaments],
    );

    const resolvePlayerName = useCallback(
        (playerId: string): string => {
            const found = players.find((p) => p._id === playerId);
            return found
                ? `${found.name}${found.jerseyNumber ? ` (#${found.jerseyNumber})` : ""}`
                : playerId.substring(0, 8);
        },
        [players],
    );

    // -------------------------------------------------------------------------
    // File Upload Handler
    // -------------------------------------------------------------------------
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (e.g. max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setFormError("File size exceeds 10MB limit.");
                return;
            }

            setSelectedFile(file);
            setFormError(null);

            // Create temporary object URL for preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (selectedItem?.imageUrl) {
            setPreviewUrl(selectedItem.imageUrl);
        } else {
            setPreviewUrl(null);
        }
    };

    // -------------------------------------------------------------------------
    // Selection Handler (Load into Right Panel)
    // -------------------------------------------------------------------------
    const handleSelectItem = (item: GalleryItem) => {
        setSelectedItem(item);
        setSelectedFile(null);
        setPreviewUrl(item.imageUrl || null);
        setFormSuccess(null);
        setFormError(null);

        reset({
            imageUrl: item.imageUrl || "",
            imageFileId: item.imageFileId || "",
            year: item.year || new Date().getFullYear(),
            category: item.category,
            tournament: item.tournament || "",
            eventName: item.eventName || "",
            caption: item.caption || "",
            description: item.description || "",
            taggedPlayers: item.taggedPlayers || [],
        });

        setTaggedPlayerIds(item.taggedPlayers || []);
        setMobileTab("form");
    };

    // -------------------------------------------------------------------------
    // Reset to Create Mode
    // -------------------------------------------------------------------------
    const handleAddNew = () => {
        setSelectedItem(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setFormSuccess(null);
        setFormError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        reset({
            imageUrl: "",
            imageFileId: "",
            year: new Date().getFullYear(),
            category: "Match Photos",
            tournament: "",
            eventName: "",
            caption: "",
            description: "",
            taggedPlayers: [],
        });

        setTaggedPlayerIds([]);
        setMobileTab("form");
    };

    // -------------------------------------------------------------------------
    // Tagged Players Handlers
    // -------------------------------------------------------------------------
    const handleAddPlayer = (playerId: string) => {
        if (!taggedPlayerIds.includes(playerId)) {
            const next = [...taggedPlayerIds, playerId];
            setTaggedPlayerIds(next);
            setValue("taggedPlayers", next);
        }
        setPlayerSearchQuery("");
        setShowPlayerDropdown(false);
    };

    const handleRemovePlayer = (playerId: string) => {
        const next = taggedPlayerIds.filter((id) => id !== playerId);
        setTaggedPlayerIds(next);
        setValue("taggedPlayers", next);
    };

    // Filtered players for tag search dropdown
    const availablePlayersToTag = useMemo(() => {
        return players.filter((p) => {
            if (taggedPlayerIds.includes(p._id)) return false;
            if (!playerSearchQuery.trim()) return true;
            return (
                p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                (p.jerseyNumber && p.jerseyNumber.toString().includes(playerSearchQuery))
            );
        });
    }, [players, taggedPlayerIds, playerSearchQuery]);

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: GalleryFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            // Validate that we have either an uploaded file or an image URL
            if (!selectedFile && !formData.imageUrl && !selectedItem?.imageUrl) {
                setFormError("Please upload an image file or provide a valid image URL.");
                setSubmitting(false);
                return;
            }

            const payload: GalleryItemCreateInput = {
                category: formData.category,
                imageUrl: formData.imageUrl || selectedItem?.imageUrl || "",
                imageFileId: formData.imageFileId || selectedItem?.imageFileId || undefined,
            };

            if (formData.year !== undefined && !Number.isNaN(formData.year)) {
                payload.year = Number(formData.year);
            }

            if (formData.tournament && formData.tournament.trim().length > 0) {
                payload.tournament = formData.tournament.trim();
            }

            if (formData.eventName && formData.eventName.trim().length > 0) {
                payload.eventName = formData.eventName.trim();
            }

            if (formData.caption && formData.caption.trim().length > 0) {
                payload.caption = formData.caption.trim();
            }

            if (formData.description && formData.description.trim().length > 0) {
                payload.description = formData.description.trim();
            }

            if (taggedPlayerIds.length > 0) {
                payload.taggedPlayers = taggedPlayerIds;
            }

            if (selectedItem) {
                // Update
                const response = await updateGalleryItem(selectedItem._id, payload, selectedFile || undefined);
                setFormSuccess(`Gallery asset "${response.data.caption || response.data._id}" updated successfully.`);
                setSelectedItem(response.data);
                setPreviewUrl(response.data.imageUrl);
                setValue("imageUrl", response.data.imageUrl);
                if (response.data.imageFileId) {
                    setValue("imageFileId", response.data.imageFileId);
                }
                setSelectedFile(null);
            } else {
                // Create
                const response = await createGalleryItem(payload, selectedFile || undefined);
                setFormSuccess(`Gallery asset committed to the permanent archive.`);
                setSelectedItem(response.data);
                setPreviewUrl(response.data.imageUrl);
                setValue("imageUrl", response.data.imageUrl);
                if (response.data.imageFileId) {
                    setValue("imageFileId", response.data.imageFileId);
                }
                setSelectedFile(null);
            }

            // Refresh directory list
            await fetchItems();
        } catch (err: unknown) {
            console.error("Failed to save gallery asset:", err);
            const errMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Error saving media item. Please check image and required fields.")
                    : "An unexpected error occurred while processing the media upload.";
            setFormError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Delete Handler
    // -------------------------------------------------------------------------
    const handleDeleteClick = (e: React.MouseEvent, item: GalleryItem) => {
        e.stopPropagation();
        setItemToDelete(item);
        setDeleteError(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteGalleryItem(itemToDelete._id);

            // If active in editor, reset
            if (selectedItem?._id === itemToDelete._id) {
                handleAddNew();
            }

            setItemToDelete(null);
            await fetchItems();
        } catch (err: unknown) {
            console.error("Failed to delete gallery item:", err);
            const errMsg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
                          ?.message ?? "Failed to purge media record from database.")
                    : "Could not purge gallery item. Please try again.";
            setDeleteError(errMsg);
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Category Badge Styler
    // -------------------------------------------------------------------------
    const getCategoryBadgeClass = (category: string) => {
        switch (category) {
            case "Team Photos":
                return "bg-[#5a181e]/10 text-[#3d030b] border-[#5a181e]/20";
            case "Match Photos":
                return "bg-[#2D5A3D]/10 text-[#2D5A3D] border-[#2D5A3D]/20";
            case "Awards & Medal Celebrations":
                return "bg-[#fed88b]/40 text-[#765a1a] border-[#fed88b]";
            case "Old/Archive Memories":
                return "bg-[#ECE8E1] text-[#6B665F] border-[#d9c1c0]";
            case "SPARDHA":
                return "bg-[#3d030b] text-[#ffffff] border-[#3d030b]";
            case "Inter-IIT":
                return "bg-[#00210e] text-[#bceec8] border-[#00210e]";
            default:
                return "bg-[#E2DDD4] text-[#1A1A1A] border-[rgba(26,26,26,0.1)]";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F1EA]">
            {/* ================================================================= */}
            {/* TOP BREADCRUMB & HEADER                                          */}
            {/* ================================================================= */}
            <header className="h-14 px-4 md:px-8 flex items-center justify-between bg-[#FCF9F2]/70 backdrop-blur-sm sticky top-0 z-30 border-b border-[rgba(26,26,26,0.06)]">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-[#6B665F] uppercase">
                    <span>ARCHIVE ADMIN</span>
                    <span className="text-[#9C968D]">/</span>
                    <span className="text-[#3d030b] font-semibold">MEDIA &amp; PHOTOGRAPHIC REPOSITORY</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECE8E1] text-[#6B665F] text-[11px] font-medium border border-[rgba(26,26,26,0.08)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3D]"></span>
                        ImageKit Pipeline Active
                    </span>
                    <button
                        onClick={fetchItems}
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
                        CENTRAL ATHLETICS VAULT
                    </span>
                    <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                        Gallery &amp; Media Ledger
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1 max-w-2xl leading-relaxed">
                        Curate high-resolution digitized photographic plates, varsity match media, team portraits, and
                        archival metadata.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleAddNew}
                        className="px-4 py-1.5 rounded-full bg-[#3d030b] text-[#ffffff] hover:bg-[#5a181e] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-none"
                    >
                        <Plus className="w-3.5 h-3.5" />+ Add / Upload Media
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
                    Media Directory ({filteredItems.length})
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
                    {selectedItem ? "Edit Media Dossier" : "New Media Upload"}
                </button>
            </div>

            {/* ================================================================= */}
            {/* MAIN TWO-PANEL WORKSPACE (12 Cols: 7 Left, 5 Right)              */}
            {/* ================================================================= */}
            <main className="px-4 md:px-8 pb-12 grid grid-cols-12 gap-6 items-start">
                {/* ============================================================= */}
                {/* LEFT PANEL: GALLERY DIRECTORY & ARCHIVAL LEDGER (7 Cols)      */}
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
                                placeholder="Search media by caption, tournament, year, or tagged player..."
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
                                Category:
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
                                All ({items.length})
                            </button>
                            {GALLERY_CATEGORIES.map((cat) => (
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[rgba(26,26,26,0.06)] text-xs">
                            {/* Era / Decade Filter */}
                            <div className="flex flex-col gap-1 text-[#6B665F]">
                                <span className="text-[10px] uppercase text-[#9C968D] font-medium">Year / Era</span>
                                <select
                                    value={eraFilter}
                                    onChange={(e) => setEraFilter(e.target.value)}
                                    className="py-1 px-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b]"
                                >
                                    <option value="all">All Eras (1920–2026)</option>
                                    <option value="1920-1939">1920–1939 (Foundation)</option>
                                    <option value="1940-1959">1940–1959 (Post-Independence)</option>
                                    <option value="1960-1979">1960–1979 (Golden Era)</option>
                                    <option value="1980-1999">1980–1999 (Modern Revival)</option>
                                    <option value="2000-2026">2000–Present</option>
                                </select>
                            </div>

                            {/* Tournament Circuit Filter */}
                            <div className="flex flex-col gap-1 text-[#6B665F]">
                                <span className="text-[10px] uppercase text-[#9C968D] font-medium">
                                    Tournament Circuit
                                </span>
                                <select
                                    value={tournamentFilter}
                                    onChange={(e) => setTournamentFilter(e.target.value)}
                                    className="py-1 px-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b] truncate"
                                >
                                    <option value="all">All Tournaments</option>
                                    {tournaments.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tagged Player Filter */}
                            <div className="flex flex-col gap-1 text-[#6B665F]">
                                <span className="text-[10px] uppercase text-[#9C968D] font-medium">Tagged Player</span>
                                <select
                                    value={playerFilter}
                                    onChange={(e) => setPlayerFilter(e.target.value)}
                                    className="py-1 px-2 text-xs bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded text-[#1A1A1A] focus:outline-none focus:border-[#3d030b] truncate"
                                >
                                    <option value="all">Any Tagged Player</option>
                                    {players.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} {p.jerseyNumber ? `(#${p.jerseyNumber})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                                    onClick={fetchItems}
                                    className="mt-2 px-3 py-1 bg-[#ECE8E1] hover:bg-[#E2DDD4] text-xs font-medium rounded text-[#1A1A1A]"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                                <RefreshCw className="w-6 h-6 animate-spin text-[#3d030b]" />
                                <span className="text-xs text-[#6B665F]">Loading media assets from vault...</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                                <ImageIcon className="w-8 h-8 text-[#9C968D]" />
                                <h3 className="text-sm font-semibold text-[#1A1A1A]">No Media Assets Found</h3>
                                <p className="text-xs text-[#6B665F] max-w-sm">
                                    {searchQuery ||
                                    categoryFilter !== "all" ||
                                    eraFilter !== "all" ||
                                    tournamentFilter !== "all" ||
                                    playerFilter !== "all"
                                        ? "No media assets match the active search criteria or filters."
                                        : "No photographic records are currently recorded in the repository."}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddNew}
                                    className="mt-3 px-4 py-1.5 bg-[#3d030b] text-[#ffffff] rounded-full text-xs font-medium hover:bg-[#5a181e]"
                                >
                                    + Upload First Media Plate
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-[#ECE8E1]/60 border-b border-[rgba(26,26,26,0.08)] text-[#6B665F] font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="py-2.5 px-3 font-medium">Plate / Era</th>
                                            <th className="py-2.5 px-3 font-medium">Category</th>
                                            <th className="py-2.5 px-3 font-medium">Event &amp; Caption</th>
                                            <th className="py-2.5 px-3 font-medium">Tournament</th>
                                            <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(26,26,26,0.06)]">
                                        {filteredItems.map((item) => {
                                            const isSelected = selectedItem?._id === item._id;
                                            const contextLabel = resolveTournamentContext(item.tournament);
                                            const taggedNames =
                                                item.taggedPlayers?.map(resolvePlayerName).join(", ") || "";

                                            return (
                                                <tr
                                                    key={item._id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#ECE8E1] border-l-4 border-[#3d030b]"
                                                            : "hover:bg-[#ECE8E1]/50"
                                                    }`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-10 bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] shrink-0 relative overflow-hidden rounded-sm flex items-center justify-center">
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.caption || "Archival Asset"}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.currentTarget as HTMLImageElement).src =
                                                                            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120";
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-[#1A1A1A]">
                                                                    {item.year || "Archive"}
                                                                </span>
                                                                <span className="block text-[10px] text-[#9C968D] font-mono">
                                                                    #MED-
                                                                    {item._id
                                                                        .substring(item._id.length - 4)
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
                                                                item.category,
                                                            )}`}
                                                        >
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 max-w-[200px]">
                                                        <p className="font-medium text-[#1A1A1A] truncate">
                                                            {item.caption ||
                                                                item.eventName ||
                                                                "Untitled Archival Plate"}
                                                        </p>
                                                        {taggedNames ? (
                                                            <p className="text-[10px] text-[#6B665F] truncate mt-0.5">
                                                                Tagged: {taggedNames}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-[#9C968D] truncate mt-0.5">
                                                                No players tagged
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-[#6B665F] text-[11px] max-w-[140px] truncate">
                                                        {contextLabel}
                                                    </td>
                                                    <td className="py-3 px-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setZoomItem(item);
                                                                }}
                                                                className="p-1 text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] rounded"
                                                                title="View Full Plate"
                                                            >
                                                                <Maximize2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectItem(item);
                                                                }}
                                                                className="p-1 text-[#3d030b] hover:bg-[#E2DDD4] rounded"
                                                                title="Edit Item"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteClick(e, item)}
                                                                className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded"
                                                                title="Delete Item"
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
                                Showing {filteredItems.length > 0 ? (page - 1) * limit + 1 : 0}-
                                {Math.min(page * limit, totalRecords)} of {totalRecords} digitized media items
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

                    {/* Archival Context Note Box */}
                    <div className="p-4 bg-[#ECE8E1]/70 border border-[rgba(26,26,26,0.08)] flex items-start gap-3">
                        <Info className="w-4 h-4 text-[#3d030b] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#6B665F] leading-relaxed">
                            <span className="font-semibold text-[#1A1A1A]">ImageKit Cloud Vault Pipeline: </span>
                            All photographic plates uploaded through this console are transformed into web-optimized
                            high-fidelity assets and assigned unique ImageKit file IDs while maintaining strict
                            separation of storage references.
                        </div>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* RIGHT PANEL: MEDIA ITEM DOSSIER FORM (5 Cols)                */}
                {/* ============================================================= */}
                <div
                    className={`col-span-12 lg:col-span-5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.08)] flex flex-col ${
                        mobileTab === "list" ? "hidden lg:flex" : "flex"
                    }`}
                >
                    {/* Dossier Top Status Header */}
                    <div className="p-4 bg-[#ECE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {selectedItem ? (
                                <span className="px-2.5 py-1 rounded-full bg-[#fed88b]/40 text-[#765a1a] border border-[#fed88b] text-[10px] uppercase font-bold tracking-wider">
                                    EDITING MEDIA — ID: #MED-
                                    {selectedItem._id.substring(selectedItem._id.length - 4).toUpperCase()}
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full bg-[#2D5A3D]/10 text-[#2D5A3D] border border-[#2D5A3D]/30 text-[10px] uppercase font-bold tracking-wider">
                                    NEW MEDIA DOSSIER — UPLOAD MODE
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAddNew}
                                className="px-3 py-1 text-xs text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] rounded-full transition-colors font-medium"
                            >
                                {selectedItem ? "Clear / New" : "Reset"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={submitting}
                                className="px-3.5 py-1 text-xs bg-[#3d030b] text-[#ffffff] rounded-full hover:bg-[#5a181e] font-medium transition-colors flex items-center gap-1.5 shadow-none disabled:opacity-50"
                            >
                                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                                {selectedItem ? "Save Changes" : "Commit Record"}
                            </button>
                        </div>
                    </div>

                    {/* Dossier Subtitle Section */}
                    <div className="px-6 pt-5 pb-3 border-b border-[rgba(26,26,26,0.06)]">
                        <h2 className="text-lg font-semibold text-[#1A1A1A] tracking-tight">
                            Media Dossier &amp; Curation
                        </h2>
                        <p className="text-xs text-[#6B665F] mt-0.5">
                            Amend metadata, provenance notes, and tagged player relationships.
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
                        {/* SECTION 1: ASSET & ARCHIVAL PLATE (MEDIA)             */}
                        {/* ----------------------------------------------------- */}
                        <div className="space-y-3 bg-[#FCF9F2] p-4 border border-[rgba(26,26,26,0.1)] rounded">
                            <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] pb-2">
                                <span className="text-[11px] uppercase tracking-wider text-[#3d030b] font-bold">
                                    01. Asset &amp; Archival Plate
                                </span>
                                <span className="text-[10px] text-[#9C968D] font-mono">HIGH-RES CLOUD VAULT</span>
                            </div>

                            {/* Archival Photo Mount / Preview */}
                            <div className="p-3 bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] rounded relative group flex flex-col items-center justify-center">
                                {previewUrl ? (
                                    <div className="w-full h-44 bg-[#E2DDD4] overflow-hidden rounded relative border border-[rgba(26,26,26,0.1)]">
                                        <img
                                            src={previewUrl}
                                            alt="Archival Plate"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src =
                                                    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400";
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setZoomItem(selectedItem || ({ imageUrl: previewUrl } as GalleryItem))
                                            }
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-[#ffffff] flex items-center justify-center hover:bg-[#3d030b] transition-colors"
                                            title="Zoom Archival Resolution"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-40 border-2 border-dashed border-[rgba(26,26,26,0.2)] rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E2DDD4] transition-colors"
                                    >
                                        <UploadCloud className="w-8 h-8 text-[#9C968D]" />
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-[#1A1A1A] block">
                                                Click or Drag image file to upload
                                            </span>
                                            <span className="text-[10px] text-[#9C968D]">
                                                Supports JPEG, PNG, WebP, GIF (Max 10MB)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2 w-full flex items-center justify-between text-[11px] text-[#6B665F]">
                                    <span className="truncate max-w-[200px]">
                                        {selectedFile
                                            ? `Attached: ${selectedFile.name}`
                                            : previewUrl
                                              ? "Archival Image Loaded"
                                              : "No File Selected"}
                                    </span>
                                    {previewUrl && (
                                        <span className="text-[#2D5A3D] flex items-center gap-1 font-medium">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Verified Asset
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Upload Action Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-[#ECE8E1] hover:bg-[#E2DDD4] text-[#1A1A1A] text-xs font-medium rounded border border-[rgba(26,26,26,0.12)] flex items-center gap-1.5 transition-colors"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    {previewUrl ? "Replace Image File" : "Choose Image File"}
                                </button>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={handleClearFile}
                                        className="text-[11px] text-[#ba1a1a] hover:underline"
                                    >
                                        Remove Attached File
                                    </button>
                                )}
                            </div>

                            {/* Image Source URL */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                    Image Source URL
                                </label>
                                <input
                                    type="text"
                                    {...register("imageUrl")}
                                    placeholder="https://ik.imagekit.io/... or external photo URL"
                                    className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] font-mono focus:border-[#3d030b] focus:outline-none"
                                />
                                {errors.imageUrl && (
                                    <span className="text-[11px] text-[#ba1a1a] font-medium">
                                        {errors.imageUrl.message}
                                    </span>
                                )}
                            </div>

                            {/* ImageKit File ID (Separate Field as Required) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                    ImageKit File ID (Separate Archival Reference)
                                </label>
                                <input
                                    type="text"
                                    {...register("imageFileId")}
                                    placeholder="e.g. ik_file_88492019a_78"
                                    className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] font-mono focus:border-[#3d030b] focus:outline-none"
                                />
                                {errors.imageFileId && (
                                    <span className="text-[11px] text-[#ba1a1a] font-medium">
                                        {errors.imageFileId.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 2: CORE ARCHIVAL METADATA                     */}
                        {/* ----------------------------------------------------- */}
                        <div className="space-y-3 bg-[#FCF9F2] p-4 border border-[rgba(26,26,26,0.1)] rounded">
                            <div className="border-b border-[rgba(26,26,26,0.08)] pb-2">
                                <span className="text-[11px] uppercase tracking-wider text-[#3d030b] font-bold">
                                    02. Core Metadata
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                        Year / Date
                                    </label>
                                    <input
                                        type="number"
                                        {...register("year", { valueAsNumber: true })}
                                        placeholder="e.g. 1978"
                                        className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none"
                                    />
                                    {errors.year && (
                                        <span className="text-[11px] text-[#ba1a1a] font-medium">
                                            {errors.year.message}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                        Category <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <select
                                        {...register("category")}
                                        className="w-full text-xs py-1.5 px-2.5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none"
                                    >
                                        {GALLERY_CATEGORIES.map((cat) => (
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

                            {/* Tournament / Edition Selector */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                    Tournament / Edition Reference
                                </label>
                                <select
                                    {...register("tournament")}
                                    className="w-full text-xs py-1.5 px-2.5 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none"
                                >
                                    <option value="">None / Institutional Archival Only</option>
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
                            </div>

                            {/* Event Name */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">Event Name</label>
                                <input
                                    type="text"
                                    {...register("eventName")}
                                    placeholder="e.g. Inter-IIT Sports Meet, Bombay — Men's Final"
                                    className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 3: DESCRIPTIVE COPY & PROVENANCE              */}
                        {/* ----------------------------------------------------- */}
                        <div className="space-y-3 bg-[#FCF9F2] p-4 border border-[rgba(26,26,26,0.1)] rounded">
                            <div className="border-b border-[rgba(26,26,26,0.08)] pb-2">
                                <span className="text-[11px] uppercase tracking-wider text-[#3d030b] font-bold">
                                    03. Descriptive Copy &amp; Provenance
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                    Archival Caption
                                </label>
                                <input
                                    type="text"
                                    {...register("caption")}
                                    placeholder="e.g. Varsity squad lined up at Bombay University Sports Ground prior to gold medal clash."
                                    className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-[#6B665F] font-medium">
                                    Detailed Provenance Description
                                </label>
                                <textarea
                                    {...register("description")}
                                    rows={3}
                                    placeholder="Condition notes, original photographer, repository shelfmark, negative number..."
                                    className="w-full text-xs py-1.5 px-3 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded text-[#1A1A1A] focus:border-[#3d030b] focus:outline-none resize-none leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* ----------------------------------------------------- */}
                        {/* SECTION 4: TAGGED ENTITIES & PLAYERS                  */}
                        {/* ----------------------------------------------------- */}
                        <div className="space-y-3 bg-[#FCF9F2] p-4 border border-[rgba(26,26,26,0.1)] rounded">
                            <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] pb-2">
                                <span className="text-[11px] uppercase tracking-wider text-[#3d030b] font-bold">
                                    04. Tagged Entities &amp; Players
                                </span>
                                <span className="text-[10px] text-[#9C968D]">
                                    {taggedPlayerIds.length} Player{taggedPlayerIds.length !== 1 ? "s" : ""} Tagged
                                </span>
                            </div>

                            {/* Tagged Players Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                                {taggedPlayerIds.map((pId) => (
                                    <span
                                        key={pId}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] text-xs text-[#1A1A1A]"
                                    >
                                        <UserCheck className="w-3 h-3 text-[#2D5A3D]" />
                                        {resolvePlayerName(pId)}
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePlayer(pId)}
                                            className="text-[#9C968D] hover:text-[#ba1a1a]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                {taggedPlayerIds.length === 0 && (
                                    <span className="text-[11px] text-[#9C968D] italic">
                                        No players currently tagged in this photograph plate.
                                    </span>
                                )}
                            </div>

                            {/* Search Player Roster to Tag */}
                            <div className="relative pt-1">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C968D]" />
                                    <input
                                        type="text"
                                        value={playerSearchQuery}
                                        onChange={(e) => {
                                            setPlayerSearchQuery(e.target.value);
                                            setShowPlayerDropdown(true);
                                        }}
                                        onFocus={() => setShowPlayerDropdown(true)}
                                        placeholder="Search player roster to tag..."
                                        className="w-full pl-8 pr-4 py-1.5 text-xs bg-[#FCF9F2] rounded border border-[rgba(26,26,26,0.15)] focus:border-[#3d030b] focus:outline-none placeholder:text-[#9C968D]"
                                    />
                                </div>

                                {showPlayerDropdown && availablePlayersToTag.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#FCF9F2] border border-[rgba(26,26,26,0.15)] rounded-md shadow-lg z-40 max-h-40 overflow-y-auto divide-y divide-[rgba(26,26,26,0.06)]">
                                        {availablePlayersToTag.slice(0, 8).map((p) => (
                                            <div
                                                key={p._id}
                                                onClick={() => handleAddPlayer(p._id)}
                                                className="p-2 text-xs hover:bg-[#ECE8E1] cursor-pointer flex items-center justify-between"
                                            >
                                                <span className="font-medium text-[#1A1A1A]">{p.name}</span>
                                                <span className="text-[10px] text-[#6B665F]">
                                                    {p.jerseyNumber ? `Jersey #${p.jerseyNumber}` : "Roster"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
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
                                        Processing Upload...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        {selectedItem ? "Save Changes / Commit Record" : "Upload & Save to Vault"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ================================================================= */}
            {/* FULL PLATE ZOOM MODAL                                             */}
            {/* ================================================================= */}
            {zoomItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 bg-[#ECE8E1] border-b border-[rgba(26,26,26,0.08)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-[#3d030b]" />
                                <span className="font-semibold text-xs text-[#1A1A1A]">
                                    {zoomItem.caption || zoomItem.eventName || "Archival Photographic Plate"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setZoomItem(null)}
                                className="p-1 rounded text-[#9C968D] hover:text-[#1A1A1A] hover:bg-[#E2DDD4]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#121212]">
                            <img
                                src={zoomItem.imageUrl}
                                alt={zoomItem.caption || "Plate Full Resolution"}
                                className="max-w-full max-h-[70vh] object-contain shadow-lg"
                            />
                        </div>
                        <div className="p-3 bg-[#FCF9F2] border-t border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs text-[#6B665F]">
                            <span>Category: {zoomItem.category || "General"}</span>
                            <span>{zoomItem.year ? `Season: ${zoomItem.year}` : ""}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* DESTRUCTIVE DELETE CONFIRMATION MODAL                             */}
            {/* ================================================================= */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-[#ba1a1a]">
                            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-[#1A1A1A]">Purge Media Asset</h3>
                                <span className="text-xs text-[#6B665F]">
                                    Permanent archival &amp; ImageKit deletion
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-[#6B665F] leading-relaxed">
                            Are you sure you want to permanently delete this media asset{" "}
                            <strong className="text-[#1A1A1A]">
                                "
                                {itemToDelete.caption ||
                                    `#MED-${itemToDelete._id.substring(itemToDelete._id.length - 4).toUpperCase()}`}
                                "
                            </strong>
                            ? The image file will be purged from the ImageKit cloud vault and the database record
                            removed.
                        </p>

                        {deleteError && (
                            <div className="p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded text-[#ba1a1a] text-xs">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setItemToDelete(null)}
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
                    <span>ImageKit Media Vault: Bucket "hockey-archive-media" synced</span>
                </div>
                <div className="text-[11px] text-[#9C968D] uppercase font-mono mt-1 sm:mt-0">
                    INDIAN INSTITUTE OF TECHNOLOGY (BHU) VARANASI — SPORTS ARCHIVES SYSTEM
                </div>
            </footer>
        </div>
    );
}
