import { contextBridge } from "electron";

// Expose minimal API to renderer
// Currently the dashboard connects directly to WebSocket on localhost:8888
// This preload script is kept minimal but can be extended for future IPC needs

contextBridge.exposeInMainWorld("electronAPI", {
  // Platform info
  platform: process.platform,

  // App version (useful for displaying in UI)
  version: process.env.npm_package_version || "dev",
});

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      version: string;
    };
  }
}
