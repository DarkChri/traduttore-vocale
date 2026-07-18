# 🎙️ Traduttore Vocale in Tempo Reale

Web app che traduce la voce in tempo reale, in due modalità:

- **🎙️ Microfono** — parli, l'app trascrive, traduce e legge la traduzione ad alta voce
- **🎧 Chiamata Discord** — cattura l'audio di sistema di una chiamata (Discord o qualsiasi altra app) e mostra **sottotitoli tradotti in tempo reale** nella lingua scelta

Tutto in un singolo file `index.html`, senza dipendenze da installare e senza chiavi API.

**▶️ Provalo online: https://darkchri.github.io/traduttore-vocale/**

## Come si avvia

**Modo più semplice:** doppio click su `index.html` con Google Chrome o Microsoft Edge.

**In alternativa, con un server locale:**

```
node server.js
```

poi apri http://localhost:8617

## Modalità Chiamata Discord

1. Apri la scheda **🎧 Chiamata Discord** e scegli la lingua della chiamata (o **🌐 Rileva lingua**) e la lingua dei sottotitoli
2. Premi il pulsante grande e, nella finestra di condivisione, scegli **Schermo intero** spuntando **"Condividi anche l'audio di sistema"** (oppure la **scheda** del browser con Discord, attivando l'audio della scheda)
3. I sottotitoli tradotti compaiono in basso; con **🪟 Sottotitoli flottanti** si aprono in una finestrella sempre in primo piano, da tenere sopra Discord
4. Al primo avvio viene scaricato il modello di riconoscimento (una sola volta, poi resta in cache)

La trascrizione avviene **localmente nel browser** con Whisper (WebGPU se disponibile, altrimenti CPU): l'audio della chiamata non viene inviato a nessun server. Per correttezza, avvisa i partecipanti che la chiamata viene sottotitolata.

Qualità del riconoscimento selezionabile: **⚡ Veloce** (modello piccolo), **⚖️ Bilanciata** (consigliata), **🎯 Alta** (più pesante, meglio con GPU).

## Modalità Microfono

Premi il microfono, consenti l'accesso e parla: trascrizione e traduzione compaiono in tempo reale e la traduzione viene letta ad alta voce. Il microfono si mette in pausa mentre parla la voce sintetica. Scorciatoia: **barra spaziatrice**.

## Altre funzionalità

- 18 lingue + rilevamento automatico (in modalità chiamata)
- Input testuale alternativo se non vuoi/puoi usare l'audio
- Cronologia con riascolto 🔊 e copia 📋 di ogni frase
- Le preferenze (lingue, modalità, qualità) vengono ricordate

## Come funziona

| Passaggio | Tecnologia |
|---|---|
| Voce → testo (microfono) | Web Speech API del browser (`SpeechRecognition`) |
| Voce → testo (chiamata) | Cattura schermo/audio (`getDisplayMedia`) + Whisper locale ([transformers.js](https://github.com/huggingface/transformers.js), WebGPU/WASM) |
| Traduzione | Endpoint gratuito di Google Translate, con fallback su MyMemory |
| Testo → voce | Sintesi vocale del browser (`speechSynthesis`) |
| Sottotitoli flottanti | Document Picture-in-Picture API |

## Requisiti e limiti

- **Browser:** Google Chrome o Microsoft Edge recenti
- **Internet:** necessario per la traduzione (e per il primo download del modello Whisper); la trascrizione della chiamata funziona poi in locale
- I sottotitoli della chiamata arrivano con 1–3 secondi di ritardo (l'audio viene segmentato sulle pause del parlato)
- I servizi di traduzione gratuiti possono imporre limiti in caso di uso molto intensivo
- La qualità delle voci sintetiche dipende da quelle installate nel sistema/browser
