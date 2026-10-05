import { rm } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";

const root = path.resolve(import.meta.dir, "..");
const outDir = path.join(root, "out");

// Shipped as plain node_modules by electron-builder (see electron-builder.yml)
const external = ["electron", "node-osc", "ws"];

export const rendererConfig = path.join(root, "dashboard/vite.config.ts");

async function bundle(entry: string, options: Partial<Bun.BuildConfig>) {
  const result = await Bun.build({
    // Absolute entry: a relative "electron/..." path collides with the
    // "electron" import in Bun's resolver
    entrypoints: [path.join(root, entry)],
    target: "node",
    external,
    ...options,
  });
  if (!result.success) {
    throw new AggregateError(result.logs, `Failed to build ${entry}`);
  }
}

/**
 * Main runs as ESM: in CJS output Bun inlines __dirname and import.meta.url
 * as build-machine paths. Preload must stay CJS for sandboxed renderers.
 */
export async function buildElectron() {
  await Promise.all([
    bundle("electron/main.ts", {
      outdir: path.join(outDir, "main"),
      naming: "index.mjs",
      format: "esm",
    }),
    bundle("electron/preload.ts", {
      outdir: path.join(outDir, "preload"),
      naming: "index.js",
      format: "cjs",
    }),
  ]);
}

if (import.meta.main) {
  await rm(outDir, { recursive: true, force: true });
  await buildElectron();
  await viteBuild({
    configFile: rendererConfig,
    build: { outDir: path.join(outDir, "renderer"), emptyOutDir: true },
  });
}
