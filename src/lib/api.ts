import type { ItemInfo, PlaystateCommand, RepeatMode, SessionInfo, SystemInfo } from './types';

/** Error for every non-2xx answer of the Jellyfin server. */
export class JellyfinHttpError extends Error {
    /**
     * @param status - HTTP status code (0 = network error / timeout)
     * @param path - request path without query (never contains the API key)
     * @param message - error text
     */
    public constructor(
        public readonly status: number,
        public readonly path: string,
        message: string,
    ) {
        super(message);
        this.name = 'JellyfinHttpError';
    }
}

/** Connection settings of {@link JellyfinApi}. */
export interface JellyfinApiOptions {
    /** Server URL incl. optional base path, e.g. `http://192.168.1.10:8096` or `https://host/jellyfin` */
    baseUrl: string;
    /** API key created in the Jellyfin dashboard */
    apiKey: string;
    /** Device id under which the adapter registers itself (filtered out of the session list) */
    deviceId: string;
    /** Adapter version, reported to the server */
    version: string;
    /** Request timeout in ms */
    timeoutMs: number;
}

/**
 * Normalizes the configured server URL: trims, removes trailing slashes, adds `http://` if missing.
 *
 * @param url - URL as entered by the user
 * @returns normalized URL or `null` if it is not a valid http(s) URL
 */
export function normalizeBaseUrl(url: string | undefined): string | null {
    let value = (url ?? '').trim();
    if (!value) {
        return null;
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
        if (!/^https?:\/\//i.test(value)) {
            return null;
        }
    } else {
        value = `http://${value}`;
    }
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
    } catch {
        return null;
    }
}

/**
 * Thin REST client for Jellyfin 12.x. Uses only the modern `Authorization: MediaBrowser … Token="…"`
 * header (legacy `X-Emby-Token` / `api_key` are rejected by Jellyfin 12).
 */
export class JellyfinApi {
    private readonly auth: string;

    /** @param opts - connection settings */
    public constructor(private readonly opts: JellyfinApiOptions) {
        const esc = (v: string): string => v.replace(/"/g, '');
        this.auth =
            `MediaBrowser Client="ioBroker", Device="ioBroker", DeviceId="${esc(opts.deviceId)}", ` +
            `Version="${esc(opts.version)}", Token="${esc(opts.apiKey)}"`;
    }

    /** Base URL without trailing slash (also used for image URLs). */
    public get baseUrl(): string {
        return this.opts.baseUrl;
    }

    // @KI_HINWEIS: Jellyfin 12 only accepts `ApiKey` (not the legacy `api_key`) in the query.
    /**
     * WebSocket URL. The key has to go into the query because Node's WebSocket cannot send headers.
     */
    public get socketUrl(): string {
        const url = new URL(`${this.opts.baseUrl}/socket`);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('ApiKey', this.opts.apiKey);
        url.searchParams.set('deviceId', this.opts.deviceId);
        return url.toString();
    }

    /**
     * Sends a request and returns the parsed JSON body (or `undefined` for empty answers like 204).
     *
     * @param method - HTTP method
     * @param path - path incl. query, starting with `/`
     * @param body - optional JSON body
     */
    public async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T | undefined> {
        const headers: Record<string, string> = { Authorization: this.auth };
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        const plainPath = path.split('?')[0];
        let res: Response;
        try {
            res = await fetch(`${this.opts.baseUrl}${path}`, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(this.opts.timeoutMs),
            });
        } catch (e) {
            const err = e as Error & { cause?: { code?: string } };
            const reason = err.name === 'TimeoutError' ? 'timeout' : (err.cause?.code ?? err.message);
            throw new JellyfinHttpError(0, plainPath, `${method} ${plainPath} failed: ${reason}`);
        }
        const text = await res.text();
        if (!res.ok) {
            throw new JellyfinHttpError(res.status, plainPath, `${method} ${plainPath} → HTTP ${res.status}`);
        }
        if (!text) {
            return undefined;
        }
        try {
            return JSON.parse(text) as T;
        } catch {
            return undefined;
        }
    }

    /** GET /System/Info */
    public async getSystemInfo(): Promise<SystemInfo> {
        return (await this.request<SystemInfo>('GET', '/System/Info')) ?? {};
    }

