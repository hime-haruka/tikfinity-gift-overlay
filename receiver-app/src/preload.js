const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("receiver", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (cfg) => ipcRenderer.invoke("save-config", cfg),
  start: () => ipcRenderer.invoke("start"),
  stop: () => ipcRenderer.invoke("stop"),
  checkServer: () => ipcRenderer.invoke("check-server"),
  openOverlay: () => ipcRenderer.invoke("open-overlay"),
  openControl: () => ipcRenderer.invoke("open-control"),
  getClientUrls: () => ipcRenderer.invoke("get-client-urls"),
  copyOverlayUrl: () => ipcRenderer.invoke("copy-overlay-url"),
  copyControlUrl: () => ipcRenderer.invoke("copy-control-url"),
  sendTestGift: () => ipcRenderer.invoke("send-test-gift"),
  onLog: (cb) => ipcRenderer.on("log", (_, data) => cb(data)),
  onTikfinityStatus: (cb) => ipcRenderer.on("tikfinity-status", (_, data) => cb(data)),
  onServerStatus: (cb) => ipcRenderer.on("server-status", (_, data) => cb(data)),
  onRunning: (cb) => ipcRenderer.on("running", (_, data) => cb(data))
});
