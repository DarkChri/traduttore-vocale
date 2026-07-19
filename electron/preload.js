// Ponte sicuro tra l'app e il processo principale (contextIsolation attivo).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeApp', {
  isElectron: true,
  platform: process.platform,

  // selettore interno delle sorgenti (finestre e schermi)
  listSources: () => ipcRenderer.invoke('sources:list'),
  selectSource: (id) => ipcRenderer.invoke('sources:select', id),

  // overlay dei sottotitoli
  openOverlay: () => ipcRenderer.invoke('overlay:open'),
  closeOverlay: () => ipcRenderer.invoke('overlay:close'),
  isOverlayOpen: () => ipcRenderer.invoke('overlay:isOpen'),
  sendSubtitle: (payload) => ipcRenderer.send('overlay:text', payload),
  onOverlayClosed: (cb) => ipcRenderer.on('overlay:closed', () => cb()),

  // usato dalla finestra overlay stessa
  onSubtitle: (cb) => ipcRenderer.on('overlay:text', (_e, payload) => cb(payload)),
  setClickThrough: (on) => ipcRenderer.send('overlay:clickThrough', on),
  hideOverlay: () => ipcRenderer.send('overlay:hideSelf')
});
