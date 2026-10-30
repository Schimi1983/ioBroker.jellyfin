"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var objects_exports = {};
__export(objects_exports, {
  DEVICE_CHANNELS: () => DEVICE_CHANNELS,
  DEVICE_STATES: () => DEVICE_STATES,
  MEDIA_STATES: () => MEDIA_STATES,
  REPEAT_STATES: () => REPEAT_STATES,
  SERVER_STATES: () => SERVER_STATES,
  toCommon: () => toCommon
});
module.exports = __toCommonJS(objects_exports);
const DEVICE_CHANNELS = {
  info: "Information",
  media: "Media",
  command: "Commands"
};
const MEDIA_STATES = { play: "play", pause: "pause", stop: "stop" };
const REPEAT_STATES = {
  RepeatNone: "off",
  RepeatAll: "all",
  RepeatOne: "one"
};
const button = (id, name, role) => ({
  id,
  name,
  type: "boolean",
  role,
  read: false,
  write: true
});
const DEVICE_STATES = [
  // info
  { id: "info.name", name: "Device name", type: "string", role: "info.name", read: true, write: false },
  { id: "info.client", name: "App", type: "string", role: "media.player.type", read: true, write: false },
  { id: "info.version", name: "App version", type: "string", role: "info.firmware", read: true, write: false },
  { id: "info.user", name: "User", type: "string", role: "text", read: true, write: false },
  {
    id: "info.reachable",
    name: "Connected to the server",
    type: "boolean",
    role: "indicator.reachable",
    read: true,
    write: false,
    def: false
  },
  {
    id: "info.remoteControl",
    name: "Can be controlled remotely",
    type: "boolean",
    role: "indicator",
    read: true,
    write: false,
    def: false
  },
  { id: "info.lastActivity", name: "Last activity", type: "number", role: "date", read: true, write: false },
  // media (read)
  {
    id: "media.state",
    name: "Playback state",
    type: "string",
    role: "media.state",
    read: true,
    write: false,
    states: MEDIA_STATES,
    def: "stop"
  },
  { id: "media.title", name: "Title", type: "string", role: "media.title", read: true, write: false, def: "" },
  { id: "media.type", name: "Media type", type: "string", role: "text", read: true, write: false, def: "" },
  { id: "media.series", name: "Series", type: "string", role: "text", read: true, write: false, def: "" },
  { id: "media.season", name: "Season", type: "string", role: "media.season", read: true, write: false, def: "" },
  { id: "media.episode", name: "Episode", type: "string", role: "media.episode", read: true, write: false, def: "" },
  { id: "media.artist", name: "Artist", type: "string", role: "media.artist", read: true, write: false, def: "" },
  { id: "media.album", name: "Album", type: "string", role: "media.album", read: true, write: false, def: "" },
  { id: "media.genre", name: "Genre", type: "string", role: "media.genre", read: true, write: false, def: "" },
  { id: "media.year", name: "Year", type: "string", role: "media.date", read: true, write: false, def: "" },
  { id: "media.cover", name: "Cover URL", type: "string", role: "media.cover", read: true, write: false, def: "" },
  {
    id: "media.duration",
    name: "Duration",
    type: "number",
    role: "media.duration",
    read: true,
    write: false,
    unit: "s",
    def: 0
  },
  {
    id: "media.elapsed",
    name: "Position",
    type: "number",
    role: "media.elapsed",
    read: true,
    write: false,
    unit: "s",
    def: 0
  },
  // media (read/write)
  {
    id: "media.seek",
    name: "Position in percent (write to jump)",
    type: "number",
    role: "media.seek",
    read: true,
    write: true,
    unit: "%",
    min: 0,
    max: 100,
    def: 0
  },
  {
    id: "media.volume",
    name: "Volume",
    type: "number",
    role: "level.volume",
    read: true,
    write: true,
    unit: "%",
    min: 0,
    max: 100
  },
  { id: "media.mute", name: "Muted", type: "boolean", role: "media.mute", read: true, write: true },
  {
    id: "media.repeat",
    name: "Repeat",
    type: "string",
    role: "state",
    read: true,
    write: true,
    states: REPEAT_STATES
  },
  // commands
  button("command.play", "Play", "button.play"),
  button("command.pause", "Pause", "button.pause"),
  button("command.playPause", "Play / pause", "button"),
  button("command.stop", "Stop", "button.stop"),
  button("command.next", "Next", "button.next"),
  button("command.previous", "Previous", "button.prev"),
  button("command.forward", "Skip forward", "button.forward"),
  button("command.rewind", "Skip back", "button.reverse"),
  button("command.volumeUp", "Volume up", "button.volume.up"),
  button("command.volumeDown", "Volume down", "button.volume.down"),
  button("command.toggleMute", "Mute on/off", "button"),
  {
    id: "command.message",
    name: "Show message on the screen",
    type: "string",
    role: "text",
    read: true,
    write: true,
    def: ""
  },
  {
    id: "command.generalCommand",
    name: 'Send command (e.g. GoHome or {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    type: "string",
    role: "text",
    read: true,
    write: true,
    def: ""
  }
];
const SERVER_STATES = [
  { id: "server.name", name: "Server name", type: "string", role: "info.name", read: true, write: false },
  { id: "server.version", name: "Server version", type: "string", role: "info.firmware", read: true, write: false },
  {
    id: "server.updateAvailable",
    name: "Update available",
    type: "boolean",
    role: "indicator",
    read: true,
    write: false,
    def: false
  },
  {
    id: "server.restartPending",
    name: "Restart required",
    type: "boolean",
    role: "indicator",
    read: true,
    write: false,
    def: false
  },
  {
    id: "server.activeDevices",
    name: "Connected devices",
    type: "number",
    role: "value",
    read: true,
    write: false,
    def: 0
  },
  {
    id: "server.playingDevices",
    name: "Devices playing",
    type: "number",
    role: "value",
    read: true,
    write: false,
    def: 0
  },
  button("server.refreshLibrary", "Scan all libraries", "button")
];
function toCommon(def) {
  const common = {
    name: def.name,
    type: def.type,
    role: def.role,
    read: def.read,
    write: def.write
  };
  if (def.unit) {
    common.unit = def.unit;
  }
  if (def.min !== void 0) {
    common.min = def.min;
  }
  if (def.max !== void 0) {
    common.max = def.max;
  }
  if (def.states) {
    common.states = def.states;
  }
  if (def.def !== void 0) {
    common.def = def.def;
  }
  return common;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEVICE_CHANNELS,
  DEVICE_STATES,
  MEDIA_STATES,
  REPEAT_STATES,
  SERVER_STATES,
  toCommon
});
//# sourceMappingURL=objects.js.map
