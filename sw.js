// Service worker: o app funciona offline. Rede primeiro (pega atualização), cache se estiver sem internet.
// MEXEU EM QUALQUER ARQUIVO DA LISTA? Suba o CACHE, senão o app instalado continua servindo a versão velha.
const CACHE = 'pomodorocat-v0.3.3';
const APP = ['./', './index.html', './app.js', './estado.js', './regras.js', './catalogo.js', './gato.js', './quarto.js', './cena.js', './som.js', './i18n.js', './nuvem.js',
  './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonte = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonte) return;
  e.respondWith(
    fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req)));
});
