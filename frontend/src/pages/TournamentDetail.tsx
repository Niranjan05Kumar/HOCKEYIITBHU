import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, MapPin, AlertCircle, RotateCcw, ArrowRight, Shield } from "lucide-react";
import { getTournamentById, getTournamentEditions } from "@/api/tournaments";
import type { Tournament, TournamentEdition } from "@/types/tournament";

const getPositionBadge = (pos?: number) => {
    if (pos === 1) {
        return {
            label: "Gold • 1st Place",
            className: "bg-[#2D5A3D] text-[#F4F1EA]",
        };
    }
    if (pos === 2) {
        return {
            label: "Silver • 2nd Place",
            className: "bg-[#877272] text-[#F4F1EA]",
        };
    }
    if (pos === 3) {
        return {
            label: "Bronze • 3rd Place",
            className: "bg-[#A0522D] text-[#F4F1EA]",
        };
    }
    if (pos && pos > 3) {
        return {
            label: `Position #${pos}`,
            className: "bg-[#E2DDD4] text-[#6B665F] border border-[rgba(26,26,26,0.08)]",
        };
    }
    return {
        label: "Documented",
        className: "bg-[#E2DDD4] text-[#6B665F]",
    };
};

export default function TournamentDetail() {
    const { id } = useParams<{ id: string }>();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [editions, setEditions] = useState<TournamentEdition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isNotFound, setIsNotFound] = useState<boolean>(false);

    const fetchTournamentData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setIsNotFound(false);

        try {
            // Fetch tournament details and its associated editions in parallel
            const [tournamentRes, editionsRes] = await Promise.all([
                getTournamentById(id),
                getTournamentEditions({ tournament: id, limit: 100, sort: "year", order: "desc" }),
            ]);

            setTournament(tournamentRes.data);
            setEditions(editionsRes.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load tournament";
            if (errorMessage.toLowerCase().includes("not found")) {
                setIsNotFound(true);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchTournamentData();
    }, [fetchTournamentData]);

    const latestEdition = useMemo(() => {
        return editions.length > 0 ? editions[0] : null;
    }, [editions]);

    return (
        <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-8 text-[#6B665F] text-xs font-medium">
                <Link to="/tournaments" className="hover:text-[#3d030b] transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tournaments
                </Link>
                {tournament && (
                    <>
                        <span>/</span>
                        <span className="text-[#1A1A1A] font-medium">{tournament.name}</span>
                    </>
                )}
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-10 animate-pulse">
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 md:p-12 h-80 rounded-none" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 h-48" />
                        ))}
                    </div>
                </div>
            )}

            {/* Not Found State */}
            {!loading && isNotFound && (
                <div className="bg-[#ECE8E1] p-12 border border-[rgba(26,26,26,0.08)] max-w-md mx-auto text-center space-y-4 my-12">
                    <Shield className="w-12 h-12 text-[#6B665F] mx-auto opacity-60" />
                    <h2 className="text-xl font-medium text-[#1A1A1A]">Tournament Not Found</h2>
                    <p className="text-xs text-[#6B665F] leading-relaxed">
                        The requested tournament record could not be found or has been moved.
                    </p>
                    <Link
                        to="/tournaments"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5a181e] hover:underline mt-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Return to Tournaments Hub
                    </Link>
                </div>
            )}

            {/* Error State */}
            {!loading && !isNotFound && error && (
                <div className="bg-[#ECE8E1] p-8 sm:p-12 border border-[rgba(26,26,26,0.08)] max-w-xl mx-auto text-center space-y-4 my-12">
                    <AlertCircle className="w-10 h-10 text-[#7A2E2E] mx-auto" />
                    <h2 className="text-lg font-medium text-[#1A1A1A]">Unable to Load Tournament Details</h2>
                    <p className="text-xs text-[#6B665F] leading-relaxed max-w-md mx-auto">{error}</p>
                    <button
                        type="button"
                        onClick={() => void fetchTournamentData()}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#5a181e] text-[#5a181e] hover:bg-[#5a181e] hover:text-[#F4F1EA] text-xs font-medium transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Connection</span>
                    </button>
                </div>
            )}

            {/* Real Data Tournament View */}
            {!loading && !error && tournament && (
                <div className="space-y-12">
                    {/* Header Hero Card */}
                    <section className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 md:p-10 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            <div className="md:col-span-8 flex flex-col justify-center">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                                    <span className="bg-[#F1EEE7] text-[#6B665F] text-xs font-medium px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                        {tournament.type}
                                    </span>
                                    <span className="bg-[#F1EEE7] text-[#6B665F] text-xs font-medium px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                        {editions.length} Recorded Edition{editions.length !== 1 ? "s" : ""}
                                    </span>
                                    {latestEdition?.finalPosition === 1 && (
                                        <span className="bg-[#2D5A3D] text-[#F4F1EA] text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                                            <Trophy className="w-3.5 h-3.5 text-[#F4F1EA]" />
                                            Champion
                                        </span>
                                    )}
                                </div>

                                {/* Tournament Title */}
                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-[#3d030b] mb-4 tracking-tight leading-tight">
                                    {tournament.name}
                                </h1>

                                {/* Description */}
                                {tournament.description && (
                                    <p className="text-sm sm:text-base text-[#6B665F] mb-6 leading-relaxed max-w-2xl">
                                        {tournament.description}
                                    </p>
                                )}

                                {/* Metadata Attributes Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-[rgba(26,26,26,0.08)] mt-2">
                                    <div>
                                        <p className="text-[10px] text-[#9C968D] uppercase tracking-widest font-semibold mb-1">
                                            Classification
                                        </p>
                                        <p className="text-sm font-medium text-[#1A1A1A]">{tournament.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#9C968D] uppercase tracking-widest font-semibold mb-1">
                                            Latest Host
                                        </p>
                                        <p className="text-sm font-medium text-[#1A1A1A]">
                                            {latestEdition?.hostInstitute || "Various National Hosts"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#9C968D] uppercase tracking-widest font-semibold mb-1">
                                            Latest Season
                                        </p>
                                        <p className="text-sm font-medium text-[#1A1A1A]">
                                            {latestEdition?.year ? `${latestEdition.year}` : "Historical"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Archival Visual Banner */}
                            {(() => {
                                const tournamentImage = tournament.logo || latestEdition?.photos?.[0];
                                return (
                                    <div className="md:col-span-4 hidden md:flex justify-end items-start relative h-[240px]">
                                        <div className="w-full h-full bg-[#F4F1EA] p-4 border border-[rgba(26,26,26,0.08)] flex items-center justify-center relative shadow-[4px_4px_0_0_rgba(26,26,26,0.05)] overflow-hidden">
                                            {tournamentImage ? (
                                                <>
                                                    <img
                                                        alt={`${tournament.name} Archival Record`}
                                                        src={tournamentImage}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 text-[#F4F1EA] text-[10px] font-mono tracking-wider">
                                                        ARCHIVAL REF: {tournament.type}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-[#dcdad3] flex flex-col items-center justify-center p-6 text-center text-[#6B665F]">
                                                    <Trophy className="w-14 h-14 mb-2 text-[#5a181e]/40" />
                                                    <span className="text-xs uppercase tracking-widest font-semibold">
                                                        {tournament.type} Archive
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Main Content Layout: Editions List + Summary Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Editions List Section (8 Cols) */}
                        <section className="lg:col-span-8 space-y-6">
                            <div className="border-b border-[rgba(26,26,26,0.08)] pb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-medium text-[#3d030b] tracking-tight">
                                        Documented Editions
                                    </h2>
                                    <p className="text-xs text-[#6B665F] mt-1">
                                        Explore official championship campaigns, squads, and match logs.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-[#6B665F] bg-[#ECE8E1] px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                    {editions.length} Records
                                </span>
                            </div>

                            {/* Empty Editions */}
                            {editions.length === 0 && (
                                <div className="bg-[#ECE8E1] p-10 border border-[rgba(26,26,26,0.08)] text-center space-y-3">
                                    <Trophy className="w-8 h-8 text-[#9C968D] mx-auto opacity-70" />
                                    <h3 className="text-sm font-medium text-[#1A1A1A]">No Editions Cataloged Yet</h3>
                                    <p className="text-xs text-[#6B665F] max-w-sm mx-auto">
                                        Historical campaigns and fixtures for this tournament are currently being
                                        archived.
                                    </p>
                                </div>
                            )}

                            {/* Editions Grid */}
                            {editions.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {editions.map((edition) => {
                                        const badge = getPositionBadge(edition.finalPosition);
                                        return (
                                            <Link
                                                key={edition._id}
                                                to={`/tournaments/${tournament._id}/editions/${edition._id}`}
                                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 hover:bg-[#E2DDD4] hover:border-[rgba(26,26,26,0.25)] transition-all duration-300 group flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-xs font-medium text-[#6B665F] bg-[#F1EEE7] px-2.5 py-1 rounded-full border border-[rgba(26,26,26,0.08)] flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-[#6B665F]" />
                                                            {edition.year}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${badge.className}`}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#3d030b] mb-2 tracking-tight transition-colors">
                                                        {edition.edition}
                                                    </h3>

                                                    {edition.hostInstitute && (
                                                        <p className="text-xs text-[#6B665F] flex items-center gap-1.5 mb-4">
                                                            <MapPin className="w-3.5 h-3.5 text-[#9C968D] shrink-0" />
                                                            <span>Host: {edition.hostInstitute}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-[rgba(26,26,26,0.08)] flex items-center justify-between text-xs text-[#6B665F]">
                                                    <span className="text-[11px] font-medium text-[#9C968D]">
                                                        Campaign Ledger
                                                    </span>
                                                    <span className="text-[#5a181e] font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Edition <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Contextual Summary Sidebar (4 Cols) */}
                        <aside className="lg:col-span-4">
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 space-y-6 sticky top-24">
                                <h3 className="text-base font-medium text-[#3d030b] flex items-center gap-2 border-b border-[rgba(26,26,26,0.08)] pb-3">
                                    <Trophy className="w-4 h-4 text-[#5a181e]" />
                                    Tournament Summary
                                </h3>

                                <div className="space-y-4 text-xs">
                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                                        <span className="text-[#6B665F]">Editions Cataloged</span>
                                        <span className="font-semibold text-[#1A1A1A]">{editions.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                                        <span className="text-[#6B665F]">Category</span>
                                        <span className="font-semibold text-[#1A1A1A]">{tournament.type}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2.5">
                                        <span className="text-[#6B665F]">Latest Documented Year</span>
                                        <span className="font-semibold text-[#1A1A1A]">
                                            {latestEdition?.year ? `${latestEdition.year}` : "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[rgba(26,26,26,0.08)]">
                                    <h4 className="text-[10px] uppercase font-bold text-[#9C968D] tracking-widest mb-2">
                                        Archival Ledger Note
                                    </h4>
                                    <p className="text-xs text-[#6B665F] leading-relaxed italic">
                                        Official historical record of IIT (BHU) Hockey participation in{" "}
                                        {tournament.name}. Each documented edition preserves team lineups, results, and
                                        honors achieved.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </main>
    );
}
