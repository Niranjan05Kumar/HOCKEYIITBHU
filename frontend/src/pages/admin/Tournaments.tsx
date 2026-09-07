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
    Trophy,
    ExternalLink,
    ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getTournaments, createTournament, updateTournament, deleteTournament } from "@/api/tournaments";
import { getCachedTournamentEditions, invalidateCatalog } from "@/lib/catalogCache";
import type { Tournament, TournamentCreateInput, TournamentEdition } from "@/types/tournament";
import { tournamentFormSchema, type TournamentFormData, TOURNAMENT_TYPE_OPTIONS } from "@/schemas/tournamentSchema";
import AdminSelect from "@/components/admin/AdminSelect";

export default function AdminTournaments() {
    // -------------------------------------------------------------------------
    // List & Query States
    // -------------------------------------------------------------------------
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [listError, setListError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 20;

    // -------------------------------------------------------------------------
    // Tournament Editions (for live edition metrics)
    // -------------------------------------------------------------------------
    const [allEditions, setAllEditions] = useState<TournamentEdition[]>([]);

    // -------------------------------------------------------------------------
    // Form & Selection States
    // -------------------------------------------------------------------------
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Insignia / ImageKit state
    const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Destructive Delete State
    const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
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
    } = useForm<TournamentFormData>({
        resolver: zodResolver(tournamentFormSchema),
        defaultValues: {
            name: "",
            type: "Inter-IIT Sports Meet",
            description: "",
            logo: "",
        },
    });

    const watchedType = watch("type");

    // -------------------------------------------------------------------------
    // Data Fetching: Tournaments & Editions
    // -------------------------------------------------------------------------
    const fetchTournamentsList = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const query: {
                page: number;
                limit: number;
                type?: string;
                sort: "name";
                order: "asc";
            } = {
                page,
                limit,
                sort: "name",
                order: "asc",
            };

            if (categoryFilter !== "all") {
                query.type = categoryFilter;
            }

            const res = await getTournaments(query);
            setTournaments(res.data);
            setTotalRecords(res.meta?.total ?? res.data.length);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load tournaments directory";
            setListError(msg);
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter]);

    useEffect(() => {
        fetchTournamentsList();
    }, [fetchTournamentsList]);

    // Fetch tournament editions from shared cache to calculate real edition counts
    useEffect(() => {
        getCachedTournamentEditions()
            .then((data) => setAllEditions(data))
            .catch(() => setAllEditions([]));
    }, []);

    // -------------------------------------------------------------------------
    // Fast Tournament ID -> Editions Metric Mapping
    // -------------------------------------------------------------------------
    const editionsMap = useMemo(() => {
        const map = new Map<string, TournamentEdition[]>();
        for (const edition of allEditions) {
            const tId =
                typeof edition.tournament === "string"
                    ? edition.tournament
                    : (edition.tournament as { _id?: string })?._id;
            if (tId) {
                const existing = map.get(tId) || [];
                existing.push(edition);
                map.set(tId, existing);
            }
        }
        return map;
    }, [allEditions]);

    // -------------------------------------------------------------------------
    // Client-side Search Filtering
    // -------------------------------------------------------------------------
    const filteredTournaments = useMemo(() => {
        if (!searchQuery.trim()) return tournaments;
        const q = searchQuery.toLowerCase().trim();
        return tournaments.filter((trn) => {
            const matchesName = trn.name.toLowerCase().includes(q);
            const matchesType = trn.type.toLowerCase().includes(q);
            const matchesDesc = trn.description?.toLowerCase().includes(q);
            return matchesName || matchesType || matchesDesc;
        });
    }, [tournaments, searchQuery]);

    // -------------------------------------------------------------------------
    // Form Population on Tournament Select
    // -------------------------------------------------------------------------
    const selectTournamentForEdit = useCallback(
        (tournament: Tournament) => {
            setSelectedTournament(tournament);
            setFormSuccess(null);
            setFormError(null);
            setSelectedLogoFile(null);
            setLogoPreview(tournament.logo || null);
            setMobileTab("form");

            reset({
                name: tournament.name,
                type: tournament.type,
                description: tournament.description || "",
                logo: tournament.logo || "",
            });
        },
        [reset],
    );

    const switchModeToCreate = () => {
        setSelectedTournament(null);
        setFormSuccess(null);
        setFormError(null);
        setSelectedLogoFile(null);
        setLogoPreview(null);
        setMobileTab("form");
        reset({
            name: "",
            type: "Inter-IIT Sports Meet",
            description: "",
            logo: "",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleReset = () => {
        setFormSuccess(null);
        setFormError(null);
        if (selectedTournament) {
            selectTournamentForEdit(selectedTournament);
        } else {
            switchModeToCreate();
        }
    };

    // -------------------------------------------------------------------------
    // Logo File Selection Handler
    // -------------------------------------------------------------------------
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check: 5MB
        if (file.size > 5 * 1024 * 1024) {
            setFormError("Selected emblem exceeds the 5MB ImageKit file size limit.");
            return;
        }

        setSelectedLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setValue("logo", ""); // File will be uploaded to ImageKit on submit
        setFormError(null);
    };

    const handleClearLogo = () => {
        setSelectedLogoFile(null);
        setLogoPreview(null);
        setValue("logo", "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // -------------------------------------------------------------------------
    // Form Submission: Create or Update
    // -------------------------------------------------------------------------
    const onSubmit = async (formData: TournamentFormData) => {
        setSubmitting(true);
        setFormSuccess(null);
        setFormError(null);

        try {
            const payload: TournamentCreateInput = {
                name: formData.name.trim(),
                type: formData.type,
                description: formData.description?.trim() ? formData.description.trim() : undefined,
                logo: formData.logo?.trim() ? formData.logo.trim() : undefined,
            };

            if (selectedTournament) {
                // UPDATE RECORD
                const updated = await updateTournament(selectedTournament._id, payload, selectedLogoFile || undefined);
                setFormSuccess(`Tournament record "${updated.data.name}" updated successfully.`);
                setSelectedTournament(updated.data);
                if (updated.data.logo) {
                    setLogoPreview(updated.data.logo);
                }
                setSelectedLogoFile(null);
            } else {
                // CREATE RECORD
                const created = await createTournament(payload, selectedLogoFile || undefined);
                setFormSuccess(`New tournament circuit "${created.data.name}" registered successfully.`);
                setSelectedTournament(created.data);
                if (created.data.logo) {
                    setLogoPreview(created.data.logo);
                }
                setSelectedLogoFile(null);
            }

            invalidateCatalog("tournaments");
            await fetchTournamentsList();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An error occurred while saving tournament record";
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Destructive Deletion Handler
    // -------------------------------------------------------------------------
    const confirmDeleteTournament = async () => {
        if (!tournamentToDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteTournament(tournamentToDelete._id);
            if (selectedTournament?._id === tournamentToDelete._id) {
                switchModeToCreate();
            }
            setTournamentToDelete(null);
            invalidateCatalog("tournaments");
            await fetchTournamentsList();
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Unable to delete tournament. Ensure no historical editions reference this circuit.";
            setDeleteError(msg);
        } finally {
            setDeleting(false);
        }
    };

    // Helper: Compute metrics for the currently selected tournament
    const selectedEditions = selectedTournament ? editionsMap.get(selectedTournament._id) || [] : [];
    const editionYears = selectedEditions.map((e) => e.year).filter((y) => typeof y === "number");
    const inauguralYear = editionYears.length > 0 ? Math.min(...editionYears) : "—";
    const lastHeldYear = editionYears.length > 0 ? Math.max(...editionYears) : "—";

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA]">
            {/* Standardized Admin Page Header */}
            <header className="px-6 md:px-8 py-6 border-b border-[rgba(26,26,26,0.08)] bg-[#FCF9F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-tight">
                        Tournaments Directory &amp; Classification
                    </h1>
                    <p className="text-xs md:text-sm text-[#6B665F] mt-1">Manage tournament records and categories.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            invalidateCatalog("tournaments");
                            void fetchTournamentsList();
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
                        <span>Add New Tournament</span>
                    </button>
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
                    Circuits ({filteredTournaments.length})
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
                    {selectedTournament ? "Edit Dossier" : "New Tournament"}
                </button>
            </div>

            {/* Main Two-Panel Workspace Container */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
                    {/* ========================================================= */}
                    {/* LEFT PANEL: Tournament Directory (~58% width)             */}
                    {/* ========================================================= */}
                    <section
                        className={`w-full lg:w-[58%] flex flex-col space-y-4 ${
                            mobileTab === "form" ? "hidden lg:flex" : "flex"
                        }`}
                    >
                        {/* Filter & Search Console */}
                        <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 flex flex-col gap-3 corner-decor relative">
                            <div className="flex items-center justify-between gap-3">
                                {/* Search by Title or Category */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3 top-2.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search tournaments by title or category..."
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

                                <button
                                    type="button"
                                    onClick={switchModeToCreate}
                                    className="px-3.5 py-2 rounded-full bg-[#3d030b] text-white text-xs font-semibold hover:bg-[#5a181e] transition-colors shrink-0 flex items-center gap-1.5 uppercase tracking-wider"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Circuit</span>
                                </button>
                            </div>

                            {/* Category Filter Pills matching Stitch */}
                            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto select-none pb-0.5 text-xs">
                                <span className="text-[11px] text-[#6B665F] font-semibold uppercase tracking-wider mr-1">
                                    Filter:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter("all");
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                        categoryFilter === "all"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    All ({totalRecords})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter("SPARDHA");
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                        categoryFilter === "SPARDHA"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    SPARDHA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter("Inter-IIT Sports Meet");
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                        categoryFilter === "Inter-IIT Sports Meet"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    Inter-IIT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter("General Championship (GC)");
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                        categoryFilter === "General Championship (GC)"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    General Championship (GC)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter("Sports Out Fests");
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                        categoryFilter === "Sports Out Fests"
                                            ? "bg-[#3d030b] text-white"
                                            : "bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] hover:bg-[#E2DDD4]"
                                    }`}
                                >
                                    Sports Out Fests
                                </button>
                            </div>
                        </div>

                        {/* List Error Banner */}
                        {listError && (
                            <div className="bg-[#ECE8E1] border border-[#7A2E2E]/40 p-4 corner-decor flex items-center justify-between text-xs">
                                <span className="text-[#7A2E2E]">{listError}</span>
                                <button
                                    type="button"
                                    onClick={fetchTournamentsList}
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
                                            <th className="py-3 px-4">Tournament Name &amp; Scope</th>
                                            <th className="py-3 px-4 w-44">Category / Circuit</th>
                                            <th className="py-3 px-4 w-28 text-center">Total Editions</th>
                                            <th className="py-3 px-4 w-28 text-center">Status</th>
                                            <th className="py-3 px-4 w-20 text-right">Actions</th>
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
                                                            <div className="w-10 h-10 bg-[#E2DDD4] rounded" />
                                                            <div className="space-y-1">
                                                                <div className="h-3 w-32 bg-[#E2DDD4] rounded" />
                                                                <div className="h-2 w-48 bg-[#E2DDD4] rounded" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="h-3 w-24 bg-[#E2DDD4] rounded" />
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="h-4 w-16 bg-[#E2DDD4] rounded mx-auto" />
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="h-4 w-20 bg-[#E2DDD4] rounded mx-auto" />
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="h-4 w-12 bg-[#E2DDD4] rounded ml-auto" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredTournaments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[#6B665F]">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <Trophy className="w-8 h-8 text-[#9C968D] mx-auto stroke-1" />
                                                        <p className="font-medium text-[#1A1A1A]">
                                                            No tournament records found
                                                        </p>
                                                        <p className="text-[11px] text-[#9C968D]">
                                                            {searchQuery || categoryFilter !== "all"
                                                                ? "No tournament circuits match your search or filter criteria."
                                                                : "There are no tournament categories registered in the archive ledger yet."}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={switchModeToCreate}
                                                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#3d030b] text-white hover:bg-[#5a181e] transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Register First Tournament</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTournaments.map((tournament, index) => {
                                                const isSelected = selectedTournament?._id === tournament._id;
                                                const editionsCount = editionsMap.get(tournament._id)?.length || 0;

                                                return (
                                                    <tr
                                                        key={tournament._id}
                                                        onClick={() => selectTournamentForEdit(tournament)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isSelected
                                                                ? "bg-[#E2DDD4] font-medium border-l-4 border-l-[#3d030b]"
                                                                : "hover:bg-[#EAE5DC]"
                                                        }`}
                                                    >
                                                        {/* Number Index */}
                                                        <td className="py-3.5 px-3 text-center font-mono text-[#9C968D]">
                                                            {String(index + 1).padStart(2, "0")}
                                                        </td>

                                                        {/* Tournament Name & Scope */}
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 bg-[#DED9CE] border border-[rgba(26,26,26,0.12)] p-1 flex items-center justify-center shrink-0">
                                                                    {tournament.logo ? (
                                                                        <img
                                                                            src={tournament.logo}
                                                                            alt={tournament.name}
                                                                            className="w-full h-full object-contain"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <Trophy className="w-5 h-5 text-[#9C968D]" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5 truncate">
                                                                        {tournament.name}
                                                                        {isSelected && (
                                                                            <span
                                                                                className="w-1.5 h-1.5 rounded-full bg-[#3d030b]"
                                                                                title="Active Selected Record"
                                                                            />
                                                                        )}
                                                                    </span>
                                                                    <span className="text-[11px] text-[#6B665F] line-clamp-1 leading-snug mt-0.5">
                                                                        {tournament.description ||
                                                                            "Official sanctioned tournament circuit"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Category / Circuit */}
                                                        <td className="py-3.5 px-4">
                                                            <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-[#F4F1EA] text-[#6B665F] border border-[rgba(26,26,26,0.1)] whitespace-nowrap">
                                                                {tournament.type}
                                                            </span>
                                                        </td>

                                                        {/* Total Editions (Real Data) */}
                                                        <td className="py-3.5 px-4 text-center font-mono text-[#1A1A1A] font-semibold">
                                                            {editionsCount}{" "}
                                                            <span className="text-[10px] text-[#9C968D] font-normal">
                                                                {editionsCount === 1 ? "Edition" : "Editions"}
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="py-3.5 px-4 text-center">
                                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#2D5A3D]/10 text-[#2D5A3D] border border-[#2D5A3D]/20">
                                                                Active Circuit
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
                                                                    onClick={() => selectTournamentForEdit(tournament)}
                                                                    className="p-1 rounded text-[#6B665F] hover:text-[#3d030b] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Edit Dossier"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTournamentToDelete(tournament)}
                                                                    className="p-1 rounded text-[#9C968D] hover:text-[#7A2E2E] hover:bg-[#F4F1EA] transition-colors"
                                                                    title="Delete Tournament"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <Link
                                                                    to={`/tournaments/${tournament._id}`}
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
                                    Showing {filteredTournaments.length} of {totalRecords} verified tournament circuits
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
                    {/* RIGHT PANEL: Tournament Dossier Form (~42% width)         */}
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
                                {selectedTournament && (
                                    <div className="flex items-center mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2DDD4] text-[#3d030b] border border-[#3d030b]/20 tracking-wider uppercase font-mono">
                                            EDITING TOURNAMENT — {selectedTournament.name.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <h2 className="text-lg font-serif text-[#1A1A1A] tracking-tight">Tournament Dossier</h2>
                                <p className="text-xs text-[#6B665F] mt-0.5">
                                    Configure competition circuit identity, regulatory category, permanent branding, and
                                    institutional notes.
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

                            {/* Section 1: Tournament Identification */}
                            <div className="space-y-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    1. Tournament Identification
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Tournament Name <span className="text-[#7A2E2E]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register("name")}
                                        className="w-full px-3 py-2 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b]"
                                        placeholder="e.g. Inter-IIT Sports Meet"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Classification Category <span className="text-[#7A2E2E]">*</span>
                                    </label>
                                    <AdminSelect
                                        value={watchedType}
                                        onChange={(val) =>
                                            setValue("type", val as TournamentFormData["type"], {
                                                shouldValidate: true,
                                            })
                                        }
                                        options={TOURNAMENT_TYPE_OPTIONS.map((opt) => ({
                                            value: opt.value,
                                            label: opt.label,
                                        }))}
                                        placeholder="Select Classification Category"
                                        error={Boolean(errors.type)}
                                    />
                                    {errors.type && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.type.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Descriptive Overview */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    2. Descriptive Overview
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                                        Short Archival Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        {...register("description")}
                                        className="w-full p-3 text-xs bg-[#F4F1EA] text-[#1A1A1A] border border-[rgba(26,26,26,0.1)] rounded focus:outline-none focus:border-[#3d030b] resize-none"
                                        placeholder="Historic and curatorial context regarding this competition circuit..."
                                    />
                                    {errors.description && (
                                        <p className="text-[11px] text-[#7A2E2E] mt-1">{errors.description.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Tournament Insignia / Cover Asset */}
                            <div className="space-y-3">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    3. Tournament Insignia / Cover Asset
                                </h3>

                                <div className="p-3 bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] flex items-center gap-4 rounded-xs">
                                    <div className="w-14 h-14 bg-[#DED9CE] border border-[rgba(26,26,26,0.12)] p-1 flex items-center justify-center shrink-0">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Insignia Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Trophy className="w-6 h-6 text-[#9C968D]" />
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="text-xs font-mono font-medium text-[#1A1A1A] truncate">
                                                {selectedLogoFile
                                                    ? selectedLogoFile.name
                                                    : selectedTournament?.logo
                                                      ? "Archival Crest Linked"
                                                      : "No insignia attached"}
                                            </div>
                                            <div className="text-[11px] text-[#6B665F]">
                                                {selectedLogoFile
                                                    ? `${(selectedLogoFile.size / 1024).toFixed(0)} KB · Ready to upload`
                                                    : "PNG, JPEG, WebP · Max 5MB"}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 mt-2">
                                            <label className="text-[11px] text-[#3d030b] font-semibold hover:underline cursor-pointer flex items-center space-x-1">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>{logoPreview ? "Replace Insignia" : "Upload Insignia"}</span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    onChange={handleLogoFileChange}
                                                    className="hidden"
                                                />
                                            </label>

                                            {(selectedLogoFile || logoPreview) && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearLogo}
                                                    className="text-[11px] text-[#7A2E2E] hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {errors.logo && <p className="text-[11px] text-[#7A2E2E]">{errors.logo.message}</p>}
                            </div>

                            {/* Section 4: Circuit Metrics & Editions Summary */}
                            <div className="space-y-3">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    4. Circuit Metrics &amp; Editions Summary
                                </h3>

                                <div className="grid grid-cols-3 gap-2 py-1 text-center">
                                    <div className="bg-[#F4F1EA] p-2.5 border border-[rgba(26,26,26,0.1)]">
                                        <span className="block text-[10px] text-[#9C968D] uppercase tracking-wider">
                                            Documented
                                        </span>
                                        <span className="text-lg font-bold text-[#3d030b] font-mono">
                                            {selectedEditions.length}
                                        </span>
                                        <span className="block text-[10px] text-[#6B665F]">Editions</span>
                                    </div>
                                    <div className="bg-[#F4F1EA] p-2.5 border border-[rgba(26,26,26,0.1)]">
                                        <span className="block text-[10px] text-[#9C968D] uppercase tracking-wider">
                                            Inaugural
                                        </span>
                                        <span className="text-lg font-bold text-[#1A1A1A] font-mono">
                                            {inauguralYear}
                                        </span>
                                        <span className="block text-[10px] text-[#6B665F]">First Recorded</span>
                                    </div>
                                    <div className="bg-[#F4F1EA] p-2.5 border border-[rgba(26,26,26,0.1)]">
                                        <span className="block text-[10px] text-[#9C968D] uppercase tracking-wider">
                                            Last Held
                                        </span>
                                        <span className="text-lg font-bold text-[#1A1A1A] font-mono">
                                            {lastHeldYear}
                                        </span>
                                        <span className="block text-[10px] text-[#6B665F]">Recent Edition</span>
                                    </div>
                                </div>

                                <Link
                                    to="/admin/tournament-editions"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d030b] hover:underline pt-1"
                                >
                                    <span>Open Tournament Editions Ledger</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {/* Section 5: Status & Recognition */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-[#6B665F] font-semibold border-b border-[rgba(26,26,26,0.08)] pb-1">
                                    5. Status &amp; Recognition
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-[#1A1A1A] pt-1">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="circuit_status"
                                            defaultChecked
                                            className="text-[#3d030b] focus:ring-0"
                                        />
                                        <span className="font-medium">Active Circuit</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-[#6B665F]">
                                        <input
                                            type="radio"
                                            name="circuit_status"
                                            className="text-[#3d030b] focus:ring-0"
                                        />
                                        <span>Historic / Concluded</span>
                                    </label>
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
                                    <span>{selectedTournament ? "Save Changes" : "Commit Record"}</span>
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            </main>

            {/* ============================================================= */}
            {/* Destructive Delete Confirmation Modal                         */}
            {/* ============================================================= */}
            {tournamentToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 max-w-md w-full corner-decor relative space-y-4 shadow-xl">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 rounded bg-red-100 text-[#7A2E2E]">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1A1A1A]">
                                    Delete Tournament ({tournamentToDelete.name})
                                </h3>
                                <p className="text-xs text-[#6B665F] mt-1 leading-relaxed">
                                    Are you sure you want to permanently delete the circuit &ldquo;
                                    {tournamentToDelete.name}&rdquo;? This action is irreversible. Note that tournaments
                                    linked to historical editions cannot be deleted until editions are reassigned or
                                    removed.
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
                                    setTournamentToDelete(null);
                                    setDeleteError(null);
                                }}
                                disabled={deleting}
                                className="px-4 py-2 border border-[rgba(26,26,26,0.12)] rounded-full text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] bg-[#F4F1EA] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteTournament}
                                disabled={deleting}
                                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#7A2E2E] text-white hover:bg-[#5a181e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>Delete Tournament Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
