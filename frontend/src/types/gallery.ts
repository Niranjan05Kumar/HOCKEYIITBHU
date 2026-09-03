export interface GalleryItem {
    _id: string;
    imageUrl: string;
    imageFileId?: string;
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
    tournament?: string;
    player?: string;
    page?: number;
    limit?: number;
    sort?: "year" | "category" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
