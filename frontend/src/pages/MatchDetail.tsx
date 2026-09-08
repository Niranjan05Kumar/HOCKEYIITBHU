import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    Trophy,
    Shield,
    ExternalLink,
    AlertCircle,
    RotateCcw,
    CheckCircle2,
    MapPin,
    Award,
    Clock,
} from "lucide-react";
import { getMatchById } from "@/api/matches";
import { getTournamentById, getTournamentEditionById } from "@/api/tournaments";
import type { Match } from "@/types/match";
import type { Tournament, TournamentEdition } from "@/types/tournament";

const CREST_URL = "/images/logo.png";

export default function MatchDetail() {
    const { id } = useParams<{ id: string }>();

    const [match, setMatch] = useState<Match | null>(null);
    const [edition, setEdition] = useState<TournamentEdition | null>(null);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);

    const fetchMatchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            const matchRes = await getMatchById(id);
            const matchData = matchRes.data;

            if (!matchData) {
                setNotFound(true);
                return;
            }

            setMatch(matchData);

            // Fetch referenced tournament edition
            if (matchData.tournamentEdition) {
                try {
                    const edRes = await getTournamentEditionById(matchData.tournamentEdition);
                    const edData = edRes.data;
                    setEdition(edData);

                    // Fetch parent tournament if available
                    if (edData?.tournament) {
                        try {
                            const tourRes = await getTournamentById(edData.tournament);
                            setTournament(tourRes.data || null);
                        } catch {
                            // Non-critical if tournament category lookup fails
                        }
                    }
                } catch {
                    // Non-critical if edition details fail
                }
            }
        } catch (err: unknown) {
            // Check for 404
            const is404 =
                (err as { response?: { status?: number } })?.response?.status === 404 ||
                (err instanceof Error && err.message.includes("404"));

            if (is404) {
                setNotFound(true);
            } else {
                setError(err instanceof Error ? err.message : "Failed to load match record from server");
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchMatchData();
    }, [fetchMatchData]);

    // Derived Result calculations
    const isWin =
        match?.result === "Win" ||
        (match?.iitBhuScore !== undefined &&
            match?.opponentScore !== undefined &&
            match.iitBhuScore > match.opponentScore);

    const isDraw =
        match?.result === "Draw" ||
        (match?.iitBhuScore !== undefined &&
            match?.opponentScore !== undefined &&
            match.iitBhuScore === match.opponentScore);

    const resultLabel = match?.result?.toUpperCase() || (isWin ? "WIN" : isDraw ? "DRAW" : "LOSS");

    const isFinal =
        match?.round?.toLowerCase().includes("final") &&
        !match?.round?.toLowerCase().includes("semi") &&
        !match?.round?.toLowerCase().includes("quarter");

    return (
        <main className="flex-grow pt-8 md:pt-12 pb-16 px-4 md:px-12 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            {/* Breadcrumb & Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs font-mono text-[#6B665F]">
                <div className="flex items-center gap-2">
                    <Link to="/matches" className="hover:text-[#5A181E] transition-colors flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Matches Archive</span>
                    </Link>
                    <span>/</span>
                    {edition && (
                        <>
                            <Link
                                to={`/tournament-editions/${edition._id}`}
                                className="hover:text-[#5A181E] transition-colors"
                            >
                                {edition.edition}
                            </Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-[#1A1A1A] font-semibold">Fixture Dossier</span>
                </div>

                {edition && (
                    <Link
                        to={`/tournament-editions/${edition._id}`}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.18)] text-[#5A181E] hover:bg-[#ECE8E1] transition-colors inline-flex items-center gap-1.5"
                    >
                        <span>View Tournament Campaign</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-[#ECE8E1] border-l-4 border-l-[#7A2E2E] border border-[rgba(26,26,26,0.12)] p-8 text-center space-y-4 max-w-xl mx-auto my-8">
                    <AlertCircle className="w-8 h-8 text-[#7A2E2E] mx-auto" />
                    <h2 className="text-base font-semibold text-[#1A1A1A]">Unable to Load Match Dossier</h2>
                    <p className="text-xs text-[#6B665F]">{error}</p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => void fetchMatchData()}
                            className="px-5 py-2 rounded-full text-xs font-medium bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors inline-flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                        </button>
                        <Link
                            to="/matches"
                            className="px-4 py-2 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.2)] text-[#1A1A1A] hover:bg-[#ECE8E1] transition-colors"
                        >
                            Back to Matches
                        </Link>
                    </div>
                </div>
            )}

            {/* Not Found State (404) */}
            {notFound && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.1)] p-12 text-center space-y-4 max-w-md mx-auto my-12">
                    <Shield className="w-10 h-10 text-[#6B665F] mx-auto opacity-70" />
                    <h2 className="font-serif text-2xl text-[#1A1A1A] font-medium">Match Record Not Found</h2>
                    <p className="text-xs text-[#6B665F] leading-relaxed">
                        The requested match fixture ID could not be found in the verified archive ledger. It may have
                        been relocated or removed.
                    </p>
                    <div className="pt-3">
                        <Link
                            to="/matches"
                            className="px-5 py-2 rounded-full text-xs font-medium bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors inline-block"
                        >
                            Return to Matches Directory
                        </Link>
                    </div>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-6">
                    <div className="bg-[#ECE8E1] p-8 border border-[rgba(26,26,26,0.08)] animate-pulse h-64" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] animate-pulse h-80" />
                        <div className="bg-[#ECE8E1] p-6 border border-[rgba(26,26,26,0.08)] animate-pulse h-80" />
                    </div>
                </div>
            )}

            {/* Match Detail Content */}
            {!loading && !error && !notFound && match && (
                <div className="space-y-8">
                    {/* Header Spotlight & Scoreboard Card */}
                    <section
                        className={`bg-[#ECE8E1] border p-6 md:p-10 relative overflow-hidden ${
                            isFinal ? "border-2 border-[#3d030b]" : "border-[rgba(26,26,26,0.12)]"
                        }`}
                    >
                        {isFinal && <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#3d030b]" />}

                        {/* Top Meta Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-[rgba(26,26,26,0.08)] pb-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-[#F4F1EA] text-[#5A181E] font-semibold text-xs px-3.5 py-1 rounded-full border border-[rgba(26,26,26,0.1)] uppercase tracking-wider">
                                    {match.round || "Fixture"}
                                </span>

                                {edition && (
                                    <Link
                                        to={`/tournament-editions/${edition._id}`}
                                        className="bg-[#F4F1EA] text-[#6B665F] hover:text-[#5A181E] text-xs px-3 py-1 rounded-full border border-[rgba(26,26,26,0.1)] transition-colors flex items-center gap-1"
                                    >
                                        <Trophy className="w-3 h-3 text-[#5A181E]" />
                                        <span>{edition.edition}</span>
                                    </Link>
                                )}

                                {match.date && (
                                    <span className="bg-[#F4F1EA] text-[#6B665F] font-mono text-xs px-3 py-1 rounded-full border border-[rgba(26,26,26,0.1)] flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(match.date).toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                )}
                            </div>

                            {/* Result Classification Pill */}
                            <span
                                className={`text-xs font-bold px-4 py-1.5 rounded-full text-center uppercase tracking-widest ${
                                    isWin
                                        ? "bg-[#2D5A3D] text-white"
                                        : isDraw
                                          ? "bg-[#7D7871] text-white"
                                          : "bg-[#7A2E2E] text-white"
                                }`}
                            >
                                {resultLabel}
                            </span>
                        </div>

                        {/* Main Scoreboard Display */}
                        <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-6 md:gap-4 my-4">
                            {/* Team 1: IIT (BHU) */}
                            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={CREST_URL}
                                        alt="IIT (BHU) Crest"
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                    <div>
                                        <p className="text-xs uppercase tracking-widest font-semibold text-[#5A181E]">
                                            Varsity Team
                                        </p>
                                        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                                            IIT (BHU) Varanasi
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Score Display (Center Column) */}
                            <div className="md:col-span-3 flex flex-col items-center justify-center text-center">
                                <div className="bg-[#F4F1EA] border border-[rgba(26,26,26,0.12)] px-8 py-4 rounded-none shadow-inner font-mono">
                                    <span
                                        className={`text-4xl md:text-6xl font-extrabold tracking-tight ${
                                            isWin ? "text-[#2D5A3D]" : "text-[#3d030b]"
                                        }`}
                                    >
                                        {match.iitBhuScore ?? "-"}
                                    </span>
                                    <span className="mx-4 text-2xl md:text-3xl text-[#6B665F] font-normal">:</span>
                                    <span
                                        className={`text-4xl md:text-6xl font-extrabold tracking-tight ${
                                            !isWin && !isDraw ? "text-[#7A2E2E]" : "text-[#1A1A1A]"
                                        }`}
                                    >
                                        {match.opponentScore ?? "-"}
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono text-[#6B665F] mt-2 uppercase tracking-widest">
                                    Official Final Scoreline
                                </span>
                            </div>

                            {/* Team 2: Opponent */}
                            <div className="md:col-span-4 flex flex-col items-center md:items-end text-center md:text-right space-y-2">
                                <div className="flex flex-col md:items-end">
                                    <p className="text-xs uppercase tracking-widest font-semibold text-[#6B665F]">
                                        Opponent Institution
                                    </p>
                                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                                        {match.opponent}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Match Outcome Subtitle */}
                        <div className="mt-8 pt-4 border-t border-[rgba(26,26,26,0.08)] flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B665F]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[#2D5A3D]" />
                                <span>
                                    {isWin
                                        ? `IIT (BHU) secured a verified victory against ${match.opponent}.`
                                        : isDraw
                                          ? `Match concluded in a competitive draw between IIT (BHU) and ${match.opponent}.`
                                          : `${match.opponent} edged out the fixture over IIT (BHU).`}
                                </span>
                            </div>

                            <span className="font-mono text-[11px] text-[#9C968D]">Record ID: {match._id}</span>
                        </div>
                    </section>

                    {/* Dual Ledger Panels: Match Dossier & Tournament Context */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Panel 1: Match Dossier Specifications (7 Cols) */}
                        <div className="lg:col-span-7 bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 md:p-8 space-y-6">
                            <div className="border-b border-[rgba(26,26,26,0.1)] pb-3">
                                <h3 className="font-serif text-xl font-medium text-[#3d030b] flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#5A181E]" />
                                    <span>Fixture Dossier Specifications</span>
                                </h3>
                                <p className="text-xs text-[#6B665F] mt-1">
                                    Detailed archival attributes recorded in the varsity competition ledger.
                                </p>
                            </div>

                            <div className="space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Opponent Team</span>
                                    <span className="font-semibold text-[#1A1A1A]">{match.opponent}</span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Tournament Stage / Round</span>
                                    <span className="font-semibold text-[#1A1A1A]">{match.round || "Fixture"}</span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">IIT (BHU) Score</span>
                                    <span className="font-semibold text-[#2D5A3D]">
                                        {match.iitBhuScore ?? "Unrecorded"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Opponent Score</span>
                                    <span className="font-semibold text-[#7A2E2E]">
                                        {match.opponentScore ?? "Unrecorded"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Outcome Classification</span>
                                    <span
                                        className={`font-semibold ${
                                            isWin ? "text-[#2D5A3D]" : isDraw ? "text-[#7D7871]" : "text-[#7A2E2E]"
                                        }`}
                                    >
                                        {match.result || (isWin ? "Win" : isDraw ? "Draw" : "Loss")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Match Date</span>
                                    <span className="font-semibold text-[#1A1A1A]">
                                        {match.date
                                            ? new Date(match.date).toLocaleDateString("en-IN", {
                                                  day: "numeric",
                                                  month: "long",
                                                  year: "numeric",
                                              })
                                            : "Date unrecorded • Result verified"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-[rgba(26,26,26,0.06)]">
                                    <span className="text-[#6B665F] font-sans">Tournament Campaign</span>
                                    <span className="font-semibold text-[#5A181E]">
                                        {edition ? (
                                            <Link
                                                to={`/tournament-editions/${edition._id}`}
                                                className="hover:underline flex items-center gap-1"
                                            >
                                                <span>
                                                    {edition.edition} ({edition.year})
                                                </span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        ) : (
                                            "Referenced Tournament Edition"
                                        )}
                                    </span>
                                </div>

                                {match.createdAt && (
                                    <div className="flex justify-between items-center py-2.5">
                                        <span className="text-[#6B665F] font-sans">Archive Committal</span>
                                        <span className="text-[#9C968D] flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(match.createdAt).toLocaleDateString("en-IN", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel 2: Referenced Tournament Edition Context (5 Cols) */}
                        <div className="lg:col-span-5 space-y-6">
                            {edition ? (
                                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 md:p-8 space-y-5">
                                    <div className="border-b border-[rgba(26,26,26,0.1)] pb-3">
                                        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#5A181E] font-semibold mb-1">
                                            <Trophy className="w-3.5 h-3.5" />
                                            <span>Tournament Context</span>
                                        </div>
                                        <h3 className="font-serif text-xl font-medium text-[#1A1A1A]">
                                            {edition.edition}
                                        </h3>
                                        {tournament && <p className="text-xs text-[#6B665F]">{tournament.name}</p>}
                                    </div>

                                    <div className="space-y-3 text-xs">
                                        <div className="flex justify-between items-center py-1.5 border-b border-[rgba(26,26,26,0.06)]">
                                            <span className="text-[#6B665F]">Competition Year</span>
                                            <span className="font-mono font-bold text-[#1A1A1A]">{edition.year}</span>
                                        </div>

                                        {edition.hostInstitute && (
                                            <div className="flex justify-between items-center py-1.5 border-b border-[rgba(26,26,26,0.06)]">
                                                <span className="text-[#6B665F] flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>Host Institute</span>
                                                </span>
                                                <span className="font-medium text-[#1A1A1A]">
                                                    {edition.hostInstitute}
                                                </span>
                                            </div>
                                        )}

                                        {typeof edition.finalPosition === "number" && (
                                            <div className="flex justify-between items-center py-1.5 border-b border-[rgba(26,26,26,0.06)]">
                                                <span className="text-[#6B665F] flex items-center gap-1">
                                                    <Award className="w-3 h-3" />
                                                    <span>IIT (BHU) Standing</span>
                                                </span>
                                                <span className="font-medium text-[#2D5A3D]">
                                                    {edition.finalPosition === 1
                                                        ? "1st Place (Champion)"
                                                        : edition.finalPosition === 2
                                                          ? "2nd Place (Runners-Up)"
                                                          : edition.finalPosition === 3
                                                            ? "3rd Place (Bronze)"
                                                            : `${edition.finalPosition}th Place`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Link
                                            to={`/tournament-editions/${edition._id}`}
                                            className="w-full block py-2.5 px-4 rounded-full text-center text-xs font-semibold bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors"
                                        >
                                            Explore Full Campaign &amp; Squad →
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 text-center space-y-2">
                                    <Trophy className="w-6 h-6 text-[#6B665F] mx-auto opacity-60" />
                                    <p className="text-xs font-medium text-[#1A1A1A]">Tournament Edition Reference</p>
                                    <p className="text-[11px] text-[#6B665F]">
                                        Detailed campaign data for ID {match.tournamentEdition} is cataloged in the
                                        tournaments register.
                                    </p>
                                </div>
                            )}

                            {/* Return Navigation CTA */}
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-[#1A1A1A]">All Tournament Fixtures</p>
                                    <p className="text-[11px] text-[#6B665F]">
                                        Filter matches by edition or search by opponent.
                                    </p>
                                </div>
                                <Link
                                    to={edition ? `/matches?tournamentEditionId=${edition._id}` : "/matches"}
                                    className="px-4 py-1.5 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.2)] text-[#1A1A1A] hover:bg-[#5A181E] hover:text-white hover:border-[#5A181E] transition-colors shrink-0"
                                >
                                    Browse Matches
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
