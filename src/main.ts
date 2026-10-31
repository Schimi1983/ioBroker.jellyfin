/*
 * ioBroker.jellyfin – monitor and control Jellyfin clients
 * Copyright (c) 2026 Schimi <github@world-mg.de>, MIT License
 */
import * as utils from '@iobroker/adapter-core';
import { JellyfinApi, JellyfinHttpError, normalizeBaseUrl } from './lib/api';
import { deviceObjectId } from './lib/ids';
import { DEVICE_CHANNELS, DEVICE_STATES, REPEAT_STATES, SERVER_STATES, toCommon } from './lib/objects';
import { parseGeneralCommand, parseMessage, type MessagePayload } from './lib/commands';
import { checkCommand, reportsAudio, sessionValues, type CommandKind } from './lib/session';
import type { PlaystateCommand, RepeatMode, SessionInfo, SocketMessage, SystemInfo } from './lib/types';

/** DeviceId prefix of all ioBroker connections (`ioBroker-jellyfin.0`, …); filtered out of the device list. */
const OWN_DEVICE_PREFIX = 'ioBroker-';
/** Minimum supported Jellyfin major version. */
const MIN_SERVER_MAJOR = 12;
/** First and maximum reconnect delay. */
const RECONNECT_MIN_MS = 5_000;
const RECONNECT_MAX_MS = 60_000;
/** Server info (update available, restart pending) is refreshed in this interval. */
const SERVER_INFO_INTERVAL_MS = 10 * 60_000;

/** Playstate buttons: state id below the device → Jellyfin command. */
const PLAYSTATE_BUTTONS: Record<string, PlaystateCommand> = {
    'command.play': 'Unpause',
    'command.pause': 'Pause',
    'command.playPause': 'PlayPause',
    'command.stop': 'Stop',
    'command.next': 'NextTrack',
    'command.previous': 'PreviousTrack',
    'command.forward': 'FastForward',
    'command.rewind': 'Rewind',
};

/** General command buttons: state id below the device → GeneralCommandType. */
const GENERAL_BUTTONS: Record<string, string> = {
    'command.volumeUp': 'VolumeUp',
    'command.volumeDown': 'VolumeDown',
    'command.toggleMute': 'ToggleMute',
};

class Jellyfin extends utils.Adapter {
    private api: JellyfinApi | null = null;
    private socket: WebSocket | null = null;
    private keepAliveTimer: ioBroker.Interval | undefined;
    private reconnectTimer: ioBroker.Timeout | undefined;
    private serverInfoTimer: ioBroker.Interval | undefined;
    private reconnectDelay = RECONNECT_MIN_MS;
    private stopping = false;
    private connectedOnce = false;
    private lastConnectError = '';
    private sessionIntervalMs = 5_000;
    private coverHeight = 300;
    private onlyRemote = false;
    /** Id of the Jellyfin server (from /System/Info) */
    private serverId = '';

    /** Current session per device object id. */
    private sessions = new Map<string, SessionInfo>();
    /** Devices whose objects exist (from the database or created in this run). */
    private knownDevices = new Set<string>();
    /** Devices whose objects were created/updated in this run, value = device name written. */
    private preparedDevices = new Map<string, string>();
    /** Devices currently marked as not connected (avoids rewriting the offline values every push). */
    private offlineDevices = new Set<string>();
    /** Last written value per state id (relative), we are the only writer of ack values. */
    private valueCache = new Map<string, ioBroker.StateValue>();
    /** Sessions waiting for processing (only the latest push is kept). */
    private pendingSessions: SessionInfo[] | null = null;
    private processing = false;

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({ ...options, name: 'jellyfin' });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /** Own device id; our WebSocket connection shows up as a session with this id and is filtered out. */
    private get ownDeviceId(): string {
        return `ioBroker-${this.namespace}`;
    }