    /** GET /Sessions (all sessions incl. inactive, our own session is filtered out) */
    public async getSessions(): Promise<SessionInfo[]> {
        const list = await this.request<SessionInfo[]>('GET', '/Sessions');
        return Array.isArray(list) ? list.filter(s => s.DeviceId !== this.opts.deviceId) : [];
    }

    /**
     * POST /Sessions/{id}/Playing/{command}
     *
     * @param sessionId - Jellyfin session id
     * @param command - playstate command
     * @param seekPositionTicks - only for `Seek`
     */
    public async playstate(sessionId: string, command: PlaystateCommand, seekPositionTicks?: number): Promise<void> {
        const query = seekPositionTicks !== undefined ? `?seekPositionTicks=${Math.round(seekPositionTicks)}` : '';
        await this.request('POST', `/Sessions/${encodeURIComponent(sessionId)}/Playing/${command}${query}`);
    }

    /**
     * POST /Sessions/{id}/Command – general command with optional arguments.
     *
     * @param sessionId - Jellyfin session id
     * @param name - GeneralCommandType, e.g. `SetVolume`
     * @param args - command arguments (all values as strings)
     */
    public async generalCommand(sessionId: string, name: string, args?: Record<string, string>): Promise<void> {
        await this.request('POST', `/Sessions/${encodeURIComponent(sessionId)}/Command`, {
            Name: name,
            Arguments: args ?? {},
        });
    }

    /**
     * POST /Sessions/{id}/Command – SetRepeatMode
     *
     * @param sessionId - Jellyfin session id
     * @param mode - repeat mode
     */
    public async setRepeatMode(sessionId: string, mode: RepeatMode): Promise<void> {
        await this.generalCommand(sessionId, 'SetRepeatMode', { RepeatMode: mode });
    }

    /**
     * POST /Sessions/{id}/Message
     *
     * @param sessionId - Jellyfin session id
     * @param text - message text
     * @param header - optional header
     * @param timeoutMs - optional display time (ignored by the Android TV app)
     */
    public async sendMessage(sessionId: string, text: string, header?: string, timeoutMs?: number): Promise<void> {
        const body: Record<string, unknown> = { Header: header || 'ioBroker', Text: text };
        if (timeoutMs && timeoutMs > 0) {
            body.TimeoutMs = Math.round(timeoutMs);
        }
        await this.request('POST', `/Sessions/${encodeURIComponent(sessionId)}/Message`, body);
    }

    /**
     * Searches a playable item by name (movies, series, episodes, music, videos).
     * A series is played by Jellyfin from its first episode.
     *
     * @param term - search text
     * @param userId - user of the session (library permissions of this user apply)
     * @returns best match or `undefined`
     */
    public async findItem(term: string, userId?: string): Promise<ItemInfo | undefined> {
        const q = new URLSearchParams({
            searchTerm: term,
            includeItemTypes: 'Movie,Series,Episode,Audio,MusicAlbum,MusicVideo,Video',
            recursive: 'true',
            limit: '10',
        });
        if (userId) {
            q.set('userId', userId);
        }
        const res = await this.request<{ Items?: ItemInfo[] }>('GET', `/Items?${q.toString()}`);
        const items = res?.Items ?? [];
        const lower = term.toLowerCase();
        // exact title first, otherwise the server's best match
        return items.find(i => (i.Name ?? '').toLowerCase() === lower) ?? items[0];
    }

    /**
     * POST /Sessions/{id}/Playing – starts playback of items on a client ("PlayNow").
     *
     * @param sessionId - Jellyfin session id
     * @param itemIds - ids of the items to play
     */
    public async playNow(sessionId: string, itemIds: string[]): Promise<void> {
        const q = new URLSearchParams({ playCommand: 'PlayNow', itemIds: itemIds.join(',') });
        await this.request('POST', `/Sessions/${encodeURIComponent(sessionId)}/Playing?${q.toString()}`);
    }

    /** POST /Library/Refresh – starts a library scan (returns immediately). */
    public async refreshLibrary(): Promise<void> {
        await this.request('POST', '/Library/Refresh');
    }
}
