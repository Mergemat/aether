interface WebSocketEventHandlers {
  onClose?: () => void;
  onOpen?: () => void;
}

const RECONNECT_INTERVAL = 1000;

/**
 * Binary-only WebSocket that keeps reconnecting until destroyed, so the
 * bridge can start before or after the dashboard.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly eventHandlers: WebSocketEventHandlers;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Widened explicitly: Biome otherwise infers the literal `false` and flags
  // every later check as always falsy, missing the write in destroy
  // biome-ignore lint/style/noInferrableTypes: see above
  private isDestroyed: boolean = false;

  constructor(url: string, eventHandlers: WebSocketEventHandlers = {}) {
    this.url = url;
    this.eventHandlers = eventHandlers;
  }

  connect() {
    if (this.isDestroyed) {
      return;
    }

    const ws = new WebSocket(this.url);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => this.eventHandlers.onOpen?.();
    ws.onclose = () => {
      this.ws = null;
      this.eventHandlers.onClose?.();
      this.scheduleReconnect();
    };
    this.ws = ws;
  }

  /** Completely destroy the client. After calling this, it cannot be reused. */
  destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  /** The bytes are copied before returning, so callers may reuse the buffer */
  send(data: Uint8Array<ArrayBuffer>) {
    if (this.isConnected()) {
      this.ws?.send(data);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    if (this.isDestroyed) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_INTERVAL);
  }
}
