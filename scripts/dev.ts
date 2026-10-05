import { watch } from "node:fs";
import path from "node:path";
import electron from "electron";
import { createServer } from "vite";
import { buildElectron, rendererConfig } from "./build";

const root = path.resolve(import.meta.dir, "..");

const server = await createServer({ configFile: rendererConfig });
await server.listen();
server.printUrls();

const rendererUrl = server.resolvedUrls?.local[0];
if (!rendererUrl) {
  throw new Error("Vite dev server has no local URL");
}

let app: Bun.Subprocess | null = null;
let restarting = false;

async function start() {
  restarting = true;
  if (app) {
    app.kill();
    await app.exited;
  }
  try {
    await buildElectron();
  } catch (error) {
    console.error(error);
    return;
  } finally {
    restarting = false;
  }

  const proc = Bun.spawn([electron as unknown as string, "."], {
    cwd: root,
    env: { ...process.env, ELECTRON_RENDERER_URL: rendererUrl },
    stdio: ["inherit", "inherit", "inherit"],
  });
  app = proc;

  // Quitting the app ends the dev session; restarts don't
  proc.exited.then(async (code) => {
    if (app === proc && !restarting) {
      await server.close();
      process.exit(code);
    }
  });
}

// Renderer changes go through Vite HMR; main/preload changes need a restart
let timer: Timer | undefined;
watch(path.join(root, "electron"), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(start, 100);
});

await start();
