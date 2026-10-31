import { deviceObjectId } from './ids';
import type { SessionInfo } from './types';

/** Sessions without remote control and without playback count as gone after this time without activity. */
export const STALE_SESSION_MS = 10 * 60_000;

/** One device as shown in ioBroker, built from one or more Jellyfin sessions. */
export interface DeviceSessions {
    /** ioBroker object id below the namespace */
    id: string;
    /** Merged view: flags and session id of the controllable session, media and play state of the playing one */
    view: SessionInfo;
    /** All sessions of this device */
    members: SessionInfo[];
}

/**
 * Display name of a device. Some Android apps send the name URL-encoded (`Szymon-Pixel+10a`).
 *
 * @param s - session
 */
export function displayName(s: SessionInfo): string {
    return (s.DeviceName ?? '').replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
}

// @KI_HINWEIS: The Jellyfin apps for Android, Android TV and iPadOS register twice: the app itself (accepts remote
//     control) and its player (reports the playback, remote=false). The DeviceIds are not related (iPad
//     `e481…`/`c2f8…`), but device name, app and user are the same. Commands sent to the app session control
//     the player (verified on iPad 1.8.0). Web browsers are not grouped: every browser is called "Firefox" etc.
/**
 * Key that identifies one physical device across its sessions.
 *
 * @param s - session
 * @returns key or `null` if the session is not grouped
 */
export function groupKey(s: SessionInfo): string | null {
    if (!s.Client || /web/i.test(s.Client)) {
        return null;
    }
    return `${s.Client}|${displayName(s).toLowerCase()}|${s.UserId ?? s.UserName ?? ''}`;
}

/**
 * True if a session is an old leftover: not controllable, nothing playing and no activity for a while.
 *
 * @param s - session
 * @param now - current time in ms
 */
export function isStale(s: SessionInfo, now: number): boolean {
    if (s.SupportsRemoteControl || s.NowPlayingItem) {
        return false;
    }
    const last = s.LastActivityDate ? Date.parse(s.LastActivityDate) : NaN;
    return Number.isNaN(last) || now - last > STALE_SESSION_MS;
}

/**
 * Groups the session list into devices.
 *
 * @param list - sessions (own sessions already removed)
 * @param now - current time in ms (stale sessions are dropped)
 */
export function groupSessions(list: SessionInfo[], now: number): Map<string, DeviceSessions> {
    const groups = new Map<string, SessionInfo[]>();
    for (const s of list) {
        if (isStale(s, now)) {
            continue;
        }
        const key = groupKey(s);
        const id = deviceObjectId(key ?? s.DeviceId);
        const members = groups.get(id);
        if (members) {
            members.push(s);
        } else {
            groups.set(id, [s]);
        }
    }

    const result = new Map<string, DeviceSessions>();
    for (const [id, members] of groups) {
        const control =
            members.find(s => s.SupportsRemoteControl && s.NowPlayingItem) ??
            members.find(s => s.SupportsRemoteControl) ??
            members.find(s => s.NowPlayingItem) ??
            members[0];
        const media = control.NowPlayingItem ? control : (members.find(s => s.NowPlayingItem) ?? control);
        const lastActivity = members
            .map(s => (s.LastActivityDate ? Date.parse(s.LastActivityDate) : NaN))
            .filter(t => !Number.isNaN(t))
            .reduce((a, b) => Math.max(a, b), NaN);
        const view: SessionInfo = {
            ...control,
            DeviceName: displayName(control) || displayName(media),
            NowPlayingItem: media.NowPlayingItem ?? null,
            PlayState: media.NowPlayingItem ? media.PlayState : control.PlayState,
            LastActivityDate: Number.isNaN(lastActivity)
                ? control.LastActivityDate
                : new Date(lastActivity).toISOString(),
        };
        result.set(id, { id, view, members });
    }
    return result;
}
