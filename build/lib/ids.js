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
var ids_exports = {};
__export(ids_exports, {
  deviceObjectId: () => deviceObjectId
});
module.exports = __toCommonJS(ids_exports);
var import_node_crypto = require("node:crypto");
function deviceObjectId(deviceId) {
  if (/^[a-z0-9_-]{1,40}$/.test(deviceId)) {
    return deviceId;
  }
  return (0, import_node_crypto.createHash)("sha1").update(deviceId).digest("hex").slice(0, 16);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deviceObjectId
});
//# sourceMappingURL=ids.js.map
