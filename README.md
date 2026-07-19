# 🎙️ Traduttore Vocale

App desktop per Windows che traduce l'audio in tempo reale e mostra i **sottotitoli tradotti** in una finestra sempre in primo piano.

Due modalità:

- **🎙️ Microfono** — parli, l'app trascrive, traduce e legge la traduzione ad alta voce
- **🎧 Audio del PC** — cattura l'audio di qualunque cosa stia suonando sul computer (una chiamata, un video, una riunione, un gioco) e lo sottotitola tradotto

La trascrizione avviene **interamente sul tuo computer** con Whisper: l'audio non viene mai inviato a nessun server.

## Installazione

Scarica ed esegui uno dei due file dalla cartella `dist` (o dalla sezione Releases):

| File | Cosa fa |
|---|---|
| `Traduttore Vocale Setup 1.0.0.exe` | Installa l'app con collegamenti nel menu Start e sul desktop |
| `TraduttoreVocale-portable.exe` | Si avvia direttamente, senza installare niente |

Windows mostrerà un avviso "SmartScreen" perché l'app non ha una firma digitale a pagamento: scegli **Ulteriori informazioni → Esegui comunque**.

## Come si usa

1. Apri la scheda **🎧 Audio del PC**
2. Scegli la lingua dell'audio (o **🌐 Rileva lingua**) e la lingua dei sottotitoli
3. Premi il pulsante grande: si apre il **selettore delle finestre**, scegli quella che stai guardando
4. I sottotitoli compaiono nella finestrella flottante: trascinala dove preferisci, resta sempre in primo piano

Non c'è nessuna impostazione di condivisione audio da attivare: l'app cattura l'audio di sistema in modo nativo.

Al primo avvio viene scaricato il modello di riconoscimento (una sola volta, poi resta in cache).

## Funzionalità

- 18 lingue più il rilevamento automatico
- Selettore nativo delle finestre aperte, con anteprime
- Overlay dei sottotitoli sempre in primo piano, trascinabile e con modalità "trasparente ai clic"
- Qualità del riconoscimento regolabile: ⚡ Veloce, ⚖️ Bilanciata, 🎯 Alta
- Cronologia con riascolto 🔊 e copia 📋
- Input testuale come alternativa all'audio
- Scorciatoia: **barra spaziatrice** per avviare/fermare

## Prestazioni

Su una macchina con GPU compatibile WebGPU, la trascrizione con il modello **Bilanciata** gira a circa **0,2× il tempo reale** (misurato: 3,3 s di audio trascritti in ~550 ms), quindi regge senza problemi il parlato continuo. Senza GPU l'app passa automaticamente al modello ⚡ Veloce.

## Sviluppo

```bash
npm install       # installa le dipendenze
npm start         # avvia l'app
npm run dev       # avvia con gli strumenti di sviluppo
npm run build     # crea installer + portable in dist/
```

## Come funziona

| Passaggio | Tecnologia |
|---|---|
| Cattura audio di sistema | Electron `setDisplayMediaRequestHandler` con audio `loopback` (nessun dialogo) |
| Selettore finestre | Electron `desktopCapturer` |
| Voce → testo | Whisper via [transformers.js](https://github.com/huggingface/transformers.js), in locale su WebGPU (fallback CPU) |
| Traduzione | Endpoint gratuito di Google Translate, con riserva su MyMemory |
| Testo → voce | Sintesi vocale di sistema |
| Overlay sottotitoli | `BrowserWindow` senza bordi, `alwaysOnTop` a livello `screen-saver` |

## Versione web

Esiste anche una versione da browser: https://darkchri.github.io/traduttore-vocale/ — stesse funzioni, ma per catturare l'audio di sistema richiede di attivare manualmente l'opzione "Condividi anche l'audio" nella finestra di condivisione di Chrome. L'app desktop evita del tutto questo passaggio.

## Limiti

- La traduzione richiede una connessione a Internet (la trascrizione no, dopo il primo download)
- La cattura audio è dell'intero sistema, non della singola finestra: Windows non permette di isolare l'audio per applicazione
- I sottotitoli arrivano 1–3 secondi dopo la frase, perché l'audio viene segmentato sulle pause
- I servizi di traduzione gratuiti possono limitare un uso molto intensivo
