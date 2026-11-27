/* Tema do app (/explorar): Claro, Escuro ou Automático.
   Carregado no <head>, antes do CSS pintar, para não piscar. A escolha fica em localStorage
   'ond-app-tema' ('claro' | 'escuro' | 'auto'); sem escolha, fica o claro de sempre.
   'auto' segue o tema do aparelho (prefers-color-scheme) e acompanha a troca ao vivo.
   Também marca a página em <html data-app-pag>, que o assets/explorar-escuro.css usa para as
   regras que só valem numa página. API: window.OndTema.escolha(), .tema(), .definir(escolha).
   No localhost, ?tema=claro|escuro|auto vale só para aquela carga (prints e testes). */
(function () {
  var CHAVE = 'ond-app-tema';
  var COR_BARRA = { claro: '#f8f6fc', escuro: '#0d0d14' };
  var raiz = document.documentElement;
  var midia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var caminho = location.pathname;
  var pagina = /\/explorar\/viagens\/nova/.test(caminho) ? 'nova'
    : /\/explorar\/viagens/.test(caminho) ? 'viagens'
    : /\/explorar\/roteiro/.test(caminho) ? 'roteiro'
    : /\/explorar\/destino/.test(caminho) ? 'destino'
    : /\/explorar\/viajante/.test(caminho) ? 'viajante'
    : 'explorar';
  raiz.setAttribute('data-app-pag', pagina);

  function valida(valor) { return valor === 'claro' || valor === 'escuro' || valor === 'auto' ? valor : null; }
  function lerSalva() {
    try { return valida(localStorage.getItem(CHAVE)) || 'claro'; } catch (erro) { return 'claro'; }
  }
  var teste = null;
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    try { teste = valida(new URLSearchParams(location.search).get('tema')); } catch (erro) {}
  }
  var escolha = teste || lerSalva();

  function temaDe(valor) { return valor === 'auto' ? (midia && midia.matches ? 'escuro' : 'claro') : valor; }

  function aplicar() {
    var tema = temaDe(escolha);
    raiz.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light');
    raiz.style.colorScheme = tema === 'escuro' ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta && document.head) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    if (meta) meta.setAttribute('content', COR_BARRA[tema]);
    try { window.dispatchEvent(new CustomEvent('ond-tema', { detail: { escolha: escolha, tema: tema } })); } catch (erro) {}
  }

  aplicar();

  /* Automático: acompanha o aparelho trocando de tema com a página aberta */
  function aoMudarAparelho() { if (escolha === 'auto') aplicar(); }
  if (midia) {
    if (midia.addEventListener) midia.addEventListener('change', aoMudarAparelho);
    else if (midia.addListener) midia.addListener(aoMudarAparelho);
  }
  /* escolha feita em outra aba */
  window.addEventListener('storage', function (evento) {
    if (evento.key !== CHAVE || teste) return;
    escolha = lerSalva();
    aplicar();
  });

  window.OndTema = {
    escolha: function () { return escolha; },
    tema: function () { return temaDe(escolha); },
    definir: function (valor) {
      valor = valida(valor);
      if (!valor) return;
      escolha = valor;
      teste = null;
      try { localStorage.setItem(CHAVE, valor); } catch (erro) {}
      aplicar();
    }
  };
})();
