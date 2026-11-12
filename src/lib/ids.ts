import { createHash } from 'node:crypto';

// @KI_HINWEIS: Android/Android-TV apps report short ids (16–40 chars) that can be used directly.
//     Web clients report ~130-character Base64 ids (user agent + timestamp) which are unreadable and may contain
//     characters that are forbidden in object ids → those are replaced by a 16-char SHA-1 hash.
/**
 * Builds a stable ioBroker object id for a Jellyfin DeviceId.
 *
 * @param deviceId - DeviceId reported by Jellyfin
 * @returns id part that is safe to use below the adapter namespace
 */
export function deviceObjectId(deviceId: string): string {
    // @KI_HINWEIS: only lowercase ids are kept – two ids that differ only in case must not collide.
    if (/^[a-z0-9_-]{1,40}$/.test(deviceId)) {
        return deviceId;
    }
    return createHash('sha1').update(deviceId).digest('hex').slice(0, 16);
}
