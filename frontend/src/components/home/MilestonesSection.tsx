import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, AlertCircle, RotateCcw } from "lucide-react";
import { getHistoryEvents } from "@/api/history";
import type { HistoryCategory, HistoryEvent } from "@/types/history";

const getCategoryBadge = (category: HistoryCategory) => {
    switch (category) {
        case "Major Victory":
        case "Championship":
            return (
                <span className="px-3 py-1 bg-[#2D5A3D] text-[#F4F1EA] rounded-full text-xs uppercase tracking-wider font-medium">
                    {category}
                </span>
            );
        case "Medal":
            return (
                <span className="px-3 py-1 bg-[#9A7B38] text-[#F4F1EA] rounded-full text-xs uppercase tracking-wider font-medium">
                    {category}
                </span>
            );
        case "Milestone":
        case "Memorable Performance":
        default:
            return (
                <span className="px-3 py-1 bg-[#E2DDD4] text-[#6B665F] rounded-full text-xs uppercase tracking-wider font-medium border border-[rgba(26,26,26,0.12)]">
                    {category}
                </span>
            );
    }
};

export default function MilestonesSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [events, setEvents] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch top historical milestones sorted by year descending
            const response = await getHistoryEvents({
                limit: 10,
                sort: "year",
                order: "desc",
            });
            setEvents(response.data || []);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load historical events from the server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchEvents();
    }, [fetchEvents]);

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = direction === "left" ? -420 : 420;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

    return (
        <section className="py-16 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto w-full">
            {/* Header & Controls */}
            <div className="flex justify-between items-end mb-8 md:mb-10">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#1A1A1A] mb-2">
                        Historic Victories
                    </h2>
                    <p className="text-sm text-[#6B665F]">Chronicles of our most defining moments on the field.</p>
                </div>

                {events.length > 0 && (
                    <div className="hidden md:flex gap-2">
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            aria-label="Scroll left"
                            className="w-10 h-10 rounded-full border border-[rgba(26,26,26,0.12)] flex items-center justify-center text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            aria-label="Scroll right"
                            className="w-10 h-10 rounded-full border border-[rgba(26,26,26,0.12)] flex items-center justify-center text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex gap-6 overflow-hidden pb-6">
                    {[1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className="min-w-[300px] sm:min-w-[360px] md:min-w-[400px] bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] animate-pulse flex flex-col justify-between"
                        >
                            <div className="h-48 bg-[#dcdad3] w-full" />
                            <div className="p-6 space-y-4">
                                <div className="h-4 bg-[#dcdad3] rounded w-1/3" />
                                <div className="h-5 bg-[#dcdad3] rounded w-3/4" />
                                <div className="space-y-2">
                                    <div className="h-3.5 bg-[#dcdad3] rounded w-full" />
                                    <div className="h-3.5 bg-[#dcdad3] rounded w-5/6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 text-center max-w-xl mx-auto my-4">
                    <AlertCircle className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-80" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">Unable to Load Historical Archive</h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] mb-5 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchEvents}
                        className="px-6 py-2 border border-[#5A181E] text-[#5A181E] hover:bg-[#5A181E] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && events.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-4">
                    <Calendar className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-50" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">
                        No Historical Milestones Documented Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] leading-relaxed">
                        Championship chronicles and historic tournament moments will appear here once registered in the
                        institutional database.
                    </p>
                </div>
            )}

            {/* Real Data Carousel */}
            {!loading && !error && events.length > 0 && (
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {events.map((event) => (
                        <article
                            key={event._id}
                            className="min-w-[300px] sm:min-w-[360px] md:min-w-[400px] snap-start bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded-none group hover:bg-[#E2DDD4] transition-colors duration-300 flex flex-col justify-between"
                        >
                            <div className="h-48 bg-[#dcdad3] w-full relative overflow-hidden flex items-center justify-center">
                                {event.photo ? (
                                    <img
                                        src={event.photo}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#dcdad3] flex flex-col items-center justify-center p-6 text-center text-[#6B665F]">
                                        <Calendar className="w-8 h-8 mb-2 text-[#5A181E]/40" />
                                        <span className="text-xs uppercase tracking-widest font-semibold">
                                            Archival Record • {event.year}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">{getCategoryBadge(event.category)}</div>
                            </div>

                            <div className="p-6">
                                <div className="text-xs font-medium text-[#6B665F] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5 text-[#5A181E]" />
                                    {event.year} {event.tournament ? `• ${event.tournament}` : `• ${event.category}`}
                                </div>
                                <h3 className="text-lg font-medium text-[#1A1A1A] mb-3 tracking-[-0.01em]">
                                    {event.title}
                                </h3>
                                <p className="text-sm text-[#6B665F] leading-relaxed line-clamp-3">
                                    {event.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
