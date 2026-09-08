import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Lock, Menu, X } from "lucide-react";

const CREST_URL = "/images/logo.png";

interface NavItem {
    label: string;
    to: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Home", to: "/" },
    { label: "Achievements", to: "/achievements" },
    { label: "Tournaments", to: "/tournaments" },
    { label: "Matches", to: "/matches" },
    { label: "Teams", to: "/teams" },
    { label: "Players", to: "/roster" },
    { label: "Gallery", to: "/gallery" },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-[#F4F1EA]/95 backdrop-blur-sm border-b border-[rgba(26,26,26,0.08)]">
            <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-3.5 flex justify-between items-center">
                {/* Brand Lockup */}
                <Link to="/" className="flex items-center gap-3 group">
                    <img
                        src={CREST_URL}
                        alt="IIT BHU Hockey Crest"
                        className="w-10 h-10 object-contain rounded-full transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight text-[#5A181E] leading-tight font-sans">
                            HOCKEY
                        </span>
                        <span className="text-sm tracking-[0.16em] font-semibold text-[#5A181E] uppercase leading-tight">
                            IIT BHU
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-8 text-sm">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive
                                    ? "text-[#5A181E] font-medium border-b-2 border-[#5A181E] pb-1 transition-colors"
                                    : "text-[#6B665F] hover:text-[#1A1A1A] font-normal pb-1 transition-colors duration-200"
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Right Action & Mobile Toggle */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/login"
                        className="rounded-full border border-[rgba(26,26,26,0.18)] hover:border-[#5A181E] text-xs font-medium text-[#1A1A1A] hover:text-[#5A181E] px-4 py-2 flex items-center gap-2 transition-colors"
                    >
                        <Lock className="w-3.5 h-3.5 text-[#5A181E]" />
                        <span>Admin Login</span>
                    </Link>

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="md:hidden p-1.5 rounded-full border border-[rgba(26,26,26,0.15)] text-[#1A1A1A] hover:bg-[#ECE8E1] transition-colors"
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[rgba(26,26,26,0.08)] bg-[#F4F1EA] px-6 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col space-y-2">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#5A181E] font-semibold text-sm py-1.5 border-l-2 border-[#5A181E] pl-2 bg-[#ECE8E1]/50"
                                        : "text-[#6B665F] hover:text-[#1A1A1A] text-sm py-1.5 pl-2 transition-colors"
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