    private async onReady(): Promise<void> {
        await this.setState('info.connection', false, true);

        const baseUrl = normalizeBaseUrl(this.config.url);
        if (!baseUrl) {
            this.log.error('Please enter the address of your Jellyfin server in the instance settings.');
            return;
        }
        const apiKey = (this.config.apiKey ?? '').trim();
        if (!apiKey) {
            this.log.error('Please enter an API key in the instance settings (Jellyfin dashboard → API keys).');
            return;
        }
        this.sessionIntervalMs = clamp(Number(this.config.updateInterval) || 5, 2, 60) * 1000;
        this.coverHeight = clamp(Number(this.config.coverHeight ?? 300), 0, 2000);
        this.onlyRemote = this.config.onlyRemoteControllable === true;

        this.api = new JellyfinApi({
            baseUrl,
            apiKey,
            deviceId: this.ownDeviceId,
            version: this.version ?? '0.0.0',
            timeoutMs: clamp(Number(this.config.requestTimeout) || 10, 2, 60) * 1000,
        });

        await this.createServerObjects();
        for (const dev of await this.getDevicesAsync()) {
            this.knownDevices.add(dev._id.slice(this.namespace.length + 1));
        }

        for (const pattern of ['*.command.*', '*.media.seek', '*.media.volume', '*.media.mute', '*.media.repeat']) {
            this.subscribeStates(pattern);
        }
        this.subscribeStates('server.refreshLibrary');

        this.serverInfoTimer = this.setInterval(() => void this.refreshServerInfo(false), SERVER_INFO_INTERVAL_MS);
        await this.connect();
    }

    // ---------------------------------------------------------------- connection

    /** Checks the server via REST, loads the sessions once and opens the WebSocket. */
    private async connect(): Promise<void> {
        this.reconnectTimer = undefined;
        if (this.stopping || !this.api) {
            return;
        }
        if (!(await this.refreshServerInfo(true))) {
            this.scheduleReconnect();
            return;
        }
        try {
            this.queueSessions(await this.api.getSessions());
        } catch (e) {
            this.log.debug(`Initial session list failed: ${(e as Error).message}`);
        }
        this.openSocket();
    }

    /**
     * Reads /System/Info and writes the server states.
     *
     * @param logErrors - log connection errors (only the first occurrence of each error)
     * @returns true if the server answered
     */
    private async refreshServerInfo(logErrors: boolean): Promise<boolean> {
        if (!this.api) {
            return false;
        }
        let info: SystemInfo;
        try {
            info = await this.api.getSystemInfo();
        } catch (e) {
            if (logErrors) {
                this.logConnectError(e);
            }
            return false;
        }
        this.serverId = info.Id ?? this.serverId;
        await this.writeValue('server.name', info.ServerName ?? '');
        await this.writeValue('server.version', info.Version ?? '');
        await this.writeValue('server.updateAvailable', info.HasUpdateAvailable === true);
        await this.writeValue('server.restartPending', info.HasPendingRestart === true);
        const major = parseInt(info.Version ?? '', 10);
        if (logErrors && !Number.isNaN(major) && major < MIN_SERVER_MAJOR) {
            this.log.warn(
                `Jellyfin ${info.Version} is not supported. Please update the server to version ${MIN_SERVER_MAJOR} or newer.`,
            );
        }
        return true;
    }

    /**
     * Logs a connection error once (repeated identical errors only on debug level).
     *
     * @param e - error
     */
    private logConnectError(e: unknown): void {
        let text: string;
        if (e instanceof JellyfinHttpError && (e.status === 401 || e.status === 403)) {
            text = 'The Jellyfin server rejected the API key. Please check the key in the instance settings.';
        } else if (e instanceof JellyfinHttpError && e.status === 404) {
            text =
                'Jellyfin was not found at this address. Please check the server address (incl. port and base path).';
        } else {
            text = `Cannot reach the Jellyfin server: ${(e as Error).message}`;
        }
        if (text !== this.lastConnectError) {
            this.lastConnectError = text;
            this.log.error(text);
        } else {
            this.log.debug(text);
        }
    }

    /** Opens the WebSocket. Reconnects are scheduled from the close handler only. */
    private openSocket(): void {
        if (!this.api || this.stopping) {
            return;
        }
        let ws: WebSocket;
        try {
            ws = new WebSocket(this.api.socketUrl);
        } catch (e) {
            this.logConnectError(e);
            this.scheduleReconnect();
            return;
        }
        this.socket = ws;
        ws.onopen = () => {
            this.reconnectDelay = RECONNECT_MIN_MS;
            this.lastConnectError = '';
            // "initial delay, interval" in ms – the server then pushes the session list in this interval
            ws.send(JSON.stringify({ MessageType: 'SessionsStart', Data: `0,${this.sessionIntervalMs}` }));
            void this.setState('info.connection', true, true);
            if (!this.connectedOnce) {
                this.log.info(`Connected to Jellyfin at ${this.api?.baseUrl}`);
                this.connectedOnce = true;
            } else {
                this.log.info('Connection to Jellyfin restored');
            }
        };
        ws.onmessage = ev => this.onSocketMessage(ev.data);
        ws.onerror = () => {
            // WHATWG WebSocket: an error is always followed by a close event
            this.log.debug('WebSocket error');
        };
        ws.onclose = ev => {
            if (this.socket !== ws) {
                return;
            }
            this.socket = null;
            this.stopKeepAlive();
            void this.setState('info.connection', false, true);
            if (this.stopping) {
                return;
            }
            this.log.info(`Connection to Jellyfin closed (code ${ev.code}), reconnecting …`);
            this.markAllOffline();
            this.scheduleReconnect();
        };
    }

