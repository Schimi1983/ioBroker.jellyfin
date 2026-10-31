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
var session_exports = {};
__export(session_exports, {
  TICKS_PER_SECOND: () => TICKS_PER_SECOND,
  checkCommand: () => checkCommand,
  coverUrl: () => coverUrl,
  reportsAudio: () => reportsAudio,
  sessionValues: () => sessionValues
});
module.exports = __toCommonJS(session_exports);
const TICKS_PER_SECOND = 1e7;
function coverUrl(s, opts) {
  var _a;
  const item = s.NowPlayingItem;
  if (!item) {
    return "";
  }
  let id;
  let tag;
  if (item.Type === "Episode" && item.SeriesId && item.SeriesPrimaryImageTag) {
    id = item.SeriesId;
    tag = item.SeriesPrimaryImageTag;
  } else if (((_a = item.ImageTags) == null ? void 0 : _a.Primary) && item.Id) {
    id = item.Id;
    tag = item.ImageTags.Primary;
  } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
    id = item.AlbumId;
    tag = item.AlbumPrimaryImageTag;
  }
  if (!id) {
    return "";
  }
  const query = new URLSearchParams();
  if (opts.coverHeight > 0) {
    query.set("maxHeight", String(Math.round(opts.coverHeight)));
  }
  if (tag) {
    query.set("tag", tag);
  }
  const qs = query.toString();
  return `${opts.baseUrl}/Items/${encodeURIComponent(id)}/Images/Primary${qs ? `?${qs}` : ""}`;
}
function reportsAudio(s) {
  var _a;
  return typeof ((_a = s.PlayState) == null ? void 0 : _a.VolumeLevel) === "number";
}
function sessionValues(s, opts) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const v = {};
  const item = (_a = s.NowPlayingItem) != null ? _a : void 0;
  const ps = (_b = s.PlayState) != null ? _b : {};
  v["info.name"] = ((_c = s.DeviceName) != null ? _c : "").replace(/\+/g, " ").trim();
  v["info.client"] = (_d = s.Client) != null ? _d : "";
  v["info.version"] = (_e = s.ApplicationVersion) != null ? _e : "";
  v["info.user"] = (_f = s.UserName) != null ? _f : "";
  v["info.reachable"] = true;
  v["info.remoteControl"] = s.SupportsRemoteControl === true;
  if (s.LastActivityDate) {
    const t = Date.parse(s.LastActivityDate);
    if (!Number.isNaN(t)) {
      v["info.lastActivity"] = t;
    }
  }
  if (item) {
    v["media.state"] = ps.IsPaused ? "pause" : "play";
    v["media.title"] = (_g = item.Name) != null ? _g : "";
    v["media.itemId"] = (_h = item.Id) != null ? _h : "";
    v["media.type"] = (_i = item.Type) != null ? _i : "";
    v["media.series"] = (_j = item.SeriesName) != null ? _j : "";
    v["media.season"] = item.Type === "Episode" && item.ParentIndexNumber != null ? String(item.ParentIndexNumber) : "";
    v["media.episode"] = item.Type === "Episode" && item.IndexNumber != null ? String(item.IndexNumber) : "";
    v["media.artist"] = ((_k = item.Artists) != null ? _k : []).join(", ");
    v["media.album"] = (_l = item.Album) != null ? _l : "";
    v["media.genre"] = ((_m = item.Genres) != null ? _m : []).join(", ");
    v["media.year"] = item.ProductionYear ? String(item.ProductionYear) : "";
    v["media.cover"] = coverUrl(s, opts);
    const duration = item.RunTimeTicks ? Math.round(item.RunTimeTicks / TICKS_PER_SECOND) : 0;
    const elapsed = ps.PositionTicks ? Math.round(ps.PositionTicks / TICKS_PER_SECOND) : 0;
    v["media.duration"] = duration;
    v["media.elapsed"] = elapsed;
    v["media.seek"] = duration > 0 ? Math.min(100, Math.round(elapsed / duration * 1e3) / 10) : 0;
  } else {
    v["media.state"] = "stop";
    for (const key of [
      "title",
      "type",
      "series",
      "season",
      "episode",
      "artist",
      "album",
      "genre",
      "year",
      "cover"
    ]) {
      v[`media.${key}`] = "";
    }
    v["media.duration"] = 0;
    v["media.elapsed"] = 0;
    v["media.seek"] = 0;
  }
  if (reportsAudio(s)) {
    v["media.volume"] = ps.VolumeLevel;
    v["media.mute"] = ps.IsMuted === true;
  }
  if (ps.RepeatMode && ((_n = s.SupportedCommands) == null ? void 0 : _n.includes("SetRepeatMode"))) {
    v["media.repeat"] = ps.RepeatMode;
  }
  return v;
}
function checkCommand(s, kind) {
  var _a;
  if (!s) {
    return "device is not connected to the server";
  }
  if (s.SupportsRemoteControl !== true) {
    return "device does not accept remote control right now";
  }
  if (kind.type === "playstate") {
    return s.SupportsMediaControl === true ? null : "device does not accept playback commands";
  }
  const supported = (_a = s.SupportedCommands) != null ? _a : [];
  const names = kind.type === "general" ? [kind.name] : kind.names;
  return names.some((n) => supported.includes(n)) ? null : `device does not support ${names.join("/")}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TICKS_PER_SECOND,
  checkCommand,
  coverUrl,
  reportsAudio,
  sessionValues
});
//# sourceMappingURL=session.js.map
