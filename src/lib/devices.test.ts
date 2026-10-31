import { expect } from 'chai';
import { describe, it } from 'mocha';
import { displayName, groupKey, groupSessions, isStale, STALE_SESSION_MS } from './devices';
import type { SessionInfo } from './types';

const now = Date.parse('2026-10-31T15:00:00Z');
const recent = new Date(now - 60_000).toISOString();
const old = new Date(now - STALE_SESSION_MS - 60_000).toISOString();

/** iPad: app session (remote) + player session (playing), unrelated DeviceIds. */
const ipadApp: SessionInfo = {
    Id: 'app',
    DeviceId: 'e4815207-9d78-4002-99bf-129b02e75b92',
    DeviceName: 'Szymon-iPad Pro',
    Client: 'Jellyfin iPadOS',
    UserId: 'u1',
    SupportsRemoteControl: true,
    SupportsMediaControl: true,
    SupportedCommands: ['DisplayMessage', 'Mute'],
    LastActivityDate: recent,
    NowPlayingItem: null,
};
const ipadPlayer: SessionInfo = {
    Id: 'player',
    DeviceId: 'c2f89261-f80a-475e-af19-aea4d15c7cd4',
    DeviceName: 'Szymon-iPad Pro',
    Client: 'Jellyfin iPadOS',
    UserId: 'u1',
    SupportsRemoteControl: false,
    LastActivityDate: recent,
    NowPlayingItem: { Id: 'm1', Name: 'Movie', RunTimeTicks: 1000 },
    PlayState: { PositionTicks: 500, IsPaused: false, VolumeLevel: 100 },
};

describe('device grouping', () => {
    it('normalizes URL-encoded names', () => {
        expect(displayName({ ...ipadApp, DeviceName: 'Szymon-Pixel+10a' })).to.equal('Szymon-Pixel 10a');
    });
    it('does not group web browsers', () => {
        expect(groupKey({ ...ipadApp, Client: 'Jellyfin Web', DeviceName: 'Firefox' })).to.equal(null);
    });
    it('merges app and player session into one device', () => {
        const devices = [...groupSessions([ipadApp, ipadPlayer], now).values()];
        expect(devices).to.have.length(1);
        const d = devices[0];
        expect(d.members).to.have.length(2);
        expect(d.view.Id).to.equal('app'); // commands go to the controllable session
        expect(d.view.SupportsRemoteControl).to.equal(true);
        expect(d.view.NowPlayingItem?.Name).to.equal('Movie'); // media from the player
        expect(d.view.PlayState?.PositionTicks).to.equal(500);
        expect(d.id).to.match(/^[0-9a-f]{16}$/);
    });
    it('keeps the same object id whichever session exists', () => {
        const a = [...groupSessions([ipadApp], now).keys()][0];
        const b = [...groupSessions([ipadPlayer], now).keys()][0];
        expect(a).to.equal(b);
    });
    it('treats "+" and " " in the name as the same device', () => {
        const a = [...groupSessions([{ ...ipadApp, DeviceName: 'Szymon-Pixel+10a' }], now).keys()][0];
        const b = [...groupSessions([{ ...ipadApp, DeviceName: 'Szymon-Pixel 10a' }], now).keys()][0];
        expect(a).to.equal(b);
    });
    it('keeps two browsers apart', () => {
        const ff1 = { ...ipadApp, Client: 'Jellyfin Web', DeviceName: 'Firefox', DeviceId: 'a1' };
        const ff2 = { ...ff1, Id: 'x', DeviceId: 'a2' };
        expect(groupSessions([ff1, ff2], now).size).to.equal(2);
    });
    it('drops old sessions that neither play nor accept commands', () => {
        const stale = { ...ipadPlayer, NowPlayingItem: null, LastActivityDate: old };
        expect(isStale(stale, now)).to.equal(true);
        expect(isStale({ ...stale, SupportsRemoteControl: true }, now)).to.equal(false);
        expect(groupSessions([stale], now).size).to.equal(0);
    });
});
