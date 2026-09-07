import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Trophy,
    Calendar,
    MapPin,
    Users,
    UserCheck,
    Shield,
    AlertCircle,
    RotateCcw,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Medal,
    Swords,
    Award,
    ArrowRight,
} from "lucide-react";
import { getTournamentEditionById, getTournamentById } from "@/api/tournaments";
import { getTeamById } from "@/api/teams";
import { getPlayerById } from "@/api/players";
import { getMatches } from "@/api/matches";
import {
    getCachedTournaments,
    getCachedTeams,
    getCachedPlayers,
    getCachedAchievements,
    getCachedGalleryItems,
} from "@/lib/catalogCache";
import type { Tournament, TournamentEdition } from "@/types/tournament";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import type { Match } from "@/types/match";
import type { Achievement } from "@/types/achievement";
import type { GalleryItem } from "@/types/gallery";

type TabType = "matches" | "squad" | "distinctions" | "gallery";

const FALLBACK_ARCHIVAL_HERO =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDi7plpkEox-IEt3HcKoLvibM6_gtk59Sf873inR-D2etH1qPvn_MwKmcs4UkKwHNqIDqQVq_ao7C63AOBbs7HvCMaC7wtMsJT5OF9btW1Awr38zSXDuv4D32dm5Oh-wh4U-xocuheXEYVSrWNLyFItWEkfoZkNGYMAkl98mdmLBq_hoiEQYVpRVzwlJkemx1IXXFd-7IYgS_7XSmBKF7hywR0L75yEwHKjsZ6e7Q5GkN93EIO3u-eI";

