import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Search, AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import { getTournaments } from "@/api/tournaments";
import { getCachedTournaments } from "@/lib/catalogCache";
import { useDebounce } from "@/hooks/useDebounce";
import type { Tournament, TournamentQuery } from "@/types/tournament";

const CATEGORY_FILTERS = [
    { label: "All Tournaments", value: "ALL" },
    { label: "SPARDHA", value: "SPARDHA" },
    { label: "Inter-IIT Sports Meet", value: "Inter-IIT" },
    { label: "General Championship (GC)", value: "GC" },
    { label: "Sports Out Fests", value: "Out Fest" },
];

export default function Tournaments() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // If viewing all with no search query, leverage shared in-memory catalog cache
            if (selectedCategory === "ALL" && !debouncedSearch.trim()) {
                const data = await getCachedTournaments();
                setTournaments(data);
                return;
            }

            const queryParams: TournamentQuery = {
                limit: 100,
                sort: "name",
                order: "asc",
            };

            if (selectedCategory !== "ALL") {
                queryParams.type = selectedCategory;
            }

            if (debouncedSearch.trim()) {
                queryParams.name = debouncedSearch.trim();
            }

            const response = await getTournaments(queryParams);
            setTournaments(response.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load tournaments from server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, debouncedSearch]);

    useEffect(() => {
        void fetchTournaments();
    }, [fetchTournaments]);

    // Client-side fallback filter in case backend type string has variant prefixes (e.g. "Inter-IIT" vs "Inter-IIT Sports Meet")
    const filteredTournaments = useMemo(() => {
        if (selectedCategory === "ALL") return tournaments;
        return tournaments.filter((t) => {
            const tType = (t.type || "").toLowerCase();
            const target = selectedCategory.toLowerCase();
            return tType.includes(target) || target.includes(tType);
        });
    }, [tournaments, selectedCategory]);

    const handleResetFilters = () => {
        setSelectedCategory("ALL");
        setSearchQuery("");
    };

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Page Header */}
            <header className="mb-10 border-b border-[rgba(26,26,26,0.08)] pb-8">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-[#3d030b] mb-4 tracking-tight">
                    Tournaments Hub
                </h1>
                <p className="text-base text-base text-[#6B665F] max-w-2xl leading-relaxed">
                    Comprehensive records of all competitive tournaments contested by <br/> IIT (BHU) Hockey across the
                    decades.
                </p>
            </header>

            {/* Category Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10 pb-6 border-b border-[rgba(26,26,26,0.08)]">
                {/* Horizontally Scrollable Category Pills */}
                <div className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto scrollbar-none">
                    {CATEGORY_FILTERS.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === cat.value
                                    ? "bg-[#5a181e] text-[#F4F1EA] shadow-sm"
                                    : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)]"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Name Search Box */}
                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-[#9C968D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search tournament name..."
                        aria-label="Search tournament name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded-full text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#5a181e] transition-colors"
                    />
                </div>
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] animate-pulse h-60 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <div className="h-5 bg-[#dcdad3] rounded-full w-20" />
                                <div className="h-5 bg-[#dcdad3] rounded-full w-14" />
                            </div>
                            <div className="space-y-3 my-4">
                                <div className="h-6 bg-[#dcdad3] rounded w-3/4" />
                                <div className="h-3 bg-[#dcdad3] rounded w-full" />
                                <div className="h-3 bg-[#dcdad3] rounded w-5/6" />
                            </div>
                            <div className="h-8 bg-[#dcdad3] rounded w-full pt-2" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] p-8 sm:p-12 border border-[rgba(26,26,26,0.08)] max-w-xl mx-auto text-center space-y-4 my-12">
                    <AlertCircle className="w-10 h-10 text-[#7A2E2E] mx-auto" />
                    <h2 className="text-lg font-medium text-[#1A1A1A]">Unable to Load Tournaments</h2>
                    <p className="text-xs text-[#6B665F] leading-relaxed max-w-md mx-auto">{error}</p>
                    <button
                        type="button"
                        onClick={() => void fetchTournaments()}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] text-xs font-medium transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Connection</span>
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredTournaments.length === 0 && (
                <div className="bg-[#ECE8E1] p-12 border border-[rgba(26,26,26,0.08)] max-w-md mx-auto text-center space-y-4 my-12">
                    <Trophy className="w-10 h-10 text-[#9C968D] mx-auto opacity-70" />
                    <h3 className="text-lg font-medium text-[#1A1A1A]">No Tournaments Found</h3>
                    <p className="text-xs text-[#6B665F] leading-relaxed">
                        No competitive tournament archives match your current filter or search criteria.
                    </p>
                    {(selectedCategory !== "ALL" || searchQuery) && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-xs font-medium text-[#5a181e] hover:underline inline-block mt-2"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            )}

            {/* Tournaments Card Grid */}
            {!loading && !error && filteredTournaments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTournaments.map((tournament) => (
                        <Link
                            key={tournament._id}
                            to={`/tournaments/${tournament._id}`}
                            className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all duration-300 group flex flex-col justify-between"
                        >
                            <div>
                                {/* Header Badges */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-medium text-[#6B665F] bg-[#F1EEE7] px-2.5 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                        {tournament.type}
                                    </span>
                                    <span className="bg-[#2D5A3D] text-[#F4F1EA] px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                                        Archive
                                    </span>
                                </div>

                                {/* Tournament Title */}
                                <h3 className="text-xl font-medium text-[#1A1A1A] group-hover:text-[#3d030b] mb-2 tracking-tight transition-colors">
                                    {tournament.name}
                                </h3>

                                {/* Description */}
                                {tournament.description ? (
                                    <p className="text-xs text-[#6B665F] line-clamp-3 mb-6 leading-relaxed">
                                        {tournament.description}
                                    </p>
                                ) : (
                                    <p className="text-xs text-[#6B665F]/80 italic mb-6">
                                        Historical competitive championship ledger.
                                    </p>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="mt-auto pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs text-[#6B665F]">
                                <div>
                                    <span className="block text-[10px] uppercase text-[#9C968D] tracking-wider font-semibold mb-0.5">
                                        Category
                                    </span>
                                    <span className="font-medium text-[#1A1A1A]">{tournament.type}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#5a181e] font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
