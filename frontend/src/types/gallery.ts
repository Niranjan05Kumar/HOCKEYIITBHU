export interface GalleryItem {
    _id: string;
    imageUrl: string;
    category: string;
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
    category?: string;
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
