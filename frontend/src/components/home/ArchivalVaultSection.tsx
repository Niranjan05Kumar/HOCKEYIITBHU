import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface VaultItem {
    id: string;
    title: string;
    spanClass: string;
    imageUrl: string;
}

const VAULT_ITEMS: VaultItem[] = [
    {
        id: "equipment-log",
        title: "1940s Equipment Log",
        spanClass: "col-span-1 row-span-2",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCNpEeuuFa_W56uYt2SPyl5jsWWZXMxxUlIlVXP4qM8m4eQ7hNncfHRf8ETgVPo5nQhsnxNeBGOO9cNNYjrueGc85iLs3yfDc1_6HlKrrSr0t9SWDIAIpNFVk2KiceC6DeCqmnnCsgoqqCrwF2NgrxvIfYgqJ-EzE9wmwmmyqC3mu57sCf9ENkiVgwBbAZLTM2tW-ZLQQcK_tEG6xG_pkHxDYepdd45hiGGfPaFfm979w9tzTF_QueB",
    },
    {
        id: "match-reports-1972",
        title: "Match Reports: 1972",
        spanClass: "col-span-1 row-span-1",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCepIcWmwCvyTgzvzAqPZbKd0CCljoKLzMCmbfpBkoXgKRg3xUXfDZLuPeB-JV3nHuhn2MByepvFLikFm-ROTr619L3AhjlJDS1vBXwKCHsrs3GtBCzjCDlph95ur4qfzglymycJ5M-JG2Kk8rYVz56cumHVV7y7aJWrZvn-uzTM5FXS1n-lcbVooGx8iUlUZ8wTayYX3cotWJUxTJhdIsxij37RE7KDCL05k_bv3zKIi9lug_-MesZ",
    },
    {
        id: "championship-crowds",
        title: "Championship Crowds",
        spanClass: "col-span-2 row-span-1",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCOTcKlGBHzM2gd4AzY8pF0So21fPlzCyCiJdBX2i7Pe2j3F4dLZsmLDnBDNIYnqlEsYJXiGeFO37483Hzlwdqxk2uQE_3EBO7ti5ZJpMNuc9fFoVDrCe8bF49vCwaqj2ZnW8m9FX9qJWpCixJOFISgdJEFJ7LCd4HOBrWh7LEF3eWDXLQux9w_LnT8-Mt3vtTr8PtfA-XyeEf-O3rEb6l6g98IWXylQ-okbJQrI4usi4nrOuN1fyFH",
    },
    {
        id: "the-grit",
        title: "The Grit",
        spanClass: "col-span-1 row-span-1",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCVkaSET93wCzNJhr9nIOfqeMmpYBmrdhl9SOe0FVmFR2hi1Muq26HSQiuB4JLD95OB10JfKdf6OVgt3wgaAkBtZ956W7o3DPpOEjFZxPuJx0IaIHH8Kw_eG00podE2TqTIjA7yoWCqoC0xpzOcrR17WqOuhcl4CaquqlX73o5Jwdl30sGTADeAEOzi9sOxbnKUimazXUpsf-K1vwdwll-od-5bGLUxr3Nd19qIdlIGX6uz-rpkHw-8",
    },
    {
        id: "class-of-85",
        title: "Class of '85",
        spanClass: "col-span-2 row-span-1",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuADwlgy5zzXhXejHSz_Yjy8XxQdySYWagiVDWBh5Am8ZiNmlt5mWv9ZrdiL1yCQTrqU5k-TYWLZvRwJpM3cZWJ3uFRLDpn5Ni-z7d0bNuk1feRBAsLIeNO-9Gekb1Uu3NKQK0aWL2NZo4DKYmzAfC2BAGf5fd7-8pcBper6aw4kzWwFRssA2HSfJCy3Sq5PKscOFAWZXA8zekTgMAWHpqPHi49eElbeNC2FL9pxHCDpI7EOsD6GXJKG",
    },
];

export default function ArchivalVaultSection() {
    return (
        <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="max-w-2xl">
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#1A1A1A] mb-3">
                        From the Vaults
                    </h2>
                    <p className="text-sm sm:text-base text-[#6B665F] leading-relaxed">
                        Explore our digitized collection of match reports, vintage equipment, team logs, and candid
                        photographs spanning over eight decades of collegiate hockey history.
                    </p>
                </div>

                <Link
                    to="/gallery"
                    className="px-7 py-3 bg-[#5A181E] text-[#F4F1EA] hover:bg-[#3D030B] rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
                >
                    Explore Full Archive
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] sm:auto-rows-[200px]">
                {VAULT_ITEMS.map((item) => (
                    <article
                        key={item.id}
                        className={`${item.spanClass} bg-[#ECE8E1] p-3 border border-[rgba(26,26,26,0.08)] relative group overflow-hidden`}
                    >
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-xs font-medium text-[#F4F1EA] tracking-wider uppercase">
                                {item.title}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
