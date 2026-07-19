// Processo principale: finestra dell'app, cattura audio nativa e overlay dei sottotitoli.
const { app, BrowserWindow, ipcMain, desktopCapturer, session, screen, shell } = require('electron');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const isDev = process.argv.includes('--dev');

let mainWin = null;
let overlayWin = null;
let pendingSourceId = null; // sorgente scelta dall'utente nel selettore interno all'app
let loopbackMode = 'loopback'; // oppure 'loopbackWithMute' come ripiego

// ---------------------------------------------------------------------------
// Finestra principale
// ---------------------------------------------------------------------------
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1040,
    height: 900,
    minWidth: 720,
    minHeight: 600,
    backgroundColor: '#0b1020',
    title: 'Traduttore Vocale',
    icon: path.join(ROOT, 'icon-512.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
sandbox: false
    }
  });

  mainWin.removeMenu();
  mainWin.loadFile(path.join(ROOT, 'index.html'));
  mainWin.once('ready-to-show', () => mainWin.show());
  if (isDev) mainWin.webContents.openDevTools({ mode: 'detach' });

  // i link esterni si aprono nel browser di sistema, non dentro l'app
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWin.on('closed', () => {
    mainWin = null;
    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
  });
}

// ---------------------------------------------------------------------------
// Cattura schermo + audio di sistema SENZA la finestra di dialogo di Chrome.
// Il renderer chiama getDisplayMedia() e questo handler risponde con la sorgente
// gia scelta dall'utente nel selettore interno all'app.
// ---------------------------------------------------------------------------
let displayHandlerRegistered = false;

function registerDisplayMediaHandler() {
  // ri-registrare fallisce in silenzio (electron#39566): registrare una sola volta
  if (displayHandlerRegistered) return;
  displayHandlerRegistered = true;

  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((wc, permission, callback) => {
    // l'app e locale e di proprieta dell'utente: microfono e cattura sono concessi.
    // NB: nella *request* esistono solo 'media' e 'display-capture'
    callback(permission === 'media' || permission === 'display-capture');
  });

  // niente useSystemPicker: e solo macOS 15+, su Windows e inerte
  ses.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 0, height: 0 }, // qui le anteprime non servono: piu veloce
        fetchWindowIcons: false
      });
      let chosen = pendingSourceId ? sources.find((s) => s.id === pendingSourceId) : null;
      if (!chosen) chosen = sources.find((s) => s.id.startsWith('screen:')) || sources[0];
      if (!chosen) {
        callback({});
        return;
      }
      // 'loopback' = audio di sistema catturato nativamente (Windows): nessuna
      // finestra di dialogo e nessun interruttore da attivare.
      callback({
        video: chosen,
        audio: request.audioRequested && loopbackMode ? loopbackMode : undefined
      });
    } catch (e) {
      console.error('Errore nella selezione della sorgente:', e);
      callback({}); // il callback va SEMPRE chiamato, altrimenti la promise resta appesa
    }
  });
}

// ---------------------------------------------------------------------------
// IPC: elenco delle sorgenti per il selettore interno
// ---------------------------------------------------------------------------
ipcMain.handle('sources:list', async () => {
  const thumbSize = { width: 320, height: 180 };
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: thumbSize,
    fetchWindowIcons: true
  });
  // esclude le finestre dell'app stessa confrontando gli id reali, non i nomi
  const own = new Set();
  for (const w of [mainWin, overlayWin]) {
    if (w && !w.isDestroyed()) {
      try { own.add(w.getMediaSourceId()); } catch (e) { /* finestra non ancora pronta */ }
    }
  }
  return sources
    .filter((s) => s.name && !own.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.id.startsWith('screen:') ? 'screen' : 'window',
      thumbnail: s.thumbnail && !s.thumbnail.isEmpty() ? s.thumbnail.toDataURL() : null,
      appIcon: s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null
    }));
});

ipcMain.handle('sources:select', (_e, id) => {
  pendingSourceId = id || null;
  return true;
});

// ---------------------------------------------------------------------------
// Overlay dei sottotitoli: finestra senza bordi, sempre in primo piano
// ---------------------------------------------------------------------------
function createOverlay() {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.showInactive();
    return true;
  }
  const display = screen.getPrimaryDisplay();
  const wa = display.workAreaSize;
  const w = Math.min(900, Math.round(wa.width * 0.7));
  const h = 160;

  overlayWin = new BrowserWindow({
    width: w,
    height: h,
    x: Math.round((wa.width - w) / 2),
    y: wa.height - h - 60,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  overlayWin.loadFile(path.join(__dirname, 'overlay.html'));
  // 'screen-saver' e il livello piu alto: resta sopra anche alle app a schermo intero
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // evita che l'overlay finisca dentro la cattura schermo (si sottotitolerebbe da solo)
  overlayWin.setContentProtection(true);
  overlayWin.once('ready-to-show', () => overlayWin.showInactive());

  // altre app che si dichiarano "sempre in primo piano" possono scavalcarci:
  // si ri-asserisce periodicamente (senza il toggle false->true, che farebbe
  // perdere l'always-on-top ad altre finestre di sistema — electron#31536)
  const keepOnTop = setInterval(() => {
    if (!overlayWin || overlayWin.isDestroyed()) { clearInterval(keepOnTop); return; }
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
  }, 4000);

  overlayWin.on('closed', () => {
    clearInterval(keepOnTop);
    overlayWin = null;
    overlayClickThrough = false;
    if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('overlay:closed');
  });
  return true;
}

ipcMain.handle('overlay:open', () => createOverlay());
ipcMain.handle('overlay:close', () => {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
  return true;
});
ipcMain.handle('overlay:isOpen', () => !!(overlayWin && !overlayWin.isDestroyed()));
ipcMain.on('overlay:text', (_e, payload) => {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.webContents.send('overlay:text', payload);
});
ipcMain.on('overlay:style', (_e, payload) => {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.webContents.send('overlay:style', payload);
});
let overlayClickThrough = false;
ipcMain.on('overlay:clickThrough', (_e, on) => {
  overlayClickThrough = !!on;
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.setIgnoreMouseEvents(overlayClickThrough, { forward: true });
    // la finestra principale deve poter riattivare l'interazione: da sola
    // l'overlay diventerebbe incliccabile e quindi irrecuperabile
    if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('overlay:clickThroughChanged', overlayClickThrough);
  }
});
ipcMain.handle('overlay:getClickThrough', () => overlayClickThrough);
ipcMain.on('overlay:hideSelf', () => {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
});

// ---------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  registerDisplayMediaHandler();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
