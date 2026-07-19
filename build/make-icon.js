// Genera build/icon.ico multi-risoluzione (dimensioni standard di Windows)
// ridimensionando il PNG dell'app. Richiede solo pacchetti npm, nessun tool esterno.
var fs = require('fs');
var path = require('path');
var pngToIco = require('png-to-ico');
var sharpAvailable = true;
var sharp;
try { sharp = require('sharp'); } catch (e) { sharpAvailable = false; }

var root = path.join(__dirname, '..');
var src = path.join(root, 'icon-512.png');
var out = path.join(__dirname, 'icon.ico');
var SIZES = [16, 24, 32, 48, 64, 128, 256];

if (!fs.existsSync(src)) {
  console.error('Manca ' + src);
  process.exit(1);
}

function withSharp() {
  var tmp = path.join(__dirname, '.tmp-icons');
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
  return Promise.all(
    SIZES.map(function (s) {
      var f = path.join(tmp, s + '.png');
      return sharp(src).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(f).then(function () { return f; });
    })
  ).then(function (files) {
    return pngToIco(files).then(function (buf) {
      fs.writeFileSync(out, buf);
      files.forEach(function (f) { try { fs.unlinkSync(f); } catch (e) {} });
      try { fs.rmdirSync(tmp); } catch (e) {}
      console.log('Creato ' + out + ' (' + buf.length + ' byte) con dimensioni ' + SIZES.join(','));
    });
  });
}

// Riserva: se sharp non c'e, usa solo il PNG 256 gia presente (ico valido ma singola dimensione)
function withoutSharp() {
  var alt = path.join(root, 'icon-192.png');
  return pngToIco([fs.existsSync(alt) ? alt : src]).then(function (buf) {
    fs.writeFileSync(out, buf);
    console.log('Creato ' + out + ' (' + buf.length + ' byte) — installa "sharp" per un ico multi-risoluzione');
  });
}

(sharpAvailable ? withSharp() : withoutSharp()).catch(function (e) {
  console.error('Errore nella creazione dell icona:', e);
  process.exit(1);
});
