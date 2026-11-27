/* Idioma do app (/explorar/): os 10 idiomas do app atual (pt, en, es, fr, it, de, nl, ar, hi, zh).
   Carrega no <head>, antes de tudo. O texto do app continua escrito em português no código; aqui
   cada texto que aparece na tela (e placeholder, aria-label, title, alt) é trocado pela tradução
   de /assets/i18n/app-<idioma>.json. Texto com número usa modelo: "{0} de {1} roteiros" casa com
   "6 de 10 roteiros". Escolha: ?lang=, depois localStorage 'ond-idioma', depois o idioma do
   navegador. Português não carrega nada. */
(function () {
  /* os mesmos 10 idiomas do app Flutter (l10n/*.arb) */
  var IDIOMAS = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français', it: 'Italiano', de: 'Deutsch', nl: 'Nederlands', ar: 'العربية', hi: 'हिन्दी', zh: '中文' };
  var LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL', ar: 'ar', hi: 'hi-IN', zh: 'zh-CN' };
  function escolher() {
    var pedido = (new URLSearchParams(location.search).get('lang') || '').slice(0, 2).toLowerCase();
    if (IDIOMAS[pedido]) { try { localStorage.setItem('ond-idioma', pedido); } catch (error) {} return pedido; }
    try { var salvo = localStorage.getItem('ond-idioma'); if (IDIOMAS[salvo]) return salvo; } catch (error) {}
    var nav = (navigator.languages || [navigator.language || 'pt']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
    for (var i = 0; i < nav.length; i++) if (IDIOMAS[nav[i]]) return nav[i];
    return 'pt';
  }
  var lang = escolher();
  var raiz = document.documentElement;
  raiz.lang = LOCALE[lang];
  if (lang === 'ar') raiz.dir = 'rtl';

  /* transição entre idiomas: some com fade, pede o dicionário novo enquanto isso e a página seguinte entra com fade.
     Só opacidade: transform no body quebraria os menus fixos. A cor de fundo segura o escuro sem piscar branco. */
  var veu = document.createElement('style');
  veu.textContent = 'html.i18n-carregando body{visibility:hidden}' +
    'html.i18n-saindo body{opacity:0;transition:opacity .22s ease}' +
    'html.i18n-entrando body{animation:i18nEntra .32s ease both}' +
    '@keyframes i18nEntra{from{opacity:0}to{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){html.i18n-saindo body{transition:none}html.i18n-entrando body{animation:none}}';
  (document.head || document.documentElement).appendChild(veu);
  var trocou = null;
  try { trocou = sessionStorage.getItem('ond-idioma-troca'); sessionStorage.removeItem('ond-idioma-troca'); } catch (error) {}
  if (trocou) raiz.style.backgroundColor = trocou;
  var entrou = false;
  function entrar() {
    if (entrou || !trocou) return; entrou = true;
    raiz.classList.add('i18n-entrando');
    setTimeout(function () { raiz.classList.remove('i18n-entrando'); raiz.style.backgroundColor = ''; }, 400);
  }
  /* voltar pelo navegador pode trazer a página ainda apagada */
  window.addEventListener('pageshow', function (event) { if (event.persisted) { raiz.classList.remove('i18n-saindo'); raiz.style.backgroundColor = ''; } });

  var exato = {}, modelos = [], faltam = {};
  var NUM = /\d+(?:[.,]\d+)*/g;
  function preencher(texto, vars) { return String(texto).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; }); }
  function traduzir(texto) {
    if (!texto) return texto;
    var limpo = texto.replace(/\s+/g, ' ').trim();
    if (!limpo || !/[A-Za-zÀ-ÿ]/.test(limpo)) return texto;
    var saida = exato[limpo];
    if (saida == null && NUM.test(limpo)) {
      NUM.lastIndex = 0;
      var nums = [], i = 0;
      var chave = limpo.replace(NUM, function (n) { nums.push(n); return '{' + (i++) + '}'; });
      var modelo = exato[chave];
      if (modelo != null) saida = preencher(modelo, nums);
    }
    NUM.lastIndex = 0;
    if (saida == null) {
      for (var m = 0; m < modelos.length; m++) {
        var hit = limpo.match(modelos[m][0]);
        if (hit) { var vars = {}; modelos[m][2].forEach(function (nome, k) { vars[nome] = traduzir(hit[k + 1]); }); saida = preencher(modelos[m][1], vars); break; }
      }
    }
    if (saida == null) { if (/[a-zà-ÿ]/i.test(limpo)) faltam[limpo.replace(NUM, function (n, k) { return '{#}'; })] = 1; NUM.lastIndex = 0; return texto; }
    var antes = texto.match(/^\s*/)[0], depois = texto.match(/\s*$/)[0];
    return antes + saida + depois;
  }

  window.OndIdioma = {
    atual: lang, lista: IDIOMAS, locale: LOCALE[lang],
    /* em código: OndIdioma.t('Texto em português com {nome}', { nome: 'Ana' }) */
    t: function (pt, vars) { return preencher(lang === 'pt' ? pt : (exato[pt] != null ? exato[pt] : pt), vars); },
    trocar: function (novo) {
      if (!IDIOMAS[novo] || novo === lang) return;
      try { localStorage.setItem('ond-idioma', novo); } catch (error) {}
      var url = new URL(location.href); url.searchParams.delete('lang');
      var fundo = getComputedStyle(document.body).backgroundColor;
      if (!fundo || fundo === 'transparent' || fundo === 'rgba(0, 0, 0, 0)') fundo = getComputedStyle(raiz).backgroundColor;
      if (!fundo || fundo === 'rgba(0, 0, 0, 0)') fundo = '#ffffff';
      try { sessionStorage.setItem('ond-idioma-troca', fundo); } catch (error) {}
      raiz.style.backgroundColor = fundo;
      raiz.classList.add('i18n-saindo');
      var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var dicionario = novo === 'pt' ? null : fetch('/assets/i18n/app-' + novo + '.json').catch(function () {});
      var fade = new Promise(function (ok) { setTimeout(ok, reduz ? 0 : 230); });
      var teto = new Promise(function (ok) { setTimeout(ok, 1200); });
      Promise.race([Promise.all([dicionario, fade]), teto]).then(function () { location.href = url.toString(); });
    },
    pronto: Promise.resolve(),
    /* textos que apareceram sem tradução nesta página (para completar o dicionário) */
    faltam: function () { return Object.keys(faltam); }
  };
  if (lang === 'pt') {
    if (trocou) { if (document.body) entrar(); else document.addEventListener('DOMContentLoaded', entrar, { once: true }); }
    return;
  }

  /* esconde a página até o dicionário chegar, para não piscar português (no máximo 2,5 s) */
  raiz.classList.add('i18n-carregando');
  var mostrar = function () { raiz.classList.remove('i18n-carregando'); entrar(); };
  setTimeout(mostrar, 2500);

  var PULAR = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var ATRIBUTOS = ['placeholder', 'aria-label', 'title', 'alt', 'data-tip'];
  var feitos = new WeakMap();
  function pular(el) { return !el || PULAR[String(el.nodeName).toUpperCase()] || (el.closest && el.closest('[data-no-i18n],[contenteditable="true"]')); }
  function textoNo(no) {
    if (pular(no.parentElement)) return;
    var atual = no.nodeValue;
    if (feitos.get(no) === atual) return;
    var novo = traduzir(atual);
    if (novo !== atual) no.nodeValue = novo;
    feitos.set(no, no.nodeValue);
  }
  function atributos(el) {
    /* textarea: o texto digitado fica, mas o placeholder traduz */
    if (el.nodeName === 'TEXTAREA' ? (el.closest && el.closest('[data-no-i18n],[contenteditable="true"]')) : pular(el)) return;
    for (var i = 0; i < ATRIBUTOS.length; i++) {
      var nome = ATRIBUTOS[i], valor = el.getAttribute(nome);
      if (valor) { var novo = traduzir(valor); if (novo !== valor) el.setAttribute(nome, novo); }
    }
    if (el.nodeName === 'INPUT' && /^(button|submit)$/.test(el.type) && el.value) { var v = traduzir(el.value); if (v !== el.value) el.value = v; }
  }
  function varrer(base) {
    if (!base) return;
    if (base.nodeType === 3) return textoNo(base);
    if (base.nodeType !== 1) return;
    if (pular(base)) { if (base.nodeName === 'TEXTAREA') atributos(base); return; }
    atributos(base);
    var walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var no;
    while ((no = walker.nextNode())) { if (no.nodeType === 3) textoNo(no); else atributos(no); }
  }
  var observador = new MutationObserver(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      var m = lista[i];
      if (m.type === 'characterData') textoNo(m.target);
      else if (m.type === 'attributes') atributos(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) varrer(m.addedNodes[j]);
    }
    var titulo = traduzir(document.title); if (titulo !== document.title) document.title = titulo;
  });

  OndIdioma.pronto = fetch('/assets/i18n/app-' + lang + '.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (dic) {
    Object.keys(dic).forEach(function (pt) {
      if (pt.charAt(0) === '~') {
        /* modelo com texto livre: "~Roteiro de {nome} · {dias} dias" */
        var partes = pt.slice(1).split(/\{\w+\}/).map(function (p) { return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
        var nomes = (pt.match(/\{(\w+)\}/g) || []).map(function (n) { return n.slice(1, -1); });
        modelos.push([new RegExp('^' + partes.join('(.+?)') + '$'), dic[pt], nomes]);
      } else exato[pt.replace(/\s+/g, ' ').trim()] = dic[pt];
    });
    var iniciar = function () {
      varrer(document.body);
      document.title = traduzir(document.title);
      observador.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
      mostrar();
    };
    if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  });
})();
