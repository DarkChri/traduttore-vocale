# 🎙️ Traduttore Vocale in Tempo Reale

Web app che ascolta la tua voce, la trascrive, la traduce e legge la traduzione ad alta voce. Tutto in un singolo file `index.html`, senza dipendenze da installare.

## Come si usa

**Modo più semplice:** doppio click su `index.html` (si apre nel browser), premi il microfono, consenti l'accesso e parla.

**In alternativa, con un server locale:**

```
node server.js
```

poi apri http://localhost:8617

## Funzionalità

- 18 lingue, con pulsante per invertire rapidamente la direzione
- Trascrizione in tempo reale (anche i risultati provvisori mentre parli)
- Traduzione in tempo reale con lettura vocale automatica della traduzione
- Il microfono si mette in pausa mentre parla la voce sintetica (per non "ascoltarsi da sola")
- Input testuale alternativo se non vuoi/puoi usare il microfono
- Cronologia con riascolto 🔊 e copia 📋 di ogni frase
- Scorciatoia: **barra spaziatrice** per avviare/fermare l'ascolto
- Le lingue scelte vengono ricordate tra una sessione e l'altra

## Come funziona

| Passaggio | Tecnologia |
|---|---|
| Voce → testo | Web Speech API del browser (`SpeechRecognition`) |
| Traduzione | Endpoint gratuito di Google Translate, con fallback su MyMemory |
| Testo → voce | Sintesi vocale del browser (`speechSynthesis`) |

## Requisiti e limiti

- **Browser:** Google Chrome o Microsoft Edge (Firefox non supporta il riconoscimento vocale; l'input testuale funziona comunque)
- **Internet:** necessario sia per il riconoscimento vocale sia per la traduzione
- I servizi di traduzione gratuiti possono imporre limiti in caso di uso molto intensivo
- La qualità delle voci dipende da quelle installate nel sistema/browser
