// Preload script for Electron
// This script runs in the renderer process before its web content begins loading

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,

    // Backup operations
    listBackups: () => ipcRenderer.invoke('backup:list'),
    restoreBackup: (backupName) => ipcRenderer.invoke('backup:restore', backupName),
    getBackupDir: () => ipcRenderer.invoke('backup:getDir'),

    // App control
    restartApp: () => ipcRenderer.invoke('app:restart'),
});