export default function TournamentEditionDetail() {
    const { id, editionId } = useParams<{ id?: string; editionId?: string }>();
    const targetEditionId = editionId || id;

    const [edition, setEdition] = useState<TournamentEdition | null>(null);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [captain, setCaptain] = useState<Player | null>(null);
    const [viceCaptain, setViceCaptain] = useState<Player | null>(null);
    const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>("matches");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    // Lightbox state for gallery tab
    const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!targetEditionId) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setNotFound(false);

            // 1. Fetch the tournament edition record
            const editionRes = await getTournamentEditionById(targetEditionId);
            const ed = editionRes.data;

            if (!ed) {
                setNotFound(true);
                return;
            }

            setEdition(ed);

            // 2. Fetch related data concurrently leveraging shared catalog cache
            const [matchesRes, allTournaments, allTeams, allPlayers, allAchievements, allGallery] = await Promise.all([
                getMatches({ tournamentEditionId: ed._id, limit: 100 }).catch(() => ({ data: [] })),
                getCachedTournaments().catch(() => []),
                getCachedTeams().catch(() => []),
                getCachedPlayers().catch(() => []),
                getCachedAchievements().catch(() => []),
                getCachedGalleryItems().catch(() => []),
            ]);

            setMatches(matchesRes.data || []);

            // A. Tournament details
            if (ed.tournament) {
                const tour = allTournaments.find((t) => t._id === ed.tournament);
                if (tour) {
                    setTournament(tour);
                } else {
                    getTournamentById(ed.tournament)
                        .then((res) => setTournament(res.data))
                        .catch(() => setTournament(null));
                }
            } else {
                setTournament(null);
            }

            // B. Team / Squad details
            if (ed.team) {
                const tm = allTeams.find((t) => t._id === ed.team);
                if (tm) {
                    setTeam(tm);
                    if (tm.players && tm.players.length > 0) {
                        const teamPlayerIds = new Set(tm.players);
                        setSquadPlayers(allPlayers.filter((p) => teamPlayerIds.has(p._id)));
                    } else {
                        setSquadPlayers([]);
                    }
                } else {
                    getTeamById(ed.team)
                        .then((res) => {
                            const teamData = res.data;
                            setTeam(teamData);
                            if (teamData?.players && teamData.players.length > 0) {
                                const teamPlayerIds = new Set(teamData.players);
                                setSquadPlayers(allPlayers.filter((p) => teamPlayerIds.has(p._id)));
                            } else {
                                setSquadPlayers([]);
                            }
                        })
                        .catch(() => setTeam(null));
                }
            } else {
                setTeam(null);
                setSquadPlayers([]);
            }

            // C. Captain
            if (ed.captain) {
                const capt = allPlayers.find((p) => p._id === ed.captain);
                if (capt) {
                    setCaptain(capt);
                } else {
                    getPlayerById(ed.captain)
                        .then((res) => setCaptain(res.data))
                        .catch(() => setCaptain(null));
                }
            } else {
                setCaptain(null);
            }

            // D. Vice-Captain
            if (ed.viceCaptain) {
                const vc = allPlayers.find((p) => p._id === ed.viceCaptain);
                if (vc) {
                    setViceCaptain(vc);
                } else {
                    getPlayerById(ed.viceCaptain)
                        .then((res) => setViceCaptain(res.data))
                        .catch(() => setViceCaptain(null));
                }
            } else {
                setViceCaptain(null);
            }

            // E. Achievements & Awards
            const matchedAchievements = allAchievements.filter(
                (a) =>
                    (ed.tournament && a.tournament === ed.tournament) ||
                    (a.year && a.year === ed.year) ||
                    (ed.achievements && ed.achievements.includes(a._id)) ||
                    (ed.awards && ed.awards.includes(a._id)),
            );
            setAchievements(matchedAchievements);

            // F. Gallery media
            const matchedGallery = allGallery.filter(
                (g) =>
                    g.tournament === ed._id ||
                    (ed.tournament && g.tournament === ed.tournament) ||
                    (ed.photos && ed.photos.includes(g._id)),
            );
            setGallery(matchedGallery);
        } catch (err: unknown) {
            const apiError = err as { response?: { status?: number; data?: { message?: string } } };
            if (apiError.response?.status === 404) {
                setNotFound(true);
            } else {
                setError(apiError.response?.data?.message || "Failed to load tournament edition details.");
            }
        } finally {
            setLoading(false);
        }
    }, [targetEditionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived match statistics
    const stats = useMemo(() => {
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goalsScored = 0;
        let goalsConceded = 0;
        let cleanSheets = 0;

        for (const m of matches) {
            const iitScore = m.iitBhuScore ?? 0;
            const oppScore = m.opponentScore ?? 0;

            if (
                m.result === "Win" ||
                (m.iitBhuScore !== undefined && m.opponentScore !== undefined && iitScore > oppScore)
            ) {
                wins++;
            } else if (
                m.result === "Draw" ||
                (m.iitBhuScore !== undefined && m.opponentScore !== undefined && iitScore === oppScore)
            ) {
                draws++;
            } else if (
                m.result === "Loss" ||
                (m.iitBhuScore !== undefined && m.opponentScore !== undefined && iitScore < oppScore)
            ) {
                losses++;
            }

            if (m.iitBhuScore !== undefined) goalsScored += iitScore;
            if (m.opponentScore !== undefined) {
                goalsConceded += oppScore;
                if (oppScore === 0) cleanSheets++;
            }
        }

        return {
            played: matches.length,
            wins,
            draws,
            losses,
            goalsScored,
            goalsConceded,
            cleanSheets,
        };
    }, [matches]);

    // Hero image logic: use primary gallery image if available, else fallback
    const heroImage = useMemo(() => {
        if (gallery.length > 0 && gallery[0].imageUrl) {
            return gallery[0].imageUrl;
        }
        return FALLBACK_ARCHIVAL_HERO;
    }, [gallery]);

    // Position badge styling
    const positionBadge = useMemo(() => {
        if (!edition?.finalPosition) return null;

        const pos = edition.finalPosition;
        if (pos === 1) {
            return {
                label: "Gold Medal • Champions",
                className: "bg-[#2D5A3D] text-white",
                icon: Trophy,
            };
        }
        if (pos === 2) {
            return {
                label: "Silver Medal • Runners Up",
                className: "bg-[#7D7871] text-white",
                icon: Medal,
            };
        }
        if (pos === 3) {
            return {
                label: "Bronze Medal • 3rd Place",
                className: "bg-[#765a1a] text-white",
                icon: Award,
            };
        }
        return {
            label: `Ranked #${pos}`,
            className: "bg-[#E2DDD4] text-[#1A1A1A]",
            icon: Shield,
        };
    }, [edition]);

    // Lightbox keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activePhotoIndex === null) return;
            if (e.key === "Escape") {
                setActivePhotoIndex(null);
            } else if (e.key === "ArrowLeft") {
                setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1));
            } else if (e.key === "ArrowRight") {
                setActivePhotoIndex((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activePhotoIndex, gallery.length]);

    // Loading Skeleton State
    if (loading) {
        return (
            <main className="flex-grow pt-8 pb-16 px-4 md:px-16 max-w-screen-xl mx-auto w-full bg-[#F4F1EA]">
                {/* Breadcrumb Skeleton */}
                <div className="h-4 w-48 bg-[#ECE8E1] animate-pulse rounded mb-8" />

                {/* Hero Card Skeleton */}
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 md:p-10 mb-10 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-4">
                            <div className="flex gap-2">
                                <div className="h-6 w-24 bg-[#E2DDD4] rounded-full" />
                                <div className="h-6 w-20 bg-[#E2DDD4] rounded-full" />
                                <div className="h-6 w-32 bg-[#E2DDD4] rounded-full" />
                            </div>
                            <div className="h-10 w-3/4 bg-[#E2DDD4] rounded" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                <div className="h-12 bg-[#E2DDD4] rounded" />
                                <div className="h-12 bg-[#E2DDD4] rounded" />
                                <div className="h-12 bg-[#E2DDD4] rounded" />
                            </div>
                        </div>
                        <div className="md:col-span-4 hidden md:block h-48 bg-[#E2DDD4] rounded" />
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-6 border-b border-[rgba(26,26,26,0.12)] mb-8 pb-3">
                    <div className="h-6 w-32 bg-[#ECE8E1] animate-pulse rounded" />
                    <div className="h-6 w-32 bg-[#ECE8E1] animate-pulse rounded" />
                    <div className="h-6 w-32 bg-[#ECE8E1] animate-pulse rounded" />
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                    <div className="h-20 bg-[#ECE8E1] animate-pulse rounded" />
                    <div className="h-20 bg-[#ECE8E1] animate-pulse rounded" />
                    <div className="h-20 bg-[#ECE8E1] animate-pulse rounded" />
                </div>
            </main>
        );
    }

    // Not Found State
    if (notFound || !edition) {
        return (
            <main className="flex-grow pt-12 pb-16 px-4 md:px-16 max-w-screen-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-12 border border-[rgba(26,26,26,0.08)] max-w-lg mx-auto text-center space-y-5 my-12 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-[#E2DDD4] flex items-center justify-center mx-auto text-[#6B665F]">
                        <Shield className="w-8 h-8 text-[#3d030b]" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#3d030b]">Tournament Edition Not Found</h2>
                    <p className="text-sm text-[#6B665F]">
                        The requested tournament campaign edition does not exist in our digital archive or may have been
                        relocated.
                    </p>
                    <div className="pt-2">
                        <Link
                            to="/tournaments"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#3d030b] text-[#F4F1EA] hover:bg-[#5a181e] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Tournaments Directory
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Error State
    if (error) {
        return (
            <main className="flex-grow pt-12 pb-16 px-4 md:px-16 max-w-screen-xl mx-auto w-full bg-[#F4F1EA]">
                <div className="bg-[#ECE8E1] p-12 border border-red-200 max-w-lg mx-auto text-center space-y-4 my-12">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-[#7A2E2E]">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-medium text-[#3d030b]">Archive Connection Interrupted</h2>
                    <p className="text-xs text-[#6B665F]">{error}</p>
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium bg-[#3d030b] text-[#F4F1EA] hover:bg-[#5a181e] transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry Connection
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-grow pt-[80px] md:pt-[100px] px-4 md:px-16 pb-16 bg-[#F4F1EA] min-h-screen">
            <div className="max-w-screen-xl mx-auto">
                {/* Breadcrumb Navigation */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-2 mb-8 text-xs font-medium text-[#6B665F]"
                >
                    <Link
                        to="/tournaments"
                        className="hover:text-[#3d030b] transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Tournaments
                    </Link>
                    {tournament && (
                        <>
                            <span>/</span>
                            <Link
                                to={`/tournaments/${tournament._id}`}
                                className="hover:text-[#3d030b] transition-colors"
                            >
                                {tournament.name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-[#1A1A1A] font-semibold">{edition.edition}</span>
                </nav>

                {/* Hero Header Card */}
                <section className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 md:p-10 mb-10 relative overflow-hidden group shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Hero Text Info (8 Cols) */}
                        <div className="md:col-span-8 flex flex-col justify-center">
                            {/* Badges Row */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-[#E2DDD4] text-[#6B665F] text-xs font-medium px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                    Edition: {edition.edition}
                                </span>
                                <span className="bg-[#E2DDD4] text-[#6B665F] text-xs font-medium px-3 py-1 rounded-full border border-[rgba(26,26,26,0.08)]">
                                    Year: {edition.year}
                                </span>
                                {positionBadge && (
                                    <span
                                        className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${positionBadge.className}`}
                                    >
                                        <positionBadge.icon className="w-3.5 h-3.5" />
                                        {positionBadge.label}
                                    </span>
                                )}
                            </div>

                            {/* Main Title */}
                            <h1 className="font-serif text-3xl md:text-5xl text-[#3d030b] mb-4 leading-tight font-medium tracking-tight">
                                {edition.edition} {tournament?.name ? `• ${tournament.name}` : ""}
                            </h1>

                            {/* Tournament Metadata Dossier */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[rgba(26,26,26,0.08)]">
                                <div>
                                    <p className="text-[10px] tracking-widest text-[#6B665F] uppercase mb-1 font-semibold">
                                        Host Institute
                                    </p>
                                    <p className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-[#3d030b] shrink-0" />
                                        <span>{edition.hostInstitute || "Not recorded"}</span>
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] tracking-widest text-[#6B665F] uppercase mb-1 font-semibold">
                                        Captain
                                    </p>
                                    {captain ? (
                                        <Link
                                            to={`/roster/${captain._id}`}
                                            className="text-sm font-semibold text-[#3d030b] hover:underline flex items-center gap-1"
                                        >
                                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                            <span>{captain.name}</span>
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium text-[#6B665F]">Unassigned</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[10px] tracking-widest text-[#6B665F] uppercase mb-1 font-semibold">
                                        Vice-Captain
                                    </p>
                                    {viceCaptain ? (
                                        <Link
                                            to={`/roster/${viceCaptain._id}`}
                                            className="text-sm font-semibold text-[#3d030b] hover:underline flex items-center gap-1"
                                        >
                                            <Users className="w-3.5 h-3.5 shrink-0" />
                                            <span>{viceCaptain.name}</span>
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium text-[#6B665F]">Unassigned</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[10px] tracking-widest text-[#6B665F] uppercase mb-1 font-semibold">
                                        IIT (BHU) Squad
                                    </p>
                                    {team ? (
                                        <Link
                                            to={`/teams/${team._id}`}
                                            className="text-sm font-semibold text-[#3d030b] hover:underline flex items-center gap-1"
                                        >
                                            <Shield className="w-3.5 h-3.5 shrink-0" />
                                            <span>Season {team.year}</span>
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium text-[#6B665F]">Season {edition.year}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Archival Photo Frame (4 Cols) */}
                        <div className="md:col-span-4 hidden md:flex justify-end items-center">
                            <div className="w-full h-[220px] bg-[#FCF9F2] p-2.5 border border-[rgba(26,26,26,0.12)] relative shadow-[4px_4px_0_0_rgba(26,26,26,0.08)] group/photo">
                                <img
                                    src={heroImage}
                                    alt={`${edition.edition} Archival Photography`}
                                    className="w-full h-full object-cover transition-all duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = FALLBACK_ARCHIVAL_HERO;
                                    }}
                                />
                                <div className="absolute bottom-4 right-4 bg-[#121212]/85 px-2.5 py-1 text-white font-mono text-[9px] uppercase tracking-wider backdrop-blur-sm">
                                    ARCHIVAL REF: {edition.year}-{edition.edition.slice(0, 4).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs Navigation */}
                <div className="border-b border-[rgba(26,26,26,0.12)] mb-8">
                    <nav aria-label="Tabs" className="flex space-x-6 md:space-x-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("matches")}
                            className={`py-3.5 px-1 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                                activeTab === "matches"
                                    ? "border-[#3d030b] text-[#3d030b]"
                                    : "border-transparent text-[#6B665F] hover:text-[#3d030b]"
                            }`}
                        >
                            <Swords className="w-4 h-4" />
                            <span>Matches &amp; Results</span>
                            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-[#E2DDD4] text-[#1A1A1A]">
                                {matches.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("squad")}
                            className={`py-3.5 px-1 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                                activeTab === "squad"
                                    ? "border-[#3d030b] text-[#3d030b]"
                                    : "border-transparent text-[#6B665F] hover:text-[#3d030b]"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Participating Squad</span>
                            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-[#E2DDD4] text-[#1A1A1A]">
                                {squadPlayers.length || team?.players?.length || 0}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("distinctions")}
                            className={`py-3.5 px-1 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                                activeTab === "distinctions"
                                    ? "border-[#3d030b] text-[#3d030b]"
                                    : "border-transparent text-[#6B665F] hover:text-[#3d030b]"
                            }`}
                        >
                            <Trophy className="w-4 h-4" />
                            <span>Individual Distinctions</span>
                            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-[#E2DDD4] text-[#1A1A1A]">
                                {achievements.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("gallery")}
                            className={`py-3.5 px-1 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                                activeTab === "gallery"
                                    ? "border-[#3d030b] text-[#3d030b]"
                                    : "border-transparent text-[#6B665F] hover:text-[#3d030b]"
                            }`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span>Tournament Gallery</span>
                            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-[#E2DDD4] text-[#1A1A1A]">
                                {gallery.length}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* TAB 1: Matches & Results */}
                {activeTab === "matches" && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Match Progressions (8 Cols) */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex flex-wrap items-center justify-between border-b border-[rgba(26,26,26,0.12)] pb-2 mb-6 gap-2">
                                <h2 className="font-serif text-2xl text-[#3d030b] font-medium">
                                    Tournament Progression
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#6B665F]">{matches.length} Documented Fixtures</span>
                                    {edition && (
                                        <Link
                                            to={`/matches?tournamentEditionId=${edition._id}`}
                                            className="px-3 py-1 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.18)] text-[#5A181E] hover:bg-[#5A181E] hover:text-white transition-colors inline-flex items-center gap-1"
                                        >
                                            <span>Open in Matches Archive</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {matches.length === 0 && (
                                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 text-center space-y-3">
                                    <Swords className="w-8 h-8 text-[#6B665F] mx-auto" />
                                    <p className="text-sm font-medium text-[#1A1A1A]">No Match Records Documented</p>
                                    <p className="text-xs text-[#6B665F]">
                                        Match fixtures and progression results for this tournament edition have not yet
                                        been logged in the archive.
                                    </p>
                                </div>
                            )}

                            {matches.map((match, idx) => {
                                const isFinal =
                                    match.round?.toLowerCase().includes("final") &&
                                    !match.round?.toLowerCase().includes("semi") &&
                                    !match.round?.toLowerCase().includes("quarter");

                                const isWin =
                                    match.result === "Win" ||
                                    (match.iitBhuScore !== undefined &&
                                        match.opponentScore !== undefined &&
                                        match.iitBhuScore > match.opponentScore);

                                const isDraw =
                                    match.result === "Draw" ||
                                    (match.iitBhuScore !== undefined &&
                                        match.opponentScore !== undefined &&
                                        match.iitBhuScore === match.opponentScore);

                                return (
                                    <div
                                        key={match._id}
                                        className={`bg-[#ECE8E1] border p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-[#E2DDD4] transition-colors group relative ${
                                            isFinal
                                                ? "border-2 border-[#3d030b] shadow-sm"
                                                : "border-[rgba(26,26,26,0.12)]"
                                        }`}
                                    >
                                        {isFinal && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3d030b]" />
                                        )}

                                        {/* Match Info */}
                                        <div className="flex items-center gap-4 mb-3 md:mb-0 pl-1">
                                            <span className="font-mono text-xs text-[#6B665F] w-8 text-right font-medium">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={`text-xs uppercase font-semibold tracking-wider ${
                                                            isFinal ? "text-[#3d030b]" : "text-[#6B665F]"
                                                        }`}
                                                    >
                                                        {match.round || "Match Fixture"}
                                                    </p>
                                                    {match.date && (
                                                        <span className="text-[11px] text-[#6B665F] flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(match.date).toLocaleDateString("en-IN", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-base font-semibold text-[#1A1A1A] mt-0.5">
                                                    vs {match.opponent}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Score & Result Pill & Link */}
                                        <div className="flex items-center gap-4 md:gap-6 justify-end">
                                            <div className="text-center font-mono">
                                                <span
                                                    className={`text-2xl font-bold tracking-tight ${
                                                        isWin ? "text-[#2D5A3D]" : "text-[#3d030b]"
                                                    }`}
                                                >
                                                    {match.iitBhuScore ?? "-"}
                                                    <span className="mx-1 text-[#6B665F] text-lg font-normal">-</span>
                                                    {match.opponentScore ?? "-"}
                                                </span>
                                            </div>

                                            <span
                                                className={`text-xs font-semibold px-3 py-1 rounded-full w-20 text-center uppercase tracking-wider ${
                                                    isWin
                                                        ? "bg-[#2D5A3D] text-white"
                                                        : isDraw
                                                          ? "bg-[#7D7871] text-white"
                                                          : "bg-[#7A2E2E] text-white"
                                                }`}
                                            >
                                                {match.result?.toUpperCase() ||
                                                    (isWin ? "WIN" : isDraw ? "DRAW" : "LOSS")}
                                            </span>

                                            <Link
                                                to={`/matches/${match._id}`}
                                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.18)] text-[#1A1A1A] hover:bg-[#5A181E] hover:text-white hover:border-[#5A181E] transition-colors"
                                                title="View Match Record Dossier"
                                            >
                                                <span>Details</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sidebar: Tournament Summary & Context (4 Cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Summary Card */}
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-6 shadow-sm sticky top-[120px]">
                                <h3 className="font-serif text-lg text-[#3d030b] mb-4 flex items-center gap-2 font-medium">
                                    <Trophy className="w-4 h-4" />
                                    Tournament Summary
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2">
                                        <span className="text-[#6B665F]">Matches Contested</span>
                                        <span className="font-bold text-[#1A1A1A]">{stats.played}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2">
                                        <span className="text-[#6B665F]">Victories / Wins</span>
                                        <span className="font-bold text-[#2D5A3D]">{stats.wins}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2">
                                        <span className="text-[#6B665F]">Goals Scored</span>
                                        <span className="font-bold text-[#2D5A3D]">{stats.goalsScored}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2">
                                        <span className="text-[#6B665F]">Goals Conceded</span>
                                        <span className="font-bold text-[#7A2E2E]">{stats.goalsConceded}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-[rgba(26,26,26,0.08)] pb-2">
                                        <span className="text-[#6B665F]">Clean Sheets</span>
                                        <span className="font-bold text-[#1A1A1A]">{stats.cleanSheets}</span>
                                    </div>
                                </div>

                                {/* Participating Teams List */}
                                {edition.participatingTeams && edition.participatingTeams.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-[rgba(26,26,26,0.08)]">
                                        <h4 className="text-[11px] font-semibold tracking-wider text-[#6B665F] uppercase mb-3">
                                            Participating Institutions ({edition.participatingTeams.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {edition.participatingTeams.map((inst, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.08)] px-2.5 py-1 text-[11px] text-[#1A1A1A] rounded"
                                                >
                                                    {inst}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Archival Note */}
                                {tournament?.description && (
                                    <div className="mt-6 pt-6 border-t border-[rgba(26,26,26,0.08)]">
                                        <h4 className="text-[11px] font-semibold tracking-wider text-[#6B665F] uppercase mb-2">
                                            Archival Narrative
                                        </h4>
                                        <p className="text-xs text-[#6B665F] italic leading-relaxed">
                                            "{tournament.description}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* TAB 2: Participating Squad */}
                {activeTab === "squad" && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.12)] pb-2 mb-6">
                            <h2 className="font-serif text-2xl text-[#3d030b] font-medium">Fielded Varsity Squad</h2>
                            {team && (
                                <Link
                                    to={`/teams/${team._id}`}
                                    className="text-xs text-[#3d030b] hover:underline font-semibold flex items-center gap-1"
                                >
                                    <span>View Season {team.year} Roster</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>

                        {/* Head Coach Badge if present */}
                        {team?.coach && (
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-4 flex items-center justify-between rounded-none mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#3d030b] text-[#F4F1EA] flex items-center justify-center font-serif font-bold text-sm">
                                        HC
                                    </div>
                                    <div>
                                        <p className="text-[10px] tracking-widest text-[#6B665F] uppercase font-semibold">
                                            Head Coach
                                        </p>
                                        <p className="text-base font-semibold text-[#1A1A1A]">{team.coach}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-[#6B665F] bg-[#FCF9F2] px-3 py-1 border border-[rgba(26,26,26,0.08)]">
                                    Technical Staff
                                </span>
                            </div>
                        )}

                        {squadPlayers.length === 0 && (
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 text-center space-y-3">
                                <Users className="w-8 h-8 text-[#6B665F] mx-auto" />
                                <p className="text-sm font-medium text-[#1A1A1A]">No Players Linked to this Campaign</p>
                                <p className="text-xs text-[#6B665F]">
                                    Player roster records for this tournament edition are being digitized.
                                </p>
                            </div>
                        )}

                        {/* Player Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {squadPlayers.map((player) => {
                                const isCaptain = edition.captain === player._id || team?.captain === player._id;
                                const isVice = edition.viceCaptain === player._id || team?.viceCaptain === player._id;

                                return (
                                    <Link
                                        key={player._id}
                                        to={`/roster/${player._id}`}
                                        className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-4 rounded-none hover:bg-[#E2DDD4] transition-all duration-200 group flex flex-col justify-between shadow-sm"
                                    >
                                        <div>
                                            {/* Photo container */}
                                            <div className="aspect-[3/4] w-full bg-[#E2DDD4] mb-3 overflow-hidden relative border border-[rgba(26,26,26,0.08)]">
                                                {player.profilePhoto ? (
                                                    <img
                                                        src={player.profilePhoto}
                                                        alt={player.name}
                                                        className="w-full h-full object-cover transition-all duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#6B665F]">
                                                        <Users className="w-12 h-12 stroke-1" />
                                                    </div>
                                                )}

                                                {/* Jersey number badge */}
                                                {player.jerseyNumber && (
                                                    <div className="absolute top-2 right-2 bg-[#3d030b] text-white text-[11px] font-mono font-bold px-2 py-0.5 shadow-sm">
                                                        #{player.jerseyNumber}
                                                    </div>
                                                )}

                                                {/* Leadership Tag */}
                                                {(isCaptain || isVice) && (
                                                    <div className="absolute bottom-2 left-2 bg-[#2D5A3D] text-white text-[10px] font-semibold px-2 py-0.5 tracking-wider uppercase shadow-sm">
                                                        {isCaptain ? "Captain" : "Vice-Captain"}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-base font-serif font-bold text-[#1A1A1A] group-hover:text-[#3d030b] transition-colors">
                                                {player.name}
                                            </h3>
                                            <p className="text-xs text-[#6B665F] uppercase tracking-wider mt-0.5">
                                                {player.playingPosition}
                                            </p>
                                        </div>

                                        <div className="mt-3 pt-2 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-[11px] text-[#6B665F]">
                                            <span>View Player Profile</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-[#3d030b] group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* TAB 3: Individual Distinctions */}
                {activeTab === "distinctions" && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.12)] pb-2 mb-6">
                            <h2 className="font-serif text-2xl text-[#3d030b] font-medium">
                                Tournament Honors &amp; Distinctions
                            </h2>
                            <span className="text-xs text-[#6B665F]">{achievements.length} Documented Honors</span>
                        </div>

                        {achievements.length === 0 && (
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 text-center space-y-3">
                                <Trophy className="w-8 h-8 text-[#6B665F] mx-auto" />
                                <p className="text-sm font-medium text-[#1A1A1A]">
                                    No Individual Distinctions Recorded
                                </p>
                                <p className="text-xs text-[#6B665F]">
                                    Individual player honors (Player of the Tournament, Top Scorer, etc.) have not been
                                    cataloged for this campaign.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.map((ach) => (
                                <div
                                    key={ach._id}
                                    className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-5 rounded-none shadow-sm hover:bg-[#E2DDD4] transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-full bg-[#3d030b] text-[#F4F1EA] flex items-center justify-center shrink-0">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 bg-[#2D5A3D] text-white rounded-full">
                                            {ach.type || "Award"}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-serif font-bold text-[#3d030b] mb-1">{ach.title}</h3>

                                    {ach.description && (
                                        <p className="text-xs text-[#6B665F] leading-relaxed mb-3">{ach.description}</p>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-[rgba(26,26,26,0.08)] flex justify-between items-center text-xs text-[#6B665F]">
                                        <span>Recipient: {ach.recipientType}</span>
                                        {ach.recipient && ach.recipientType === "Player" && (
                                            <Link
                                                to={`/roster/${ach.recipient}`}
                                                className="text-[#3d030b] hover:underline font-semibold"
                                            >
                                                View Profile
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TAB 4: Tournament Gallery */}
                {activeTab === "gallery" && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.12)] pb-2 mb-6">
                            <h2 className="font-serif text-2xl text-[#3d030b] font-medium">Campaign Visual Archive</h2>
                            <Link
                                to="/gallery"
                                className="text-xs text-[#3d030b] hover:underline font-semibold flex items-center gap-1"
                            >
                                <span>Browse Full Institute Gallery</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {gallery.length === 0 && (
                            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-8 text-center space-y-3">
                                <ImageIcon className="w-8 h-8 text-[#6B665F] mx-auto" />
                                <p className="text-sm font-medium text-[#1A1A1A]">No Tournament Photography Logged</p>
                                <p className="text-xs text-[#6B665F]">
                                    Photographs from this tournament edition will appear here as the historical archive
                                    is updated.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {gallery.map((item, idx) => (
                                <div
                                    key={item._id}
                                    onClick={() => setActivePhotoIndex(idx)}
                                    className="bg-[#FCF9F2] border border-[rgba(26,26,26,0.12)] p-3 cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#ECE8E1] relative border border-[rgba(26,26,26,0.06)]">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.caption || item.eventName || "Tournament Photo"}
                                            className="w-full h-full object-cover transition-all duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = FALLBACK_ARCHIVAL_HERO;
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-[#121212]/80 text-white text-[10px] font-mono px-2 py-0.5">
                                            {item.year}
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <p className="text-xs text-[#6B665F] uppercase tracking-wider font-semibold">
                                            {item.eventName || "Match Action"}
                                        </p>
                                        <h4 className="text-sm font-serif font-bold text-[#1A1A1A] mt-0.5 truncate">
                                            {item.caption || "Archival Capture"}
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Lightbox Dialog Modal */}
            {activePhotoIndex !== null && gallery[activePhotoIndex] && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                    onClick={() => setActivePhotoIndex(null)}
                >
                    <div
                        className="relative max-w-4xl w-full bg-[#FCF9F2] border border-[#6B665F]/30 p-4 md:p-6 shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Lightbox Header Controls */}
                        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.1)] pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#3d030b] text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                                    {gallery[activePhotoIndex].category}
                                </span>
                                <span className="text-xs text-[#6B665F] font-mono">
                                    {activePhotoIndex + 1} of {gallery.length}
                                </span>
                            </div>
                            <button
                                onClick={() => setActivePhotoIndex(null)}
                                className="p-1 rounded-full text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                                aria-label="Close Preview"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Lightbox Image Container */}
                        <div className="relative flex-grow flex items-center justify-center overflow-hidden bg-black/5 min-h-[300px]">
                            <img
                                src={gallery[activePhotoIndex].imageUrl}
                                alt={gallery[activePhotoIndex].caption || "Gallery Preview"}
                                className="max-h-[55vh] w-auto max-w-full object-contain mx-auto"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_ARCHIVAL_HERO;
                                }}
                            />

                            {/* Prev / Next buttons */}
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivePhotoIndex((prev) =>
                                                prev !== null && prev > 0 ? prev - 1 : gallery.length - 1,
                                            );
                                        }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivePhotoIndex((prev) =>
                                                prev !== null && prev < gallery.length - 1 ? prev + 1 : 0,
                                            );
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Lightbox Metadata Drawer */}
                        <div className="mt-4 pt-3 border-t border-[rgba(26,26,26,0.1)]">
                            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                                {gallery[activePhotoIndex].caption || gallery[activePhotoIndex].eventName}
                            </h3>
                            {gallery[activePhotoIndex].description && (
                                <p className="text-xs text-[#6B665F] mt-1 leading-relaxed">
                                    {gallery[activePhotoIndex].description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
