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
var playlists_exports = {};
__export(playlists_exports, {
  findPlaylist: () => findPlaylist,
  mergePlaylists: () => mergePlaylists,
  playlistStates: () => playlistStates
});
module.exports = __toCommonJS(playlists_exports);
function mergePlaylists(lists) {
  var _a;
  const byId = /* @__PURE__ */ new Map();
  for (const list of lists) {
    for (const item of list) {
      if (!(item == null ? void 0 : item.Id) || byId.has(item.Id)) {
        continue;
      }
      byId.set(item.Id, {
        id: item.Id,
        name: ((_a = item.Name) != null ? _a : "").trim() || item.Id,
        ...typeof item.ChildCount === "number" ? { count: item.ChildCount } : {}
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }));
}
function playlistStates(list) {
  const states = {};
  for (const p of list) {
    if (!(p.name in states)) {
      states[p.name] = p.name;
    }
  }
  return states;
}
function findPlaylist(list, term) {
  var _a;
  const t = term.trim().toLowerCase();
  if (!t) {
    return void 0;
  }
  return (_a = list.find((p) => p.id.toLowerCase() === t)) != null ? _a : list.find((p) => p.name.toLowerCase() === t);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findPlaylist,
  mergePlaylists,
  playlistStates
});
//# sourceMappingURL=playlists.js.map
