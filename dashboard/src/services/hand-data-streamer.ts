import { WebSocketClient } from "@/services/websocket-client";
import { useHandStore } from "@/store/hand-store";
import { useMappingsStore } from "@/store/mappings-store";
import { useWebSocketStore } from "@/store/websocket-store";

interface HandDataStreamerConfig {
  wsUrl: string;
  throttleMs?: number;
}

export class HandDataStreamer {
  private readonly client: WebSocketClient;
  private readonly lastSentValues = new Map<string, number>();
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly config: Required<HandDataStreamerConfig>;
  private isStreaming = false;

  constructor(config: HandDataStreamerConfig) {
    this.config = {
      throttleMs: 33,
      ...config,
    };

    this.client = new WebSocketClient(
      { url: this.config.wsUrl },
      {
        onOpen: () => {
          useWebSocketStore.getState().setStatus("connected");
          useWebSocketStore.getState().setConnectedAt(Date.now());
          useWebSocketStore.getState().resetReconnectAttempts();
          useWebSocketStore.getState().setError(null);
        },
        onClose: () => {
          useWebSocketStore.getState().setStatus("disconnected");
          useWebSocketStore.getState().setConnectedAt(null);
        },
        onError: (error) => {
          useWebSocketStore.getState().setStatus("error");
          useWebSocketStore
            .getState()
            .setError(`WebSocket error: ${error.type}`);
        },
      }
    );
  }

  start() {
    if (this.isStreaming) {
      return;
    }
    this.isStreaming = true;
    this.client.connect();
    this.subscribeToHandData();
  }

  stop() {
    this.isStreaming = false;
    this.client.disconnect();
    this.clearTimers();
  }

  private subscribeToHandData() {
    useHandStore.subscribe((handState) => {
      if (!this.isStreaming) {
        return;
      }
      if (!this.client.isConnected()) {
        return;
      }

      const messages = this.buildMessages(handState);
      if (messages.length === 0) {
        return;
      }

      this.sendMessages(messages);
    });
  }

  private buildMessages(
    handState: ReturnType<typeof useHandStore.getState>
  ): { address: string; value: number }[] {
    const mappingsState = useMappingsStore.getState();
    const messages: { address: string; value: number }[] = [];

    for (const mapping of mappingsState.mappings) {
      if (!mapping.enabled) {
        continue;
      }

      const handData = handState[mapping.hand];
      if (handData.gesture !== mapping.gesture) {
        continue;
      }

      const value = mapping.mode === "fader" ? handData.y : handData.rot;

      const lastValue = this.lastSentValues.get(mapping.address);
      if (lastValue !== undefined && Math.abs(value - lastValue) < 0.01) {
        continue;
      }

      messages.push({ address: mapping.address, value });
      this.lastSentValues.set(mapping.address, value);
    }

    return messages;
  }

  private sendMessages(messages: { address: string; value: number }[]) {
    if (this.throttleTimer !== null) {
      return;
    }

    this.throttleTimer = setTimeout(() => {
      for (const message of messages) {
        this.client.send(message);
      }
      this.throttleTimer = null;
    }, this.config.throttleMs);
  }

  private clearTimers() {
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
  }
}
