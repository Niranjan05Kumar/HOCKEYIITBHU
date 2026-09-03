import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/components/common/PublicLayout";
import Home from "@/pages/Home";

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
        ],
    },
]);
