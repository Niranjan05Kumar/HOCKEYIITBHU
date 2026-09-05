export type GalleryCategory =
    | "SPARDHA"
    | "Inter-IIT"
    | "GC"
    | "Out Fest"
    | "Team Photos"
    | "Match Photos"
    | "Awards & Medal Celebrations"
    | "Old/Archive Memories"
    | "Other Memorable Moments";

export interface GalleryItem {
    _id: string;
    imageUrl: string;
    imageFileId?: string;
    category: GalleryCategory;
    year?: number;
    tournament?: string;
    eventName?: string;
    caption?: string;
    description?: string;
    taggedPlayers?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GalleryQuery {
    category?: GalleryCategory | string;
    year?: number;
    tournament?: string;
    player?: string;
    page?: number;
    limit?: number;
    sort?: "year" | "category" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}

export interface GalleryItemCreateInput {
    imageUrl?: string;
    imageFileId?: string;
    category: GalleryCategory;
    year?: number;
    tournament?: string;
    eventName?: string;
    caption?: string;
    description?: string;
    taggedPlayers?: string[];
}

export type GalleryItemUpdateInput = Partial<GalleryItemCreateInput>;
