const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

let mainWindow;
let mongoProc = null;
let serverProc = null;
let serverPort = 38017;
let mongoPort = 27777;

// Allow unlimited memory (max for Node 20 = 8 GB on x64)
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=8192");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const isPackaged = app.isPackaged;
const IS_WIN = process.platform === "win32";
const EXE_EXT = IS_WIN ? ".exe" : "";

// In dev: resources live at /app/desktop/resources/*
// In packaged build: electron-builder places extraResources at process.resourcesPath
function resourcesRoot() {
  if (isPackaged) return process.resourcesPath;
  return path.join(__dirname, "resources");
}

function mongodBinary() {
  return path.join(resourcesRoot(), "mongodb", "bin", `mongod${EXE_EXT}`);
}

function serverBinary() {
  return path.join(resourcesRoot(), "server", `bandobast-server${EXE_EXT}`);
}

// ---------------------------------------------------------------------------
// Port & health helpers
// ---------------------------------------------------------------------------

function findFreePort(start) {
  return new Promise((resolve) => {
    const tryPort = (p) => {
      const srv = net.createServer();
      srv.once("error", () => tryPort(p + 1));
      srv.once("listening", () => {
        srv.close(() => resolve(p));
      });
      srv.listen(p, "127.0.0.1");
    };
    tryPort(start);
  });
}

function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve(true);
        if (Date.now() > deadline) return reject(new Error("Server did not become ready"));
        setTimeout(tick, 400);
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Server did not become ready"));
        setTimeout(tick, 400);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

function waitForTcp(host, port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const sock = net.connect(port, host);
      sock.once("connect", () => {
        sock.end();
        resolve(true);
      });
      sock.once("error", () => {
        if (Date.now() > deadline) return reject(new Error("MongoDB not reachable"));
        setTimeout(tick, 400);
      });
      sock.setTimeout(1500, () => sock.destroy());
    };
    tick();
  });
}

// ---------------------------------------------------------------------------
// Spawning services
// ---------------------------------------------------------------------------

async function startMongo(userDataDir) {
  const bin = mongodBinary();
  if (!fs.existsSync(bin)) {
    throw new Error(
      `Bundled MongoDB binary not found at:\n${bin}\n\n` +
      `Run build-windows.ps1 or the build steps in BUILD_WINDOWS.md first.`
    );
  }
  const dbDir = path.join(userDataDir, "mongo-data");
  const logDir = path.join(userDataDir, "logs");
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, "mongod.log");
  // Fresh log each run so error dialog shows the CURRENT run's error.
  try { if (fs.existsSync(logFile)) fs.unlinkSync(logFile); } catch (_) {}

  mongoPort = await findFreePort(27777);

  const args = [
    "--port", String(mongoPort),
    "--bind_ip", "127.0.0.1",
    "--dbpath", dbDir,
    "--logpath", logFile,
  ];
  mongoProc = spawn(bin, args, {
    // cwd MUST be a user-writable folder. mongod writes transient files
    // (WiredTigerHS.wt locks etc.) relative to cwd during listener startup.
    // Running from Program Files\...\bin (read-only) causes silent exit.
    cwd: userDataDir,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Drain stdout/stderr into our own fallback log so early crash messages
  // (before --logpath is opened) are never lost.
  const fallback = fs.createWriteStream(
    path.join(logDir, "mongod-stdio.log"),
    { flags: "w" }
  );
  mongoProc.stdout.pipe(fallback);
  mongoProc.stderr.pipe(fallback);

  let earlyExitCode = null;
  mongoProc.on("exit", (code) => {
    console.log(`mongod exited (${code})`);
    earlyExitCode = code;
    mongoProc = null;
  });

  try {
    await waitForTcp("127.0.0.1", mongoPort, 60000);
  } catch (err) {
    // Collect last 120 lines from BOTH logs.
    const tail = (p, n) => {
      try {
        if (!fs.existsSync(p)) return "";
        const buf = fs.readFileSync(p, "utf8");
        return buf.split("\n").slice(-n).join("\n");
      } catch (_) { return ""; }
    };
    const mainTail   = tail(logFile, 120);
    const stdioTail  = tail(path.join(logDir, "mongod-stdio.log"), 40);
    const reason = earlyExitCode !== null
      ? `mongod.exe exited with code ${earlyExitCode} before opening port ${mongoPort}.`
      : `mongod.exe did not open port ${mongoPort} within 60s.`;
    // Auto-open the logs folder so the user can see the full file.
    try { shell.openPath(logDir); } catch (_) {}
    throw new Error(
      `${reason}\n\n` +
      `Full logs opened in Explorer: ${logDir}\n\n` +
      `=== tail of mongod.log ===\n${mainTail || "(empty)"}\n\n` +
      `=== tail of mongod-stdio.log ===\n${stdioTail || "(empty)"}`
    );
  }
}

async function startBackend(userDataDir) {
  const bin = serverBinary();
  if (!fs.existsSync(bin)) {
    throw new Error(
      `Bundled backend binary not found at:\n${bin}\n\n` +
      `Run build-windows.ps1 to build it with PyInstaller.`
    );
  }
  serverPort = await findFreePort(38017);
  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(serverPort),
    MONGO_URL: `mongodb://127.0.0.1:${mongoPort}`,
    DB_NAME: "buldhana_bandobast",
    CORS_ORIGINS: "*",
    APP_DATA_DIR: userDataDir,
  };
  const logFile = path.join(userDataDir, "logs", "backend.log");
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const logStream = fs.createWriteStream(logFile, { flags: "a" });

  serverProc = spawn(bin, [], {
    cwd: path.dirname(bin),
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProc.stdout.pipe(logStream);
  serverProc.stderr.pipe(logStream);
  serverProc.on("exit", (code) => {
    console.log(`backend exited (${code})`);
    serverProc = null;
  });

  await waitForHttp(`http://127.0.0.1:${serverPort}/_desktop/health`, 60000);
}

function stopServices() {
  try { if (serverProc) serverProc.kill(); } catch (e) {}
  try { if (mongoProc) mongoProc.kill(); } catch (e) {}
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

async function createWindow() {
  const userData = app.getPath("userData");
  fs.mkdirSync(userData, { recursive: true });

  try {
    await startMongo(userData);
    await startBackend(userData);
  } catch (err) {
    dialog.showErrorBox(
      "Buldhana Bandobast — Startup Failed",
      String(err && err.message ? err.message : err)
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Buldhana Police Bandobast",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = `http://127.0.0.1:${serverPort}`;
  await mainWindow.loadURL(url);
  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  const template = [
    {
      label: "File",
      submenu: [
        { label: "Open Data Folder", click: () => shell.openPath(userData) },
        {
          label: "Open Logs Folder",
          click: () => shell.openPath(path.join(userData, "logs")),
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Buldhana Police Bandobast",
              message: "Digital Police Bandobast Management System",
              detail:
                `Version ${app.getVersion()}\n` +
                `Offline Desktop Edition\n` +
                `Backend port: ${serverPort}\n` +
                `MongoDB port: ${mongoPort}\n` +
                `© Buldhana District Police`,
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  stopServices();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopServices);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
