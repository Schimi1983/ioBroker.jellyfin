/**
 * Object definitions for one Jellyfin client (device) and the server channel.
 * Roles follow https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
 */

import { tr } from './names';

/** Definition of one state below a device (`<device>.<id>`). */
export interface StateDef {
    /** id relative to the device (or namespace for server states) */
    id: string;
    /** English object name */
    name: string;
    /** common.type */
    type: ioBroker.CommonType;
    /** common.role (official state roles) */
    role: string;
    /** common.read */
    read: boolean;
    /** common.write */
    write: boolean;
    /** common.unit */
    unit?: string;
    /** common.min */
    min?: number;
    /** common.max */
    max?: number;
    /** common.states */
    states?: Record<string | number, string>;
    /** common.def */
    def?: ioBroker.StateValue;
}

/** Channels below each device. */
export const DEVICE_CHANNELS: Record<string, string> = {
    info: 'Information',
    media: 'Media',
    command: 'Commands',
};

/** Media state values (role `media.state`). */
export const MEDIA_STATES: Record<string, string> = { play: 'play', pause: 'pause', stop: 'stop' };

/** Jellyfin repeat modes, index = value of `media.repeat` (role `media.mode.repeat`: 0 none, 1 all, 2 one). */
export const REPEAT_MODES = ['RepeatNone', 'RepeatAll', 'RepeatOne'] as const;

/** Display texts of `media.repeat`. */
export const REPEAT_STATES: Record<number, string> = { 0: 'off', 1: 'all', 2: 'one' };

const button = (id: string, name: string, role: string): StateDef => ({
    id,
    name,
    type: 'boolean',
    role,
    read: false,
    write: true,
});

/** All states of one device. */
export const DEVICE_STATES: StateDef[] = [
    // info
    { id: 'info.name', name: 'Device name', type: 'string', role: 'info.name', read: true, write: false },
    { id: 'info.client', name: 'App', type: 'string', role: 'text', read: true, write: false },
    { id: 'info.version', name: 'App version', type: 'string', role: 'info.firmware', read: true, write: false },
    { id: 'info.user', name: 'User', type: 'string', role: 'text', read: true, write: false },
    {
        id: 'info.reachable',
        name: 'Connected to the server',
        type: 'boolean',
        role: 'indicator.reachable',
        read: true,
        write: false,
        def: false,
    },
    {
        id: 'info.remoteControl',
        name: 'Can be controlled remotely',
        type: 'boolean',
        role: 'indicator',
        read: true,
        write: false,
        def: false,
    },
    { id: 'info.lastActivity', name: 'Last activity', type: 'number', role: 'date', read: true, write: false },

    // media (read)
    {
        id: 'media.state',
        name: 'Playback state',
        type: 'string',
        role: 'media.state',
        read: true,
        write: false,
        states: MEDIA_STATES,
        def: 'stop',
    },
    { id: 'media.title', name: 'Title', type: 'string', role: 'media.title', read: true, write: false, def: '' },
    { id: 'media.type', name: 'Media type', type: 'string', role: 'text', read: true, write: false, def: '' },
    { id: 'media.series', name: 'Series', type: 'string', role: 'text', read: true, write: false, def: '' },
    { id: 'media.season', name: 'Season', type: 'string', role: 'media.season', read: true, write: false, def: '' },
    { id: 'media.episode', name: 'Episode', type: 'string', role: 'media.episode', read: true, write: false, def: '' },
    { id: 'media.artist', name: 'Artist', type: 'string', role: 'media.artist', read: true, write: false, def: '' },
    { id: 'media.album', name: 'Album', type: 'string', role: 'media.album', read: true, write: false, def: '' },
    { id: 'media.genre', name: 'Genre', type: 'string', role: 'media.genre', read: true, write: false, def: '' },
    { id: 'media.year', name: 'Year', type: 'string', role: 'media.date', read: true, write: false, def: '' },
    {
        id: 'media.itemId',
        name: 'Jellyfin id of the item',
        type: 'string',
        role: 'text',
        read: true,
        write: false,
        def: '',
    },
    { id: 'media.cover', name: 'Cover URL', type: 'string', role: 'media.cover', read: true, write: false, def: '' },
    {
        id: 'media.duration',
        name: 'Duration',
        type: 'number',
        role: 'media.duration',
        read: true,
        write: false,
        unit: 's',
        def: 0,
    },
    {
        id: 'media.elapsed',
        name: 'Position',
        type: 'number',
        role: 'media.elapsed',
        read: true,
        write: false,
        unit: 's',
        def: 0,
    },

    // media (read/write)
    {
        id: 'media.seek',
        name: 'Position in percent (write to jump)',
        type: 'number',
        role: 'media.seek',
        read: true,
        write: true,
        unit: '%',
        min: 0,
        max: 100,
        def: 0,
    },
    {
        id: 'media.volume',
        name: 'Volume',
        type: 'number',
        role: 'level.volume',
        read: true,
        write: true,
        unit: '%',
        min: 0,
        max: 100,
    },
    { id: 'media.mute', name: 'Muted', type: 'boolean', role: 'media.mute', read: true, write: true },
    {
        id: 'media.repeat',
        name: 'Repeat',
        type: 'number',
        role: 'media.mode.repeat',
        read: true,
        write: true,
        min: 0,
        max: 2,
        states: REPEAT_STATES,
    },

    // commands
    button('command.play', 'Play', 'button.play'),
    button('command.pause', 'Pause', 'button.pause'),
    button('command.playPause', 'Play / pause', 'button'),
    button('command.stop', 'Stop', 'button.stop'),
    button('command.next', 'Next', 'button.next'),
    button('command.previous', 'Previous', 'button.prev'),
    button('command.forward', 'Skip forward', 'button.forward'),
    button('command.rewind', 'Skip back', 'button.reverse'),
    button('command.volumeUp', 'Volume up', 'button.volume.up'),
    button('command.volumeDown', 'Volume down', 'button.volume.down'),
    button('command.toggleMute', 'Mute on/off', 'button'),
    {
        id: 'command.playTitle',
        name: 'Play a film, episode or song by its title (or item id)',
        type: 'string',
        role: 'text',
        read: true,
        write: true,
        def: '',
    },
    {
        id: 'command.message',
        name: 'Show message on the screen',
        type: 'string',
        role: 'text',
        read: true,
        write: true,
        def: '',
    },
    {
        id: 'command.generalCommand',
        name: 'Send command (e.g. GoHome or {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
        type: 'string',
        role: 'text',
        read: true,
        write: true,
        def: '',
    },
];

