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
var api_exports = {};
__export(api_exports, {
  JellyfinApi: () => JellyfinApi,
  JellyfinHttpError: () => JellyfinHttpError,
  normalizeBaseUrl: () => normalizeBaseUrl
});
module.exports = __toCommonJS(api_exports);
class JellyfinHttpError extends Error {
  /**
   * @param status - HTTP status code (0 = network error / timeout)
   * @param path - request path without query (never contains the API key)
   * @param message - error text
   */
  constructor(status, path, message) {
    super(message);
    this.status = status;
    this.path = path;
    this.name = "JellyfinHttpError";
  }
}
function normalizeBaseUrl(url) {
  let value = (url != null ? url : "").trim();
  if (!value) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    if (!/^https?:\/\//i.test(value)) {
      return null;
    }
  } else {
    value = `http://${value}`;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
class JellyfinApi {
  /** @param opts - connection settings */
  constructor(opts) {
    this.opts = opts;
    const esc = (v) => v.replace(/"/g, "");
    this.auth = `MediaBrowser Client="ioBroker", Device="ioBroker", DeviceId="${esc(opts.deviceId)}", Version="${esc(opts.version)}", Token="${esc(opts.apiKey)}"`;
  }
  auth;
  /** Base URL without trailing slash (also used for image URLs). */
  get baseUrl() {
    return this.opts.baseUrl;
  }
  // @KI_HINWEIS: Jellyfin 12 only accepts `ApiKey` (not the legacy `api_key`) in the query.
  /**
   * WebSocket URL. The key has to go into the query because Node's WebSocket cannot send headers.
   */
  get socketUrl() {
    const url = new URL(`${this.opts.baseUrl}/socket`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("ApiKey", this.opts.apiKey);
    url.searchParams.set("deviceId", this.opts.deviceId);
    return url.toString();
  }
  /**
   * Sends a request and returns the parsed JSON body (or `undefined` for empty answers like 204).
   *
   * @param method - HTTP method
   * @param path - path incl. query, starting with `/`
   * @param body - optional JSON body
   */
  async request(method, path, body) {
    var _a, _b;
    const headers = { Authorization: this.auth };
    if (body !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    const plainPath = path.split("?")[0];
    let res;
    try {
      res = await fetch(`${this.opts.baseUrl}${path}`, {
        method,
        headers,
        body: body === void 0 ? void 0 : JSON.stringify(body),
        signal: AbortSignal.timeout(this.opts.timeoutMs)
      });
    } catch (e) {
      const err = e;
      const reason = err.name === "TimeoutError" ? "timeout" : (_b = (_a = err.cause) == null ? void 0 : _a.code) != null ? _b : err.message;
      throw new JellyfinHttpError(0, plainPath, `${method} ${plainPath} failed: ${reason}`);
    }
    const text = await res.text();
    if (!res.ok) {
      throw new JellyfinHttpError(res.status, plainPath, `${method} ${plainPath} \u2192 HTTP ${res.status}`);
    }
    if (!text) {
      return void 0;
    }
    try {
      return JSON.parse(text);
    } catch {
      return void 0;
    }
  }
  /** GET /System/Info */
  async getSystemInfo() {
    var _a;
    return (_a = await this.request("GET", "/System/Info")) != null ? _a : {};
  }
  /** GET /Sessions (all sessions incl. inactive, our own session is filtered out) */
  async getSessions() {
    const list = await this.request("GET", "/Sessions");
    return Array.isArray(list) ? list.filter((s) => s.DeviceId !== this.opts.deviceId) : [];
  }
  /**
   * POST /Sessions/{id}/Playing/{command}
   *
   * @param sessionId - Jellyfin session id
   * @param command - playstate command
   * @param seekPositionTicks - only for `Seek`
   */
  async playstate(sessionId, command, seekPositionTicks) {
    const query = seekPositionTicks !== void 0 ? `?seekPositionTicks=${Math.round(seekPositionTicks)}` : "";
    await this.request("POST", `/Sessions/${encodeURIComponent(sessionId)}/Playing/${command}${query}`);
  }
  /**
   * POST /Sessions/{id}/Command – general command with optional arguments.
   *
   * @param sessionId - Jellyfin session id
   * @param name - GeneralCommandType, e.g. `SetVolume`
   * @param args - command arguments (all values as strings)
   */
  async generalCommand(sessionId, name, args) {
    await this.request("POST", `/Sessions/${encodeURIComponent(sessionId)}/Command`, {
      Name: name,
      Arguments: args != null ? args : {}
    });
  }
  /**
   * POST /Sessions/{id}/Command – SetRepeatMode
   *
   * @param sessionId - Jellyfin session id
   * @param mode - repeat mode
   */
  async setRepeatMode(sessionId, mode) {
    await this.generalCommand(sessionId, "SetRepeatMode", { RepeatMode: mode });
  }
  /**
   * POST /Sessions/{id}/Message
   *
   * @param sessionId - Jellyfin session id
   * @param text - message text
   * @param header - optional header
   * @param timeoutMs - optional display time (ignored by the Android TV app)
   */
  async sendMessage(sessionId, text, header, timeoutMs) {
    const body = { Header: header || "ioBroker", Text: text };
    if (timeoutMs && timeoutMs > 0) {
      body.TimeoutMs = Math.round(timeoutMs);
    }
    await this.request("POST", `/Sessions/${encodeURIComponent(sessionId)}/Message`, body);
  }
  /**
   * Searches a playable item by name (movies, series, episodes, music, videos).
   * A series is played by Jellyfin from its first episode.
   *
   * @param term - search text
   * @param userId - user of the session (library permissions of this user apply)
   * @returns best match or `undefined`
   */
  async findItem(term, userId) {
    var _a, _b;
    const q = new URLSearchParams({
      searchTerm: term,
      includeItemTypes: "Movie,Series,Episode,Audio,MusicAlbum,MusicVideo,Video",
      recursive: "true",
      limit: "10"
    });
    if (userId) {
      q.set("userId", userId);
    }
    const res = await this.request("GET", `/Items?${q.toString()}`);
    const items = (_a = res == null ? void 0 : res.Items) != null ? _a : [];
    const lower = term.toLowerCase();
    return (_b = items.find((i) => {
      var _a2;
      return ((_a2 = i.Name) != null ? _a2 : "").toLowerCase() === lower;
    })) != null ? _b : items[0];
  }
  /**
   * POST /Sessions/{id}/Playing – starts playback of items on a client ("PlayNow").
   *
   * @param sessionId - Jellyfin session id
   * @param itemIds - ids of the items to play
   */
  async playNow(sessionId, itemIds) {
    const q = new URLSearchParams({ playCommand: "PlayNow", itemIds: itemIds.join(",") });
    await this.request("POST", `/Sessions/${encodeURIComponent(sessionId)}/Playing?${q.toString()}`);
  }
  /** POST /Library/Refresh – starts a library scan (returns immediately). */
  async refreshLibrary() {
    await this.request("POST", "/Library/Refresh");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JellyfinApi,
  JellyfinHttpError,
  normalizeBaseUrl
});
//# sourceMappingURL=api.js.map
