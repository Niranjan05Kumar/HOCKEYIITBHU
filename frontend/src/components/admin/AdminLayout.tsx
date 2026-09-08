import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    User,
    Users,
    Trophy,
    CalendarRange,
    Swords,
    Medal,
    History,
    Image,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/context";

const CREST_URL = "/images/logo.png";

interface NavItem {
    label: string;
    to: string;
    icon: typeof LayoutDashboard;
}

/**
 * EXACT 9 Sidebar Navigation Items as mandated by project requirements and Stitch spec.
 */
const ADMIN_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Players", to: "/admin/players", icon: User },
    { label: "Teams", to: "/admin/teams", icon: Users },
    { label: "Tournament", to: "/admin/tournaments", icon: Trophy },
    { label: "Tournament Editions", to: "/admin/tournament-editions", icon: CalendarRange },
    { label: "Matches", to: "/admin/matches", icon: Swords },
    { label: "Achievements", to: "/admin/achievements", icon: Medal },
    { label: "History", to: "/admin/history", icon: History },
    { label: "Gallery", to: "/admin/gallery", icon: Image },
];

export default function AdminLayout() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [loggingOut, setLoggingOut] = useState<boolean>(false);

    const handleSignOut = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate("/admin/login", { replace: true });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F1EA] text-[#1A1A1A]">
            {/* Mobile Header Bar */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#ECE8E1] border-b border-[rgba(26,26,26,0.08)] sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <img
                        src={CREST_URL}
                        alt="IIT (BHU) Hockey Crest"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <div>
                        <h1 className="text-xs font-semibold tracking-wider text-[#3d030b] uppercase leading-tight">
                            IIT (BHU) Hockey
                        </h1>
                        <p className="text-[10px] text-[#6B665F] tracking-widest uppercase">Admin Suite</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setMobileOpen((prev) => !prev)}
                    className="p-1.5 rounded-full border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                    aria-label="Toggle admin navigation menu"
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Fixed Sidebar Navigation */}
            <aside
                className={`w-64 bg-[#ECE8E1] border-r border-[rgba(26,26,26,0.08)] flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Brand Header */}
                <div className="p-6 border-b border-[rgba(26,26,26,0.08)]">
                    <div className="flex items-center gap-3">
                        <img
                            src={CREST_URL}
                            alt="IIT (BHU) Hockey Crest"
                            className="w-10 h-10 object-contain shrink-0"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                        <div className="min-w-0">
                            <h1 className="text-xs font-semibold tracking-wider text-[#3d030b] uppercase leading-tight">
                                IIT (BHU) Hockey Archive
                            </h1>
                            <p className="text-[11px] text-[#6B665F] tracking-widest uppercase mt-0.5">Admin Suite</p>
                        </div>
                    </div>

                    {/* Admin identity badge */}
                    {admin && (
                        <div className="mt-4 pt-3 border-t border-[rgba(26,26,26,0.06)] flex flex-col">
                            <span className="text-xs font-medium text-[#1A1A1A] truncate">
                                {admin.name || "Administrator"}
                            </span>
                            <span className="text-[11px] text-[#6B665F] truncate">{admin.email}</span>
                        </div>
                    )}
                </div>

                {/* Exact 9 Navigation Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {ADMIN_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-3.5 py-2.5 transition-colors text-xs font-medium ${
                                        isActive
                                            ? "bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] text-[#3d030b]"
                                            : "text-[#6B665F] hover:bg-[#E2DDD4] hover:text-[#3d030b] border border-transparent hover:border-[rgba(26,26,26,0.06)]"
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="tracking-tight">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Fixed Logout at Bottom of Sidebar */}
                <div className="p-4 border-t border-[rgba(26,26,26,0.08)] bg-[#ECE8E1]">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={loggingOut}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-[#6B665F] border border-[rgba(26,26,26,0.15)] hover:border-[#3d030b] hover:text-[#3d030b] hover:bg-[#5a181e]/5 transition-all text-xs font-medium disabled:opacity-50"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="tracking-tight">{loggingOut ? "Signing Out..." : "Sign Out"}</span>
                    </button>
                </div>
            </aside>

            {/* Main Admin Workspace */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA] overflow-x-hidden">
                <Outlet />
            </div>
        </div>
    );
}
