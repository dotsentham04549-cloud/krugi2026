/* КРУГИ — служебный модуль. Правило одно: никогда не оставлять страницу без ответа. */
var CACHE = 'krugi-12';
var CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './fonts/commissioner-cyrillic-400-normal.woff2',
  './fonts/commissioner-cyrillic-500-normal.woff2',
  './fonts/commissioner-cyrillic-600-normal.woff2',
  './fonts/commissioner-latin-400-normal.woff2',
  './fonts/commissioner-latin-500-normal.woff2',
  './fonts/commissioner-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-400-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-500-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './fonts/ibm-plex-mono-latin-600-normal.woff2',
  './fonts/unbounded-cyrillic-500-normal.woff2',
  './fonts/unbounded-cyrillic-700-normal.woff2',
  './fonts/unbounded-latin-500-normal.woff2',
  './fonts/unbounded-latin-700-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(CORE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function fallbackPage() {
  return new Response(
    '<!doctype html><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="margin:0;background:#090A09;color:#F5F7F1;font:16px/1.5 system-ui;padding:28px">' +
    '<p>Сохранённой копии пока нет. Открой приложение один раз с интернетом — дальше оно будет работать без сети.</p>' +
    '<p><a href="./index.html" style="color:#DFFF43">Попробовать ещё раз</a></p>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   /* шрифты не трогаем вовсе */

  e.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var hit = await cache.match(req, { ignoreSearch: true });
    if (!hit && req.mode === 'navigate') hit = await cache.match('./index.html');

    if (hit) {
      fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req.mode === 'navigate' ? './index.html' : req, res.clone());
      }).catch(function () {});
      return hit;
    }
    try {
      var res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      var shell = await cache.match('./index.html');
      return shell || fallbackPage();
    }
  })());
});
