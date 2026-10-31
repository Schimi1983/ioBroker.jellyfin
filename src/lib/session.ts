import type { SessionInfo } from './types';

/** Jellyfin time unit: 1 tick = 100 ns. */
export const TICKS_PER_SECOND = 10_000_000;

/** Options for {@link sessionValues}. */
export interface MappingOptions {
    /** Server base URL for cover links */
    baseUrl: string;
    /** Max. cover height in px (0 = original size) */
    coverHeight: number;
}

// @KI_HINWEIS: Jellyfin serves images without authentication, so the URL can be used directly in VIS.
//     `maxHeight` reduces a poster from ~800 KB to ~60 KB; `tag` changes when the image changes (cache busting).
/**
 * Builds the cover URL of the current item.
 *
 * @param s - session
 * @param opts - mapping options
 */
export function coverUrl(s: SessionInfo, opts: MappingOptions): string {
    const item = s.NowPlayingItem;
    if (!item) {
        return '';
    }
    let id: string | undefined;
    let tag: string | undefined;
    if (item.Type === 'Episode' && item.SeriesId && item.SeriesPrimaryImageTag) {
        id = item.SeriesId;
        tag = item.SeriesPrimaryImageTag;
    } else if (item.ImageTags?.Primary && item.Id) {
        id = item.Id;
        tag = item.ImageTags.Primary;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        id = item.AlbumId;
        tag = item.AlbumPrimaryImageTag;
    }
    if (!id) {
        return '';
    }
    const query = new URLSearchParams();
    if (opts.coverHeight > 0) {
        query.set('maxHeight', String(Math.round(opts.coverHeight)));
    }
    if (tag) {
        query.set('tag', tag);
    }
    const qs = query.toString();
    return `${opts.baseUrl}/Items/${encodeURIComponent(id)}/Images/Primary${qs ? `?${qs}` : ''}`;
}

// @KI_HINWEIS: The Android TV app (Fire TV, SHIELD) executes volume/mute commands but reports neither
//     `VolumeLevel` nor a correct `IsMuted` (always false). Only clients that send `VolumeLevel` are trusted for
//     volume *and* mute; otherwise the states keep the last commanded value.
/**
 * True if the client reports its own audio status.
 *
 * @param s - session
 */
export function reportsAudio(s: SessionInfo): boolean {
    return typeof s.PlayState?.VolumeLevel === 'number';
}

/**
 * Maps a session to state values (keys relative to the device object). Keys whose value is unknown are omitted
 * so that existing values are not overwritten.
 *
 * @param s - session
 * @param opts - mapping options
 */
export function sessionValues(s: SessionInfo, opts: MappingOptions): Record<string, ioBroker.StateValue> {
    const v: Record<string, ioBroker.StateValue> = {};
    const item = s.NowPlayingItem ?? undefined;
    const ps = s.PlayState ?? {};

    v['info.name'] = (s.DeviceName ?? '').replace(/\+/g, ' ').trim();
    v['info.client'] = s.Client ?? '';
    v['info.version'] = s.ApplicationVersion ?? '';
    v['info.user'] = s.UserName ?? '';
    v['info.reachable'] = true;
    v['info.remoteControl'] = s.SupportsRemoteControl === true;
    if (s.LastActivityDate) {
        const t = Date.parse(s.LastActivityDate);
        if (!Number.isNaN(t)) {
            v['info.lastActivity'] = t;
        }
    }

    if (item) {
        v['media.state'] = ps.IsPaused ? 'pause' : 'play';
        v['media.title'] = item.Name ?? '';
        v['media.itemId'] = item.Id ?? '';
        v['media.type'] = item.Type ?? '';
        v['media.series'] = item.SeriesName ?? '';
        v['media.season'] =
            item.Type === 'Episode' && item.ParentIndexNumber != null ? String(item.ParentIndexNumber) : '';
        v['media.episode'] = item.Type === 'Episode' && item.IndexNumber != null ? String(item.IndexNumber) : '';
        v['media.artist'] = (item.Artists ?? []).join(', ');
        v['media.album'] = item.Album ?? '';
        v['media.genre'] = (item.Genres ?? []).join(', ');
        v['media.year'] = item.ProductionYear ? String(item.ProductionYear) : '';
        v['media.cover'] = coverUrl(s, opts);
        const duration = item.RunTimeTicks ? Math.round(item.RunTimeTicks / TICKS_PER_SECOND) : 0;
        const elapsed = ps.PositionTicks ? Math.round(ps.PositionTicks / TICKS_PER_SECOND) : 0;
        v['media.duration'] = duration;
        v['media.elapsed'] = elapsed;
        v['media.seek'] = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 1000) / 10) : 0;
    } else {
        v['media.state'] = 'stop';
        for (const key of [
            'title',
            'type',
            'series',
            'season',
            'episode',
            'artist',
            'album',
            'genre',
            'year',
            'cover',
        ]) {
            v[`media.${key}`] = '';
        }
        v['media.duration'] = 0;
        v['media.elapsed'] = 0;
        v['media.seek'] = 0;
    }

    if (reportsAudio(s)) {
        v['media.volume'] = ps.VolumeLevel as number;
        v['media.mute'] = ps.IsMuted === true;
    }
    if (ps.RepeatMode && s.SupportedCommands?.includes('SetRepeatMode')) {
        v['media.repeat'] = ps.RepeatMode;
    }
    return v;
}

/** Kind of command for {@link checkCommand}. */
export type CommandKind =
    { type: 'playstate' } | { type: 'general'; name: string } | { type: 'anyGeneral'; names: string[] };

// @KI_HINWEIS: The server answers 204 even if the client ignores the command, so the check has to happen before
//     sending. Playstate commands (Pause, Seek, Stop, …) are never listed in `SupportedCommands`; they are allowed by
//     `SupportsMediaControl`. Both flags change during a session (e.g. app closed, integrated player started).
/**
 * Checks whether a command can be sent to a session.
 *
 * @param s - current session of the device (undefined if the device is not connected)
 * @param kind - command kind
 * @returns `null` if allowed, otherwise the reason (English, for the log)
 */
export function checkCommand(s: SessionInfo | undefined, kind: CommandKind): string | null {
    if (!s) {
        return 'device is not connected to the server';
    }
    if (s.SupportsRemoteControl !== true) {
        return 'device does not accept remote control right now';
    }
    if (kind.type === 'playstate') {
        return s.SupportsMediaControl === true ? null : 'device does not accept playback commands';
    }
    const supported = s.SupportedCommands ?? [];
    const names = kind.type === 'general' ? [kind.name] : kind.names;
    return names.some(n => supported.includes(n)) ? null : `device does not support ${names.join('/')}`;
}
