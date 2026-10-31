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
var devices_exports = {};
__export(devices_exports, {
  STALE_SESSION_MS: () => STALE_SESSION_MS,
  displayName: () => displayName,
  groupKey: () => groupKey,
  groupSessions: () => groupSessions,
  isStale: () => isStale
});
module.exports = __toCommonJS(devices_exports);
var import_ids = require("./ids");
const STALE_SESSION_MS = 10 * 6e4;
function displayName(s) {
  var _a;
  return ((_a = s.DeviceName) != null ? _a : "").replace(/\+/g, " ").replace(/\s+/g, " ").trim();
}
function groupKey(s) {
  var _a, _b;
  if (!s.Client || /web/i.test(s.Client)) {
    return null;
  }
  return `${s.Client}|${displayName(s).toLowerCase()}|${(_b = (_a = s.UserId) != null ? _a : s.UserName) != null ? _b : ""}`;
}
function isStale(s, now) {
  if (s.SupportsRemoteControl || s.NowPlayingItem) {
    return false;
  }
  const last = s.LastActivityDate ? Date.parse(s.LastActivityDate) : NaN;
  return Number.isNaN(last) || now - last > STALE_SESSION_MS;
}
function groupSessions(list, now) {
  var _a, _b, _c, _d, _e;
  const groups = /* @__PURE__ */ new Map();
  for (const s of list) {
    if (isStale(s, now)) {
      continue;
    }
    const key = groupKey(s);
    const id = (0, import_ids.deviceObjectId)(key != null ? key : s.DeviceId);
    const members = groups.get(id);
    if (members) {
      members.push(s);
    } else {
      groups.set(id, [s]);
    }
  }
  const result = /* @__PURE__ */ new Map();
  for (const [id, members] of groups) {
    const control = (_c = (_b = (_a = members.find((s) => s.SupportsRemoteControl && s.NowPlayingItem)) != null ? _a : members.find((s) => s.SupportsRemoteControl)) != null ? _b : members.find((s) => s.NowPlayingItem)) != null ? _c : members[0];
    const media = control.NowPlayingItem ? control : (_d = members.find((s) => s.NowPlayingItem)) != null ? _d : control;
    const lastActivity = members.map((s) => s.LastActivityDate ? Date.parse(s.LastActivityDate) : NaN).filter((t) => !Number.isNaN(t)).reduce((a, b) => Math.max(a, b), NaN);
    const view = {
      ...control,
      DeviceName: displayName(control) || displayName(media),
      NowPlayingItem: (_e = media.NowPlayingItem) != null ? _e : null,
      PlayState: media.NowPlayingItem ? media.PlayState : control.PlayState,
      LastActivityDate: Number.isNaN(lastActivity) ? control.LastActivityDate : new Date(lastActivity).toISOString()
    };
    result.set(id, { id, view, members });
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STALE_SESSION_MS,
  displayName,
  groupKey,
  groupSessions,
  isStale
});
//# sourceMappingURL=devices.js.map
