import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

interface ModulePlaceholderProps {
    title: string;
    subtitle: string;
    description: string;
}

export default function ModulePlaceholder({ title, subtitle, description }: ModulePlaceholderProps) {
    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="border-b border-[rgba(26,26,26,0.08)] px-6 md:px-12 py-8 bg-[#F4F1EA]">
                <div className="max-w-6xl mx-auto">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#9C968D]">
                        {subtitle}
                    </span>
                    <h1 className="text-3xl font-medium text-[#3d030b] tracking-tight mt-1">{title}</h1>
                    <p className="text-xs sm:text-sm text-[#6B665F] mt-1 max-w-2xl leading-relaxed">{description}</p>
                </div>
            </header>

            {/* Workspace State */}
            <main className="flex-1 p-6 md:p-12 flex items-center justify-center">
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 max-w-lg text-center space-y-4 shadow-xs">
                    <Clock className="w-10 h-10 text-[#5a181e] mx-auto opacity-75" />
                    <h2 className="text-xl font-medium text-[#1A1A1A]">{title} Management Module</h2>
                    <p className="text-xs sm:text-sm text-[#6B665F] leading-relaxed">
                        The full administrative management and curation workspace for {title.toLowerCase()} is scheduled
                        for the upcoming frontend milestone.
                    </p>
                    <div className="pt-3">
                        <Link
                            to="/admin/dashboard"
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium bg-[#5a181e] text-white hover:bg-[#3d030b] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Return to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
