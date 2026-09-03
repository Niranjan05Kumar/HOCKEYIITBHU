export type MatchResult = "Win" | "Loss" | "Draw";

export interface Match {
    _id: string;
    tournamentEdition: string;
    date?: string;
    opponent: string;
    iitBhuScore?: number;
    opponentScore?: number;
    result?: MatchResult;
    round?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MatchQuery {
    tournamentEditionId?: string;
    page?: number;
    limit?: number;
    sort?: "date" | "opponent" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
