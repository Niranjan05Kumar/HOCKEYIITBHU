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

/**
 * Application routing configuration.
 * Public views are wrapped in PublicLayout with shared Header and Footer.
 */
export const router = createBrowserRouter([
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
        ],
    },
]);
