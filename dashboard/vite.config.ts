import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task";

const mediapipeDir = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("@mediapipe/tasks-vision")
  ),
  "wasm"
);
const modelCache = path.join(
  import.meta.dirname,
  "node_modules/.cache/aether/gesture_recognizer.task"
);

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false
  );

async function ensureModel() {
  if (await exists(modelCache)) {
    return;
  }
  const response = await fetch(MODEL_URL);
  if (!response.ok) {
    throw new Error(`Failed to download ${MODEL_URL}: ${response.status}`);
  }
  await mkdir(path.dirname(modelCache), { recursive: true });
  const partial = `${modelCache}.partial`;
  await writeFile(partial, new Uint8Array(await response.arrayBuffer()));
  await rename(partial, modelCache);
}

/**
 * Ships the MediaPipe runtime and gesture model with the app under
 * `mediapipe/`, instead of fetching ~20 MB from CDNs on every cold start.
 * The model is downloaded once into node_modules/.cache.
 */
function mediapipeAssets(): Plugin {
  const files: Record<string, { file: string; type: string }> = {
    "vision_wasm_module_internal.js": {
      file: path.join(mediapipeDir, "vision_wasm_module_internal.js"),
      type: "text/javascript",
    },
    "vision_wasm_module_internal.wasm": {
      file: path.join(mediapipeDir, "vision_wasm_module_internal.wasm"),
      type: "application/wasm",
    },
    "gesture_recognizer.task": {
      file: modelCache,
      type: "application/octet-stream",
    },
  };

  return {
    name: "mediapipe-assets",
    async buildStart() {
      await ensureModel();
    },
    configureServer(server) {
      server.middlewares.use("/mediapipe", (req, res, next) => {
        const entry = files[(req.url ?? "").slice(1).split("?")[0]];
        if (!entry) {
          next();
          return;
        }
        res.setHeader("Content-Type", entry.type);
        createReadStream(entry.file).on("error", next).pipe(res);
      });
    },
    async generateBundle() {
      const sources = await Promise.all(
        Object.values(files).map(({ file }) => readFile(file))
      );
      for (const [i, name] of Object.keys(files).entries()) {
        this.emitFile({
          type: "asset",
          fileName: `mediapipe/${name}`,
          source: sources[i],
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Pinned so the Electron build scripts can run this config from the repo root
  root: import.meta.dirname,
  // Relative asset URLs so the build also loads from file:// in Electron
  base: "./",
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    mediapipeAssets(),
    {
      // React Scan must load before React, so it gets its own entry script
      name: "react-scan",
      apply: "serve",
      transformIndexHtml: () => [
        {
          tag: "script",
          attrs: { type: "module", src: "/src/react-scan.ts" },
          injectTo: "head-prepend",
        },
      ],
    },
  ],
  // MediaPipe loads its runtime with import() when importScripts is
  // unavailable, which needs a module worker
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
