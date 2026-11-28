import type { ItemInfo } from './types';

/** A playlist of the Jellyfin server. */
export interface Playlist {
    /** item id */
    id: string;
    /** display name */
    name: string;
    /** number of entries (if reported) */
    count?: number;
}

// @KI_HINWEIS: playlists belong to a user in Jellyfin. The adapter has no user of its own (API key), so the list
//     is collected for every user and merged; a playlist shared with several users appears once.
/**
 * Merges the playlists of several users (deduplicated by id, sorted by name).
 *
 * @param lists - playlists per user
 */
export function mergePlaylists(lists: ItemInfo[][]): Playlist[] {
    const byId = new Map<string, Playlist>();
    for (const list of lists) {
        for (const item of list) {
            if (!item?.Id || byId.has(item.Id)) {
                continue;
            }
            byId.set(item.Id, {
                id: item.Id,
                name: (item.Name ?? '').trim() || item.Id,
                ...(typeof item.ChildCount === 'number' ? { count: item.ChildCount } : {}),
            });
        }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/**
 * Value list for `common.states` (name → name), so VIS and admin offer the playlists for selection.
 * The first playlist of a name wins.
 *
 * @param list - playlists
 */
export function playlistStates(list: Playlist[]): Record<string, string> {
    const states: Record<string, string> = {};
    for (const p of list) {
        if (!(p.name in states)) {
            states[p.name] = p.name;
        }
    }
    return states;
}

/**
 * Finds a playlist by id or name (case-insensitive).
 *
 * @param list - playlists
 * @param term - id or name
 */
export function findPlaylist(list: Playlist[], term: string): Playlist | undefined {
    const t = term.trim().toLowerCase();
    if (!t) {
        return undefined;
    }
    return list.find(p => p.id.toLowerCase() === t) ?? list.find(p => p.name.toLowerCase() === t);
}
