/* Acessibilidade compartilhada das páginas do site: janela de contato, menu do celular, tema e globo.
   Complementa o script inline de cada página sem mudar o comportamento visual. */
(function () {
  var d = document.documentElement;

  /* tema: color-scheme e theme-color acompanham claro/escuro */
  function tema() {
    var claro = d.getAttribute('data-theme') === 'light';
    d.style.colorScheme = claro ? 'light' : 'dark';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', claro ? '#f8f6fc' : '#0d0d14');
  }
  tema();
  new MutationObserver(tema).observe(d, { attributes: true, attributeFilter: ['data-theme'] });

  /* logo sem texto ganha nome */
  document.querySelectorAll('.header-logo, .footer-logo').forEach(function (a) {
    if (!a.getAttribute('aria-label') && !a.textContent.trim()) a.setAttribute('aria-label', 'OND, página inicial');
  });

  /* links que abrem a janela de contato se comportam como botão */
  document.querySelectorAll('a[href="#"][onclick*="openContact"]').forEach(function (a) { a.setAttribute('role', 'button'); });

  /* menu do celular: aria-expanded sincronizado */
  var nav = document.getElementById('mobileNav'), mb = document.querySelector('.header-menu-btn');
  if (nav && mb) {
    mb.setAttribute('aria-controls', 'mobileNav');
    var sync = function () { mb.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); };
    sync(); new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  /* janela de contato: dialog de verdade, foco preso enquanto aberta e devolvido ao fechar */
  var modal = document.getElementById('contactModal');
  if (modal) {
    var tit = modal.querySelector('.contact-modal-title');
    if (tit) { tit.id = tit.id || 'contactTitle'; modal.setAttribute('aria-labelledby', tit.id); }
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
    var x = modal.querySelector('.contact-modal-close'); if (x) { x.setAttribute('aria-label', 'Fechar'); x.type = 'button'; }
    var antes = null, aberto = false;
    var foco = function () { return [].slice.call(modal.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')); };
    var estado = function () {
      var ab = modal.classList.contains('open');
      modal.inert = !ab;
      if (ab && !aberto) { antes = document.activeElement; var f = foco(); if (f[0]) setTimeout(function () { f[0].focus(); }, 30); }
      if (!ab && aberto && antes && antes.focus) antes.focus();
      aberto = ab;
    };
    estado(); new MutationObserver(estado).observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = foco(); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
  }

  /* globo em canvas: imagem com descrição */
  document.querySelectorAll('canvas[data-ond-globo], canvas[aria-label]').forEach(function (c) { if (!c.getAttribute('role')) c.setAttribute('role', 'img'); });
})();
