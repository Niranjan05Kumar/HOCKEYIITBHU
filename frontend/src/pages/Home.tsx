import HeroSection from "@/components/home/HeroSection";
import MilestonesSection from "@/components/home/MilestonesSection";
import SquadSpotlightSection from "@/components/home/SquadSpotlightSection";
import ArchivalVaultSection from "@/components/home/ArchivalVaultSection";

export default function Home() {
    return (
        <main className="flex-grow flex flex-col bg-[#F4F1EA]">
            <HeroSection />
            <MilestonesSection />
            <SquadSpotlightSection />
            <ArchivalVaultSection />
        </main>
    );
}
