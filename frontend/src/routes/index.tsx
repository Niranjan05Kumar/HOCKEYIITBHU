import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/components/common/PublicLayout";
import Home from "@/pages/Home";
import Achievements from "@/pages/Achievements";
import Tournaments from "@/pages/Tournaments";

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
                element: (
                    <main className="flex-grow pt-12 pb-16 px-4 md:px-16 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
                        <div className="bg-[#ECE8E1] p-12 border border-[rgba(26,26,26,0.08)] max-w-md mx-auto text-center space-y-4 my-12">
                            <h2 className="text-xl font-medium text-[#3d030b]">Tournament Detail</h2>
                            <p className="text-xs text-[#6B665F]">
                                Tournament editions and match schedules will be implemented in the next milestone.
                            </p>
                        </div>
                    </main>
                ),
            },
        ],
    },
]);
