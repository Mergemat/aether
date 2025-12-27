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
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      perfLogger.websocket("connect skipped - already connected");
      return;
    }

    perfLogger.websocket("connecting", { url: this.config.url });
    this.manualClose = false;
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      perfLogger.websocket("onopen", {
        reconnectAttempts: this.reconnectAttempts,
      });
      this.reconnectAttempts = 0;
      this.eventHandlers.onOpen?.();
    };

    this.ws.onclose = (event) => {
      perfLogger.websocket("onclose", {
        code: event.code,
        reason: event.reason,
        reconnectAttempts: this.reconnectAttempts,
        manualClose: this.manualClose,
      });
      const maxAttempts = this.config.maxReconnectAttempts ?? 5;
      if (!this.manualClose && this.reconnectAttempts < maxAttempts) {
        perfLogger.websocket("scheduling reconnect", {
          attempt: this.reconnectAttempts + 1,
          maxAttempts,
        });
        this.scheduleReconnect();
      }
      this.eventHandlers.onClose?.(event);
    };

    this.ws.onerror = (error) => {
      perfLogger.websocket("onerror", { error });
      this.eventHandlers.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        perfLogger.websocket("onmessage", { data });
        this.eventHandlers.onMessage?.(data);
      } catch {
        perfLogger.websocket("onmessage", { rawData: event.data });
        this.eventHandlers.onMessage?.(event.data);
      }
    };
  }

  disconnect() {
    perfLogger.websocket("disconnect called");
    this.manualClose = true;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: unknown) {
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
    if (this.ws === null) {
      return false;
    }
    return this.ws.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    perfLogger.websocket("scheduleReconnect", {
      attempts: this.reconnectAttempts,
    });
    this.clearReconnectTimer();
    const interval = this.config.reconnectInterval ?? 3000;
    this.reconnectTimer = setTimeout(() => {
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
