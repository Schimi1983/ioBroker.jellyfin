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
var commands_exports = {};
__export(commands_exports, {
  parseGeneralCommand: () => parseGeneralCommand,
  parseMessage: () => parseMessage
});
module.exports = __toCommonJS(commands_exports);
function parseMessage(val) {
  var _a, _b, _c;
  let obj = null;
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) {
      return null;
    }
    if (t.startsWith("{")) {
      try {
        obj = JSON.parse(t);
      } catch {
        return { text: t };
      }
    } else {
      return { text: t };
    }
  } else if (val && typeof val === "object") {
    obj = val;
  }
  if (!obj) {
    return null;
  }
  const text = (_a = obj.text) != null ? _a : obj.Text;
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }
  const header = (_b = obj.header) != null ? _b : obj.Header;
  const timeout = Number((_c = obj.timeoutMs) != null ? _c : obj.TimeoutMs);
  return {
    text: text.trim(),
    header: typeof header === "string" && header.trim() ? header.trim() : void 0,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : void 0
  };
}
function parseGeneralCommand(val) {
  var _a;
  if (typeof val !== "string" || !val.trim()) {
    return null;
  }
  const t = val.trim();
  if (!t.startsWith("{")) {
    return /^[A-Za-z]+$/.test(t) ? { name: t } : null;
  }
  try {
    const obj = JSON.parse(t);
    if (typeof obj.Name !== "string" || !/^[A-Za-z]+$/.test(obj.Name)) {
      return null;
    }
    const args = {};
    for (const [k, v] of Object.entries((_a = obj.Arguments) != null ? _a : {})) {
      args[k] = String(v);
    }
    return { name: obj.Name, args };
  } catch {
    return null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseGeneralCommand,
  parseMessage
});
//# sourceMappingURL=commands.js.map
