/* Baixar uma viagem para usar sem internet (Premium e Plus). Liga o service worker de
   /explorar/sw-offline.js, abre por trás o roteiro, o PDF e a página de cada destino da viagem para
   que tudo o que eles carregam fique guardado, e baixa o mapa da região. A lista do que foi baixado
   fica em localStorage 'ond-offline-viagens'. O mapa fica de fora: a licença da Esri não permite
   guardar as imagens do mapa fora dos produtos pagos dela. Sem sinal, o roteiro abre sem o mapa. */
(function () {
  var CACHE = 'ond-offline', CHAVE = 'ond-offline-viagens';
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (error) { return {}; } }
  function gravar(lista) { try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (error) {} }
  function suportado() { return 'serviceWorker' in navigator && 'caches' in window; }
  function semAcento(texto) { return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

  function registrar() {
    return navigator.serviceWorker.register('/explorar/sw-offline.js', { scope: '/explorar/' }).then(function () {
      if (navigator.serviceWorker.controller) return;
      return new Promise(function (resolve) {
        navigator.serviceWorker.addEventListener('controllerchange', function () { resolve(); }, { once: true });
        setTimeout(resolve, 4000);
      });
    });
  }
  /* abre a página escondida e espera ela carregar tudo (scripts, dados e mapa) */
  function visitar(url, espera) {
    return new Promise(function (resolve) {
      var frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
      frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none';
      var fim = function () { setTimeout(function () { frame.remove(); resolve(); }, espera || 2500); };
      frame.addEventListener('load', fim, { once: true });
      setTimeout(function () { if (frame.isConnected) { frame.remove(); resolve(); } }, 20000);
      frame.src = url;
      document.body.appendChild(frame);
    });
  }
  function cidadesDa(trip) {
    var nomes = [];
    (trip.stays || []).forEach(function (stay) { if (stay.city && nomes.indexOf(stay.city) < 0) nomes.push(stay.city); });
    if (!nomes.length && trip.city) nomes.push(trip.city);
    return nomes;
  }
  function tamanho() {
    if (!(navigator.storage && navigator.storage.estimate)) return Promise.resolve(0);
    return navigator.storage.estimate().then(function (info) { return info.usage || 0; }).catch(function () { return 0; });
  }

  window.OndOffline = {
    suportado: suportado,
    info: function (id) { return ler()[id] || null; },
    cidades: cidadesDa,
    /* passo a passo com progresso: onPasso(texto, fracao) */
    baixar: function (trip, onPasso) {
      var passo = onPasso || function () {};
      if (!suportado()) return Promise.reject(new Error('sem suporte'));
      var cidades = cidadesDa(trip), feito = 0;
      var total = 3 + cidades.length;
      var anda = function (texto) { feito++; passo(texto, Math.min(1, feito / total)); };
      passo('Preparando', 0);
      return caches.open(CACHE).then(registrar).then(function () {
        anda('Guardando o roteiro');
        return visitar('/explorar/roteiro/?id=' + encodeURIComponent(trip.id), 3500);
      }).then(function () {
        anda('Guardando o PDF');
        return visitar('/explorar/roteiro/pdf/?id=' + encodeURIComponent(trip.id), 2000);
      }).then(function () {
        return cidades.reduce(function (corrente, cidade) {
          return corrente.then(function () { anda('Guardando ' + cidade); return visitar('/explorar/destino/?cidade=' + encodeURIComponent(semAcento(cidade)), 3000); });
        }, Promise.resolve());
      }).then(tamanho).then(function (bytes) {
        anda('Pronto');
        var lista = ler();
        lista[trip.id] = { titulo: trip.title, cidades: cidades, bytes: bytes, quando: new Date().toISOString() };
        gravar(lista);
        return lista[trip.id];
      });
    },
    remover: function (id) {
      var lista = ler(); delete lista[id]; gravar(lista);
      if (Object.keys(lista).length) return Promise.resolve();
      return caches.delete(CACHE).then(function () {});
    }
  };
})();
