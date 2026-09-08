import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";

const CREST_URL = "/images/logo.png";

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show archival verification state during initial session handshake
    if (loading) {
        return (
            <main className="min-h-screen w-full bg-[#F4F1EA] flex items-center justify-center p-6">
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 max-w-sm w-full text-center space-y-4">
                    <img
                        src={CREST_URL}
                        alt="IIT (BHU) Crest"
                        className="w-14 h-14 mx-auto object-contain animate-pulse"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-widest font-semibold text-[#5A181E]">
                            Heritage Archive
                        </p>
                        <p className="text-sm text-[#1A1A1A] font-medium">Verifying Admin Credentials...</p>
                    </div>
                    <div className="w-16 h-0.5 bg-[#5A181E]/30 mx-auto overflow-hidden rounded-full">
                        <div className="w-full h-full bg-[#5A181E] animate-indeterminate" />
                    </div>
                </div>
            </main>
        );
    }

    // Redirect unauthenticated visitors to login, preserving intended path
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
