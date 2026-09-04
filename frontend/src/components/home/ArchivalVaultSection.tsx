import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Image as ImageIcon, RotateCcw } from "lucide-react";
import { getGalleryItems } from "@/api/gallery";
import type { GalleryItem } from "@/types/gallery";

const MASONRY_SPAN_CLASSES = [
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
];

export default function ArchivalVaultSection() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getGalleryItems({
                limit: 5,
                sort: "createdAt",
                order: "desc",
            });
            setItems(response.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load gallery items from the server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchItems();
    }, [fetchItems]);

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

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] sm:auto-rows-[200px]">
                    {MASONRY_SPAN_CLASSES.map((spanClass, idx) => (
                        <div
                            key={idx}
                            className={`${spanClass} bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] animate-pulse p-3`}
                        >
                            <div className="w-full h-full bg-[#dcdad3]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.12)] p-10 text-center max-w-xl mx-auto my-4">
                    <ImageIcon className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-80" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">Unable to Load Archival Vault</h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] mb-5 leading-relaxed">{error}</p>
                    <button
                        type="button"
                        onClick={fetchItems}
                        className="px-6 py-2 border border-[#5A181E] text-[#5A181E] hover:bg-[#5A181E] hover:text-[#F4F1EA] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && items.length === 0 && (
                <div className="bg-[#ECE8E1] border border-[rgba(26,26,26,0.08)] p-12 text-center max-w-xl mx-auto my-4">
                    <ImageIcon className="w-8 h-8 text-[#5A181E] mx-auto mb-3 opacity-50" />
                    <h3 className="text-base font-medium text-[#1A1A1A] mb-1">Archival Photographs Coming Soon</h3>
                    <p className="text-xs sm:text-sm text-[#6B665F] leading-relaxed">
                        Digitized match photographs, equipment archives, and team portraits will appear here as they are
                        cataloged into the repository.
                    </p>
                </div>
            )}

            {/* Real Gallery Masonry Grid */}
            {!loading && !error && items.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] sm:auto-rows-[200px]">
                    {items.map((item, index) => {
                        const spanClass = MASONRY_SPAN_CLASSES[index % MASONRY_SPAN_CLASSES.length];
                        const title = item.caption || item.eventName || item.category;

                        return (
                            <article
                                key={item._id}
                                className={`${spanClass} bg-[#ECE8E1] p-3 border border-[rgba(26,26,26,0.08)] relative group overflow-hidden`}
                            >
                                <img
                                    src={item.imageUrl}
                                    alt={title}
                                    onError={(e) => {
                                        e.currentTarget.style.opacity = "0.2";
                                    }}
                                    className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <span className="text-xs font-medium text-[#F4F1EA] tracking-wider uppercase">
                                        {title}
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
