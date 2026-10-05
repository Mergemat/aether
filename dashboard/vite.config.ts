import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The Wasm runtime is loaded from a CDN; pin it to the installed JS version.
// The package doesn't export its package.json, so read it next to the entry.
const mediapipePackage = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("@mediapipe/tasks-vision")
  ),
  "package.json"
);
const mediapipeVersion: string = JSON.parse(
  readFileSync(mediapipePackage, "utf8")
).version;

// https://vite.dev/config/
export default defineConfig({
  // Pinned so the Electron build scripts can run this config from the repo root
  root: import.meta.dirname,
  // Relative asset URLs so the build also loads from file:// in Electron
  base: "./",
  define: {
    __MEDIAPIPE_VERSION__: JSON.stringify(mediapipeVersion),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
