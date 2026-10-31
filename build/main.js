"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_api = require("./lib/api");
var import_ids = require("./lib/ids");
var import_objects = require("./lib/objects");
var import_commands = require("./lib/commands");
var import_session = require("./lib/session");
const OWN_DEVICE_PREFIX = "ioBroker-";
const MIN_SERVER_MAJOR = 12;
const RECONNECT_MIN_MS = 5e3;
const RECONNECT_MAX_MS = 6e4;
const SERVER_INFO_INTERVAL_MS = 10 * 6e4;
const PLAYSTATE_BUTTONS = {
  "command.play": "Unpause",
  "command.pause": "Pause",
  "command.playPause": "PlayPause",
  "command.stop": "Stop",
  "command.next": "NextTrack",
  "command.previous": "PreviousTrack",
  "command.forward": "FastForward",
  "command.rewind": "Rewind"
};
const GENERAL_BUTTONS = {
  "command.volumeUp": "VolumeUp",
  "command.volumeDown": "VolumeDown",
  "command.toggleMute": "ToggleMute"
};
class Jellyfin extends utils.Adapter {
  api = null;
  socket = null;
  keepAliveTimer;
  reconnectTimer;
  serverInfoTimer;
  reconnectDelay = RECONNECT_MIN_MS;
  stopping = false;
  connectedOnce = false;
  lastConnectError = "";
  sessionIntervalMs = 5e3;
  coverHeight = 300;
  onlyRemote = false;
  /** Id of the Jellyfin server (from /System/Info) */
  serverId = "";
  /** Current session per device object id. */
  sessions = /* @__PURE__ */ new Map();
  /** Devices whose objects exist (from the database or created in this run). */
  knownDevices = /* @__PURE__ */ new Set();
  /** Devices whose objects were created/updated in this run, value = device name written. */
  preparedDevices = /* @__PURE__ */ new Map();
  /** Devices currently marked as not connected (avoids rewriting the offline values every push). */
  offlineDevices = /* @__PURE__ */ new Set();
  /** Last written value per state id (relative), we are the only writer of ack values. */
  valueCache = /* @__PURE__ */ new Map();
  /** Sessions waiting for processing (only the latest push is kept). */
  pendingSessions = null;
  processing = false;
  constructor(options = {}) {
    super({ ...options, name: "jellyfin" });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /** Own device id; our WebSocket connection shows up as a session with this id and is filtered out. */
  get ownDeviceId() {
    return `ioBroker-${this.namespace}`;
  }
  async onReady() {
    var _a, _b, _c;
    await this.setState("info.connection", false, true);
    const baseUrl = (0, import_api.normalizeBaseUrl)(this.config.url);
    if (!baseUrl) {
      this.log.error("Please enter the address of your Jellyfin server in the instance settings.");
      return;
    }
    const apiKey = ((_a = this.config.apiKey) != null ? _a : "").trim();
    if (!apiKey) {
      this.log.error("Please enter an API key in the instance settings (Jellyfin dashboard \u2192 API keys).");
      return;
    }
    this.sessionIntervalMs = clamp(Number(this.config.updateInterval) || 5, 2, 60) * 1e3;
    this.coverHeight = clamp(Number((_b = this.config.coverHeight) != null ? _b : 300), 0, 2e3);
    this.onlyRemote = this.config.onlyRemoteControllable === true;
    this.api = new import_api.JellyfinApi({
      baseUrl,
      apiKey,
      deviceId: this.ownDeviceId,
      version: (_c = this.version) != null ? _c : "0.0.0",
      timeoutMs: clamp(Number(this.config.requestTimeout) || 10, 2, 60) * 1e3
    });
    await this.createServerObjects();
    for (const dev of await this.getDevicesAsync()) {
      this.knownDevices.add(dev._id.slice(this.namespace.length + 1));
    }
    for (const pattern of ["*.command.*", "*.media.seek", "*.media.volume", "*.media.mute", "*.media.repeat"]) {
      this.subscribeStates(pattern);
    }
    this.subscribeStates("server.refreshLibrary");
    this.serverInfoTimer = this.setInterval(() => void this.refreshServerInfo(false), SERVER_INFO_INTERVAL_MS);
    await this.connect();
  }
  // ---------------------------------------------------------------- connection
  /** Checks the server via REST, loads the sessions once and opens the WebSocket. */
  async connect() {
    this.reconnectTimer = void 0;
    if (this.stopping || !this.api) {
      return;
    }
    if (!await this.refreshServerInfo(true)) {
      this.scheduleReconnect();
      return;
    }
    try {
      this.queueSessions(await this.api.getSessions());
    } catch (e) {
      this.log.debug(`Initial session list failed: ${e.message}`);
    }
    this.openSocket();
  }
  /**
   * Reads /System/Info and writes the server states.
   *
   * @param logErrors - log connection errors (only the first occurrence of each error)
   * @returns true if the server answered
   */
  async refreshServerInfo(logErrors) {
    var _a, _b, _c, _d;
    if (!this.api) {
      return false;
    }
    let info;
    try {
      info = await this.api.getSystemInfo();
    } catch (e) {
      if (logErrors) {
        this.logConnectError(e);
      }
      return false;
    }
    this.serverId = (_a = info.Id) != null ? _a : this.serverId;
    await this.writeValue("server.name", (_b = info.ServerName) != null ? _b : "");
    await this.writeValue("server.version", (_c = info.Version) != null ? _c : "");
    await this.writeValue("server.updateAvailable", info.HasUpdateAvailable === true);
    await this.writeValue("server.restartPending", info.HasPendingRestart === true);
    const major = parseInt((_d = info.Version) != null ? _d : "", 10);
    if (logErrors && !Number.isNaN(major) && major < MIN_SERVER_MAJOR) {
      this.log.warn(
        `Jellyfin ${info.Version} is not supported. Please update the server to version ${MIN_SERVER_MAJOR} or newer.`
      );
    }
    return true;
  }
  /**
   * Logs a connection error once (repeated identical errors only on debug level).
   *
   * @param e - error
   */
  logConnectError(e) {
    let text;
    if (e instanceof import_api.JellyfinHttpError && (e.status === 401 || e.status === 403)) {
      text = "The Jellyfin server rejected the API key. Please check the key in the instance settings.";
    } else if (e instanceof import_api.JellyfinHttpError && e.status === 404) {
      text = "Jellyfin was not found at this address. Please check the server address (incl. port and base path).";
    } else {
      text = `Cannot reach the Jellyfin server: ${e.message}`;
    }
    if (text !== this.lastConnectError) {
      this.lastConnectError = text;
      this.log.error(text);
    } else {
      this.log.debug(text);
    }
  }
  /** Opens the WebSocket. Reconnects are scheduled from the close handler only. */
  openSocket() {
    if (!this.api || this.stopping) {
      return;
    }
    let ws;
    try {
      ws = new WebSocket(this.api.socketUrl);
    } catch (e) {
      this.logConnectError(e);
      this.scheduleReconnect();
      return;
    }
    this.socket = ws;
    ws.onopen = () => {
      var _a;
      this.reconnectDelay = RECONNECT_MIN_MS;
      this.lastConnectError = "";
      ws.send(JSON.stringify({ MessageType: "SessionsStart", Data: `0,${this.sessionIntervalMs}` }));
      void this.setState("info.connection", true, true);
      if (!this.connectedOnce) {
        this.log.info(`Connected to Jellyfin at ${(_a = this.api) == null ? void 0 : _a.baseUrl}`);
        this.connectedOnce = true;
      } else {
        this.log.info("Connection to Jellyfin restored");
      }
    };
    ws.onmessage = (ev) => this.onSocketMessage(ev.data);
    ws.onerror = () => {
      this.log.debug("WebSocket error");
    };
    ws.onclose = (ev) => {
      if (this.socket !== ws) {
        return;
      }
      this.socket = null;
      this.stopKeepAlive();
      void this.setState("info.connection", false, true);
      if (this.stopping) {
        return;
      }
      this.log.info(`Connection to Jellyfin closed (code ${ev.code}), reconnecting \u2026`);
      this.markAllOffline();
      this.scheduleReconnect();
    };
  }
  scheduleReconnect() {
    if (this.stopping || this.reconnectTimer) {
      return;
    }
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(delay * 2, RECONNECT_MAX_MS);
    this.reconnectTimer = this.setTimeout(() => void this.connect(), delay);
  }
  /**
   * Handles one WebSocket message.
   *
   * @param raw - message text
   */
  onSocketMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      this.log.debug("Ignoring invalid WebSocket message");
      return;
    }
    switch (msg == null ? void 0 : msg.MessageType) {
      case "ForceKeepAlive":
        this.startKeepAlive(Number(msg.Data) || 60);
        break;
      case "KeepAlive":
        break;
      case "Sessions":
        if (Array.isArray(msg.Data)) {
          this.queueSessions(msg.Data);
        }
        break;
      case "RestartRequired":
        void this.refreshServerInfo(false);
        break;
      case "ServerRestarting":
      case "ServerShuttingDown":
        this.log.info(`Jellyfin server: ${msg.MessageType}`);
        break;
      default:
        this.log.silly(`Unhandled WebSocket message ${msg == null ? void 0 : msg.MessageType}`);
    }
  }
  /**
   * The server asks for a KeepAlive within `seconds`; we answer at half the interval.
   *
   * @param seconds - timeout announced by the server
   */
  startKeepAlive(seconds) {
    this.stopKeepAlive();
    this.sendSocket({ MessageType: "KeepAlive" });
    this.keepAliveTimer = this.setInterval(
      () => this.sendSocket({ MessageType: "KeepAlive" }),
      Math.max(5, seconds / 2) * 1e3
    );
  }
  stopKeepAlive() {
    if (this.keepAliveTimer) {
      this.clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = void 0;
    }
  }
  /**
   * Sends a message if the socket is open.
   *
   * @param msg - message
   */
  sendSocket(msg) {
    var _a;
    if (((_a = this.socket) == null ? void 0 : _a.readyState) === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }
  // ---------------------------------------------------------------- sessions
  /**
   * Queues a session list; while one list is processed only the newest one is kept.
   *
   * @param list - sessions from REST or WebSocket
   */
  queueSessions(list) {
    this.pendingSessions = list;
    if (!this.processing) {
      void this.processSessions();
    }
  }
  async processSessions() {
    this.processing = true;
    try {
      while (this.pendingSessions && !this.stopping) {
        const list = this.pendingSessions;
        this.pendingSessions = null;
        await this.handleSessions(list);
      }
    } catch (e) {
      this.log.warn(`Processing sessions failed: ${e.message}`);
    } finally {
      this.processing = false;
    }
  }
  /**
   * Writes all sessions to their device objects and marks missing devices as not connected.
   *
   * @param list - sessions
   */
  async handleSessions(list) {
    var _a, _b;
    const current = /* @__PURE__ */ new Map();
    for (const s of list) {
      if (!(s == null ? void 0 : s.DeviceId) || !s.Id || s.DeviceId.startsWith(OWN_DEVICE_PREFIX) || this.serverId !== "" && s.DeviceId === this.serverId) {
        continue;
      }
      const id = (0, import_ids.deviceObjectId)(s.DeviceId);
      if (this.onlyRemote && s.SupportsRemoteControl !== true && !this.knownDevices.has(id)) {
        continue;
      }
      const prev = current.get(id);
      if (!prev || rank(s) > rank(prev)) {
        current.set(id, s);
      }
    }
    const opts = { baseUrl: (_b = (_a = this.api) == null ? void 0 : _a.baseUrl) != null ? _b : "", coverHeight: this.coverHeight };
    let playing = 0;
    for (const [id, s] of current) {
      await this.prepareDevice(id, s);
      this.offlineDevices.delete(id);
      if (s.NowPlayingItem) {
        playing++;
      }
      for (const [key, val] of Object.entries((0, import_session.sessionValues)(s, opts))) {
        await this.writeValue(`${id}.${key}`, val);
      }
    }
    this.sessions = current;
    for (const id of this.knownDevices) {
      if (!current.has(id)) {
        await this.markOffline(id);
      }
    }
    await this.writeValue("server.activeDevices", current.size);
    await this.writeValue("server.playingDevices", playing);
  }
  /**
   * Creates or updates the objects of a device once per adapter run (and when its name changes).
   *
   * @param id - device object id
   * @param s - session
   */
  async prepareDevice(id, s) {
    const name = [s.DeviceName, s.Client].filter(Boolean).join(" \u2013 ") || s.DeviceId;
    if (this.preparedDevices.get(id) === name) {
      return;
    }
    await this.extendObject(id, {
      type: "device",
      common: { name, statusStates: { onlineId: `${this.namespace}.${id}.info.reachable` } },
      native: { deviceId: s.DeviceId }
    });
    if (!this.preparedDevices.has(id)) {
      for (const [ch, chName] of Object.entries(import_objects.DEVICE_CHANNELS)) {
        await this.extendObject(`${id}.${ch}`, { type: "channel", common: { name: chName }, native: {} });
      }
      for (const def of import_objects.DEVICE_STATES) {
        await this.extendObject(`${id}.${def.id}`, { type: "state", common: (0, import_objects.toCommon)(def), native: {} });
      }
      if (!this.knownDevices.has(id)) {
        this.log.info(`New Jellyfin device: ${name}`);
      }
    }
    this.knownDevices.add(id);
    this.preparedDevices.set(id, name);
  }
  /**
   * Marks a device as not connected (once).
   *
   * @param id - device object id
   */
  async markOffline(id) {
    if (this.offlineDevices.has(id)) {
      return;
    }
    this.offlineDevices.add(id);
    await this.writeValue(`${id}.info.reachable`, false);
    await this.writeValue(`${id}.info.remoteControl`, false);
    await this.writeValue(`${id}.media.state`, "stop");
  }
  /** Marks all devices as not connected (connection to the server lost). */
  markAllOffline() {
    this.sessions.clear();
    void (async () => {
      for (const id of this.knownDevices) {
        await this.markOffline(id);
      }
    })();
  }
  // @KI_HINWEIS: Jellyfin pushes the full session list every few seconds even without changes; the cache avoids
  //     a database read (setStateChanged) for every unchanged state.
  /**
   * Writes an acknowledged value if it differs from the last written one.
   *
   * @param id - state id relative to the namespace
   * @param val - value
   */
  async writeValue(id, val) {
    if (this.valueCache.has(id) && this.valueCache.get(id) === val) {
      return;
    }
    this.valueCache.set(id, val);
    await this.setState(id, val, true);
  }
  /** Creates the `server` channel. */
  async createServerObjects() {
    await this.extendObject("server", { type: "channel", common: { name: "Jellyfin server" }, native: {} });
    for (const def of import_objects.SERVER_STATES) {
      await this.extendObject(def.id, { type: "state", common: (0, import_objects.toCommon)(def), native: {} });
    }
  }
  /** Reloads the sessions via REST (e.g. after a command hit a session that no longer exists). */
  async reloadSessions() {
    try {
      if (this.api) {
        this.queueSessions(await this.api.getSessions());
      }
    } catch (e) {
      this.log.debug(`Reloading sessions failed: ${e.message}`);
    }
  }
  // ---------------------------------------------------------------- commands
  async onStateChange(fullId, state) {
    var _a;
    const api = this.api;
    if (!state || state.ack || !api) {
      return;
    }
    const id = fullId.slice(this.namespace.length + 1);
    if (id === "server.refreshLibrary") {
      await this.run(id, "library scan", () => api.refreshLibrary(), state.val);
      return;
    }
    const dot = id.indexOf(".");
    if (dot < 0) {
      return;
    }
    const device = id.slice(0, dot);
    const key = id.slice(dot + 1);
    const s = this.sessions.get(device);
    if (key in PLAYSTATE_BUTTONS) {
      const cmd = PLAYSTATE_BUTTONS[key];
      if (this.allowed(device, s, cmd, { type: "playstate" })) {
        await this.run(id, cmd, () => api.playstate(s.Id, cmd), true);
      }
      return;
    }
    if (key in GENERAL_BUTTONS) {
      const cmd = GENERAL_BUTTONS[key];
      if (this.allowed(device, s, cmd, { type: "general", name: cmd })) {
        await this.run(id, cmd, () => api.generalCommand(s.Id, cmd), true);
      }
      return;
    }
    switch (key) {
      case "media.seek": {
        const pct = Number(state.val);
        const ticks = (_a = s == null ? void 0 : s.NowPlayingItem) == null ? void 0 : _a.RunTimeTicks;
        if (!Number.isFinite(pct) || !ticks) {
          this.log.warn(
            `${this.deviceName(device, s)}: cannot jump, nothing with a known duration is playing`
          );
          return;
        }
        if (this.allowed(device, s, "Seek", { type: "playstate" })) {
          const target = clamp(pct, 0, 100) / 100 * ticks;
          await this.run(id, "Seek", () => api.playstate(s.Id, "Seek", target), void 0);
          this.valueCache.delete(id);
        }
        return;
      }
      case "media.volume": {
        const vol = Math.round(clamp(Number(state.val), 0, 100));
        if (this.allowed(device, s, "SetVolume", { type: "general", name: "SetVolume" })) {
          await this.runAudio(
            id,
            s,
            "SetVolume",
            vol,
            () => api.generalCommand(s.Id, "SetVolume", { Volume: String(vol) })
          );
        }
        return;
      }
      case "media.mute": {
        const mute = state.val === true || state.val === "true" || state.val === 1;
        const cmd = mute ? "Mute" : "Unmute";
        if (this.allowed(device, s, cmd, { type: "general", name: cmd })) {
          await this.runAudio(id, s, cmd, mute, () => api.generalCommand(s.Id, cmd));
        }
        return;
      }
      case "media.repeat": {
        const mode = String(state.val);
        if (!(mode in import_objects.REPEAT_STATES)) {
          this.log.warn(`Invalid repeat mode "${mode}", allowed: ${Object.keys(import_objects.REPEAT_STATES).join(", ")}`);
          return;
        }
        if (this.allowed(device, s, "SetRepeatMode", { type: "general", name: "SetRepeatMode" })) {
          await this.run(id, "SetRepeatMode", () => api.setRepeatMode(s.Id, mode), void 0);
          this.valueCache.delete(id);
        }
        return;
      }
      case "command.message": {
        const msg = (0, import_commands.parseMessage)(state.val);
        if (!msg) {
          return;
        }
        if (this.allowed(device, s, "DisplayMessage", { type: "general", name: "DisplayMessage" })) {
          await this.run(
            id,
            "DisplayMessage",
            () => api.sendMessage(s.Id, msg.text, msg.header, msg.timeoutMs),
            state.val
          );
        }
        return;
      }
      case "command.generalCommand": {
        const cmd = (0, import_commands.parseGeneralCommand)(state.val);
        if (!cmd) {
          this.log.warn(`${this.deviceName(device, s)}: invalid command "${String(state.val)}"`);
          return;
        }
        if (this.allowed(device, s, cmd.name, { type: "general", name: cmd.name })) {
          await this.run(id, cmd.name, () => api.generalCommand(s.Id, cmd.name, cmd.args), state.val);
        }
        return;
      }
      default:
        return;
    }
  }
  /**
   * Checks a command and logs why it is not sent.
   *
   * @param device - device object id
   * @param s - current session
   * @param label - command name for the log
   * @param kind - command kind
   */
  allowed(device, s, label, kind) {
    const reason = (0, import_session.checkCommand)(s, kind);
    if (reason) {
      this.log.warn(`${this.deviceName(device, s)}: ${label} not sent \u2013 ${reason}`);
      return false;
    }
    return true;
  }
  /**
   * Sends a command; on success the state is acknowledged with `ackValue` (undefined = wait for the report).
   *
   * @param id - state id relative to the namespace
   * @param label - command name for the log
   * @param fn - request
   * @param ackValue - value to acknowledge
   */
  async run(id, label, fn, ackValue) {
    try {
      await fn();
    } catch (e) {
      if (e instanceof import_api.JellyfinHttpError && e.status === 404) {
        this.log.warn(`${label}: the device is no longer connected to the server`);
        await this.reloadSessions();
      } else if (e instanceof import_api.JellyfinHttpError && e.status === 400) {
        this.log.warn(`${label}: rejected by the server (unknown command or invalid value)`);
      } else {
        this.log.warn(`${label} failed: ${e.message}`);
      }
      return false;
    }
    this.log.debug(`${label} sent (${id})`);
    if (ackValue !== void 0) {
      await this.setState(id, ackValue, true);
    }
    return true;
  }
  /**
   * Volume/mute: clients that report their audio status confirm the value with the next session report,
   * all others (Android TV app) get the commanded value acknowledged directly.
   *
   * @param id - state id relative to the namespace
   * @param s - session
   * @param label - command name for the log
   * @param value - commanded value
   * @param fn - request
   */
  async runAudio(id, s, label, value, fn) {
    const reported = (0, import_session.reportsAudio)(s);
    if (await this.run(id, label, fn, reported ? void 0 : value)) {
      if (reported) {
        this.valueCache.delete(id);
      } else {
        this.valueCache.set(id, value);
      }
    }
  }
  /**
   * Readable device name for log messages.
   *
   * @param device - device object id
   * @param s - session
   */
  deviceName(device, s) {
    return (s == null ? void 0 : s.DeviceName) || this.preparedDevices.get(device) || device;
  }
  // ---------------------------------------------------------------- sendTo
  /**
   * `sendTo('jellyfin.0', 'message', { text, header?, timeoutMs?, device? })`
   * – shows a message on one device (object id or name) or on all devices that support messages.
   *
   * @param obj - message
   */
  async onMessage(obj) {
    var _a, _b;
    if (!obj || obj.command !== "message") {
      return;
    }
    const payload = typeof obj.message === "string" ? { text: obj.message } : obj.message;
    const msg = (0, import_commands.parseMessage)(payload);
    let sent = 0;
    const errors = [];
    if (!msg || !this.api) {
      errors.push(!msg ? "text is missing" : "adapter is not connected");
    } else {
      const filter = typeof (payload == null ? void 0 : payload.device) === "string" ? payload.device.trim().toLowerCase() : "";
      for (const [id, s] of this.sessions) {
        const match = !filter || id.toLowerCase() === filter || ((_a = s.DeviceName) != null ? _a : "").toLowerCase().includes(filter) || ((_b = this.preparedDevices.get(id)) != null ? _b : "").toLowerCase().includes(filter);
        if (!match || (0, import_session.checkCommand)(s, { type: "general", name: "DisplayMessage" })) {
          continue;
        }
        try {
          await this.api.sendMessage(s.Id, msg.text, msg.header, msg.timeoutMs);
          sent++;
        } catch (e) {
          errors.push(`${this.deviceName(id, s)}: ${e.message}`);
        }
      }
      if (!sent && !errors.length) {
        errors.push("no connected device accepts messages");
      }
    }
    if (errors.length) {
      this.log.warn(`sendTo message: ${errors.join("; ")}`);
    }
    if (obj.callback) {
      this.sendTo(obj.from, obj.command, { sent, errors }, obj.callback);
    }
  }
  // ---------------------------------------------------------------- unload
  onUnload(callback) {
    try {
      this.stopping = true;
      this.stopKeepAlive();
      if (this.reconnectTimer) {
        this.clearTimeout(this.reconnectTimer);
      }
      if (this.serverInfoTimer) {
        this.clearInterval(this.serverInfoTimer);
      }
      if (this.socket) {
        this.sendSocket({ MessageType: "SessionsStop" });
        this.socket.close();
        this.socket = null;
      }
      void this.setState("info.connection", false, true);
    } finally {
      callback();
    }
  }
}
function clamp(v, min, max) {
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
}
function rank(s) {
  return (s.NowPlayingItem ? 2 : 0) + (s.SupportsRemoteControl ? 1 : 0);
}
if (require.main !== module) {
  module.exports = (options) => new Jellyfin(options);
} else {
  (() => new Jellyfin())();
}
//# sourceMappingURL=main.js.map