/** States of the `server` channel. */
export const SERVER_STATES: StateDef[] = [
    { id: 'server.name', name: 'Server name', type: 'string', role: 'info.name', read: true, write: false },
    { id: 'server.version', name: 'Server version', type: 'string', role: 'info.firmware', read: true, write: false },
    {
        id: 'server.updateAvailable',
        name: 'Update available',
        type: 'boolean',
        role: 'indicator',
        read: true,
        write: false,
        def: false,
    },
    {
        id: 'server.restartPending',
        name: 'Restart required',
        type: 'boolean',
        role: 'indicator',
        read: true,
        write: false,
        def: false,
    },
    {
        id: 'server.activeDevices',
        name: 'Connected devices',
        type: 'number',
        role: 'value',
        read: true,
        write: false,
        def: 0,
    },
    {
        id: 'server.playingDevices',
        name: 'Devices playing',
        type: 'number',
        role: 'value',
        read: true,
        write: false,
        def: 0,
    },
    button('server.refreshLibrary', 'Scan all libraries', 'button'),
];

/**
 * Converts a {@link StateDef} into `common` of an ioBroker state object.
 *
 * @param def - state definition
 */
export function toCommon(def: StateDef): ioBroker.StateCommon {
    const common: ioBroker.StateCommon = {
        name: tr(def.name),
        type: def.type,
        role: def.role,
        read: def.read,
        write: def.write,
    };
    if (def.unit) {
        common.unit = def.unit;
    }
    if (def.min !== undefined) {
        common.min = def.min;
    }
    if (def.max !== undefined) {
        common.max = def.max;
    }
    if (def.states) {
        common.states = def.states;
    }
    if (def.def !== undefined) {
        common.def = def.def;
    }
    return common;
}
