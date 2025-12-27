import perfLogger from "@/lib/utils/logger";

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
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...config,
    };
    this.eventHandlers = eventHandlers;
    perfLogger.websocket("client created", { url: this.config.url });
  }

  connect() {
    if (this.isDestroyed) {
      perfLogger.websocket("connect skipped - client destroyed");
      return;
    }

    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      perfLogger.websocket("connect skipped - already connected");
      return;
    }

    perfLogger.websocket("connecting", { url: this.config.url });
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
      perfLogger.websocket("onopen", {
        reconnectAttempts: this.reconnectAttempts,
      });
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
      perfLogger.websocket("onerror", { error });
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
    perfLogger.websocket("onclose", {
      code: event.code,
      reason: event.reason,
      reconnectAttempts: this.reconnectAttempts,
      manualClose: this.manualClose,
    });

    const maxAttempts = this.config.maxReconnectAttempts ?? 5;
    const canReconnect = this.reconnectAttempts < maxAttempts;
    const isManualClose = this.manualClose || this.isDestroyed;

    if (!isManualClose && canReconnect) {
      perfLogger.websocket("scheduling reconnect", {
        attempt: this.reconnectAttempts + 1,
        maxAttempts,
      });
      this.scheduleReconnect();
    }

    this.eventHandlers.onClose?.(event);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      perfLogger.websocket("onmessage", { data });
      this.eventHandlers.onMessage?.(data);
    } catch {
      perfLogger.websocket("onmessage", { rawData: event.data });
      this.eventHandlers.onMessage?.(event.data);
    }
  }

  disconnect() {
    perfLogger.websocket("disconnect called");
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
    perfLogger.websocket("destroy called");
    this.isDestroyed = true;
    this.disconnect();
  }

  send(data: unknown) {
    if (this.isDestroyed) {
      perfLogger.websocket("send failed - client destroyed", { data });
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      perfLogger.websocket("send failed - not connected", { data });
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

    perfLogger.websocket("scheduleReconnect", {
      attempts: this.reconnectAttempts,
    });
    this.clearReconnectTimer();
    const interval = this.config.reconnectInterval ?? 3000;

    this.reconnectTimer = setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.reconnectAttempts++;
      perfLogger.websocket("reconnect attempt", {
        attempt: this.reconnectAttempts,
      });
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
