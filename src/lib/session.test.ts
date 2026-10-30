import { describe, it } from 'mocha';
import { expect } from 'chai';
import { normalizeBaseUrl } from './api';
import { parseGeneralCommand, parseMessage } from './commands';
import { deviceObjectId } from './ids';
import { checkCommand, coverUrl, sessionValues } from './session';
import type { SessionInfo } from './types';

const opts = { baseUrl: 'http://jf:8096', coverHeight: 300 };

/** Session as reported by the Android TV app (Fire TV / SHIELD) while playing. */
const tv: SessionInfo = {
    Id: 's1',
    DeviceId: '3ef30646b735e17e0c8697a704ec9c0401d647d4',
    DeviceName: 'SHIELD',
    Client: 'Jellyfin Android TV',
    ApplicationVersion: '0.19.10',
    SupportsRemoteControl: true,
    SupportsMediaControl: true,
    SupportedCommands: ['DisplayMessage', 'SetVolume', 'Mute', 'Unmute', 'ToggleMute', 'VolumeUp', 'VolumeDown'],
    NowPlayingItem: {
        Id: 'm1',
        Name: 'Movie',
        Type: 'Movie',
        RunTimeTicks: 6000 * 10_000_000,
        ImageTags: { Primary: 'tag1' },
    },
    PlayState: { PositionTicks: 600 * 10_000_000, IsPaused: false, IsMuted: false, RepeatMode: 'RepeatNone' },
};

describe('deviceObjectId', () => {
    it('keeps short app ids', () => {
        expect(deviceObjectId('b0ce7344f928a75f')).to.equal('b0ce7344f928a75f');
        expect(deviceObjectId(tv.DeviceId)).to.equal(tv.DeviceId);
    });
    it('hashes long web ids to 16 hex chars, stable', () => {
        const web =
            'TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6MTU5LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTU5LjB8MTc5MzM5MjA3Nzg5MA11';
        const id = deviceObjectId(web);
        expect(id).to.match(/^[0-9a-f]{16}$/);
        expect(deviceObjectId(web)).to.equal(id);
    });
    it('hashes ids with forbidden characters', () => {
        expect(deviceObjectId('b0ce7344f928a75f5b9b155f-fefa-43d5-8b55-0123456789ab')).to.match(/^[0-9a-f]{16}$/);
        expect(deviceObjectId('a.b')).to.match(/^[0-9a-f]{16}$/);
    });
});

describe('normalizeBaseUrl', () => {
    it('adds http and strips trailing slashes', () => {
        expect(normalizeBaseUrl('192.168.1.14:8097/')).to.equal('http://192.168.1.14:8097');
        expect(normalizeBaseUrl(' https://host/jellyfin/ ')).to.equal('https://host/jellyfin');
    });
    it('rejects empty and invalid values', () => {
        expect(normalizeBaseUrl('')).to.equal(null);
        expect(normalizeBaseUrl('ftp://host')).to.equal(null);
    });
});

describe('sessionValues', () => {
    it('maps a playing session', () => {
        const v = sessionValues(tv, opts);
        expect(v['media.state']).to.equal('play');
        expect(v['media.duration']).to.equal(6000);
        expect(v['media.elapsed']).to.equal(600);
        expect(v['media.seek']).to.equal(10);
        expect(v['info.remoteControl']).to.equal(true);
        expect(v['media.cover']).to.equal('http://jf:8096/Items/m1/Images/Primary?maxHeight=300&tag=tag1');
    });
    it('does not report volume/mute for clients without VolumeLevel (Android TV)', () => {
        const v = sessionValues(tv, opts);
        expect(v).to.not.have.property('media.volume');
        expect(v).to.not.have.property('media.mute');
        expect(v).to.not.have.property('media.repeat');
    });
    it('reports volume/mute when VolumeLevel is present', () => {
        const v = sessionValues(
            {
                ...tv,
                PlayState: { ...tv.PlayState, VolumeLevel: 40, IsMuted: true },
                SupportedCommands: ['SetRepeatMode'],
            },
            opts,
        );
        expect(v['media.volume']).to.equal(40);
        expect(v['media.mute']).to.equal(true);
        expect(v['media.repeat']).to.equal('RepeatNone');
    });
    it('clears media values when nothing plays', () => {
        const v = sessionValues({ ...tv, NowPlayingItem: null }, opts);
        expect(v['media.state']).to.equal('stop');
        expect(v['media.title']).to.equal('');
        expect(v['media.elapsed']).to.equal(0);
    });
    it('uses the series poster for episodes', () => {
        const ep: SessionInfo = {
            ...tv,
            NowPlayingItem: {
                Id: 'e1',
                Type: 'Episode',
                SeriesId: 'ser',
                SeriesPrimaryImageTag: 'st',
                ParentIndexNumber: 2,
                IndexNumber: 5,
            },
        };
        expect(coverUrl(ep, { ...opts, coverHeight: 0 })).to.equal('http://jf:8096/Items/ser/Images/Primary?tag=st');
        const v = sessionValues(ep, opts);
        expect(v['media.season']).to.equal('2');
        expect(v['media.episode']).to.equal('5');
    });
});

describe('checkCommand', () => {
    it('allows playstate only with SupportsMediaControl', () => {
        expect(checkCommand(tv, { type: 'playstate' })).to.equal(null);
        expect(checkCommand({ ...tv, SupportsMediaControl: false }, { type: 'playstate' })).to.be.a('string');
    });
    it('allows general commands only if listed', () => {
        expect(checkCommand(tv, { type: 'general', name: 'SetVolume' })).to.equal(null);
        expect(checkCommand(tv, { type: 'general', name: 'SetRepeatMode' })).to.be.a('string');
    });
    it('blocks everything without remote control or session', () => {
        expect(checkCommand({ ...tv, SupportsRemoteControl: false }, { type: 'playstate' })).to.be.a('string');
        expect(checkCommand(undefined, { type: 'general', name: 'Mute' })).to.be.a('string');
    });
});

describe('parseMessage / parseGeneralCommand', () => {
    it('parses plain text and JSON', () => {
        expect(parseMessage(' Hallo ')).to.deep.equal({ text: 'Hallo' });
        expect(parseMessage('{"text":"Klingel","header":"Haustür","timeoutMs":5000}')).to.deep.equal({
            text: 'Klingel',
            header: 'Haustür',
            timeoutMs: 5000,
        });
        expect(parseMessage('')).to.equal(null);
        expect(parseMessage({ Text: 'x' })).to.deep.equal({ text: 'x', header: undefined, timeoutMs: undefined });
    });
    it('parses general commands', () => {
        expect(parseGeneralCommand('GoHome')).to.deep.equal({ name: 'GoHome' });
        expect(parseGeneralCommand('{"Name":"SetVolume","Arguments":{"Volume":50}}')).to.deep.equal({
            name: 'SetVolume',
            args: { Volume: '50' },
        });
        expect(parseGeneralCommand('Go Home')).to.equal(null);
        expect(parseGeneralCommand('{"Name":1}')).to.equal(null);
    });
});
