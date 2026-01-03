interface WebSocketMessage {
  data: unknown;
}

interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (data: WebSocketMessage) => void;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface OscMessage {
  address: string;
  value: number;
}

// Pre-allocated buffer for encoding (max 256 byte address + 4 byte float per message, 16 messages max)
const ENCODE_BUFFER = new ArrayBuffer(4160);
const ENCODE_VIEW = new DataView(ENCODE_BUFFER);
const ENCODE_BYTES = new Uint8Array(ENCODE_BUFFER);

/**
 * Encode OSC messages to binary format for minimal latency.
 * Format per message: [1 byte addr length][N bytes addr][4 bytes float32 value]
 * Returns a view into the pre-allocated buffer (zero allocations in hot path).
 */
function encodeMessagesToBinary(messages: OscMessage[]): Uint8Array {
  let offset = 0;

  for (const msg of messages) {
    const addrLen = msg.address.length;
    ENCODE_VIEW.setUint8(offset, addrLen);
    offset += 1;

    // Write address bytes (ASCII)
    for (let i = 0; i < addrLen; i++) {
      ENCODE_BYTES[offset + i] = msg.address.charCodeAt(i);
    }
    offset += addrLen;

    // Write value as float32
    ENCODE_VIEW.setFloat32(offset, msg.value, true); // little-endian
    offset += 4;
  }

  return new Uint8Array(ENCODE_BUFFER, 0, offset);
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly config: WebSocketConfig;
  private readonly eventHandlers: WebSocketEventHandlers;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private isDestroyed = false;

  constructor(
    config: WebSocketConfig,
    eventHandlers: WebSocketEventHandlers = {}
  ) {
    this.config = {
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      ...config,
    };
    this.eventHandlers = eventHandlers;
  }

  connect() {
    if (this.isDestroyed) {
      return;
    }

    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.manualClose = false;
    this.ws = new WebSocket(this.config.url);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.ws) {
      return;
    }

    this.ws.onopen = () => {
      if (this.isDestroyed) {
        return;
      }
      this.reconnectAttempts = 0;
      this.eventHandlers.onOpen?.();
    };

    this.ws.onclose = (event) => {
      if (this.isDestroyed) {
        return;
      }
      this.handleClose(event);
    };

    this.ws.onerror = (error) => {
      if (this.isDestroyed) {
        return;
      }
      this.eventHandlers.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      if (this.isDestroyed) {
        return;
      }
      this.handleMessage(event);
    };
  }

  private handleClose(event: CloseEvent) {
    const maxAttempts = this.config.maxReconnectAttempts ?? 5;
    const canReconnect = this.reconnectAttempts < maxAttempts;
    const isManualClose = this.manualClose || this.isDestroyed;

    if (!isManualClose && canReconnect) {
      this.scheduleReconnect();
    }

    this.eventHandlers.onClose?.(event);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      this.eventHandlers.onMessage?.(data);
    } catch {
      this.eventHandlers.onMessage?.(event.data);
    }
  }

  disconnect() {
    this.manualClose = true;
    this.clearReconnectTimer();

    if (this.ws) {
      // Remove event handlers to prevent callbacks after disconnect
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;

      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Completely destroy the client. After calling this, the client cannot be reused.
   * This ensures all timers are cleared and no reconnection attempts will be made.
   */
  destroy() {
    this.isDestroyed = true;
    this.disconnect();
  }

  send(data: unknown) {
    if (this.isDestroyed) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send OSC messages using binary protocol for minimal latency.
   * ~10x faster than JSON for small payloads.
   */
  sendOscBinary(messages: OscMessage[]) {
    if (this.isDestroyed || messages.length === 0) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const binary = encodeMessagesToBinary(messages);
      this.ws.send(binary);
    }
  }

  getReadyState(): number {
    if (this.ws === null) {
      return WebSocket.CLOSED;
    }
    return this.ws.readyState;
  }

  isConnected(): boolean {
    if (this.isDestroyed || this.ws === null) {
      return false;
    }
    return this.ws.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    if (this.isDestroyed) {
      return;
    }

    this.clearReconnectTimer();
    const interval = this.config.reconnectInterval ?? 3000;

    this.reconnectTimer = setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.reconnectAttempts++;
      this.connect();
    }, interval);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
