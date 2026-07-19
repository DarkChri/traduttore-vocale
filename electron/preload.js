// Ponte sicuro tra l'app e il processo principale (contextIsolation attivo).
const { contextBridge, ipcRenderer } = require('electron');

// restituisce sempre una funzione di disiscrizione: senza, i listener si
// accumulano e in una finestra a vita lunga diventano una perdita di memoria
function on(channel, cb) {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

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
  onOverlayClosed: (cb) => on('overlay:closed', cb),
  onClickThroughChanged: (cb) => on('overlay:clickThroughChanged', cb),
  getClickThrough: () => ipcRenderer.invoke('overlay:getClickThrough'),

  // usato dalla finestra overlay stessa
  onSubtitle: (cb) => on('overlay:text', cb),
  setClickThrough: (v) => ipcRenderer.send('overlay:clickThrough', v),
  hideOverlay: () => ipcRenderer.send('overlay:hideSelf')
});
