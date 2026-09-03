export type HistoryCategory = "Major Victory" | "Championship" | "Medal" | "Milestone" | "Memorable Performance";

export interface HistoryEvent {
    _id: string;
    title: string;
    description: string;
    year: number;
    category: HistoryCategory;
    tournament?: string;
    achievement?: string;
    photo?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HistoryEventQuery {
    year?: number;
    category?: HistoryCategory;
    page?: number;
    limit?: number;
    sort?: "year" | "title" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
