import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Image as ImageIcon,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    RotateCcw,
    Trophy,
    Users,
} from "lucide-react";
import { getGalleryItems } from "@/api/gallery";
import { getTournamentEditions } from "@/api/tournaments";
import { getPlayers } from "@/api/players";
import type { GalleryItem, GalleryQuery } from "@/types/gallery";
import type { TournamentEdition } from "@/types/tournament";
import type { Player } from "@/types/player";

const CATEGORIES = [
    { label: "All Photos", value: "ALL" },
    { label: "Team Photos", value: "Team Photos" },
    { label: "Match Action", value: "Match Photos" },
    { label: "SPARDHA", value: "SPARDHA" },
    { label: "Inter-IIT", value: "Inter-IIT" },
    { label: "General Championship", value: "GC" },
    { label: "Awards & Celebrations", value: "Awards & Medal Celebrations" },
    { label: "Old Archives", value: "Old/Archive Memories" },
    { label: "Other Moments", value: "Other Memorable Moments" },
];

const DECADES = [
    { label: "All Time", value: "ALL" },
    { label: "2020s – Present", value: "2020s", min: 2020, max: 2029 },
    { label: "2010s", value: "2010s", min: 2010, max: 2019 },
    { label: "1980s – 2000s", value: "1980-2009", min: 1980, max: 2009 },
    { label: "1950s – 1970s", value: "1950-1979", min: 1950, max: 1979 },
    { label: "1920s – 1940s", value: "1920-1949", min: 1920, max: 1949 },
];

// Curated authentic archival imagery from the Stitch Historical Gallery design
const ARCHIVAL_FALLBACK_PHOTOS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDeEt7GB4w5flX9hWGBewZIR2wCwDbZXwIs7A4o0-ifM02cHl0IQEzvZ-qweqQeuumlBEXHTENilzZt3tjK_LCy6BURk42rVBQDGIxvEZNkrIv4HuoMxqiWsvsgKXRaYv_d0I37d9sLavi7EadPjtk3JKfGCc0PCvMh0lQP28pkhn0eOs5kq2MhrhyKnnxD38T-g6D5hgYFxiFC-z-7T1PUm5DNHLNChR9nd4KnXSeTid6N95i4rfXI",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA_2riTq7TzagIf2cakNL6xUYXlGeb0K4UpqXNhhNQWbXNidPK_wR3NBWnVSSwJ8zDAU85LnGpN9naFShvVTknhETGztjSXMIcAMIJvT8il0v_zk6duBjWeXBzElZrFz7zV4Gt20wism61af7tjp9C8Troie9EiwZZPQXajAuTrBWa9v28_qmoKPwO7mqV92tm1Yj65sF9kqrhN73O_QHBPLaikjhSCsLLSgqBbisNkxGeI1nteY8JC",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDHNkhfmNtqV19f6gyoiK6zhbYanraxrTV_HfyQ6DS6GQbt97iiZ1xhUMu0PjuM3U7mkuxXPK9AEfIYU7qfjuiHvd56pkEFZsopeYwapF6bjt58oi38qM6yWNmJN1Of-tgcWXXMXX554yXQ8HNhEt678ZY7CBCuFn8p7ibKNCOQpAzjH1dlfeOLzwbmQ0ySjeVhKakZRMSASeH5a-5-riYJ-evgov7kn9EG4ORbRdz1r4fyIsd3F5Nn",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBq_kwV0M6-4RfkohsvwNgyq0j0drFj4ptsf95-YWdGFBI4vzHY5QT466YGSn0YlZltrRPiQ1f632_VdDSnOMVrIj6kEr61tTfSDz4KX-8zvF377Uy8rVtftp-dMS8bw13BVhb_PIxO8CMwlATAOOe9OtvH1Y_BagBskRX58EmY_7RbJIjjE_t9tWS2P7ZOQkQvHJY03iymEGfz-ZB_khyicYm4IbAGDWffLptfXtyXwCisPH0_dC0b",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDo1O5BwdgNhM3hT5QmVvj-ZRkClh3w0NzOu8TOcbCzHgxaQfGvrXlvKsUlTV9xFG6vlLeWXrdAAWHxLT_qqQE9DmsDaqqjBX_FZsQQbjQf1llDX2qcvv2jDbAfgK-k6bh-9wDqkWkyxO5WiEP3gcP-lsn6oQQYo3wgoSugLUIec8lQSzPnRN6mkxbASCLpOEmgGnMbgPJXkvsoeQkTmX-cJQkonfvmpZLJlzICMjVluQKU-VkYqYw",
];

