const LOG_PREFIX = "[PERF]";

type LogLevel = "log" | "warn" | "error" | "info";
type LogData = string | number | boolean | object | null | undefined;

// Maximum entries to keep before auto-cleanup
const MAX_ENTRIES = 100;

const perfLogger = {
  enabled: true,
  logLevel: "log" as LogLevel,
  renderCounts: new Map<string, number>(),
  timestamps: new Map<string, number>(),

  shouldLog(_level: LogLevel): boolean {
    if (!this.enabled) {
      return false;
    }
    return true;
  },

  formatMessage(...args: LogData[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      })
      .join(" ");
  },

  log(level: LogLevel, ...args: LogData[]) {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = performance.now().toFixed(2);
    const message = `${LOG_PREFIX} [${timestamp}ms] ${this.formatMessage(...args)}`;

    switch (level) {
      case "error":
        console.error(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "info":
        console.info(message);
        break;
      default:
        console.log(message);
    }
  },

  // Auto-cleanup when maps get too large to prevent memory accumulation
  autoCleanup() {
    if (this.renderCounts.size > MAX_ENTRIES) {
      const entries = Array.from(this.renderCounts.entries());
      const toKeep = entries.slice(-MAX_ENTRIES / 2);
      this.renderCounts = new Map(toKeep);
    }
    if (this.timestamps.size > MAX_ENTRIES) {
      const entries = Array.from(this.timestamps.entries());
      const toKeep = entries.slice(-MAX_ENTRIES / 2);
      this.timestamps = new Map(toKeep);
    }
  },

  componentRender(componentName: string, props?: LogData) {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    const lastTimestamp = this.timestamps.get(componentName);
    const currentTimestamp = performance.now();
    const timeSinceLastRender = lastTimestamp
      ? (currentTimestamp - lastTimestamp).toFixed(2)
      : "N/A";

    this.timestamps.set(componentName, currentTimestamp);

    this.log(
      "log",
      `RENDER ${componentName} #${count}`,
      timeSinceLastRender !== "N/A"
        ? `(${timeSinceLastRender}ms since last)`
        : "",
      props ? "props:" : "",
      props
    );

    // Periodically cleanup to prevent memory growth
    this.autoCleanup();
  },

  hookInit(hookName: string, config?: LogData) {
    this.log("log", `HOOK INIT ${hookName}`, config ? "config:" : "", config);
  },

  hookCleanup(hookName: string) {
    this.log("log", `HOOK CLEANUP ${hookName}`);
  },

  storeUpdate(storeName: string, action: string, data?: LogData) {
    this.log(
      "log",
      `STORE UPDATE ${storeName} ${action}`,
      data ? "data:" : "",
      data
    );
  },

  storeSubscribe(storeName: string, selector: string) {
    this.log("log", `STORE SUBSCRIBE ${storeName} selector: ${selector}`);
  },

  effect(componentName: string, effectId: number, deps?: LogData[]) {
    this.log(
      "log",
      `EFFECT RUN ${componentName} effect#${effectId}`,
      deps ? `deps count: ${deps.length}` : "no deps"
    );
  },

  effectCleanup(componentName: string, effectId: number) {
    this.log("log", `EFFECT CLEANUP ${componentName} effect#${effectId}`);
  },

  event(eventName: string, data?: LogData) {
    this.log("info", `EVENT ${eventName}`, data ? "data:" : "", data);
  },

  websocket(event: string, data?: LogData) {
    this.log("info", `WEBSOCKET ${event}`, data ? "data:" : "", data);
  },

  gestureLoop(frameCount: number, processingTime: number) {
    this.log(
      "log",
      `GESTURE LOOP frame#${frameCount}`,
      `processing: ${processingTime.toFixed(2)}ms`
    );
  },

  renderStats() {
    console.group(`${LOG_PREFIX} RENDER STATISTICS`);
    for (const [component, count] of this.renderCounts.entries()) {
      console.log(`${component}: ${count} renders`);
    }
    console.groupEnd();
  },

  reset() {
    this.renderCounts.clear();
    this.timestamps.clear();
    this.log("log", "LOGGER RESET");
  },
};

export default perfLogger;
