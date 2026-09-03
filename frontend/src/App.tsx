import { CheckCircle2, ShieldCheck, Terminal, Layers } from "lucide-react";

export default function App() {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

    return (
        <main className="min-h-screen bg-heritage-canvas text-heritage-charcoal flex flex-col items-center justify-center p-6 font-sans antialiased">
            <div className="w-full max-w-xl bg-heritage-surface border border-heritage-charcoal/10 p-8 shadow-sm rounded-md space-y-6">
                <div className="flex items-center justify-between border-b border-heritage-charcoal/10 pb-4">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-heritage-maroon font-semibold">
                            IIT (BHU) Digital Archive
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-heritage-charcoal mt-1">
                            Frontend Foundation
                        </h1>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-heritage-win/10 text-heritage-win rounded-full border border-heritage-win/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ready
                    </span>
                </div>

                <p className="text-sm text-heritage-taupe leading-relaxed">
                    The frontend foundation is successfully set up and configured. Core tooling, Tailwind styling,
                    centralized Axios API client, strict TypeScript contracts, and React Router are initialized.
                </p>

                <div className="space-y-3">
                    <h2 className="text-xs uppercase tracking-wider text-heritage-taupe font-medium flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Configuration Details
                    </h2>
                    <div className="bg-heritage-canvas/80 border border-heritage-charcoal/10 rounded p-3 text-xs space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-heritage-taupe">API Base URL:</span>
                            <span className="text-heritage-charcoal font-semibold">{apiBaseUrl}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-heritage-taupe">Credentials:</span>
                            <span className="text-heritage-charcoal font-semibold">withCredentials (Session)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-heritage-taupe">Design Theme:</span>
                            <span className="text-heritage-charcoal font-semibold">Heritage Athletic Archive</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-xs uppercase tracking-wider text-heritage-taupe font-medium flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Integrated Core Stack
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {[
                            "React 18",
                            "Vite 6",
                            "TypeScript 5",
                            "Tailwind CSS",
                            "React Router",
                            "Axios",
                            "shadcn/ui",
                            "Lucide React",
                            "React Hook Form",
                            "Zod",
                        ].map((tech) => (
                            <span
                                key={tech}
                                className="px-2.5 py-1 bg-heritage-canvas border border-heritage-charcoal/10 text-heritage-charcoal font-medium rounded-sm"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t border-heritage-charcoal/10 flex items-center justify-between text-xs text-heritage-taupe">
                    <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-heritage-maroon" />
                        Backend-Safe Architecture
                    </span>
                    <span>Ready for Feature Integration</span>
                </div>
            </div>
        </main>
    );
}
