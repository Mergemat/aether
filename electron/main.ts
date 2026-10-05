import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	app,
	BrowserWindow,
	dialog,
	powerSaveBlocker,
	shell,
	systemPreferences,
} from "electron";
import { autoUpdater } from "electron-updater";
import { startOscServer, stopOscServer } from "./osc-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Enable GPU acceleration for MediaPipe/WebGL
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-webgl");
app.commandLine.appendSwitch("enable-gpu-rasterization");

// Gestures drive a DAW that's usually in front of this window, so the
// renderer must keep full speed while hidden or occluded
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === "win32") {
	app.setAppUserModelId(app.getName());
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	app.quit();
	process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
// Set once startup (including the camera prompt) is done
let started = false;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 400,
		minHeight: 600,
		webPreferences: {
			preload: path.join(__dirname, "../preload/index.js"),
			contextIsolation: true,
			nodeIntegration: false,
			backgroundThrottling: false,
		},
		// macOS specific
		titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
		trafficLightPosition: { x: 16, y: 16 },
		// Windows specific
		autoHideMenuBar: true,
		show: false,
	});

	// Show window when ready to prevent visual flash
	mainWindow.once("ready-to-show", () => {
		mainWindow?.show();
	});

	// Open external links in browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https:") || url.startsWith("http:")) {
			shell.openExternal(url);
		}
		return { action: "deny" };
	});

	// Load the app
	if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

// Auto-updater configuration
function setupAutoUpdater() {
	// Don't check for updates in development
	if (!app.isPackaged) {
		return;
	}

	autoUpdater.autoDownload = false;
	autoUpdater.autoInstallOnAppQuit = true;

	autoUpdater.on("update-available", async (info) => {
		const { response } = await dialog.showMessageBox({
			type: "info",
			title: "Update Available",
			message: `A new version (${info.version}) is available. Do you want to download it?`,
			buttons: ["Download from Website", "Later"],
		});

		if (response === 0) {
			// Replace with your GitHub releases page or website
			shell.openExternal("https://aether-osc.app");
		}
	});

	autoUpdater.on("update-downloaded", () => {
		// On macOS, it's safer to trigger the install explicitly
		// or notify the user.
		autoUpdater.quitAndInstall(false, true);
	});

	autoUpdater.on("error", (err) => {
		console.error("Auto-updater error:", err);
	});

	// Check for updates after app is ready
	autoUpdater.checkForUpdates().catch((err) => {
		console.error("Failed to check for updates:", err);
	});
}

// App lifecycle
app.on("ready", async () => {
	// Keep macOS App Nap from throttling the whole app in the background
	powerSaveBlocker.start("prevent-app-suspension");
	startOscServer();
	// Without an explicit request, macOS may never prompt: getUserMedia then
	// returns a live track that delivers no frames, i.e. a black preview
	if (
		process.platform === "darwin" &&
		systemPreferences.getMediaAccessStatus("camera") !== "granted"
	) {
		await systemPreferences.askForMediaAccess("camera");
	}
	started = true;
	createWindow();
	setupAutoUpdater();
});

app.on("window-all-closed", () => {
	stopOscServer();
	app.quit();
});

app.on("activate", () => {
	// macOS: re-create window when dock icon is clicked. This also fires on
	// launch, while "ready" may still be waiting on the camera prompt
	if (started && mainWindow === null) {
		createWindow();
	}
});

// Handle second instance (focus existing window)
app.on("second-instance", () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		mainWindow.focus();
	}
});