    private scheduleReconnect(): void {
        if (this.stopping || this.reconnectTimer) {
            return;
        }
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(delay * 2, RECONNECT_MAX_MS);
        this.reconnectTimer = this.setTimeout(() => void this.connect(), delay);
    }

    /**
     * Handles one WebSocket message.
     *
     * @param raw - message text
     */
    private onSocketMessage(raw: unknown): void {
        let msg: SocketMessage;
        try {
            msg = JSON.parse(String(raw)) as SocketMessage;
        } catch {
            this.log.debug('Ignoring invalid WebSocket message');
            return;
        }
        switch (msg?.MessageType) {
            case 'ForceKeepAlive':
                this.startKeepAlive(Number(msg.Data) || 60);
                break;
            case 'KeepAlive':
                break;
            case 'Sessions':
                if (Array.isArray(msg.Data)) {
                    this.queueSessions(msg.Data as SessionInfo[]);
                }
                break;
            case 'RestartRequired':
                void this.refreshServerInfo(false);
                break;
            case 'ServerRestarting':
            case 'ServerShuttingDown':
                this.log.info(`Jellyfin server: ${msg.MessageType}`);
                break;
            default:
                this.log.silly(`Unhandled WebSocket message ${msg?.MessageType}`);
        }
    }

    /**
     * The server asks for a KeepAlive within `seconds`; we answer at half the interval.
     *
     * @param seconds - timeout announced by the server
     */
    private startKeepAlive(seconds: number): void {
        this.stopKeepAlive();
        this.sendSocket({ MessageType: 'KeepAlive' });
        this.keepAliveTimer = this.setInterval(
            () => this.sendSocket({ MessageType: 'KeepAlive' }),
            Math.max(5, seconds / 2) * 1000,
        );
    }

    private stopKeepAlive(): void {
        if (this.keepAliveTimer) {
            this.clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = undefined;
        }
    }

