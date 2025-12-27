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
  }

  connect() {
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.manualClose = false;
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.eventHandlers.onOpen?.();
    };

    this.ws.onclose = (event) => {
      const maxAttempts = this.config.maxReconnectAttempts ?? 5;
      if (!this.manualClose && this.reconnectAttempts < maxAttempts) {
        this.scheduleReconnect();
      }
      this.eventHandlers.onClose?.(event);
    };

    this.ws.onerror = (error) => {
      this.eventHandlers.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.eventHandlers.onMessage?.(data);
      } catch {
        this.eventHandlers.onMessage?.(event.data);
      }
    };
  }

  disconnect() {
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
    this.clearReconnectTimer();
    const interval = this.config.reconnectInterval ?? 3000;
    this.reconnectTimer = setTimeout(() => {
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
