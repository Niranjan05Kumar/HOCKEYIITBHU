export type PlayerStatus = "current" | "former";
export type PlayingPosition = "Forward" | "Defender" | "Midfielder" | "Goalkeeper";

export interface Player {
    _id: string;
    name: string;
    profilePhoto?: string;
    profilePhotoFileId?: string;
    playingPosition?: PlayingPosition;
    status: PlayerStatus;
    playingYears?: number[];
    jerseyNumber?: number;
    leadershipRoles?: string[];
    achievements?: string[];
    individualStatistics?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

export interface PlayerCreateInput {
    name: string;
    playingPosition?: PlayingPosition;
    status: PlayerStatus;
    jerseyNumber?: number;
    playingYears?: number[];
    leadershipRoles?: string[];
    achievements?: string[];
    individualStatistics?: Record<string, unknown>;
    profilePhoto?: string;
    profilePhotoFileId?: string;
}

export type PlayerUpdateInput = Partial<PlayerCreateInput>;

export interface PlayerQuery {
    status?: PlayerStatus;
    position?: PlayingPosition;
    year?: number;
    page?: number;
    limit?: number;
    sort?: "name" | "createdAt" | "updatedAt" | "jerseyNumber";
    order?: "asc" | "desc";
}
