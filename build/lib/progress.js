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
var progress_exports = {};
__export(progress_exports, {
  elapsedAt: () => elapsedAt,
  progressValues: () => progressValues,
  updateProgress: () => updateProgress
});
module.exports = __toCommonJS(progress_exports);
var import_session = require("./session");
function updateProgress(prev, s, now) {
  var _a, _b, _c;
  const item = s.NowPlayingItem;
  if (!item) {
    return void 0;
  }
  const ps = (_a = s.PlayState) != null ? _a : {};
  const itemId = (_b = item.Id) != null ? _b : "";
  const rawTicks = (_c = ps.PositionTicks) != null ? _c : 0;
  const running = ps.IsPaused !== true;
  const durationSec = item.RunTimeTicks ? item.RunTimeTicks / import_session.TICKS_PER_SECOND : 0;
  if (prev && prev.itemId === itemId && prev.rawTicks === rawTicks) {
    if (prev.running === running) {
      return { ...prev, durationSec };
    }
    return { ...prev, baseSec: elapsedAt(prev, now), at: now, durationSec, running };
  }
  return { itemId, rawTicks, baseSec: rawTicks / import_session.TICKS_PER_SECOND, at: now, durationSec, running };
}
function elapsedAt(p, now) {
  const sec = p.running ? p.baseSec + Math.max(0, now - p.at) / 1e3 : p.baseSec;
  return p.durationSec > 0 ? Math.min(sec, p.durationSec) : sec;
}
function progressValues(p, now) {
  const elapsed = Math.round(elapsedAt(p, now));
  const duration = Math.round(p.durationSec);
  return {
    "media.elapsed": elapsed,
    "media.seek": duration > 0 ? Math.min(100, Math.round(elapsed / duration * 1e3) / 10) : 0
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  elapsedAt,
  progressValues,
  updateProgress
});
//# sourceMappingURL=progress.js.map
