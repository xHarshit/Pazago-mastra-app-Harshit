// src/logger/constants.ts
var RegisteredLogger = {
  AGENT: "AGENT",
  WORKFLOW: "WORKFLOW",
  LLM: "LLM"};
var LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error"};

// src/logger/logger.ts
var MastraLogger = class {
  name;
  level;
  transports;
  constructor(options = {}) {
    this.name = options.name || "Mastra";
    this.level = options.level || LogLevel.ERROR;
    this.transports = new Map(Object.entries(options.transports || {}));
  }
  getTransports() {
    return this.transports;
  }
  trackException(_error) {
  }
  async getLogs(transportId, params) {
    if (!transportId || !this.transports.has(transportId)) {
      return { logs: [], total: 0, page: params?.page ?? 1, perPage: params?.perPage ?? 100, hasMore: false };
    }
    return this.transports.get(transportId).getLogs(params) ?? {
      logs: [],
      total: 0,
      page: params?.page ?? 1,
      perPage: params?.perPage ?? 100,
      hasMore: false
    };
  }
  async getLogsByRunId({
    transportId,
    runId,
    fromDate,
    toDate,
    logLevel,
    filters,
    page,
    perPage
  }) {
    if (!transportId || !this.transports.has(transportId) || !runId) {
      return { logs: [], total: 0, page: page ?? 1, perPage: perPage ?? 100, hasMore: false };
    }
    return this.transports.get(transportId).getLogsByRunId({ runId, fromDate, toDate, logLevel, filters, page, perPage }) ?? {
      logs: [],
      total: 0,
      page: page ?? 1,
      perPage: perPage ?? 100,
      hasMore: false
    };
  }
};
var ConsoleLogger = class extends MastraLogger {
  constructor(options = {}) {
    super(options);
  }
  debug(message, ...args) {
    if (this.level === LogLevel.DEBUG) {
      console.debug(message, ...args);
    }
  }
  info(message, ...args) {
    if (this.level === LogLevel.INFO || this.level === LogLevel.DEBUG) {
      console.info(message, ...args);
    }
  }
  warn(message, ...args) {
    if (this.level === LogLevel.WARN || this.level === LogLevel.INFO || this.level === LogLevel.DEBUG) {
      console.warn(message, ...args);
    }
  }
  error(message, ...args) {
    if (this.level === LogLevel.ERROR || this.level === LogLevel.WARN || this.level === LogLevel.INFO || this.level === LogLevel.DEBUG) {
      console.error(message, ...args);
    }
  }
  async getLogs(_transportId, _params) {
    return { logs: [], total: 0, page: _params?.page ?? 1, perPage: _params?.perPage ?? 100, hasMore: false };
  }
  async getLogsByRunId(_args) {
    return { logs: [], total: 0, page: _args.page ?? 1, perPage: _args.perPage ?? 100, hasMore: false };
  }
};

export { ConsoleLogger as C, LogLevel as L, MastraLogger as M, RegisteredLogger as R };
