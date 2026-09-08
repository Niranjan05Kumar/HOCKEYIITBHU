import { getTournaments, getTournamentEditions } from "@/api/tournaments";
import { getTeams } from "@/api/teams";
import { getPlayers } from "@/api/players";
import { getAchievements } from "@/api/achievements";
import { getGalleryItems } from "@/api/gallery";
import type { Tournament, TournamentEdition } from "@/types/tournament";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import type { Achievement } from "@/types/achievement";
import type { GalleryItem } from "@/types/gallery";
import type { PaginatedResponse } from "@/types/api";

export type CatalogKey =
    "tournaments" | "tournamentEditions" | "teams" | "players" | "achievements" | "gallery" | "matches" | "history";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// In-memory cache store
const cacheStore: Partial<Record<CatalogKey, CacheEntry<unknown>>> = {};

// In-flight promise tracking to prevent duplicate concurrent network calls (especially under React StrictMode)
const inFlightRequests: Partial<Record<CatalogKey, Promise<unknown>>> = {};

/**
 * Generic getter with in-flight deduplication and TTL caching.
 */
async function fetchWithCache<T>(key: CatalogKey, fetcher: () => Promise<T>, forceRefresh = false): Promise<T> {
    const now = Date.now();
    const existing = cacheStore[key] as CacheEntry<T> | undefined;

    // Return cached data if fresh and refresh is not forced
    if (!forceRefresh && existing && now - existing.timestamp < CACHE_TTL_MS) {
        return existing.data;
    }

    // Reuse existing in-flight request if already loading
    if (!forceRefresh && inFlightRequests[key]) {
        return inFlightRequests[key] as Promise<T>;
    }

    // Initiate fetch and record in-flight promise
    const promise = (async () => {
        try {
            const data = await fetcher();
            cacheStore[key] = {
                data,
                timestamp: Date.now(),
            };
            return data;
        } finally {
            delete inFlightRequests[key];
        }
    })();

    inFlightRequests[key] = promise;
    return promise;
}

/**
 * Helper to fetch all records across pages using limit=100 (the backend schema maximum).
 */
async function fetchAllCatalogPages<T>(fetchPage: (page: number) => Promise<PaginatedResponse<T>>): Promise<T[]> {
    const first = await fetchPage(1);
    const items = [...(first.data || [])];
    const totalPages = first.meta?.totalPages ?? 1;

    if (totalPages > 1) {
        const remaining = await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)));
        for (const res of remaining) {
            if (res.data) {
                items.push(...res.data);
            }
        }
    }

    return items;
}

/**
 * Invalidates specific catalog or all catalogs upon data mutation.
 */
export function invalidateCatalog(key?: CatalogKey): void {
    if (key) {
        delete cacheStore[key];
        delete inFlightRequests[key];
    } else {
        for (const k of Object.keys(cacheStore) as CatalogKey[]) {
            delete cacheStore[k];
            delete inFlightRequests[k];
        }
    }
}

/**
 * Cached Tournaments reference catalog.
 */
export async function getCachedTournaments(forceRefresh = false): Promise<Tournament[]> {
    return fetchWithCache(
        "tournaments",
        () => fetchAllCatalogPages((page) => getTournaments({ page, limit: 100, sort: "name", order: "asc" })),
        forceRefresh,
    );
}

/**
 * Cached Tournament Editions reference catalog.
 */
export async function getCachedTournamentEditions(forceRefresh = false): Promise<TournamentEdition[]> {
    return fetchWithCache(
        "tournamentEditions",
        () => fetchAllCatalogPages((page) => getTournamentEditions({ page, limit: 100, sort: "year", order: "desc" })),
        forceRefresh,
    );
}

/**
 * Cached Teams reference catalog.
 */
export async function getCachedTeams(forceRefresh = false): Promise<Team[]> {
    return fetchWithCache(
        "teams",
        () => fetchAllCatalogPages((page) => getTeams({ page, limit: 100, sort: "year", order: "desc" })),
        forceRefresh,
    );
}

/**
 * Cached Players reference catalog.
 */
export async function getCachedPlayers(forceRefresh = false): Promise<Player[]> {
    return fetchWithCache(
        "players",
        () => fetchAllCatalogPages((page) => getPlayers({ page, limit: 100, sort: "name", order: "asc" })),
        forceRefresh,
    );
}

/**
 * Cached Achievements reference catalog.
 */
export async function getCachedAchievements(forceRefresh = false): Promise<Achievement[]> {
    return fetchWithCache(
        "achievements",
        () => fetchAllCatalogPages((page) => getAchievements({ page, limit: 100, sort: "year", order: "desc" })),
        forceRefresh,
    );
}

/**
 * Cached Gallery Items reference catalog.
 */
export async function getCachedGalleryItems(forceRefresh = false): Promise<GalleryItem[]> {
    return fetchWithCache(
        "gallery",
        () => fetchAllCatalogPages((page) => getGalleryItems({ page, limit: 100, sort: "createdAt", order: "desc" })),
        forceRefresh,
    );
}
