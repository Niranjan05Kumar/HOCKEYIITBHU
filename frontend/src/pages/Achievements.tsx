import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Award, Medal, AlertCircle, RotateCcw } from "lucide-react";
import { getAchievements } from "@/api/achievements";
import { getHistoryEvents } from "@/api/history";
import type { Achievement, AchievementType, RecipientType } from "@/types/achievement";
import type { HistoryEvent } from "@/types/history";

const ARCHIVAL_PHOTO_FALLBACK =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBcM5ZdIUqiaGf60ZQq-2Q0cHW4BfFEzCPOH11KsJe6fX7ewPcMcbzJD-WJpYoIUipjOquBiVKizBUbXrNTp4HiwrlZ25G-JOMa076GVveJAiYf7JjnfPfYkuWUGnRy2Fk3GttsHn5L2y_mceT54jaR-fi68fkUnsMnC_UNqnuvyoY2leVNp_nVTvcoK-8dvEg3ao_VeBCxytIZze-ieUFYgWsRZnQ9TlQrQIFlF2T2-drCtQtsdbXh";

const ACHIEVEMENT_TYPES: { label: string; value: AchievementType | "ALL" }[] = [
    { label: "All Honors", value: "ALL" },
    { label: "Medals", value: "Medal" },
    { label: "Championships", value: "Championship" },
    { label: "Awards", value: "Award" },
    { label: "Major Victories", value: "Major Victory" },
    { label: "Individual", value: "Individual Achievement" },
];

const RECIPIENT_TYPES: { label: string; value: RecipientType | "ALL" }[] = [
    { label: "All Recipients", value: "ALL" },
    { label: "Team", value: "Team" },
    { label: "Player", value: "Player" },
];

const getMedalColorClass = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("gold")) return "text-[#9A7B38]";
    if (lower.includes("silver")) return "text-[#877272]";
    if (lower.includes("bronze")) return "text-[#A0522D]";
    return "text-[#9A7B38]";
};

