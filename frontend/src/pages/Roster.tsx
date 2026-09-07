import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, AlertCircle, RotateCcw, Users, ArrowRight, X } from "lucide-react";
import { getPlayers } from "@/api/players";
import type { Player, PlayerQuery, PlayingPosition, PlayerStatus } from "@/types/player";
import CustomSelect from "@/components/common/CustomSelect";

const POSITIONS: Array<{ label: string; value: string }> = [
    { label: "All Positions", value: "ALL" },
    { label: "Forward", value: "Forward" },
    { label: "Midfielder", value: "Midfielder" },
    { label: "Defender", value: "Defender" },
    { label: "Goalkeeper", value: "Goalkeeper" },
];

const ERAS = [
    { label: "All Eras", value: "ALL" },
    { label: "2020s", value: "2020s", min: 2020, max: 2029 },
    { label: "2010s", value: "2010s", min: 2010, max: 2019 },
    { label: "2000s", value: "2000s", min: 2000, max: 2009 },
    { label: "1990s", value: "1990s", min: 1990, max: 1999 },
    { label: "Historical", value: "HISTORICAL", min: 1900, max: 1989 },
];

// Curated authentic archival player photography from the Stitch Roster design
const ARCHIVAL_PLAYER_PHOTOS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBl6_gEypZm9cvzdQ1zA9Y1IIjBErshii7sTnsxyjggcUsqZhv418HJzzUor60L7UbXTWRRzlUY_XHBAuj480GvXEcIHC4eQINWonVOeHq6bZVgr2tqDEVml021SFEwt9yaJ5-EYaJ_6NxB0FyaXfWBSExDQu9O6RKmD1Cyz30TrBS5scFGL2j1lsaKnHbbF_6c_Pl3F1pFFjnzbCw2deyOsGkDXeiVUAl6_DjJaGxOsJPyYutmxYHB",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBRsN0PtOXYO6TTEGjGjqn8scJWGhftTnMzfaJ8dyFNe0Dm61J4p7MRgRgzscS_1i7aQssw-DUfGsnC11T4-INAkHkz3UZs0n7aHkKEOTeIJZLv1qRkVep8SZ9mMdWDC7ehYY1-Vw0DtV5AiBVZVcAaOPIQBioui5pY_3qIuGvCqjtAwPSNdANfifo9HldC_nWWvoPFGItE4vJi097BHqEoqOZXS0DYjYNSg-o1oCXY3hQVutSmRvs6",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAjWXJpVxLrGbs50aORqo80FMyQFzugc0ruul6IC4hjOE1Xk_2-zd_7G42TpUhd5Shj1rV8EDMd456cyM3MVn6Hei2UVTODh1lts8aBnuNoqWijUsVLAlC4Tg3JW2xc0DHcdg_O4vnvvrsbsozVV7-5DJvXRbSeoLXSIFjyyfO0nogHH6Uo8j55tbsej4pZBs5gIp43jfKTfJr6agYO0Cv6D7WVtm6r3OFoUAQ0Zb27jwOG8N8ur9H8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD7zVUXzfC7tOKyuZHdNw724FOVsE3JahlDtUG0OxXPT4laMcYGIzmii-oUIBbB0MQ_k9k8R-Elc_yWW1X182E8NsQ1sYC6B61hm4gDzjRwON0TCMIak_nkX7JoBB5rH60r50kCS6XzzRYxQ2oAqymPFbgat9C2KQEqRXIYeflaUp1ZzFp7Uo7D21nP33-OU_nS0ORdfDhD2YPj4lmwNSAQhNdviBi_n77PxcLawQRU35LIhGthofYs",
];

function formatActiveYears(player: Player): string {
    if (!player.playingYears || player.playingYears.length === 0) {
        return player.status === "current" ? "Active: Current Squad" : "Status: Alumnus";
    }

    const sortedYears = [...player.playingYears].sort((a, b) => a - b);
    const minYear = sortedYears[0];
    const maxYear = sortedYears[sortedYears.length - 1];

    if (player.status === "current") {
        return `Active: ${minYear} - Present`;
    }

    if (minYear === maxYear) {
        return `Active: ${minYear}`;
    }

    return `Active: ${minYear} - ${maxYear}`;
}

