import { Download } from "lucide-react";

const HERO_IMAGE_URL = "/images/hero-campus.png";
const MAGAZINE_PDF_URL = "/images/Drona-magazine-hockey-iitbhu.pdf";
const MAGAZINE_DOWNLOAD_FILENAME = "IIT-BHU-Hockey-Magazine.pdf";

export default function HeroSection() {
    return (
        <section className="relative w-full h-[80vh] sm:h-[87vh] min-h-[620px] sm:min-h-[700px] flex flex-col items-center justify-between overflow-hidden px-4 sm:px-6 py-10 sm:py-14">
            {/* Background Image: Iconic IIT (BHU) Heritage Architecture */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    src={HERO_IMAGE_URL}
                    alt="IIT (BHU) Iconic Campus Architecture"
                    className="w-full h-full object-cover object-center"
                />
                {/* Balanced black gradient overlay for crisp contrast and cinematic hero presence */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/65" />
            </div>

            {/* Heading Typography: Positioned slightly above vertical center */}
            <div className="relative z-10 flex-1 flex items-center justify-center -mt-6 sm:-mt-10 md:-mt-12 w-full max-w-4xl mx-auto text-[#5A181E] text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl text-white tracking-[-0.03em] font-medium leading-[1.08] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
                    The Legacy of IIT (BHU) Varanasi Hockey
                </h1>
            </div>

            {/* Description Typography: Anchored at the bottom of the hero section */}
            <div className="relative z-10 w-full max-w-2xl mx-auto text-center pb-8 sm:pb-4">
                <p className="sm:text-lg md:text-xl text-white/95 tracking-wider leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    Preserving a century of athletic excellence, archival records, and institutional pride on the fields
                    of Varanasi.
                </p>
            </div>

            {/* Download Magazine */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:bottom-10 lg:right-12 z-20">
                <a
                    href={MAGAZINE_PDF_URL}
                    download={MAGAZINE_DOWNLOAD_FILENAME}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download IIT (BHU) Hockey Digital Archive Magazine"
                    className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#5A181E]/95 hover:bg-[#3D030B] text-[#F4F1EA] border border-[#F4F1EA]/25 shadow-lg backdrop-blur-sm font-medium text-xs sm:text-sm tracking-normal transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4F1EA] focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
                >
                    <Download
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F4F1EA] transition-transform duration-200 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                    />
                    <span>Download Magazine</span>
                </a>
            </div>
        </section>
    );
}