    /**
     * Sends a message if the socket is open.
     *
     * @param msg - message
     */
    private sendSocket(msg: SocketMessage): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        }
    }

    // ---------------------------------------------------------------- sessions

    /**
     * Queues a session list; while one list is processed only the newest one is kept.
     *
     * @param list - sessions from REST or WebSocket
     */
    private queueSessions(list: SessionInfo[]): void {
        this.pendingSessions = list;
        if (!this.processing) {
            void this.processSessions();
        }
    }

    private async processSessions(): Promise<void> {
        this.processing = true;
        try {
            while (this.pendingSessions && !this.stopping) {
                const list = this.pendingSessions;
                this.pendingSessions = null;
                await this.handleSessions(list);
            }
        } catch (e) {
            this.log.warn(`Processing sessions failed: ${(e as Error).message}`);
        } finally {
            this.processing = false;
        }
    }

    /**
     * Writes all sessions to their device objects and marks missing devices as not connected.
     *
     * @param list - sessions
     */
    private async handleSessions(list: SessionInfo[]): Promise<void> {
        const current = new Map<string, SessionInfo>();
        for (const s of list) {
            // @KI_HINWEIS: sessions of ioBroker itself (this and other jellyfin instances, test scripts) are no devices
            // @KI_HINWEIS: Jellyfin 12 registers our own WebSocket connection with DeviceId = server id
            //     ("Jellyfin Server", client = name of the API key) – it is filtered out as well.
            if (
                !s?.DeviceId ||
                !s.Id ||
                s.DeviceId.startsWith(OWN_DEVICE_PREFIX) ||
                (this.serverId !== '' && s.DeviceId === this.serverId)
            ) {
                continue;
            }
            const id = deviceObjectId(s.DeviceId);
            if (this.onlyRemote && s.SupportsRemoteControl !== true && !this.knownDevices.has(id)) {
                continue;
            }
            const prev = current.get(id);
            // same DeviceId twice is unusual – prefer the session that plays or can be controlled
            if (!prev || rank(s) > rank(prev)) {
                current.set(id, s);
            }
        }

        const opts = { baseUrl: this.api?.baseUrl ?? '', coverHeight: this.coverHeight };
        let playing = 0;
        for (const [id, s] of current) {
            await this.prepareDevice(id, s);
            this.offlineDevices.delete(id);
            if (s.NowPlayingItem) {
                playing++;
            }
            for (const [key, val] of Object.entries(sessionValues(s, opts))) {
                await this.writeValue(`${id}.${key}`, val);
            }
        }
        this.sessions = current;

        for (const id of this.knownDevices) {
            if (!current.has(id)) {
                await this.markOffline(id);
            }
        }
        await this.writeValue('server.activeDevices', current.size);
        await this.writeValue('server.playingDevices', playing);
    }

    /**
     * Creates or updates the objects of a device once per adapter run (and when its name changes).
     *
     * @param id - device object id
     * @param s - session
     */
    private async prepareDevice(id: string, s: SessionInfo): Promise<void> {
        const name = [s.DeviceName, s.Client].filter(Boolean).join(' – ') || s.DeviceId;
        if (this.preparedDevices.get(id) === name) {
            return;
        }
        await this.extendObject(id, {
            type: 'device',
            common: { name, statusStates: { onlineId: `${this.namespace}.${id}.info.reachable` } },
            native: { deviceId: s.DeviceId },
        });
        if (!this.preparedDevices.has(id)) {
            for (const [ch, chName] of Object.entries(DEVICE_CHANNELS)) {
                await this.extendObject(`${id}.${ch}`, { type: 'channel', common: { name: chName }, native: {} });
            }
            for (const def of DEVICE_STATES) {
                await this.extendObject(`${id}.${def.id}`, { type: 'state', common: toCommon(def), native: {} });
            }
            if (!this.knownDevices.has(id)) {
                this.log.info(`New Jellyfin device: ${name}`);
            }
        }
        this.knownDevices.add(id);
        this.preparedDevices.set(id, name);
    }

    /**
     * Marks a device as not connected (once).
     *
     * @param id - device object id
     */
    private async markOffline(id: string): Promise<void> {
        if (this.offlineDevices.has(id)) {
            return;
        }
        this.offlineDevices.add(id);
        await this.writeValue(`${id}.info.reachable`, false);
        await this.writeValue(`${id}.info.remoteControl`, false);
        await this.writeValue(`${id}.media.state`, 'stop');
    }

    /** Marks all devices as not connected (connection to the server lost). */
    private markAllOffline(): void {
        this.sessions.clear();
        void (async () => {
            for (const id of this.knownDevices) {
                await this.markOffline(id);
            }
        })();
    }

    // @KI_HINWEIS: Jellyfin pushes the full session list every few seconds even without changes; the cache avoids
    //     a database read (setStateChanged) for every unchanged state.
    /**
     * Writes an acknowledged value if it differs from the last written one.
     *
     * @param id - state id relative to the namespace
     * @param val - value
     */
    private async writeValue(id: string, val: ioBroker.StateValue): Promise<void> {
        if (this.valueCache.has(id) && this.valueCache.get(id) === val) {
            return;
        }
        this.valueCache.set(id, val);
        await this.setState(id, val, true);
    }

    /** Creates the `server` channel. */
    private async createServerObjects(): Promise<void> {
        await this.extendObject('server', { type: 'channel', common: { name: 'Jellyfin server' }, native: {} });
        for (const def of SERVER_STATES) {
            await this.extendObject(def.id, { type: 'state', common: toCommon(def), native: {} });
        }
    }

    /** Reloads the sessions via REST (e.g. after a command hit a session that no longer exists). */
    private async reloadSessions(): Promise<void> {
        try {
            if (this.api) {
                this.queueSessions(await this.api.getSessions());
            }
        } catch (e) {
            this.log.debug(`Reloading sessions failed: ${(e as Error).message}`);
        }
    }

    // ---------------------------------------------------------------- commands

    private async onStateChange(fullId: string, state: ioBroker.State | null | undefined): Promise<void> {
        const api = this.api;
        if (!state || state.ack || !api) {
            return;
        }
        const id = fullId.slice(this.namespace.length + 1);
        if (id === 'server.refreshLibrary') {
            await this.run(id, 'library scan', () => api.refreshLibrary(), state.val);
            return;
        }
        const dot = id.indexOf('.');
        if (dot < 0) {
            return;
        }
        const device = id.slice(0, dot);
        const key = id.slice(dot + 1);
        const s = this.sessions.get(device);

        if (key in PLAYSTATE_BUTTONS) {
            const cmd = PLAYSTATE_BUTTONS[key];
            if (this.allowed(device, s, cmd, { type: 'playstate' })) {
                await this.run(id, cmd, () => api.playstate(s.Id, cmd), true);
            }
            return;
        }
        if (key in GENERAL_BUTTONS) {
            const cmd = GENERAL_BUTTONS[key];
            if (this.allowed(device, s, cmd, { type: 'general', name: cmd })) {
                await this.run(id, cmd, () => api.generalCommand(s.Id, cmd), true);
            }
            return;
        }

        switch (key) {
            case 'media.seek': {
                const pct = Number(state.val);
                const ticks = s?.NowPlayingItem?.RunTimeTicks;
                if (!Number.isFinite(pct) || !ticks) {
                    this.log.warn(
                        `${this.deviceName(device, s)}: cannot jump, nothing with a known duration is playing`,
                    );
                    return;
                }
                if (this.allowed(device, s, 'Seek', { type: 'playstate' })) {
                    const target = (clamp(pct, 0, 100) / 100) * ticks;
                    // value comes back with the next session report
                    await this.run(id, 'Seek', () => api.playstate(s.Id, 'Seek', target), undefined);
                    this.valueCache.delete(id);
                }
                return;
            }
            case 'media.volume': {
                const vol = Math.round(clamp(Number(state.val), 0, 100));
                if (this.allowed(device, s, 'SetVolume', { type: 'general', name: 'SetVolume' })) {
                    await this.runAudio(id, s, 'SetVolume', vol, () =>
                        api.generalCommand(s.Id, 'SetVolume', { Volume: String(vol) }),
                    );
                }
                return;
            }
            case 'media.mute': {
                const mute = state.val === true || state.val === 'true' || state.val === 1;
                const cmd = mute ? 'Mute' : 'Unmute';
                if (this.allowed(device, s, cmd, { type: 'general', name: cmd })) {
                    await this.runAudio(id, s, cmd, mute, () => api.generalCommand(s.Id, cmd));
                }
                return;
            }
            case 'media.repeat': {
                const mode = String(state.val) as RepeatMode;
                if (!(mode in REPEAT_STATES)) {
                    this.log.warn(`Invalid repeat mode "${mode}", allowed: ${Object.keys(REPEAT_STATES).join(', ')}`);
                    return;
                }
                if (this.allowed(device, s, 'SetRepeatMode', { type: 'general', name: 'SetRepeatMode' })) {
                    await this.run(id, 'SetRepeatMode', () => api.setRepeatMode(s.Id, mode), undefined);
                    this.valueCache.delete(id);
                }
                return;
            }
            case 'command.message': {
                const msg = parseMessage(state.val);
                if (!msg) {
                    return;
                }
                if (this.allowed(device, s, 'DisplayMessage', { type: 'general', name: 'DisplayMessage' })) {
                    await this.run(
                        id,
                        'DisplayMessage',
                        () => api.sendMessage(s.Id, msg.text, msg.header, msg.timeoutMs),
                        state.val,
                    );
                }
                return;
            }
            case 'command.generalCommand': {
                const cmd = parseGeneralCommand(state.val);
                if (!cmd) {
                    this.log.warn(`${this.deviceName(device, s)}: invalid command "${String(state.val)}"`);
                    return;
                }
                if (this.allowed(device, s, cmd.name, { type: 'general', name: cmd.name })) {
                    await this.run(id, cmd.name, () => api.generalCommand(s.Id, cmd.name, cmd.args), state.val);
                }
                return;
            }
            default:
                return;
        }
    }

    /**
     * Checks a command and logs why it is not sent.
     *
     * @param device - device object id
     * @param s - current session
     * @param label - command name for the log
     * @param kind - command kind
     */
    private allowed(device: string, s: SessionInfo | undefined, label: string, kind: CommandKind): s is SessionInfo {
        const reason = checkCommand(s, kind);
        if (reason) {
            this.log.warn(`${this.deviceName(device, s)}: ${label} not sent – ${reason}`);
            return false;
        }
        return true;
    }

    /**
     * Sends a command; on success the state is acknowledged with `ackValue` (undefined = wait for the report).
     *
     * @param id - state id relative to the namespace
     * @param label - command name for the log
     * @param fn - request
     * @param ackValue - value to acknowledge
     */
    private async run(
        id: string,
        label: string,
        fn: () => Promise<void>,
        ackValue: ioBroker.StateValue | undefined,
    ): Promise<boolean> {
        try {
            await fn();
        } catch (e) {
            if (e instanceof JellyfinHttpError && e.status === 404) {
                this.log.warn(`${label}: the device is no longer connected to the server`);
                await this.reloadSessions();
            } else if (e instanceof JellyfinHttpError && e.status === 400) {
                this.log.warn(`${label}: rejected by the server (unknown command or invalid value)`);
            } else {
                this.log.warn(`${label} failed: ${(e as Error).message}`);
            }
            return false;
        }
        this.log.debug(`${label} sent (${id})`);
        if (ackValue !== undefined) {
            await this.setState(id, ackValue, true);
        }
        return true;
    }

    /**
     * Volume/mute: clients that report their audio status confirm the value with the next session report,
     * all others (Android TV app) get the commanded value acknowledged directly.
     *
     * @param id - state id relative to the namespace
     * @param s - session
     * @param label - command name for the log
     * @param value - commanded value
     * @param fn - request
     */
    private async runAudio(
        id: string,
        s: SessionInfo,
        label: string,
        value: ioBroker.StateValue,
        fn: () => Promise<void>,
    ): Promise<void> {
        const reported = reportsAudio(s);
        if (await this.run(id, label, fn, reported ? undefined : value)) {
            if (reported) {
                this.valueCache.delete(id);
            } else {
                this.valueCache.set(id, value);
            }
        }
    }

    /**
     * Readable device name for log messages.
     *
     * @param device - device object id
     * @param s - session
     */
    private deviceName(device: string, s: SessionInfo | undefined): string {
        return s?.DeviceName || this.preparedDevices.get(device) || device;
    }

    // ---------------------------------------------------------------- sendTo

    /**
     * `sendTo('jellyfin.0', 'message', { text, header?, timeoutMs?, device? })`
     * – shows a message on one device (object id or name) or on all devices that support messages.
     *
     * @param obj - message
     */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (!obj || obj.command !== 'message') {
            return;
        }
        const payload = (typeof obj.message === 'string' ? { text: obj.message } : obj.message) as Partial<
            MessagePayload & { device: string }
        >;
        const msg = parseMessage(payload);
        let sent = 0;
        const errors: string[] = [];
        if (!msg || !this.api) {
            errors.push(!msg ? 'text is missing' : 'adapter is not connected');
        } else {
            const filter = typeof payload?.device === 'string' ? payload.device.trim().toLowerCase() : '';
            for (const [id, s] of this.sessions) {
                const match =
                    !filter ||
                    id.toLowerCase() === filter ||
                    (s.DeviceName ?? '').toLowerCase().includes(filter) ||
                    (this.preparedDevices.get(id) ?? '').toLowerCase().includes(filter);
                if (!match || checkCommand(s, { type: 'general', name: 'DisplayMessage' })) {
                    continue;
                }
                try {
                    await this.api.sendMessage(s.Id, msg.text, msg.header, msg.timeoutMs);
                    sent++;
                } catch (e) {
                    errors.push(`${this.deviceName(id, s)}: ${(e as Error).message}`);
                }
            }
            if (!sent && !errors.length) {
                errors.push('no connected device accepts messages');
            }
        }
        if (errors.length) {
            this.log.warn(`sendTo message: ${errors.join('; ')}`);
        }
        if (obj.callback) {
            this.sendTo(obj.from, obj.command, { sent, errors }, obj.callback);
        }
    }

    // ---------------------------------------------------------------- unload

    private onUnload(callback: () => void): void {
        try {
            this.stopping = true;
            this.stopKeepAlive();
            if (this.reconnectTimer) {
                this.clearTimeout(this.reconnectTimer);
            }
            if (this.serverInfoTimer) {
                this.clearInterval(this.serverInfoTimer);
            }
            if (this.socket) {
                this.sendSocket({ MessageType: 'SessionsStop' });
                this.socket.close();
                this.socket = null;
            }
            void this.setState('info.connection', false, true);
        } finally {
            callback();
        }
    }
}

/**
 * Limits a number to a range.
 *
 * @param v - value
 * @param min - minimum
 * @param max - maximum
 */
function clamp(v: number, min: number, max: number): number {
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
}

/**
 * Preference when the same DeviceId appears twice: playing > controllable > other.
 *
 * @param s - session
 */
function rank(s: SessionInfo): number {
    return (s.NowPlayingItem ? 2 : 0) + (s.SupportsRemoteControl ? 1 : 0);
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Jellyfin(options);
} else {
    // otherwise start the instance directly
    (() => new Jellyfin())();
}
