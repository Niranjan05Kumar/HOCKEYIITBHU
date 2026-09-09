export type HistoryCategory = "Major Victory" | "Championship" | "Medal" | "Milestone" | "Memorable Performance";

export interface HistoryEvent {
    _id: string;
    title: string;
    description: string;
    year: number;
    category: HistoryCategory;
    tournament?: string;
    achievement?: string;
    photo?: string | null;
    photoFileId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface HistoryEventQuery {
    year?: number;
    category?: HistoryCategory;
    page?: number;
    limit?: number;
    sort?: "year" | "title" | "category" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}

export interface HistoryEventCreateInput {
    title: string;
    description: string;
    year: number;
    category: HistoryCategory;
    tournament?: string;
    achievement?: string;
    photo?: string | null;
    photoFileId?: string | null;
    photoFile?: File | null;
}

export type HistoryEventUpdateInput = Partial<HistoryEventCreateInput>;
