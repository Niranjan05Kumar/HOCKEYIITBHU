export type AchievementType = "Championship" | "Medal" | "Award" | "Major Victory" | "Individual Achievement";

export type RecipientType = "Player" | "Team";

export interface Achievement {
    _id: string;
    title: string;
    description?: string;
    type: AchievementType;
    year: number;
    tournament?: string;
    recipientType: RecipientType;
    recipient: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AchievementQuery {
    year?: number;
    type?: AchievementType;
    recipientType?: RecipientType;
    page?: number;
    limit?: number;
    sort?: "year" | "title" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
