import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const SQUAD_PHOTO_URL =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAhCnJsvkUJFeW_GEedF4M3zOg5UM20QM3FyiAVUoc0Gt3MwcKjZbsBPa9MNV1GYSU6JiiyZzzzaohadSYZNWyePmhT89x2EADZtJUvB_RSWig-qH1rIxi4SY-yja0B-xfWGq-Xep9ZHo7v-yIRpHAkL44nVKI6O2Vfl0CYMxfTDnMujQ3hDAsErzR9I264cvcqShnRJDtkdC9EU1FK76J9HS0OLRgPRyCqDfqa9KMf5_MEOG1-jQDE";

interface LeaderProfile {
    role: string;
    name: string;
    detail: string;
    avatarUrl: string;
}

const LEADERSHIP: LeaderProfile[] = [
    {
        role: "Captain",
        name: "Rahul Sharma",
        detail: "Midfielder • 4th Year",
        avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuARZAfs5lwiH4cq5wlfWK_bG2C_PQQt9HJiFsUV7dqgEaQBsGfZ9UmLC8rceYjCrff0CLxG4r-Vqec9-BIDLrSLjyoGsNioOALKuhEqmPGVCpfjKJuu7qaeQCpYbUvf-Bi3ygwzatBoGoZib61uXW7wRCYtvylpcCJiEs6r5EHoJQUUqRRqDfu7QlWS-15Tdy56iqTDy_3irK4yboo-YZSqRXatHFmkxlHkDf8kjOdq0v7y0_aL_Goi",
    },
    {
        role: "Vice-Captain",
        name: "Vikram Singh",
        detail: "Defender • 3rd Year",
        avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDO9CF398ndoYz9XYICa65s1IjWdtufRvffJmz2BKjavzXdrfnFuIuo01yZEjHGAZ-MryjzqS1gtqt-6nLMWLD6Den8s5RgQv7o6yKqR99VFd5D_W8xtwwHA9mS2JzzsNfRAhuF0StJYCtq1TJb0Y_pLXgyz9_4Xl6r5jDrEtgCykrOlNgl_OG8LMWftFEBsL80ZRJmm_zqMAuYUCQi9OHnCrcyUsyFEigDC0Hsh1LjAMLRRqasdE9n",
    },
    {
        role: "Head Coach",
        name: "Anil Kumar",
        detail: "Alumnus, Class of '92",
        avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDLXW3YTRAwQD1u7nK3CiarDndkxih4DumrS47Rx3-Cc7_5XPm1LtaaxjiwuBaBcpQe7OUex6DGt5eEzqgJi8FUtdA7mPwrhVGzGqEsztYzU54xfUk7-tlJuFRS9dz_2gQUhhsooRX5hF9MyRTm8UD17I2tzKQgm4VGtdU9sE2-yuoWBB2R6gfe-9-TbXUYhhRO0t6a4pv4zHnJOBiGqQ1h48kcUM2Q6XGPxf3jjF0BHwJUsBm8gkcg",
    },
];

export default function SquadSpotlightSection() {
    return (
        <section className="py-14 md:py-20 px-4 sm:px-6 md:px-12 bg-[#F1EEE7] border-y border-[rgba(26,26,26,0.08)]">
            <div className="max-w-[1440px] mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#1A1A1A] mb-2">
                        Current Roster Spotlight
                    </h2>
                    <p className="text-sm text-[#6B665F]">Carrying the torch into the modern era.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Main Team Photo Card (8 Columns) */}
                    <div className="md:col-span-8 bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] rounded-none p-4 md:p-6 flex flex-col justify-between">
                        <div className="w-full aspect-video md:h-[400px] bg-[#dcdad3] relative mb-6 overflow-hidden">
                            <img
                                src={SQUAD_PHOTO_URL}
                                alt="IIT (BHU) Varsity Field Hockey Team"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 px-2 pb-2">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-medium text-[#1A1A1A] mb-1 tracking-tight">
                                    2023-24 Varsity Squad
                                </h3>
                                <p className="text-sm text-[#6B665F] flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#5A181E]" />
                                    Rajputana Ground, Varanasi
                                </p>
                            </div>
                            <Link
                                to="/roster"
                                className="px-6 py-2.5 border border-[rgba(26,26,26,0.25)] hover:border-[#5A181E] rounded-full text-xs sm:text-sm font-medium text-[#1A1A1A] hover:text-[#5A181E] hover:bg-[#E2DDD4] transition-colors self-start sm:self-auto text-center"
                            >
                                View Full Roster
                            </Link>
                        </div>
                    </div>

                    {/* Leadership Sidebar (4 Columns) */}
                    <div className="md:col-span-4 flex flex-col gap-5 justify-between">
                        {LEADERSHIP.map((leader) => (
                            <div
                                key={leader.role}
                                className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-5 flex gap-4 items-center hover:bg-[#E2DDD4] transition-colors"
                            >
                                <div className="w-16 h-16 rounded-none bg-[#dcdad3] overflow-hidden shrink-0 border border-[rgba(26,26,26,0.12)]">
                                    <img
                                        src={leader.avatarUrl}
                                        alt={leader.name}
                                        className="w-full h-full object-cover grayscale"
                                    />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-[#6B665F] uppercase tracking-wider block mb-1">
                                        {leader.role}
                                    </span>
                                    <h4 className="text-base font-medium text-[#1A1A1A] tracking-tight">
                                        {leader.name}
                                    </h4>
                                    <span className="text-xs text-[#9C968D]">{leader.detail}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
