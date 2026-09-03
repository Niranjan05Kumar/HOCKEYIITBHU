export interface Team {
    _id: string;
    year: number;
    players: string[];
    captain?: string;
    viceCaptain?: string;
    coach?: string;
    teamPhoto?: string;
    achievements?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface TeamQuery {
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
