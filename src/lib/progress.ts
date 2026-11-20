import { TICKS_PER_SECOND } from './session';
import type { SessionInfo } from './types';

/** Playback position of one device, used to count the elapsed time between two server reports. */
export interface Progress {
    /** Id of the playing item */
    itemId: string;
    /** Position as last reported by the server (ticks) */
    rawTicks: number;
    /** Position in seconds at {@link Progress.at} */
    baseSec: number;
    /** Local time (ms) of {@link Progress.baseSec} */
    at: number;
    /** Duration in seconds (0 = unknown) */
    durationSec: number;
    /** True while playing (not paused) */
    running: boolean;
}

// @KI_HINWEIS: Jellyfin pushes the session list every few seconds, but PositionTicks only changes when the
//     client sends a progress report (web ~10 s, some apps/DLNA less often). The same stale value is repeated in
//     between. A new base is therefore only taken when the reported value changes; local time is used instead of
//     LastPlaybackCheckIn so a clock difference between Jellyfin and ioBroker cannot shift the position.
/**
 * Updates the progress of a device from a session report.
 *
 * @param prev - previous progress of the device
 * @param s - current session
 * @param now - current local time (ms)
 * @returns new progress, undefined if nothing is playing
 */
export function updateProgress(prev: Progress | undefined, s: SessionInfo, now: number): Progress | undefined {
    const item = s.NowPlayingItem;
    if (!item) {
        return undefined;
    }
    const ps = s.PlayState ?? {};
    const itemId = item.Id ?? '';
    const rawTicks = ps.PositionTicks ?? 0;
    const running = ps.IsPaused !== true;
    const durationSec = item.RunTimeTicks ? item.RunTimeTicks / TICKS_PER_SECOND : 0;

    if (prev && prev.itemId === itemId && prev.rawTicks === rawTicks) {
        if (prev.running === running) {
            return { ...prev, durationSec };
        }
        // paused or resumed without a new position: continue from the position shown right now
        return { ...prev, baseSec: elapsedAt(prev, now), at: now, durationSec, running };
    }
    return { itemId, rawTicks, baseSec: rawTicks / TICKS_PER_SECOND, at: now, durationSec, running };
}

/**
 * Elapsed seconds at a given time.
 *
 * @param p - progress
 * @param now - local time (ms)
 */
export function elapsedAt(p: Progress, now: number): number {
    const sec = p.running ? p.baseSec + Math.max(0, now - p.at) / 1000 : p.baseSec;
    return p.durationSec > 0 ? Math.min(sec, p.durationSec) : sec;
}

/**
 * State values `media.elapsed` and `media.seek` at a given time (same rounding as {@link sessionValues}).
 *
 * @param p - progress
 * @param now - local time (ms)
 */
export function progressValues(p: Progress, now: number): Record<string, number> {
    const elapsed = Math.round(elapsedAt(p, now));
    const duration = Math.round(p.durationSec);
    return {
        'media.elapsed': elapsed,
        'media.seek': duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 1000) / 10) : 0,
    };
}
