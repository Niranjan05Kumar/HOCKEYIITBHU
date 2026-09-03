import { useRef } from "react";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

interface MilestoneCard {
    id: string;
    badge: "Victory" | "Milestone";
    event: string;
    title: string;
    description: string;
    imageUrl: string;
}

const MILESTONES: MilestoneCard[] = [
    {
        id: "1968-spardha",
        badge: "Victory",
        event: "1968 SPARDHA Finals",
        title: "The Golden Goal Generation",
        description:
            "A historic final against regional rivals ending in a dramatic sudden-death victory, cementing the team's legacy for a decade.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA1HRPcjn4n-uiZ4ckwDCZb6w8bnAtptqx3eAsb5kbU17StjNxhAKvwsbtK73fPRXXBsU6FK7J8GntSsawtUKZ7nsEXbL5h8GxyXZaGoOaocYgAZ-7h0XlhH8DaUyIqrMqEs_vz86JWXagjA_y478slkYp8LjoC9MDp-pLd_3GSsG8PWVhEozKwflXqej_urZeJzGTRx4wN-bQxnPkvOpntBvs7ZLSMDRmFaWwMXE6QWhVOseHt5nea",
    },
    {
        id: "1982-inter-iit",
        badge: "Milestone",
        event: "1982 Inter-IIT Meet",
        title: "Unbeaten Streak Initiated",
        description:
            "The commencement of a legendary 3-year unbeaten run across all major collegiate tournaments in Northern India.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC8_9hbTuceqo1qrdQRYfICZMhvNK1DHK4E5mRxY0PGNmIsVeFKnPTwo_FZ7dJE1EueW6sCaS1XwFm-nk7LCysOhN-BdPjVr8x033Zu603uNGu6jP7F485vD43-lQ19iK6-vzei1XDvCiMM9XOma1OZTLYtAg5j9tvvlEPuOLq0X5EVm8Zs6X4EZsYZIxs1mmfCHMPcKnBWMXHNDkTIn8lx0Cbf4CNhd_IWhkjB1EI5MshpFdT1MIMS",
    },
    {
        id: "1955-inaugural",
        badge: "Victory",
        event: "1955 Inaugural Cup",
        title: "Foundations of Glory",
        description:
            "The very first major championship secured by the institute, laying the groundwork for a rich hockey tradition.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDJp6yAprEhHEWcJ-OV3cF2KM3jejQhxVZGvpkMppzpHQFUvs_NaG3zB0BS4QskMgJTYr2GW9ctVJMLLAe0TSuD-3i0nnr9ZO54Iztj8e4x26Py48vnqIdgWwoLZz1WLHAsnz7_8XSHCbWMN7zLejXabbbFBHoTMr5b_l_gIxDjp_mJQg60gXgZnFr7VcRBgeUplnfrjPlvauCUE8pN7nn0CMzwHHomyp3NwKC3_3XHen642FIuH-8-",
    },
];

export default function MilestonesSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = direction === "left" ? -420 : 420;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

    return (
        <section className="py-16 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto w-full">
            {/* Header & Controls */}
            <div className="flex justify-between items-end mb-8 md:mb-10">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#1A1A1A] mb-2">
                        Historic Victories
                    </h2>
                    <p className="text-sm text-[#6B665F]">Chronicles of our most defining moments on the field.</p>
                </div>

                <div className="hidden md:flex gap-2">
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        aria-label="Scroll left"
                        className="w-10 h-10 rounded-full border border-[rgba(26,26,26,0.12)] flex items-center justify-center text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        aria-label="Scroll right"
                        className="w-10 h-10 rounded-full border border-[rgba(26,26,26,0.12)] flex items-center justify-center text-[#1A1A1A] hover:bg-[#E2DDD4] transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Snap Carousel */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {MILESTONES.map((card) => (
                    <article
                        key={card.id}
                        className="min-w-[300px] sm:min-w-[360px] md:min-w-[400px] snap-start bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded-none group hover:bg-[#E2DDD4] transition-colors duration-300 flex flex-col justify-between"
                    >
                        <div className="h-48 bg-[#dcdad3] w-full relative overflow-hidden">
                            <img
                                src={card.imageUrl}
                                alt={card.title}
                                className="w-full h-full object-cover grayscale opacity-90 mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4">
                                {card.badge === "Victory" ? (
                                    <span className="px-3 py-1 bg-[#2D5A3D] text-[#F4F1EA] rounded-full text-xs uppercase tracking-wider font-medium">
                                        Victory
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-[#E2DDD4] text-[#6B665F] rounded-full text-xs uppercase tracking-wider font-medium border border-[rgba(26,26,26,0.12)]">
                                        Milestone
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="text-xs font-medium text-[#6B665F] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5 text-[#5A181E]" />
                                {card.event}
                            </div>
                            <h3 className="text-lg font-medium text-[#1A1A1A] mb-3 tracking-[-0.01em]">{card.title}</h3>
                            <p className="text-sm text-[#6B665F] leading-relaxed line-clamp-3">{card.description}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