export default function Achievements() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Curatorial Spotlight fetched from MongoDB
    const [spotlight, setSpotlight] = useState<HistoryEvent | null>(null);
    const [spotlightLoading, setSpotlightLoading] = useState<boolean>(true);

    const [selectedType, setSelectedType] = useState<AchievementType | "ALL">("ALL");
    const [selectedRecipient, setSelectedRecipient] = useState<RecipientType | "ALL">("ALL");
    const [selectedYear, setSelectedYear] = useState<string>("");

    const fetchAchievements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams: Record<string, unknown> = {
                limit: 100,
                sort: "year",
                order: "desc",
            };

            if (selectedType !== "ALL") {
                queryParams.type = selectedType;
            }

            if (selectedRecipient !== "ALL") {
                queryParams.recipientType = selectedRecipient;
            }

            if (selectedYear.trim()) {
                const parsedYear = parseInt(selectedYear, 10);
                if (!Number.isNaN(parsedYear)) {
                    queryParams.year = parsedYear;
                }
            }

            const response = await getAchievements(queryParams);
            setAchievements(response.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load achievements from the server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [selectedType, selectedRecipient, selectedYear]);

    const fetchSpotlight = useCallback(async () => {
        setSpotlightLoading(true);
        try {
            const response = await getHistoryEvents({
                limit: 1,
                sort: "year",
                order: "desc",
            });
            if (response.data && response.data.length > 0) {
                setSpotlight(response.data[0]);
            } else {
                setSpotlight(null);
            }
        } catch {
            setSpotlight(null);
        } finally {
            setSpotlightLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAchievements();
        void fetchSpotlight();
    }, [fetchAchievements, fetchSpotlight]);

    // Segment achievements for display
    const { medalsList, titlesList } = useMemo(() => {
        if (selectedType !== "ALL") {
            return { medalsList: achievements, titlesList: [] };
        }

        const medals = achievements.filter((a) => a.type === "Medal");
        const titles = achievements.filter((a) => a.type !== "Medal");

        if (medals.length === 0) {
            return { medalsList: titles, titlesList: [] };
        }

        return { medalsList: medals, titlesList: titles };
    }, [achievements, selectedType]);

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Page Header */}
            <div className="mb-10 border-b border-[rgba(26,26,26,0.08)] pb-8">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-[#3d030b] mb-4 tracking-tight">
                    Achievements Cabinet
                </h1>
                <p className="text-base sm:text-lg text-[#6B665F] max-w-2xl leading-relaxed">
                    A chronological record of team honors and individual accolades.
                </p>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-[rgba(26,26,26,0.08)]">
                {/* Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {ACHIEVEMENT_TYPES.map((typeOption) => (
                        <button
                            key={typeOption.value}
                            type="button"
                            onClick={() => setSelectedType(typeOption.value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedType === typeOption.value
                                    ? "bg-[#5a181e] text-[#F4F1EA]"
                                    : "bg-[#ECE8E1] text-[#6B665F] hover:bg-[#E2DDD4] border border-[rgba(26,26,26,0.08)]"
                            }`}
                        >
                            {typeOption.label}
                        </button>
                    ))}
                </div>

                {/* Secondary Filters: Recipient & Year */}
                <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
                    {/* Recipient Dropdown */}
                    <select
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value as RecipientType | "ALL")}
                        aria-label="Filter by recipient"
                        className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] text-[#1A1A1A] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#5a181e]"
                    >
                        {RECIPIENT_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Year Input */}
                    <input
                        type="number"
                        placeholder="Year (e.g. 1998)"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-32 bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] text-[#1A1A1A] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#5a181e]"
                    />

                    {(selectedType !== "ALL" || selectedRecipient !== "ALL" || selectedYear) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("ALL");
                                setSelectedRecipient("ALL");
                                setSelectedYear("");
                            }}
                            className="text-xs text-[#5a181e] hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
                    <div className="md:col-span-8 space-y-6">
                        <div className="h-8 bg-[#ECE8E1] rounded w-48 animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] animate-pulse h-48"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-4 space-y-6">
                        <div className="h-8 bg-[#ECE8E1] rounded w-36 animate-pulse" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] animate-pulse h-20"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 text-center max-w-xl mx-auto my-12">
                    <AlertCircle className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-80" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">Unable to Load Achievements</h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] mb-5 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchAchievements}
                        className="px-6 py-2 border border-[#5A181E] text-[#5A181E] hover:bg-[#5A181E] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && achievements.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-12">
                    <Trophy className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-50" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">No Achievements Found</h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] leading-relaxed mb-6">
                        No records match the current filter criteria in the institutional database.
                    </p>
                    {(selectedType !== "ALL" || selectedRecipient !== "ALL" || selectedYear) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType("ALL");
                                setSelectedRecipient("ALL");
                                setSelectedYear("");
                            }}
                            className="px-6 py-2 bg-[#5A181E] text-[#F4F1EA] rounded-full text-xs font-medium hover:bg-[#3D030B] transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Real Data Bento Grid */}
            {!loading && !error && achievements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
                    {/* Primary Showcase Section */}
                    <section className={`${titlesList.length > 0 ? "md:col-span-8" : "md:col-span-12"} space-y-6`}>
                        <h2 className="text-2xl font-medium text-[#1A1A1A] border-b border-[rgba(26,26,26,0.08)] pb-2 mb-6">
                            {selectedType === "ALL" ? "Inter-IIT & Institutional Honors" : `${selectedType} Records`}
                        </h2>

                        <div
                            className={`grid grid-cols-1 ${
                                titlesList.length > 0 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3"
                            } gap-6`}
                        >
                            {medalsList.map((item) => (
                                <article
                                    key={item._id}
                                    className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] rounded-none hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <Medal className={`w-9 h-9 ${getMedalColorClass(item.title)}`} />
                                            <span className="text-xs font-medium text-[#6B665F] bg-[#F1EEE7] px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                                {item.year}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-medium text-[#3d030b] mb-2 tracking-tight">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-xs text-[#6B665F] mb-4 leading-relaxed line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[rgba(26,26,26,0.08)] pt-4 mt-6">
                                        <span className="text-[11px] text-[#9C968D] uppercase tracking-wider font-semibold">
                                            {item.recipientType}
                                        </span>
                                        <span className="text-xs text-[#1A1A1A] font-medium bg-[#F1EEE7] px-2.5 py-0.5 rounded">
                                            {item.type}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Titles & Tournament Honors Section (4 cols, rendered when present) */}
                    {titlesList.length > 0 && (
                        <section className="md:col-span-4 space-y-6">
                            <h2 className="text-2xl font-medium text-[#1A1A1A] border-b border-[rgba(26,26,26,0.08)] pb-2 mb-6">
                                Tournament Titles
                            </h2>

                            <div className="flex flex-col gap-4">
                                {titlesList.map((item) => (
                                    <div
                                        key={item._id}
                                        className="bg-[#ECE8E1] p-4 border border-[rgba(26,26,26,0.08)] flex items-center hover:bg-[#E2DDD4] transition-colors"
                                    >
                                        <div className="h-12 w-12 bg-[#F4F1EA] flex items-center justify-center mr-4 shrink-0 border border-[rgba(26,26,26,0.08)]">
                                            <Trophy className="w-6 h-6 text-[#3d030b]" />
                                        </div>
                                        <div className="flex-grow min-w-0 pr-2">
                                            <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                                                {item.title}
                                            </h4>
                                            <span className="text-xs text-[#6B665F]">
                                                {item.year} • {item.type}
                                            </span>
                                        </div>
                                        <span className="bg-[#2D5A3D] text-[#F4F1EA] px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider shrink-0">
                                            WIN
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* Dynamic Curatorial Spotlight Section */}
            {spotlightLoading && (
                <section className="mt-16 mb-12 border-t border-[rgba(26,26,26,0.08)] pt-12 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-8 bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)]">
                            <div className="w-full aspect-video bg-[#dcdad3]" />
                        </div>
                        <div className="md:col-span-4 p-4 md:p-6 space-y-4">
                            <div className="h-4 bg-[#dcdad3] rounded w-1/3" />
                            <div className="h-8 bg-[#dcdad3] rounded w-3/4" />
                            <div className="space-y-2">
                                <div className="h-3.5 bg-[#dcdad3] rounded w-full" />
                                <div className="h-3.5 bg-[#dcdad3] rounded w-5/6" />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {!spotlightLoading && spotlight && (
                <section className="mt-16 mb-12 border-t border-[rgba(26,26,26,0.08)] pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-8 bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)]">
                            <div className="relative w-full aspect-video overflow-hidden">
                                <img
                                    className="w-full h-full object-cover grayscale contrast-125"
                                    alt={spotlight.title}
                                    src={spotlight.photo || ARCHIVAL_PHOTO_FALLBACK}
                                />
                            </div>
                            <p className="mt-4 text-xs text-[#6B665F] border-t border-[rgba(26,26,26,0.08)] pt-2 text-right">
                                Archival Record: {spotlight.year} • {spotlight.title}
                            </p>
                        </div>

                        <div className="md:col-span-4 p-4 md:p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-[#5a181e]" />
                                <span className="text-xs uppercase tracking-widest text-[#6B665F] font-semibold">
                                    Curatorial Spotlight {spotlight.category ? `• ${spotlight.category}` : ""}
                                </span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-medium text-[#3d030b] mb-4 tracking-tight">
                                {spotlight.title}
                            </h3>
                            <p className="text-sm text-[#1A1A1A] mb-6 leading-relaxed">{spotlight.description}</p>
                            <Link
                                to="/history"
                                className="border border-[#3d030b] text-[#3d030b] px-6 py-2.5 rounded-full text-xs font-medium hover:bg-[#3d030b] hover:text-[#F4F1EA] transition-colors self-start inline-block"
                            >
                                View Archival Ledger &rarr;
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