export default function Roster() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<"ALL" | "current" | "former">("ALL");
    const [positionFilter, setPositionFilter] = useState<string>("ALL");
    const [eraFilter, setEraFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterBarOpen, setFilterBarOpen] = useState<boolean>(true);

    const fetchPlayers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams: PlayerQuery = {
                limit: 100,
                sort: "name",
                order: "asc",
            };

            if (statusFilter !== "ALL") {
                queryParams.status = statusFilter as PlayerStatus;
            }

            if (positionFilter !== "ALL") {
                queryParams.position = positionFilter as PlayingPosition;
            }

            const response = await getPlayers(queryParams);
            setPlayers(response.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load roster directory from server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, positionFilter]);

    useEffect(() => {
        void fetchPlayers();
    }, [fetchPlayers]);

    // Client-side filtering for search query and Era decade
    const filteredPlayers = useMemo(() => {
        return players.filter((player) => {
            // Era filter based on player's playingYears
            if (eraFilter !== "ALL") {
                const eraConfig = ERAS.find((e) => e.value === eraFilter);
                if (eraConfig && eraConfig.min !== undefined && eraConfig.max !== undefined) {
                    const hasYearInEra =
                        player.playingYears &&
                        player.playingYears.some((year) => year >= eraConfig.min && year <= eraConfig.max);
                    if (!hasYearInEra) {
                        return false;
                    }
                }
            }

            // Search query filter (name, jersey number, position)
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const nameMatches = player.name.toLowerCase().includes(query);
                const jerseyMatches =
                    player.jerseyNumber !== undefined && player.jerseyNumber.toString().includes(query);
                const positionMatches = (player.playingPosition || "").toLowerCase().includes(query);

                if (!nameMatches && !jerseyMatches && !positionMatches) {
                    return false;
                }
            }

            return true;
        });
    }, [players, eraFilter, searchQuery]);

    const hasActiveFilters =
        statusFilter !== "ALL" || positionFilter !== "ALL" || eraFilter !== "ALL" || searchQuery.trim() !== "";

    const resetFilters = () => {
        setStatusFilter("ALL");
        setPositionFilter("ALL");
        setEraFilter("ALL");
        setSearchQuery("");
    };

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[rgba(26,26,26,0.08)] pb-8">
                <div>
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-[#1A1A1A] mb-2 font-sans">
                        Roster Directory
                    </h1>
                    <p className="text-sm sm:text-base text-[#6B665F] max-w-2xl leading-relaxed">
                        A comprehensive historical archive of players who have represented IIT (BHU) Hockey. Browse
                        current squad members and distinguished alumni.
                    </p>
                </div>

                {/* Search Box & Filter Toggle */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow sm:min-w-[260px]">
                        <Search className="w-4 h-4 text-[#9C968D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name or jersey #..."
                            aria-label="Search players by name or jersey number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fcf9f2] border border-[rgba(26,26,26,0.12)] rounded-none text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#5a181e] focus:ring-1 focus:ring-[#5a181e] transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setFilterBarOpen((prev) => !prev)}
                        className={`px-5 py-2 rounded-none border text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                            filterBarOpen || hasActiveFilters
                                ? "bg-[#ECE8E1] border-[rgba(26,26,26,0.25)] text-[#1A1A1A]"
                                : "bg-[#fcf9f2] border-[rgba(26,26,26,0.12)] text-[#6B665F] hover:bg-[#E2DDD4]"
                        }`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#5a181e]" />}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {filterBarOpen && (
                <div className="mb-10 p-6 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded-none flex flex-wrap gap-6 items-end">
                    {/* Status Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-wider font-medium text-[#6B665F]">Status</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    statusFilter === "ALL"
                                        ? "bg-[#5a181e] text-[#F4F1EA]"
                                        : "bg-[#fcf9f2] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)] text-[#1A1A1A]"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("current")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    statusFilter === "current"
                                        ? "bg-[#5a181e] text-[#F4F1EA]"
                                        : "bg-[#fcf9f2] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)] text-[#1A1A1A]"
                                }`}
                            >
                                Current
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("former")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    statusFilter === "former"
                                        ? "bg-[#5a181e] text-[#F4F1EA]"
                                        : "bg-[#fcf9f2] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)] text-[#1A1A1A]"
                                }`}
                            >
                                Alumni
                            </button>
                        </div>
                    </div>

                    {/* Position Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-wider font-medium text-[#6B665F]">Position</label>
                        <CustomSelect
                            value={positionFilter}
                            onChange={(val) => setPositionFilter(val)}
                            options={POSITIONS}
                            className="min-w-[170px]"
                        />
                    </div>

                    {/* Era Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-wider font-medium text-[#6B665F]">
                            Era (Decade)
                        </label>
                        <CustomSelect
                            value={eraFilter}
                            onChange={(val) => setEraFilter(val)}
                            options={ERAS}
                            className="min-w-[170px]"
                        />
                    </div>

                    {/* Active Filter Clear Action & Record Count */}
                    <div className="ml-auto flex items-center gap-4">
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs text-[#5a181e] hover:underline flex items-center gap-1 font-medium"
                            >
                                <X className="w-3.5 h-3.5" />
                                Reset Filters
                            </button>
                        )}
                        <span className="text-xs text-[#6B665F]">
                            Showing {filteredPlayers.length} {filteredPlayers.length === 1 ? "record" : "records"}
                        </span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-4 animate-pulse flex flex-col justify-between h-[420px]"
                        >
                            <div className="w-full aspect-[3/4] bg-[#dcdad3] mb-4 border border-[rgba(26,26,26,0.08)]" />
                            <div className="space-y-2 mb-4">
                                <div className="h-5 bg-[#dcdad3] rounded w-3/4" />
                                <div className="h-4 bg-[#dcdad3] rounded w-1/2" />
                            </div>
                            <div className="pt-3 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center">
                                <div className="h-3 bg-[#dcdad3] rounded w-24" />
                                <div className="h-3 bg-[#dcdad3] rounded w-4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-12 text-center max-w-xl mx-auto my-12">
                    <AlertCircle className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Unable to Load Roster</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchPlayers}
                        className="px-6 py-2.5 border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredPlayers.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-12">
                    <Users className="w-10 h-10 text-[#5a181e] mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Players Documented</h3>
                    <p className="text-sm text-[#6B665F] mb-6 leading-relaxed">
                        {hasActiveFilters
                            ? "No player records matched your current filter criteria. Try adjusting your position or era selection."
                            : "No player profiles are currently registered in the archival database."}
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

            {/* Roster Grid */}
            {!loading && !error && filteredPlayers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPlayers.map((player, index) => {
                        // Fallback portrait from curated Stitch assets
                        const fallbackIndex = index % ARCHIVAL_PLAYER_PHOTOS.length;
                        const photoUrl = player.profilePhoto || ARCHIVAL_PLAYER_PHOTOS[fallbackIndex];

                        const isCurrent = player.status === "current";

                        return (
                            <Link
                                key={player._id}
                                to={`/roster/${player._id}`}
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] hover:border-[rgba(26,26,26,0.25)] rounded-none overflow-hidden group hover:bg-[#E2DDD4] transition-colors cursor-pointer flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-[#5a181e]/30"
                            >
                                {/* Photo Mount Frame */}
                                <div className="relative w-full aspect-[3/4] bg-[#dcdad3] p-6">
                                    <img
                                        src={photoUrl}
                                        alt={player.name}
                                        onError={(e) => {
                                            e.currentTarget.src = ARCHIVAL_PLAYER_PHOTOS[0];
                                        }}
                                        className="w-full h-full object-cover transition-all duration-500 border border-[rgba(26,26,26,0.1)]"
                                        loading="lazy"
                                    />
                                    {/* Status Pill Badge */}
                                    <div
                                        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${
                                            isCurrent
                                                ? "bg-[#2D5A3D] text-white"
                                                : "bg-[#ECE8E1] text-[#6B665F] border border-[rgba(26,26,26,0.12)]"
                                        }`}
                                    >
                                        {isCurrent ? "Current" : "Alumni"}
                                    </div>
                                </div>

                                {/* Player Card Details */}
                                <div className="p-4 flex-grow flex flex-col justify-between border-t border-[rgba(26,26,26,0.08)]">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-base font-medium text-[#1A1A1A] group-hover:text-[#5a181e] transition-colors">
                                                {player.name}
                                            </h3>
                                            {player.jerseyNumber !== undefined && (
                                                <span className="text-sm font-medium text-[#9C968D]">
                                                    #{player.jerseyNumber}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#6B665F] uppercase tracking-wider mb-3 font-medium">
                                            {player.playingPosition || "Squad Member"}
                                        </p>
                                    </div>

                                    {/* Active Period & Arrow CTA */}
                                    <div className="pt-3 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                        <span>{formatActiveYears(player)}</span>
                                        <ArrowRight className="w-4 h-4 text-[#9C968D] group-hover:text-[#5a181e] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
