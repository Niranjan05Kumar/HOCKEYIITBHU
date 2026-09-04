import { useAuth } from "@/context";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Trophy,
    CalendarRange,
    Swords,
    Medal,
    History,
    Image,
    Shield,
    ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
    const { admin } = useAuth();

    const modules = [
        { title: "Players", path: "/admin/players", icon: Users, desc: "Athlete profiles & historical rosters" },
        { title: "Teams", path: "/admin/teams", icon: Shield, desc: "Varsity squads across academic seasons" },
        {
            title: "Tournaments",
            path: "/admin/tournaments",
            icon: Trophy,
            desc: "Championship categories & sanctioning bodies",
        },
        {
            title: "Tournament Editions",
            path: "/admin/tournament-editions",
            icon: CalendarRange,
            desc: "Seasonal editions, standings & venues",
        },
        { title: "Matches", path: "/admin/matches", icon: Swords, desc: "Verified scorelines & fixture dossiers" },
        {
            title: "Achievements",
            path: "/admin/achievements",
            icon: Medal,
            desc: "Medals, titles & distinction citations",
        },
        {
            title: "History",
            path: "/admin/history",
            icon: History,
            desc: "Chronological milestones & defining moments",
        },
        { title: "Gallery", path: "/admin/gallery", icon: Image, desc: "Digitized physical assets & photography" },
    ];

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Page Header matching Stitch Admin Dashboard */}
            <header className="border-b border-[rgba(26,26,26,0.08)] px-6 md:px-12 py-8 bg-[#F4F1EA]">
                <div className="max-w-6xl mx-auto">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#9C968D]">
                        Institutional Records Registry
                    </span>
                    <h1 className="text-3xl font-medium text-[#3d030b] tracking-tight mt-1">System Overview</h1>
                    <p className="text-xs sm:text-sm text-[#6B665F] mt-1 max-w-2xl leading-relaxed">
                        Welcome, {admin?.name || "Administrator"}. Comprehensive administrative suite for cataloging,
                        verifying, and curating IIT (BHU) Hockey historical records.
                    </p>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-1 p-6 md:p-12">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Welcome Banner */}
                    <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-6 md:p-8 relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#F4F1EA] border border-[rgba(26,26,26,0.1)] text-[#3d030b]">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-[#1A1A1A]">Curatorial Control Desk</h2>
                                    <p className="text-xs text-[#6B665F]">
                                        Authenticated Session:{" "}
                                        <span className="font-medium text-[#3d030b]">{admin?.email}</span>
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2D5A3D] text-white">
                                Active Session
                            </span>
                        </div>
                    </div>

                    {/* Management Module Hub */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A1A]">
                                Administrative Modules
                            </h2>
                            <p className="text-xs text-[#6B665F]">
                                Select a repository module to view and manage cataloged entries.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {modules.map((mod) => {
                                const Icon = mod.icon;
                                return (
                                    <Link
                                        key={mod.path}
                                        to={mod.path}
                                        className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] hover:border-[rgba(26,26,26,0.25)] hover:bg-[#E2DDD4] p-5 transition-colors group flex flex-col justify-between h-36"
                                    >
                                        <div className="flex justify-between items-start">
                                            <Icon className="w-5 h-5 text-[#3d030b]" />
                                            <ArrowRight className="w-3.5 h-3.5 text-[#9C968D] group-hover:text-[#3d030b] group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#3d030b] transition-colors">
                                                {mod.title}
                                            </h3>
                                            <p className="text-[11px] text-[#6B665F] line-clamp-2 mt-0.5">{mod.desc}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
