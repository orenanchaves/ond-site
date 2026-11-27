/* Modo sem internet do app (Premium e Plus). Só age depois que o viajante baixa uma viagem:
   enquanto não existe o cache 'ond-offline', todo pedido segue direto para a rede, como sempre.
   Com ele, cada GET vai primeiro à rede e guarda a resposta; sem rede, responde do cache. */
var CACHE = 'ond-offline';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || !/^https?:/.test(request.url)) return;
  if (/googletagmanager|google-analytics|clarity.ms/.test(request.url)) return;
  /* imagens do mapa (Esri) nunca entram no cache: a licença não permite guardar */
  if (/arcgis(online)?\.com/.test(request.url)) return;
  event.respondWith(caches.has(CACHE).then(function (ligado) {
    if (!ligado) return fetch(request);
    return fetch(request).then(function (response) {
      if (response && (response.ok || response.type === 'opaque')) {
        var copia = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copia); });
      }
      return response;
    }).catch(function () {
      return caches.open(CACHE).then(function (cache) {
        return cache.match(request).then(function (hit) {
          if (hit) return hit;
          if (request.mode === 'navigate') return cache.match(request, { ignoreSearch: true }).then(function (pagina) { return pagina || Response.error(); });
          return Response.error();
        });
      });
    });
  }));
});
