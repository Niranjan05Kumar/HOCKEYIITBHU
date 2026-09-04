import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, AlertCircle, RotateCcw } from "lucide-react";
import { getTeams } from "@/api/teams";
import type { Team } from "@/types/team";

export default function SquadSpotlightSection() {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLatestTeam = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getTeams({
                limit: 1,
                sort: "year",
                order: "desc",
            });
            if (response.data && response.data.length > 0) {
                setTeam(response.data[0]);
            } else {
                setTeam(null);
            }
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load varsity team information from the server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLatestTeam();
    }, [fetchLatestTeam]);

    return (
        <section className="py-14 md:py-20 px-4 sm:px-6 md:px-12 bg-[#F1EEE7] border-y border-[rgba(26,26,26,0.08)]">
            <div className="max-w-[1440px] mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#1A1A1A] mb-2">
                        Current Roster Spotlight
                    </h2>
                    <p className="text-sm text-[#6B665F]">Carrying the torch into the modern era.</p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 animate-pulse">
                        <div className="w-full aspect-video md:h-[400px] bg-[#dcdad3] mb-6" />
                        <div className="h-6 bg-[#dcdad3] rounded w-1/4 mb-2" />
                        <div className="h-4 bg-[#dcdad3] rounded w-1/3" />
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 text-center max-w-xl mx-auto my-4">
                        <AlertCircle className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-80" />
                        <h3 className="text-base font-medium text-[#1A1A1A] mb-1">Unable to Load Squad Information</h3>
                        <p className="text-xs sm:text-sm text-[#6B665F] mb-5 leading-relaxed">{error}</p>
                        <button
                            type="button"
                            onClick={fetchLatestTeam}
                            className="px-6 py-2 border border-[#5A181E] text-[#5A181E] hover:bg-[#5A181E] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry Connection
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && !team && (
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-4">
                        <Users className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-50" />
                        <h3 className="text-base font-medium text-[#1A1A1A] mb-1">
                            No Active Varsity Squad Documented
                        </h3>
                        <p className="text-xs sm:text-sm text-[#6B665F] mb-6 leading-relaxed">
                            Official team rosters, leadership assignments, and squad photography will appear here once
                            registered.
                        </p>
                        <Link
                            to="/roster"
                            className="px-6 py-2.5 border border-[rgba(26,26,26,0.25)] hover:border-[#5A181E] rounded-full text-xs sm:text-sm font-medium text-[#1A1A1A] hover:text-[#5A181E] hover:bg-[#E2DDD4] transition-colors inline-block"
                        >
                            Explore Player Archive
                        </Link>
                    </div>
                )}

                {/* Real Team Data */}
                {!loading && !error && team && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Main Team Photo Card (8 Columns) */}
                        <div className="md:col-span-8 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded-none p-4 md:p-6 flex flex-col justify-between">
                            <div className="w-full aspect-video md:h-[400px] bg-[#dcdad3] relative mb-6 overflow-hidden flex items-center justify-center">
                                {team.teamPhoto ? (
                                    <img
                                        src={team.teamPhoto}
                                        alt={`${team.year} Varsity Squad`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#6B665F]">
                                        <Users className="w-12 h-12 mb-2 text-[#5A181E]/40" />
                                        <span className="text-sm uppercase tracking-widest font-semibold">
                                            {team.year} Official Squad Portrait
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 px-2 pb-2">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-[#1A1A1A] mb-1 tracking-tight">
                                        {team.year} Varsity Squad
                                    </h3>
                                    <p className="text-sm text-[#6B665F] flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[#5A181E]" />
                                        Rajputana Ground, Varanasi
                                    </p>
                                </div>
                                <Link
                                    to="/roster"
                                    className="px-6 py-2.5 border border-[rgba(26,26,26,0.25)] hover:border-[#5A181E] rounded-full text-xs sm:text-sm font-medium text-[#1A1A1A] hover:text-[#5A181E] hover:bg-[#E2DDD4] transition-colors self-start sm:self-auto text-center"
                                >
                                    View Full Roster ({team.players?.length ?? 0} Players)
                                </Link>
                            </div>
                        </div>

                        {/* Leadership Sidebar (4 Columns) */}
                        <div className="md:col-span-4 flex flex-col gap-5 justify-between">
                            {team.coach && (
                                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded-none bg-[#dcdad3] overflow-hidden shrink-0 border border-[rgba(26,26,26,0.12)] flex items-center justify-center">
                                        <Users className="w-8 h-8 text-[#5A181E]/40" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider block mb-1">
                                            Head Coach
                                        </span>
                                        <h4 className="text-base font-medium text-[#1A1A1A] tracking-tight">
                                            {team.coach}
                                        </h4>
                                        <span className="text-xs text-[#9C968D]">Varsity Coaching Staff</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 flex gap-4 items-center">
                                <div className="w-16 h-16 rounded-none bg-[#dcdad3] overflow-hidden shrink-0 border border-[rgba(26,26,26,0.12)] flex items-center justify-center">
                                    <Users className="w-8 h-8 text-[#5A181E]/40" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider block mb-1">
                                        Active Roster
                                    </span>
                                    <h4 className="text-base font-medium text-[#1A1A1A] tracking-tight">
                                        {team.players.length} Selected Players
                                    </h4>
                                    <span className="text-xs text-[#9C968D]">Season {team.year}</span>
                                </div>
                            </div>

                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 flex flex-col justify-center">
                                <span className="text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider block mb-1">
                                    Archive Status
                                </span>
                                <h4 className="text-base font-medium text-[#1A1A1A] tracking-tight mb-2">
                                    Verified Institutional Roster
                                </h4>
                                <Link to="/roster" className="text-xs font-medium text-[#5A181E] hover:underline">
                                    Browse all varsity players &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
