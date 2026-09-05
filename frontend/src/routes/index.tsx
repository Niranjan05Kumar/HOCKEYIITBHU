import { createBrowserRouter, Link, Navigate } from "react-router-dom";
import PublicLayout from "@/components/common/PublicLayout";
import Home from "@/pages/Home";
import Achievements from "@/pages/Achievements";
import Tournaments from "@/pages/Tournaments";
import TournamentDetail from "@/pages/TournamentDetail";
import Teams from "@/pages/Teams";
import Roster from "@/pages/Roster";
import PlayerProfile from "@/pages/PlayerProfile";
import Gallery from "@/pages/Gallery";
import TournamentEditionDetail from "@/pages/TournamentEditionDetail";
import Matches from "@/pages/Matches";
import MatchDetail from "@/pages/MatchDetail";
import NotFound from "@/pages/NotFound";

// Admin Views & Components
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminPlayers from "@/pages/admin/Players";
import AdminTeams from "@/pages/admin/Teams";
import AdminTournaments from "@/pages/admin/Tournaments";
import ModulePlaceholder from "@/pages/admin/ModulePlaceholder";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";

/**
 * Application routing configuration.
 * - Public views are wrapped in PublicLayout with shared Header and Footer.
 * - Admin Login is transactional and renders without public or admin navigation shells.
 * - Admin views are secured via ProtectedRoute and wrapped in AdminLayout.
 */
export const router = createBrowserRouter([
    // Public User Routes
    {
        path: "/",
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: "achievements",
                element: <Achievements />,
            },
            {
                path: "tournaments",
                element: <Tournaments />,
            },
            {
                path: "tournaments/:id",
                element: <TournamentDetail />,
            },
            {
                path: "tournaments/:id/editions/:editionId",
                element: <TournamentEditionDetail />,
            },
            {
                path: "tournament-editions/:editionId",
                element: <TournamentEditionDetail />,
            },
            {
                path: "teams",
                element: <Teams />,
            },
            {
                path: "teams/:id",
                element: (
                    <main className="flex-grow pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
                        <div className="bg-[#ECE8E1] p-12 border border-[rgba(26,26,26,0.08)] max-w-md mx-auto text-center space-y-4 my-12">
                            <h2 className="text-xl font-medium text-[#3d030b]">Team Detail & Squad Roster</h2>
                            <p className="text-xs text-[#6B665F]">
                                Full team roster, player lineup, and season performance statistics will be implemented
                                in the upcoming Team Detail milestone.
                            </p>
                            <div className="pt-2">
                                <Link
                                    to="/teams"
                                    className="inline-block px-5 py-2 rounded-full text-xs font-medium bg-[#5a181e] text-[#F4F1EA] hover:bg-[#3d030b] transition-colors"
                                >
                                    Back to Teams Archive
                                </Link>
                            </div>
                        </div>
                    </main>
                ),
            },
            {
                path: "roster",
                element: <Roster />,
            },
            {
                path: "roster/:id",
                element: <PlayerProfile />,
            },
            {
                path: "players",
                element: <Navigate to="/roster" replace />,
            },
            {
                path: "players/:id",
                element: <Navigate to="/roster" replace />,
            },
            {
                path: "gallery",
                element: <Gallery />,
            },
            {
                path: "matches",
                element: <Matches />,
            },
            {
                path: "matches/:id",
                element: <MatchDetail />,
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },

    // Admin Authentication (Public Route)
    {
        path: "/admin/login",
        element: <AdminLogin />,
    },

    // Protected Admin Routes
    {
        path: "/admin",
        element: <ProtectedRoute />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="dashboard" replace />,
                    },
                    {
                        path: "dashboard",
                        element: <AdminDashboard />,
                    },
                    {
                        path: "players",
                        element: <AdminPlayers />,
                    },

                    {
                        path: "teams",
                        element: <AdminTeams />,
                    },
                    {
                        path: "tournaments",
                        element: <AdminTournaments />,
                    },
                    {
                        path: "tournament-editions",
                        element: (
                            <ModulePlaceholder
                                title="Tournament Editions"
                                subtitle="Seasonal Tournament Campaigns"
                                description="Manage specific tournament editions, venues, championship years, and final standings."
                            />
                        ),
                    },
                    {
                        path: "matches",
                        element: (
                            <ModulePlaceholder
                                title="Matches"
                                subtitle="Verified Fixture Dossiers"
                                description="Manage individual match scorelines, opponent institutions, tournament rounds, and verified outcomes."
                            />
                        ),
                    },
                    {
                        path: "achievements",
                        element: (
                            <ModulePlaceholder
                                title="Achievements"
                                subtitle="Honor & Distinction Registry"
                                description="Manage medals, varsity trophies, championship banners, and curatorial spotlight awards."
                            />
                        ),
                    },
                    {
                        path: "history",
                        element: (
                            <ModulePlaceholder
                                title="History"
                                subtitle="Chronological Milestone Archive"
                                description="Manage historical defining moments, timeline event entries, and archival narratives."
                            />
                        ),
                    },
                    {
                        path: "gallery",
                        element: (
                            <ModulePlaceholder
                                title="Gallery"
                                subtitle="Digitized Photographic Vault"
                                description="Manage archival photography, image classification categories, and historical asset records."
                            />
                        ),
                    },
                    {
                        path: "*",
                        element: <Navigate to="dashboard" replace />,
                    },
                ],
            },
        ],
    },
]);