export default function Gallery() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [tournaments, setTournaments] = useState<TournamentEdition[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedDecade, setSelectedDecade] = useState<string>("ALL");
    const [selectedTournament, setSelectedTournament] = useState<string>("ALL");
    const [selectedPlayer, setSelectedPlayer] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Lightbox modal index
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fetchGalleryData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams: GalleryQuery = {
                limit: 100,
                sort: "year",
                order: "desc",
            };

            if (selectedCategory !== "ALL") {
                queryParams.category = selectedCategory;
            }

            const [galleryRes, tournamentsRes, playersRes] = await Promise.all([
                getGalleryItems(queryParams),
                getTournamentEditions({ limit: 100 }).catch(() => ({ data: [] })),
                getPlayers({ limit: 100 }).catch(() => ({ data: [] })),
            ]);

            setItems(galleryRes.data || []);
            setTournaments(tournamentsRes.data || []);
            setPlayers(playersRes.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load archival gallery from server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        void fetchGalleryData();
    }, [fetchGalleryData]);

    // Fast lookup for tournaments
    const tournamentMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const t of tournaments) {
            map.set(t._id, t.edition);
        }
        return map;
    }, [tournaments]);

    // Fast lookup for player names
    const playerMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const p of players) {
            map.set(p._id, p.name);
        }
        return map;
    }, [players]);

    // Filter items client-side for multi-attribute matching (decade, tournament, player, search query)
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Decade filter
            if (selectedDecade !== "ALL") {
                const dec = DECADES.find((d) => d.value === selectedDecade);
                if (dec && dec.min !== undefined && dec.max !== undefined) {
                    if (!item.year || item.year < dec.min || item.year > dec.max) {
                        return false;
                    }
                }
            }

            // Tournament filter
            if (selectedTournament !== "ALL") {
                if (!item.tournament || String(item.tournament) !== selectedTournament) {
                    return false;
                }
            }

            // Player filter
            if (selectedPlayer !== "ALL") {
                if (!item.taggedPlayers || !item.taggedPlayers.some((pId) => String(pId) === selectedPlayer)) {
                    return false;
                }
            }

            // Text search query (caption, description, eventName, category, year)
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const caption = (item.caption || "").toLowerCase();
                const desc = (item.description || "").toLowerCase();
                const event = (item.eventName || "").toLowerCase();
                const cat = (item.category || "").toLowerCase();
                const yearStr = (item.year || "").toString();

                if (
                    !caption.includes(query) &&
                    !desc.includes(query) &&
                    !event.includes(query) &&
                    !cat.includes(query) &&
                    !yearStr.includes(query)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [items, selectedDecade, selectedTournament, selectedPlayer, searchQuery]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;

            if (e.key === "Escape") {
                setLightboxIndex(null);
            } else if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
            } else if (e.key === "ArrowRight") {
                setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, filteredItems.length]);

    const hasActiveFilters =
        selectedCategory !== "ALL" ||
        selectedDecade !== "ALL" ||
        selectedTournament !== "ALL" ||
        selectedPlayer !== "ALL" ||
        searchQuery.trim() !== "";

    const resetFilters = () => {
        setSelectedCategory("ALL");
        setSelectedDecade("ALL");
        setSelectedTournament("ALL");
        setSelectedPlayer("ALL");
        setSearchQuery("");
    };

    const activeLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Header Section */}
            <header className="mb-10 max-w-4xl border-b border-[rgba(26,26,26,0.08)] pb-8">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-[#3d030b] mb-4">
                    Historical Gallery
                </h1>
                <p className="text-sm sm:text-base text-[#6B665F] leading-relaxed max-w-2xl">
                    Visualizing over a century of hockey heritage through our digitized archival collection. Explore
                    moments frozen in time, capturing the spirit and evolution of the game at IIT (BHU).
                </p>
            </header>

            {/* Filter Ribbon */}
            <section className="mb-10 border-b border-[rgba(26,26,26,0.08)] pb-6 space-y-5">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2.5 items-center">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === cat.value
                                    ? "bg-[#5a181e] text-[#F4F1EA] shadow-xs"
                                    : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)]"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Secondary Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                        {/* Decade Filter */}
                        <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase tracking-widest text-[#9C968D] font-medium">
                                Decade:
                            </span>
                            <select
                                value={selectedDecade}
                                onChange={(e) => setSelectedDecade(e.target.value)}
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded-none px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5a181e]"
                            >
                                {DECADES.map((d) => (
                                    <option key={d.value} value={d.value}>
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tournament Filter */}
                        {tournaments.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs uppercase tracking-widest text-[#9C968D] font-medium">
                                    Tournament:
                                </span>
                                <select
                                    value={selectedTournament}
                                    onChange={(e) => setSelectedTournament(e.target.value)}
                                    className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded-none px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5a181e] max-w-[180px] truncate"
                                >
                                    <option value="ALL">All Tournaments</option>
                                    {tournaments.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.edition}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Player Filter */}
                        {players.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs uppercase tracking-widest text-[#9C968D] font-medium">
                                    Player:
                                </span>
                                <select
                                    value={selectedPlayer}
                                    onChange={(e) => setSelectedPlayer(e.target.value)}
                                    className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] rounded-none px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5a181e] max-w-[160px] truncate"
                                >
                                    <option value="ALL">All Players</option>
                                    {players.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Search Input & Reset Action */}
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-[#9C968D] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search gallery records..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded-none text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#5a181e]"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs text-[#5a181e] hover:underline whitespace-nowrap flex items-center gap-1 font-medium shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 animate-pulse">
                            <div className="w-full aspect-[4/3] bg-[#dcdad3] mb-4 border border-[rgba(26,26,26,0.08)]" />
                            <div className="pt-3 border-t border-[rgba(26,26,26,0.08)] space-y-2">
                                <div className="h-5 bg-[#dcdad3] rounded w-3/4" />
                                <div className="h-4 bg-[#dcdad3] rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-12 text-center max-w-xl mx-auto my-12">
                    <AlertCircle className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Unable to Load Historical Gallery</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchGalleryData}
                        className="px-6 py-2.5 border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-12">
                    <ImageIcon className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Archival Photographs Found</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">
                        {hasActiveFilters
                            ? "No historical records matched your active filter selections. Try clearing your category or decade filters."
                            : "No photographs are currently cataloged in the historical gallery."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-6 py-2.5 border border-[rgba(26,26,26,0.25)] hover:border-[#5a181e] rounded-full text-xs font-medium text-[#1A1A1A] hover:text-[#5a181e] hover:bg-[#E2DDD4] transition-colors"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Masonry-Style Gallery Grid */}
            {!loading && !error && filteredItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item, index) => {
                        const fallbackIndex = index % ARCHIVAL_FALLBACK_PHOTOS.length;
                        const fallbackPhoto = ARCHIVAL_FALLBACK_PHOTOS[fallbackIndex];

                        const titleText = item.eventName || item.caption || `${item.category} Memory`;
                        const subtitleText =
                            item.description ||
                            (item.tournament && tournamentMap.get(String(item.tournament))) ||
                            `${item.category} Archival Collection`;

                        return (
                            <div
                                key={item._id}
                                onClick={() => setLightboxIndex(index)}
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                {/* Photo Mount Frame */}
                                <div className="relative w-full overflow-hidden mb-4 bg-[#dcdad3] border border-[rgba(26,26,26,0.08)] aspect-[4/3]">
                                    <img
                                        src={item.imageUrl}
                                        alt={titleText}
                                        onError={(e) => {
                                            // Fallback to authentic curated archival photograph if remote URL is unavailable
                                            e.currentTarget.src = fallbackPhoto;
                                        }}
                                        className="w-full h-full object-cover filter grayscale sepia-[.2] group-hover:scale-[1.02] transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Metadata Section */}
                                <div className="flex flex-col border-t border-[rgba(26,26,26,0.08)] pt-3">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-[#3d030b] group-hover:text-[#5a181e] transition-colors line-clamp-1">
                                            {titleText}
                                        </h3>
                                        {item.year && (
                                            <span className="bg-[#E2DDD4] text-[#6B665F] px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 border border-[rgba(26,26,26,0.08)]">
                                                {item.year}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#6B665F] line-clamp-2 leading-relaxed">
                                        {subtitleText}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox / Archival Preview Modal */}
            {activeLightboxItem && lightboxIndex !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 bg-[#121212]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setLightboxIndex(null)}
                >
                    <div
                        className="bg-[#F4F1EA] border border-[rgba(26,26,26,0.2)] max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 sm:p-8 relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-4 right-4 text-[#6B665F] hover:text-[#1A1A1A] p-2 hover:bg-[#E2DDD4] transition-colors"
                            aria-label="Close Preview"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Navigation Arrows */}
                        <button
                            type="button"
                            onClick={() =>
                                setLightboxIndex((prev) =>
                                    prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1,
                                )
                            }
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 bg-[#F4F1EA]/80 hover:bg-[#F4F1EA] border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] transition-colors"
                            aria-label="Previous Photo"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setLightboxIndex((prev) =>
                                    prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0,
                                )
                            }
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 bg-[#F4F1EA]/80 hover:bg-[#F4F1EA] border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] transition-colors"
                            aria-label="Next Photo"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Main Lightbox Image Frame */}
                        <div className="w-full max-h-[60vh] bg-[#121212] overflow-hidden flex items-center justify-center mb-6 border border-[rgba(26,26,26,0.15)]">
                            <img
                                src={activeLightboxItem.imageUrl}
                                alt={activeLightboxItem.caption || activeLightboxItem.eventName || "Archival Image"}
                                onError={(e) => {
                                    e.currentTarget.src =
                                        ARCHIVAL_FALLBACK_PHOTOS[lightboxIndex % ARCHIVAL_FALLBACK_PHOTOS.length];
                                }}
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </div>

                        {/* Lightbox Dossier Details */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-between items-start gap-3 border-b border-[rgba(26,26,26,0.08)] pb-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-medium text-[#3d030b] font-serif">
                                        {activeLightboxItem.eventName ||
                                            activeLightboxItem.caption ||
                                            "Archival Record"}
                                    </h2>
                                    <span className="text-xs text-[#6B665F] uppercase tracking-wider font-medium">
                                        Classification: {activeLightboxItem.category}
                                    </span>
                                </div>
                                {activeLightboxItem.year && (
                                    <span className="bg-[#5a181e] text-[#F4F1EA] px-3.5 py-1 rounded-full text-xs font-semibold">
                                        {activeLightboxItem.year}
                                    </span>
                                )}
                            </div>

                            {activeLightboxItem.caption && (
                                <p className="text-sm font-medium text-[#1A1A1A]">{activeLightboxItem.caption}</p>
                            )}

                            {activeLightboxItem.description && (
                                <p className="text-xs text-[#6B665F] leading-relaxed">
                                    {activeLightboxItem.description}
                                </p>
                            )}

                            {/* Related Links: Tournament & Tagged Players */}
                            <div className="pt-2 flex flex-wrap gap-4 text-xs">
                                {activeLightboxItem.tournament && (
                                    <div className="flex items-center gap-1.5 text-[#5a181e]">
                                        <Trophy className="w-4 h-4" />
                                        <span>
                                            Campaign:{" "}
                                            {tournamentMap.get(String(activeLightboxItem.tournament)) ||
                                                "Documented Tournament"}
                                        </span>
                                    </div>
                                )}

                                {activeLightboxItem.taggedPlayers && activeLightboxItem.taggedPlayers.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[#6B665F]">
                                        <Users className="w-4 h-4 text-[#5a181e]" />
                                        <span>Tagged Athletes: </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeLightboxItem.taggedPlayers.map((pId) => (
                                                <Link
                                                    key={pId}
                                                    to={`/roster/${pId}`}
                                                    className="underline hover:text-[#3d030b] font-medium"
                                                    onClick={() => setLightboxIndex(null)}
                                                >
                                                    {playerMap.get(String(pId)) || "Athlete"}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
