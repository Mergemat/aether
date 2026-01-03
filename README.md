# Aether

Control your DAW with hand gestures.

![Aether Interface Placeholder](/media/main.png)

Aether is a desktop application that uses computer vision to track your hand movements and translate them into OSC (Open Sound Control) messages, allowing you to control music software like Ableton Live, Bitwig, or Logic Pro without touching your computer.

## Project Structure

- `electron/`: Main process handling system integration and the OSC/WebSocket bridge.
- `dashboard/`: React-based user interface for gesture monitoring and configuration.
- `cli/`: Command-line tool for interacting with the Aether server.
- `www/`: Project landing page.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js
- A webcam for hand tracking
- A DAW that supports OSC (e.g., Ableton Live with TouchOSC or similar bridge)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mergemat/aether.git
   cd aether
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run in development mode:
   ```bash
   bun run dev
   ```

### Building for Production

To create a production build for your platform:

```bash
# macOS
bun run dist:mac

# Windows
bun run dist:win
```

## How it Works

1. **Detection**: The Dashboard uses your webcam and MediaPipe to detect hand landmarks.
2. **Bridge**: Hand data is sent via WebSockets to the Electron main process (Port `8888`).
3. **Translation**: The Electron process translates these gestures into OSC messages.
4. **Control**: OSC messages are sent to your DAW (Port `7099` by default) to control MIDI CC or other parameters.

```text
  ┌────────────┐
  │   Webcam   │
  └─────┬──────┘
        │ Video Stream
        v
  ┌────────────┐
  │ Dashboard  │ (React + MediaPipe)
  │  Frontend  │
  └─────┬──────┘
        │ WebSocket (Port 8888)
        v
  ┌────────────┐
  │  Electron  │ (OSC Translation)
  │  Backend   │
  └─────┬──────┘
        │ OSC (Port 7099)
        v
  ┌────────────┐
  │    DAW     │ (Ableton, Bitwig, etc.)
  └────────────┘
```

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Tracking**: [MediaPipe](https://google.github.io/mediapipe/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Communication**: [node-osc](https://github.com/MyreMylar/node-osc), [ws](https://github.com/websockets/ws)

## License

MIT
