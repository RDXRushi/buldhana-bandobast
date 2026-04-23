const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const { startServer } = require("./server");

let mainWindow;
let serverInfo; // { port, close }

// Allow unlimited memory (max for Node 20 = 8 GB on x64)
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=8192");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

async function createWindow() {
  // Data directory inside user's AppData/Roaming
  const userData = app.getPath("userData");
  serverInfo = await startServer(userData);

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

  const url = `http://127.0.0.1:${serverInfo.port}`;
  await mainWindow.loadURL(url);
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Open external http links in default browser
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
        {
          label: "Open Data Folder",
          click: () => shell.openPath(userData),
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
              detail: `Version ${app.getVersion()}\nOffline Desktop Edition\n© Buldhana District Police`,
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
  if (serverInfo && serverInfo.close) serverInfo.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
