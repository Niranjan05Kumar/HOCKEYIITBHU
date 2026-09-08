import { Link } from "react-router-dom";
import { ArrowLeft, Home, Trophy } from "lucide-react";

const CREST_URL = "/images/logo.png";

export default function NotFound() {
    return (
        <main className="flex-grow flex items-center justify-center py-20 px-4 md:px-12 max-w-[1440px] mx-auto w-full bg-[#F4F1EA]">
            <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-8 sm:p-12 max-w-lg mx-auto text-center space-y-6 shadow-xs">
                <div className="flex justify-center">
                    <img
                        src={CREST_URL}
                        alt="IIT (BHU) Hockey Crest"
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </div>

                <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5A181E]">
                        Error 404 • Ledger Entry Uncataloged
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                        Page Not Found
                    </h1>
                    <p className="text-sm text-[#6B665F] leading-relaxed max-w-sm mx-auto">
                        The requested archival record or destination does not exist in the IIT (BHU) Hockey repository.
                        It may have been relocated or is yet to be indexed.
                    </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium bg-[#5A181E] text-white hover:bg-[#3d030b] transition-colors"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span>Return to Home</span>
                    </Link>
                    <Link
                        to="/tournaments"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium border border-[rgba(26,26,26,0.2)] text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                    >
                        <Trophy className="w-3.5 h-3.5 text-[#5A181E]" />
                        <span>Browse Tournaments</span>
                    </Link>
                </div>

                <div className="pt-4 border-t border-[rgba(26,26,26,0.08)]">
                    <Link
                        to="/"
                        className="text-xs text-[#6B665F] hover:text-[#1A1A1A] inline-flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back to previous directory</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}
