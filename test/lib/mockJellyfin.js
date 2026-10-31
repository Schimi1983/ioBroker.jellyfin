'use strict';
/**
 * Minimal Jellyfin 12 server for integration tests: REST endpoints used by the adapter and a WebSocket
 * (/socket) that answers SessionsStart with the session list. No dependencies – the WebSocket handshake and
 * frames are implemented with node:http / node:crypto.
 */
const http = require('node:http');
const crypto = require('node:crypto');

const API_KEY = 'test-api-key';
const TICKS = 10_000_000;

/** Sessions as reported by the iPad app (app + player) and a browser. */
function defaultSessions() {
    const now = new Date().toISOString();
    return [
        {
            Id: 'sess-ipad-app',
            DeviceId: 'e4815207-9d78-4002-99bf-129b02e75b92',
            DeviceName: 'Test-iPad',
            Client: 'Jellyfin iPadOS',
            ApplicationVersion: '1.8.0',
            UserId: 'user1',
            UserName: 'TestUser',
            LastActivityDate: now,
            SupportsRemoteControl: true,
            SupportsMediaControl: true,
            SupportedCommands: ['DisplayMessage', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume'],
            NowPlayingItem: null,
            PlayState: {},
        },
        {
            Id: 'sess-ipad-player',
            DeviceId: 'c2f89261-f80a-475e-af19-aea4d15c7cd4',
            DeviceName: 'Test-iPad',
            Client: 'Jellyfin iPadOS',
            ApplicationVersion: '1.8.0',
            UserId: 'user1',
            UserName: 'TestUser',
            LastActivityDate: now,
            SupportsRemoteControl: false,
            SupportsMediaControl: false,
            SupportedCommands: [],
            NowPlayingItem: {
                Id: 'item-movie',
                Name: 'Test Movie',
                Type: 'Movie',
                ProductionYear: 2004,
                RunTimeTicks: 6000 * TICKS,
                Genres: ['Comedy'],
                ImageTags: { Primary: 'tag1' },
            },
            PlayState: { PositionTicks: 600 * TICKS, IsPaused: false, IsMuted: false, VolumeLevel: 100, RepeatMode: 'RepeatNone' },
        },
        {
            Id: 'sess-own',
            DeviceId: 'ioBroker-jellyfin.0',
            DeviceName: 'ioBroker',
            Client: 'ioBroker',
            LastActivityDate: now,
            SupportsRemoteControl: false,
        },
    ];
}

class MockJellyfin {
    constructor() {
        /** @type {{method: string, path: string, query: Record<string,string>, body: any}[]} */
        this.requests = [];
        this.sessions = defaultSessions();
        this.sockets = new Set();
        this.server = http.createServer((req, res) => this.onRequest(req, res));
        this.server.on('upgrade', (req, socket) => this.onUpgrade(req, socket));
    }

    /** @returns {Promise<number>} port */
    start() {
        return new Promise(resolve => this.server.listen(0, '127.0.0.1', () => resolve(this.server.address().port)));
    }

    stop() {
        for (const s of this.sockets) {
            s.destroy();
        }
        return new Promise(resolve => this.server.close(() => resolve()));
    }

    /** Requests matching method and path (regex or string). */
    find(method, path) {
        return this.requests.filter(r => r.method === method && (path instanceof RegExp ? path.test(r.path) : r.path === path));
    }

    authorized(req, url) {
        const auth = req.headers.authorization || '';
        return auth.includes(`Token="${API_KEY}"`) || url.searchParams.get('ApiKey') === API_KEY;
    }

    onRequest(req, res) {
        const url = new URL(req.url, 'http://localhost');
        let raw = '';
        req.on('data', c => (raw += c));
        req.on('end', () => {
            let body;
            try {
                body = raw ? JSON.parse(raw) : undefined;
            } catch {
                body = raw;
            }
            this.requests.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
            if (!this.authorized(req, url)) {
                res.writeHead(401).end();
                return;
            }
            const json = (code, data) => {
                res.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
            };
            if (req.method === 'GET' && url.pathname === '/System/Info') {
                return json(200, { ServerName: 'Mock', Version: '12.4.0', Id: 'mock-server-id', HasPendingRestart: false, HasUpdateAvailable: true });
            }
            if (req.method === 'GET' && url.pathname === '/Sessions') {
                return json(200, this.sessions);
            }
            if (req.method === 'GET' && url.pathname === '/Items') {
                const term = (url.searchParams.get('searchTerm') || '').toLowerCase();
                const items = term.includes('family') ? [{ Id: 'series-1', Name: 'Test Family', Type: 'Series' }] : [];
                return json(200, { Items: items, TotalRecordCount: items.length });
            }
            const session = url.pathname.match(/^\/Sessions\/([^/]+)\//);
            if (req.method === 'POST' && session) {
                if (!this.sessions.some(s => s.Id === decodeURIComponent(session[1]))) {
                    return res.writeHead(404).end();
                }
                if (/\/Command\/[A-Za-z]+$/.test(url.pathname) && url.pathname.endsWith('DoesNotExist')) {
                    return res.writeHead(400).end();
                }
                return res.writeHead(204).end();
            }
            if (req.method === 'POST' && url.pathname === '/Library/Refresh') {
                return res.writeHead(204).end();
            }
            res.writeHead(404).end();
        });
    }

    onUpgrade(req, socket) {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname !== '/socket' || url.searchParams.get('ApiKey') !== API_KEY) {
            socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
            return;
        }
        const accept = crypto
            .createHash('sha1')
            .update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
            .digest('base64');
        socket.write(
            `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`,
        );
        this.sockets.add(socket);
        socket.on('close', () => this.sockets.delete(socket));
        socket.on('error', () => this.sockets.delete(socket));
        let buffer = Buffer.alloc(0);
        socket.on('data', chunk => {
            buffer = Buffer.concat([buffer, chunk]);
            for (;;) {
                const frame = decodeFrame(buffer);
                if (!frame) {
                    break;
                }
                buffer = buffer.subarray(frame.length);
                if (frame.opcode === 8) {
                    socket.end();
                    return;
                }
                if (frame.opcode === 1) {
                    this.onSocketMessage(socket, frame.payload.toString('utf8'));
                }
            }
        });
        this.send(socket, { MessageType: 'ForceKeepAlive', Data: 60 });
    }

    onSocketMessage(socket, text) {
        let msg;
        try {
            msg = JSON.parse(text);
        } catch {
            return;
        }
        this.requests.push({ method: 'WS', path: msg.MessageType, query: {}, body: msg.Data });
        if (msg.MessageType === 'SessionsStart') {
            this.send(socket, { MessageType: 'Sessions', Data: this.sessions });
        }
    }

    /** Pushes the current session list to all sockets. */
    pushSessions() {
        for (const s of this.sockets) {
            this.send(s, { MessageType: 'Sessions', Data: this.sessions });
        }
    }

    send(socket, obj) {
        const payload = Buffer.from(JSON.stringify(obj));
        let header;
        if (payload.length < 126) {
            header = Buffer.from([0x81, payload.length]);
        } else if (payload.length < 65536) {
            header = Buffer.alloc(4);
            header[0] = 0x81;
            header[1] = 126;
            header.writeUInt16BE(payload.length, 2);
        } else {
            header = Buffer.alloc(10);
            header[0] = 0x81;
            header[1] = 127;
            header.writeBigUInt64BE(BigInt(payload.length), 2);
        }
        socket.write(Buffer.concat([header, payload]));
    }
}

/** Decodes one (masked) client frame; returns null if incomplete. */
function decodeFrame(buf) {
    if (buf.length < 2) {
        return null;
    }
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f;
    let offset = 2;
    if (len === 126) {
        if (buf.length < 4) {
            return null;
        }
        len = buf.readUInt16BE(2);
        offset = 4;
    } else if (len === 127) {
        if (buf.length < 10) {
            return null;
        }
        len = Number(buf.readBigUInt64BE(2));
        offset = 10;
    }
    const maskLen = masked ? 4 : 0;
    if (buf.length < offset + maskLen + len) {
        return null;
    }
    const mask = masked ? buf.subarray(offset, offset + 4) : null;
    const payload = Buffer.from(buf.subarray(offset + maskLen, offset + maskLen + len));
    if (mask) {
        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= mask[i % 4];
        }
    }
    return { opcode, payload, length: offset + maskLen + len };
}

module.exports = { MockJellyfin, API_KEY, TICKS };
