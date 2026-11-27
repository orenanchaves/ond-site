/* Tela de carregamento do OND: o símbolo oficial em 3D (camadas empilhadas em profundidade) girando
   devagar, com uma frase embaixo. Uso: ondCarregando('Montando sua viagem', 'Lisboa e Porto').
   Devolve uma função que fecha a tela. Respeita "reduzir movimento" e o tema escuro. */
(function () {
  var PATH = 'M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z';
  var CAMADAS = 24;
  var css =
    '.ond-load{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;background:color-mix(in srgb,var(--bg,#f7f5fb) 82%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);opacity:0;transition:opacity .45s cubic-bezier(.22,1,.36,1)}' +
    '.ond-load.on{opacity:1}' +
    '.ond-load-in{display:flex;flex-direction:column;align-items:center;gap:26px;padding:24px;text-align:center;transform:translateY(8px);transition:transform .6s cubic-bezier(.22,1,.36,1)}' +
    '.ond-load.on .ond-load-in{transform:none}' +
    '.ond-load-cena{position:relative;width:150px;height:150px;perspective:900px}' +
    '.ond-load-3d{position:absolute;inset:0;transform-style:preserve-3d;animation:ond-load-gira 3.2s cubic-bezier(.65,0,.35,1) infinite}' +
    '.ond-load-3d svg{position:absolute;inset:0;width:100%;height:100%;backface-visibility:visible}' +
    '.ond-load-sombra{position:absolute;left:50%;bottom:-8px;width:96px;height:14px;margin-left:-48px;border-radius:50%;background:radial-gradient(closest-side,rgba(41,7,86,.28),transparent);animation:ond-load-sombra 3.2s cubic-bezier(.65,0,.35,1) infinite}' +
    '@keyframes ond-load-gira{0%{transform:rotateX(12deg) rotateY(0) translateY(0)}50%{transform:rotateX(12deg) rotateY(180deg) translateY(-8px)}100%{transform:rotateX(12deg) rotateY(360deg) translateY(0)}}' +
    '@keyframes ond-load-sombra{50%{transform:scaleX(.72);opacity:.55}}' +
    '.ond-load-t{font-size:20px;font-weight:800;color:var(--deep,#290756);margin:0}' +
    '.ond-load-s{font-size:14px;font-weight:600;color:var(--muted,#6b6a6a);margin:6px 0 0;max-width:280px}' +
    '.ond-load-barra{width:140px;height:4px;border-radius:4px;background:color-mix(in srgb,#7f11f4 14%,transparent);overflow:hidden}' +
    '.ond-load-barra i{display:block;height:100%;width:40%;border-radius:4px;background:#7f11f4;animation:ond-load-barra 1.6s cubic-bezier(.65,0,.35,1) infinite}' +
    '@keyframes ond-load-barra{from{transform:translateX(-100%)}to{transform:translateX(250%)}}' +
    '[data-theme="dark"] .ond-load{background:rgba(13,13,20,.86)}' +
    '[data-theme="dark"] .ond-load-t{color:#f0eeff}' +
    '[data-theme="dark"] .ond-load-s{color:#8888b0}' +
    '[data-theme="dark"] .ond-load-sombra{background:radial-gradient(closest-side,rgba(157,111,255,.35),transparent)}' +
    '@media (prefers-reduced-motion:reduce){.ond-load-3d,.ond-load-sombra,.ond-load-barra i{animation:none}.ond-load-3d{transform:rotateX(12deg) rotateY(-24deg)}}';

  function camadas() {
    var html = '<defs><linearGradient id="ond-load-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9d6fff"/><stop offset="1" stop-color="#7f11f4"/></linearGradient></defs>';
    var out = '';
    for (var i = 0; i < CAMADAS; i++) {
      var z = (i - (CAMADAS - 1) / 2) * 0.95;
      var frente = i === CAMADAS - 1, tras = i === 0;
      /* o miolo escurece para dar volume; frente e verso usam o degradê do símbolo */
      var cor = frente || tras ? 'url(#ond-load-g)' : '#5a0cb3';
      out += '<svg viewBox="0 0 497.26 497.26" aria-hidden="true" style="transform:translateZ(' + z.toFixed(1) + 'px)">' + (frente || tras ? html : '') + '<path fill="' + cor + '" d="' + PATH + '"/></svg>';
    }
    return out;
  }
  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.ondCarregando = function (titulo, sub) {
    if (!document.getElementById('ond-load-css')) {
      var style = document.createElement('style'); style.id = 'ond-load-css'; style.textContent = css; document.head.appendChild(style);
    }
    var box = document.createElement('div');
    box.className = 'ond-load'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<div class="ond-load-in"><div class="ond-load-cena"><div class="ond-load-3d">' + camadas() + '</div><span class="ond-load-sombra"></span></div>' +
      '<div><p class="ond-load-t">' + esc(titulo) + '</p>' + (sub ? '<p class="ond-load-s">' + esc(sub) + '</p>' : '') + '</div><span class="ond-load-barra"><i></i></span></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('on'); }); });
    return function fechar() { box.classList.remove('on'); setTimeout(function () { box.remove(); }, 460); };
  };
})();
