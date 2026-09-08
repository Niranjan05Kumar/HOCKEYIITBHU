const HERO_IMAGE_URL = "/images/hero-campus.jpg";

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
            <div className="relative z-10 flex-1 flex items-center justify-center -mt-6 sm:-mt-10 md:-mt-12 w-full max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl text-white tracking-[-0.03em] font-medium leading-[1.08] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
                    The Legacy of IIT (BHU) Varanasi Hockey
                </h1>
            </div>

            {/* Description Typography: Anchored at the bottom of the hero section */}
            <div className="relative z-10 w-full max-w-2xl mx-auto text-center pb-2 sm:pb-4">
                <p className="sm:text-lg md:text-xl text-white/95 tracking-wider leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    Preserving a century of athletic excellence, archival records, and institutional pride on the fields
                    of Varanasi.
                </p>
            </div>
        </section>
    );
}
