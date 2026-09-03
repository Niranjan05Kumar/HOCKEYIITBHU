const HERO_IMAGE_URL = "/images/hero-campus.jpg";

interface MetricItem {
    value: string;
    label: string;
}

const METRICS: MetricItem[] = [
    { value: "142", label: "Total Medals" },
    { value: "18", label: "SPARDHA Titles" },
    { value: "1.2k+", label: "Documented Alumni" },
    { value: "85", label: "Documented Seasons" },
];

export default function HeroSection() {
    return (
        <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image: Vivid IIT (BHU) Campus with Reduced Darkness */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    src={HERO_IMAGE_URL}
                    alt="IIT (BHU) Iconic Campus Architecture"
                    className="w-full h-full object-cover object-center"
                />
                {/* Subtle, balanced scrim to preserve brightness while maintaining text legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/35" />
            </div>

            {/* Central Hero Typography */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto -mt-12 md:mt-0">
                <h1 className="text-4xl sm:text-5xl md:text-7xl text-white mb-5 tracking-[-0.03em] font-medium drop-shadow-[0_3px_12px_rgba(0,0,0,0.75)] leading-[1.08]">
                    The Legacy of IIT (BHU) Hockey
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-relaxed">
                    Preserving a century of athletic excellence, archival records, and institutional pride on the fields
                    of Varanasi.
                </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="absolute bottom-0 left-0 w-full bg-[#F4F1EA]/95 backdrop-blur-md border-t border-[rgba(26,26,26,0.08)] py-6 px-4 md:px-12 z-20">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {METRICS.map((metric, index) => (
                        <div
                            key={metric.label}
                            className={`flex flex-col items-center text-center ${
                                index > 0 ? "border-l border-[rgba(26,26,26,0.08)] pl-4 md:pl-6" : ""
                            }`}
                        >
                            <span className="text-2xl sm:text-3xl md:text-4xl text-[#3D030B] font-bold tracking-tight">
                                {metric.value}
                            </span>
                            <span className="text-[11px] sm:text-xs text-[#6B665F] uppercase tracking-widest mt-1 font-medium">
                                {metric.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
