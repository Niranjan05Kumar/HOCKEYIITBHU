export type TournamentType =
    | "SPARDHA"
    | "Inter-IIT"
    | "Inter-IIT Sports Meet"
    | "GC"
    | "General Championship (GC)"
    | "Out Fest"
    | "Sports Out Fests"
    | "institute_sports_fest";

export interface Tournament {
    _id: string;
    name: string;
    type: TournamentType | string;
    description?: string;
    logo?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TournamentQuery {
    name?: string;
    type?: string;
    page?: number;
    limit?: number;
    sort?: "name" | "type" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}

export interface TournamentEdition {
    _id: string;
    tournament: string;
    year: number;
    edition: string;
    team: string;
    hostInstitute?: string;
    participatingTeams?: string[];
    finalPosition?: number;
    captain?: string;
    viceCaptain?: string;
    achievements?: string[];
    awards?: string[];
    photos?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface TournamentEditionQuery {
    tournament?: string;
    year?: number;
    page?: number;
    limit?: number;
    sort?: "year" | "edition" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
}
