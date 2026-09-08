import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "@/components/common/PublicLayout";
import Home from "@/pages/Home";
import Achievements from "@/pages/Achievements";
import Tournaments from "@/pages/Tournaments";
import TournamentDetail from "@/pages/TournamentDetail";
import Teams from "@/pages/Teams";
import TeamDetail from "@/pages/TeamDetail";
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
import AdminTournamentEditions from "@/pages/admin/TournamentEditions";
import AdminMatches from "@/pages/admin/Matches";
import AdminAchievements from "@/pages/admin/Achievements";
import AdminHistory from "@/pages/admin/History";
import AdminGallery from "@/pages/admin/Gallery";
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
                element: <TeamDetail />,
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
                        element: <AdminTournamentEditions />,
                    },
                    {
                        path: "matches",
                        element: <AdminMatches />,
                    },
                    {
                        path: "achievements",
                        element: <AdminAchievements />,
                    },
                    {
                        path: "history",
                        element: <AdminHistory />,
                    },
                    {
                        path: "gallery",
                        element: <AdminGallery />,
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
