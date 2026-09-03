import { createBrowserRouter } from "react-router-dom";
import App from "@/App";

/**
 * Base application router configuration.
 * Future pages and layouts will be registered here as features are developed.
 */
export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
]);
