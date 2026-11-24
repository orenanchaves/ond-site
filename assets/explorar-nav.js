/* Navegação das páginas /explorar. No celular: topo com menu, logo e busca. Nas páginas de destino
   e de perfil, também a barra lateral e o topo do desktop. Uso: <script src="/assets/explorar-nav.js"
   data-page="explorar|destino|viajante" data-shell="sim|nao"></script> */
(function () {
  var script = document.currentScript;
  var page = (script && script.dataset.page) || 'explorar';
  var withShell = script && script.dataset.shell === 'sim';
  if (script && script.dataset.wrap === 'sim' && !document.querySelector('body > .nv-content')) {
    var wrapper = document.createElement('div');
    wrapper.className = 'nv-content';
    while (document.body.firstChild) wrapper.appendChild(document.body.firstChild);
    document.body.appendChild(wrapper);
    document.body.classList.add('nv-casca-' + page);
    document.documentElement.setAttribute('data-theme', 'light');
    /* dentro da casca, "Início" é o Explorar do app, não a home do site */
    Array.prototype.forEach.call(wrapper.querySelectorAll('a[href="/"], a[href="/index.html"]'), function (link) { link.setAttribute('href', '/explorar/'); });
  }
  var API = 'https://ond.agamatec.com/api/countries?locale=pt_BR';
  var DEMO_HOST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var CONTA_TESTE = { name: 'Marina Duarte', initials: 'MD', color: '#7f11f4', handle: 'marina.viaja' };
  /* ?conta=teste ou ?conta=sair escolhe a versão logada ou não logada nesta aba (dá para ver as duas lado a lado) */
  var contaParam = new URLSearchParams(location.search).get('conta');
  if (DEMO_HOST && (contaParam === 'teste' || contaParam === 'sair')) { try { sessionStorage.setItem('ond-conta-modo', contaParam); } catch (error) {} }
  window.ondTemConta = function () { try { if (!/^(localhost|127.0.0.1)$/.test(location.hostname)) return false; var modo = sessionStorage.getItem('ond-conta-modo'); if (modo) return modo === 'teste'; return localStorage.getItem('ond-conta-demo') === '1'; } catch (error) { return false; } };
  window.ondConta = function () { return window.ondTemConta() ? CONTA_TESTE : null; };
  /* Plano da conta: Free, Premium ou Plus (o Plus é o Premium com mais roteiros do vAI). No protótipo,
     ?conta=free, ?conta=premium e ?conta=plus entram na conta de
     teste já no plano escolhido, nesta aba (dá para ver as duas lado a lado). Os números ficam em LIMITES. */
  var planoParam = contaParam === 'free' || contaParam === 'premium' || contaParam === 'plus' ? contaParam : '';
  if (DEMO_HOST && planoParam) { try { sessionStorage.setItem('ond-conta-modo', 'teste'); sessionStorage.setItem('ond-plano', planoParam); } catch (error) {} }
  var LIMITES = { importar: 0, vai: 3, pessoas: 1 };
  var LIMITES_PREMIUM = { vai: 10, pessoas: 5 };
  var LIMITES_PLUS = { vai: 30, pessoas: 10 };
  var VIAGENS_DA_CONTA_TESTE = 3;
  function mesAtual() { return new Date().toISOString().slice(0, 7); }
  function lerUso() { try { return JSON.parse(localStorage.getItem('ond-plano-uso')) || {}; } catch (error) { return {}; } }
  window.OndPlano = {
    plano: function () { var p = ''; try { p = sessionStorage.getItem('ond-plano') || localStorage.getItem('ond-plano') || ''; } catch (error) {} return p === 'premium' || p === 'plus' ? p : 'free'; },
    premium: function () { return this.plano() !== 'free'; },
    plus: function () { return this.plano() === 'plus'; },
    limite: function (chave) { var p = this.plano(); return (p === 'plus' ? LIMITES_PLUS : p === 'premium' ? LIMITES_PREMIUM : LIMITES)[chave]; },
    usado: function (chave) {
      if (chave === 'viagens') { var criadas = []; try { criadas = JSON.parse(localStorage.getItem('ond_comunidade_viagens_criadas')) || []; } catch (error) {} return VIAGENS_DA_CONTA_TESTE + criadas.length; }
      var uso = lerUso()[mesAtual()] || {}; return uso[chave] || 0;
    },
    pode: function (chave) { if (!window.ondTemConta()) return true; var teto = this.limite(chave); return teto == null || this.usado(chave) < teto; },
    usar: function (chave) { if (this.limite(chave) == null || chave === 'viagens') return; var uso = lerUso(), mes = mesAtual(); uso[mes] = uso[mes] || {}; uso[mes][chave] = (uso[mes][chave] || 0) + 1; try { localStorage.setItem('ond-plano-uso', JSON.stringify(uso)); } catch (error) {} },
    trocar: function (plano) { try { sessionStorage.setItem('ond-plano', plano); localStorage.setItem('ond-plano', plano); } catch (error) {} location.reload(); },
    pedir: function (chave) { abrirPlanos((chave === 'vai' || chave === 'pessoas') && this.plano() === 'premium' ? chave + 'Premium' : chave); }
  };
  /* Modelos de roteiro: o viajante salva uma viagem como modelo e pode publicar para a comunidade.
     O vAI procura um modelo ou roteiro pronto antes de gerar, porque pronto não gasta IA.
     No protótipo ficam neste navegador (ond-modelos); publicado vira público quando houver servidor. */
  function semAcento(texto) { return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  window.OndModelos = {
    COMISSAO: 0.2,
    comprados: function () { try { return JSON.parse(localStorage.getItem('ond-modelos-comprados')) || []; } catch (error) { return []; } },
    comprar: function (id) { var lista = this.comprados(); if (lista.indexOf(id) < 0) lista.push(id); try { localStorage.setItem('ond-modelos-comprados', JSON.stringify(lista)); } catch (error) {} },
    listar: function () { try { return JSON.parse(localStorage.getItem('ond-modelos')) || []; } catch (error) { return []; } },
    salvar: function (modelo) {
      var lista = this.listar().filter(function (item) { return item.id !== modelo.id; });
      lista.unshift(modelo);
      try { localStorage.setItem('ond-modelos', JSON.stringify(lista)); } catch (error) {}
      return modelo;
    },
    /* melhor roteiro para as cidades pedidas: precisa ter a primeira, ganha quem cobre mais e sobra menos */
    acharPara: function (cidades) {
      var alvo = cidades.map(semAcento).filter(Boolean);
      if (!alvo.length) return null;
      var melhor = null, nota = -1;
      this.listar().concat(window.OND_PRONTOS || []).forEach(function (tpl, ordem) {
        var nomes = (tpl.stops || []).map(function (stop) { return semAcento(stop.city); });
        if (nomes.indexOf(alvo[0]) < 0) return;
        var cobre = alvo.filter(function (nome) { return nomes.indexOf(nome) >= 0; }).length;
        var pontos = cobre * 100 - (nomes.length - cobre) * 10 - ordem * 0.01;
        if (pontos > nota) { nota = pontos; melhor = tpl; }
      });
      return melhor;
    }
  };
  var PLANO_TITULOS = {
    viagens: ['Você chegou às 3 viagens do Free', 'Com o Premium você cria quantas viagens quiser.'],
    importar: ['Importar roteiro é do Premium', 'Traga um PDF, um .md, uma planilha ou um texto e ele vira roteiro OND.'],
    offline: ['Usar sem internet é do Premium', 'Guarde a viagem inteira no aparelho, com destinos e PDF, e abra sem sinal.'],
    vender: ['Vender roteiros é do Plus', 'Publique seu roteiro com preço e receba a cada venda.'],
    vai: ['Você já usou os roteiros do OND vAI deste mês', 'Com o Premium o OND vAI monta 10 roteiros por mês.'],
    pessoas: ['Compartilhar com mais gente é do Premium', 'No Free a viagem tem 1 pessoa convidada. No Premium cabem até 5, e no Plus até 10.'],
    pessoasPremium: ['Sua viagem chegou a 5 pessoas convidadas', 'No Plus cabem até 10 pessoas na mesma viagem.'],
    vaiPremium: ['Você já usou os 10 roteiros deste mês', 'Com o Plus o OND vAI monta 30 roteiros por mês.'],
    geral: ['Viaje mais. Planeje menos.', 'Escolha como quer usar o OND.']
  };
  /* Preços: sugestão para o protótipo. Por viagem são os avulsos que o app já vende na App Store
     (consulta de 23/11/2026). Mensal e anual ainda não existem à venda. */
  var PRECOS = { mensal: '14,90', anual: '119,90', anualMes: '9,99', economia: '33%' };
  var PRECOS_PLUS = { mensal: '29,90', anual: '239,90', anualMes: '19,99' };
  var AVULSOS = [['Curta', '19,90'], ['Média', '29,90'], ['Longa', '49,90'], ['Estendida', '69,90']];
  var PLANO_FREE = [
    [1, 'Viagens sem limite, montadas do seu jeito'], [1, 'Roteiros prontos e modelos da comunidade'], [1, 'Destinos, avaliações, mapa e blog'],
    [1, '3 roteiros do OND vAI por mês'], [1, 'Compartilhar a viagem com 1 pessoa'], [1, 'Concierge com 3 respostas'], [0, 'Importar PDF, .md e outros arquivos'],
    [0, 'Roteiro inteiro sem internet'], [0, 'Áudio guia completo'], [0, 'Suporte com prioridade']
  ];
  var PLANO_PREMIUM = [
    '10 roteiros do OND vAI por mês', 'Compartilhar a viagem com até 5 pessoas', 'Importar PDF, .md e outros arquivos', 'Concierge sem limite durante a viagem',
    'Roteiro inteiro sem internet, com destinos e PDF', 'Áudio guia completo', 'Todos os modelos de imagem do passaporte', 'Suporte com prioridade'
  ];
  var PLANO_PLUS = ['30 roteiros do OND vAI por mês', 'Tudo o que o Premium tem', 'Compartilhar a viagem com até 10 pessoas', 'Venda seus roteiros na comunidade', 'Concierge com a equipe OND, de pessoa para pessoa', 'Acesso antes de todo mundo ao que for lançado'];
  var IC_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var IC_TRAVA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function tagPlano() { var plano = window.OndPlano.plano(); return '<span class="nv-plano-tag' + (plano !== 'free' ? ' premium' : '') + '">' + ({ free: 'Free', premium: 'Premium', plus: 'Plus' })[plano] + '</span>'; }
  var planosEl = null;
  function abrirPlanos(chave) {
    var textos = PLANO_TITULOS[chave] || PLANO_TITULOS.geral;
    var premium = window.OndPlano.premium();
    if (!planosEl) {
      planosEl = document.createElement('div');
      planosEl.className = 'nv-planos'; planosEl.setAttribute('role', 'dialog'); planosEl.setAttribute('aria-modal', 'true'); planosEl.setAttribute('aria-labelledby', 'nv-planos-t');
      planosEl.innerHTML = '<div class="nv-planos-card"><button type="button" class="nv-login-x" data-planos-fechar aria-label="Fechar">' + ICONS.fechar + '</button>' +
        '<header class="nv-planos-topo"><span class="nv-planos-orb">' + ICONS.vai + '</span><h2 id="nv-planos-t"></h2><p class="nv-planos-sub"></p>' +
        '<div class="nv-planos-periodo" role="radiogroup" aria-label="Cobrança do Premium"><i></i><button type="button" role="radio" data-periodo="mensal">Mensal</button><button type="button" role="radio" data-periodo="anual">Anual <span>-' + PRECOS.economia + '</span></button></div></header>' +
        '<div class="nv-planos-cols">' +
          '<section class="nv-pl nv-pl-free"><h3>Free</h3><p class="nv-pl-preco"><b>R$ 0</b></p><small class="nv-pl-nota">Para sempre</small>' +
            '<ul>' + PLANO_FREE.map(function (item) { return '<li class="' + (item[0] ? '' : 'trava') + '">' + (item[0] ? IC_OK : IC_TRAVA) + item[1] + '</li>'; }).join('') + '</ul>' +
            '<button type="button" class="nv-pl-btn linha" data-pl-free></button></section>' +
          '<section class="nv-pl nv-pl-premium"><h3>Premium</h3><p class="nv-pl-preco"><small>R$</small><b data-pl-valor></b><small>/mês</small></p><small class="nv-pl-nota" data-pl-nota></small>' +
            '<ul>' + PLANO_PREMIUM.map(function (item) { return '<li>' + IC_OK + item + '</li>'; }).join('') + '</ul>' +
            '<button type="button" class="nv-pl-btn" data-planos-assinar="premium">Assinar o Premium</button></section>' +
          '<section class="nv-pl nv-pl-plus"><h3>Plus</h3><p class="nv-pl-preco"><small>R$</small><b data-pl-valor-plus></b><small>/mês</small></p><small class="nv-pl-nota" data-pl-nota-plus></small>' +
            '<ul>' + PLANO_PLUS.map(function (item) { return '<li>' + IC_OK + item + '</li>'; }).join('') + '</ul>' +
            '<button type="button" class="nv-pl-btn linha" data-planos-assinar="plus">Assinar o Plus</button></section>' +
        '</div>' +
          '<section class="nv-pl nv-pl-viagem"><h3>Por viagem</h3><p class="nv-pl-preco"><small>a partir de R$</small><b>' + AVULSOS[0][1] + '</b></p><small class="nv-pl-nota">Pagamento único, sem assinatura</small>' +
            '<p class="nv-pl-txt">O Premium inteiro durante uma viagem. O valor depende de quantos dias ela tem.</p>' +
            '<ul class="nv-pl-faixas">' + AVULSOS.map(function (item) { return '<li><span>' + item[0] + '</span><b>R$ ' + item[1] + '</b></li>'; }).join('') + '</ul></section>' +
        (DEMO_HOST ? '<small class="nv-planos-demo">Assinatura de teste, sem cobrança.</small>' : '') + '</div>';
      document.body.appendChild(planosEl);
      planosEl.addEventListener('click', function (event) {
        var periodo = event.target.closest('[data-periodo]');
        if (periodo) { definirPeriodo(periodo.dataset.periodo); return; }
        if (event.target === planosEl || event.target.closest('[data-planos-fechar]')) fecharPlanos();
        else if (event.target.closest('[data-planos-assinar]')) window.OndPlano.trocar(event.target.closest('[data-planos-assinar]').dataset.planosAssinar);
        else if (event.target.closest('[data-pl-free]') && window.OndPlano.premium()) window.OndPlano.trocar('free');
      });
      document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && planosEl.classList.contains('on')) fecharPlanos(); });
      definirPeriodo('anual');
    }
    planosEl.querySelector('h2').textContent = textos[0];
    planosEl.querySelector('.nv-planos-sub').textContent = textos[1];
    var botaoFree = planosEl.querySelector('[data-pl-free]');
    botaoFree.textContent = premium ? 'Voltar para o Free' : 'Seu plano atual';
    botaoFree.disabled = !premium || !DEMO_HOST;
    var plano = window.OndPlano.plano();
    [['premium', 'Premium'], ['plus', 'Plus']].forEach(function (par) {
      var botao = planosEl.querySelector('[data-planos-assinar="' + par[0] + '"]');
      botao.textContent = plano === par[0] ? 'Seu plano atual' : plano === 'free' ? 'Assinar o ' + par[1] : 'Trocar para o ' + par[1];
      botao.disabled = plano === par[0];
    });
    requestAnimationFrame(function () { planosEl.classList.add('on'); planosEl.querySelector('.nv-planos-card').scrollTop = 0; var alvo = planosEl.querySelector('[data-planos-assinar]:not([disabled])') || planosEl.querySelector('.nv-login-x'); alvo.focus({ preventScroll: true }); });
    document.documentElement.classList.add('nv-planos-aberto');
  }
  function definirPeriodo(periodo) {
    var anual = periodo === 'anual';
    planosEl.querySelector('.nv-planos-periodo').classList.toggle('anual', anual);
    Array.prototype.forEach.call(planosEl.querySelectorAll('[data-periodo]'), function (botao) { botao.setAttribute('aria-checked', String(botao.dataset.periodo === periodo)); });
    planosEl.querySelector('[data-pl-valor]').textContent = anual ? PRECOS.anualMes : PRECOS.mensal;
    planosEl.querySelector('[data-pl-nota]').textContent = anual ? 'R$ ' + PRECOS.anual + ' por ano' : 'Cobrado todo mês, cancele quando quiser';
    planosEl.querySelector('[data-pl-valor-plus]').textContent = anual ? PRECOS_PLUS.anualMes : PRECOS_PLUS.mensal;
    planosEl.querySelector('[data-pl-nota-plus]').textContent = anual ? 'R$ ' + PRECOS_PLUS.anual + ' por ano' : 'Cobrado todo mês, cancele quando quiser';
  }
  function fecharPlanos() { planosEl.classList.remove('on'); document.documentElement.classList.remove('nv-planos-aberto'); }
  /* Nova viagem no limite do grátis: mostra os planos antes de abrir a tela */
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="/explorar/viagens/nova/"]');
    if (!link || event.metaKey || event.ctrlKey || !window.ondTemConta() || window.OndPlano.pode('viagens')) return;
    event.preventDefault(); abrirPlanos('viagens');
  }, true);
  document.addEventListener('click', function (event) { if (event.target.closest && event.target.closest('[data-plano-free]')) window.OndPlano.trocar('free'); });
  document.addEventListener('click', function (event) { if (event.target.closest && event.target.closest('[data-planos-abrir]')) { event.preventDefault(); abrirPlanos('geral'); } });
  function avatarConta(size) { return '<span class="nv-av" style="--av:' + size + 'px;background:' + CONTA_TESTE.color + '">' + CONTA_TESTE.initials + '</span>'; }
  function sairConta() { try { localStorage.removeItem('ond-conta-demo'); sessionStorage.setItem('ond-conta-modo', 'sair'); } catch (error) {} location.reload(); }
  function entrarConta() { try { localStorage.setItem('ond-conta-demo', '1'); sessionStorage.setItem('ond-conta-modo', 'teste'); } catch (error) {} location.reload(); }
  var stroke = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    explorar: '<svg viewBox="0 0 24 24" ' + stroke + '><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    avaliacoes: '<svg viewBox="0 0 24 24" ' + stroke + '><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    mundo: '<svg viewBox="0 0 24 24" ' + stroke + '><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    viagens: '<svg viewBox="0 0 24 24" ' + stroke + '><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5"/></svg>',
    passaporte: '<svg viewBox="0 0 24 24" ' + stroke + '><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/></svg>',
    interesses: '<svg viewBox="0 0 24 24" ' + stroke + '><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    blog: '<svg viewBox="0 0 24 24" ' + stroke + '><path d="M12 6.5C10.3 5.2 7.9 4.5 4 4.5v14c3.9 0 6.3.7 8 2 1.7-1.3 4.1-2 8-2v-14c-3.9 0-6.3.7-8 2z"/><path d="M12 6.5v14"/></svg>',
    vai: '<span class="vai-orb"><svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg></span>',
    menu: '<svg viewBox="0 0 24 24" ' + stroke + '><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  var LINKS = [
    { key: 'explorar', label: 'Destinos', href: '/explorar/' },
    { key: 'avaliacoes', label: 'Guia', href: '/explorar/avaliacoes/' },
    { key: 'viagens', label: 'Minhas viagens', href: '/explorar/viagens/' },
    { key: 'interesses', label: 'Interesses', href: '/explorar/viajante/#interesses' },
    { key: 'passaporte', label: 'Meu passaporte', href: '/explorar/viajante/' },
    { key: 'blog', label: 'Blog do OND', href: '/blog.html' },
    { key: 'vai', label: 'OND vAI', href: 'https://web.ondviajar.com.br/ond-vai' }
  ];
  /* a busca de destino só aparece na página Destinos */
  if (page !== 'explorar') document.documentElement.classList.add('nv-sem-busca');
  var activeKey = page === 'avaliacoes' ? 'avaliacoes' : page === 'viajante' ? 'passaporte' : page === 'destino' ? 'explorar' : page === 'blog' ? 'blog' : page === 'viagens' ? 'viagens' : 'explorar';

  function element(html) { var holder = document.createElement('div'); holder.innerHTML = html.trim(); return holder.firstChild; }

  var mobileTop = element('<header class="nv-mtop">' +
    '<a class="nv-brand" href="/explorar/" aria-label="OND, explorar"><img src="/assets/ond-logo.png" alt="OND">' + (window.ondTemConta() ? tagPlano() : '') + '</a>' +
    '<button type="button" class="nv-open-search" aria-label="Buscar destino">' + ICONS.busca + '</button>' +
    '<button type="button" class="nv-open-menu" aria-label="Abrir menu" aria-expanded="false">' + ICONS.menu + '</button></header>');
  document.body.insertBefore(mobileTop, document.body.firstChild);

  /* idioma do app: os nomes ficam no próprio idioma e não passam pela tradução */
  function seletorIdioma(classe) {
    var I18N = window.OndIdioma; if (!I18N) return '';
    return '<button type="button" class="' + classe + '" data-idioma-abrir aria-haspopup="listbox" aria-expanded="false"><svg class="nv-idioma-globo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' +
      '<span class="nv-idioma-rot">Idioma</span><span class="nv-idioma-cod" data-no-i18n>' + I18N.atual.toUpperCase() + '</span>' +
      '<svg class="nv-idioma-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>';
  }
  /* lista de idiomas: uma só, presa ao body, posicionada junto do botão que abriu */
  var idiomaPop = null, idiomaDono = null;
  function fecharIdioma(devolverFoco) {
    if (!idiomaPop || idiomaPop.hidden) return;
    idiomaPop.hidden = true;
    if (idiomaDono) { idiomaDono.setAttribute('aria-expanded', 'false'); if (devolverFoco) idiomaDono.focus(); }
    idiomaDono = null;
  }
  function abrirIdioma(botao) {
    var I18N = window.OndIdioma; if (!I18N) return;
    if (!idiomaPop) {
      idiomaPop = document.createElement('div');
      idiomaPop.className = 'nv-idi-pop'; idiomaPop.hidden = true;
      idiomaPop.setAttribute('role', 'listbox'); idiomaPop.setAttribute('aria-label', 'Idioma'); idiomaPop.setAttribute('data-no-i18n', '');
      idiomaPop.innerHTML = Object.keys(I18N.lista).map(function (cod) {
        var on = cod === I18N.atual;
        return '<button type="button" role="option" aria-selected="' + on + '" class="nv-idi-op' + (on ? ' on' : '') + '" data-lang="' + cod + '" lang="' + cod + '">' +
          '<span class="nv-idi-cod">' + cod.toUpperCase() + '</span><span class="nv-idi-nome">' + I18N.lista[cod] + '</span>' +
          '<svg class="nv-idi-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>';
      }).join('');
      document.body.appendChild(idiomaPop);
      idiomaPop.addEventListener('click', function (event) { var op = event.target.closest('[data-lang]'); if (op) { fecharIdioma(false); if (op.dataset.lang !== I18N.atual) I18N.trocar(op.dataset.lang); } });
      idiomaPop.addEventListener('keydown', function (event) {
        var ops = Array.prototype.slice.call(idiomaPop.querySelectorAll('[data-lang]')); var i = ops.indexOf(document.activeElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); ops[(i + (event.key === 'ArrowDown' ? 1 : ops.length - 1)) % ops.length].focus(); }
        else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); ops[event.key === 'Home' ? 0 : ops.length - 1].focus(); }
        else if (event.key === 'Escape' || event.key === 'Tab') { if (event.key === 'Escape') event.preventDefault(); fecharIdioma(event.key === 'Escape'); }
      });
    }
    idiomaDono = botao; botao.setAttribute('aria-expanded', 'true');
    idiomaPop.hidden = false;
    var r = botao.getBoundingClientRect(), alto = idiomaPop.offsetHeight, largo = idiomaPop.offsetWidth, vw = window.innerWidth, vh = window.innerHeight;
    var lado = document.documentElement.classList.contains('nv-mini') && botao.classList.contains('nv-idioma-lateral');
    var top, left;
    if (lado) { left = r.right + 12; top = Math.min(r.bottom, vh - 12) - alto; }
    else {
      left = document.documentElement.dir === 'rtl' ? r.right - largo : r.left;
      top = (vh - r.bottom - 8 >= alto + 12) ? r.bottom + 8 : r.top - 8 - alto;
    }
    idiomaPop.style.left = Math.max(12, Math.min(left, vw - largo - 12)) + 'px';
    idiomaPop.style.top = Math.max(12, top) + 'px';
    var atual = idiomaPop.querySelector('.on') || idiomaPop.querySelector('[data-lang]'); if (atual) atual.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (event) {
    var botao = event.target.closest && event.target.closest('[data-idioma-abrir]');
    if (botao) { event.preventDefault(); if (idiomaDono === botao) fecharIdioma(false); else { fecharIdioma(false); abrirIdioma(botao); } return; }
    if (idiomaPop && !idiomaPop.hidden && !idiomaPop.contains(event.target)) fecharIdioma(false);
  });
  window.addEventListener('resize', function () { fecharIdioma(false); });
  document.addEventListener('scroll', function (event) { if (idiomaPop && !idiomaPop.contains(event.target)) fecharIdioma(false); }, true);
  document.addEventListener('change', function (event) { var sel = event.target.closest && event.target.closest('select[data-idioma]'); if (sel && window.OndIdioma) window.OndIdioma.trocar(sel.value); });
  var drawer = element('<nav class="nv-drawer" aria-label="Menu" aria-hidden="true">' +
    '<div class="nv-drawer-head"><a href="/explorar/" aria-label="OND, página inicial"><img src="/assets/ond-logo.png" alt="OND"></a><button type="button" class="nv-close-menu" aria-label="Fechar menu">' + ICONS.fechar + '</button></div>' +
    LINKS.map(function (link, index) {
      return '<a class="nv-link' + (link.key === activeKey ? ' on' : '') + '" data-key="' + link.key + '" href="' + link.href + '" style="transition-delay:' + (60 + index * 40) + 'ms">' + ICONS[link.key] + link.label + '</a>';
    }).join('') +
    seletorIdioma('nv-idioma nv-idioma-gaveta') + '<a class="nv-enter" href="https://web.ondviajar.com.br/">Entrar</a></nav>');
  var tabs = [
    { key: 'explorar', label: 'Destinos', href: '/explorar/' },
    { key: 'avaliacoes', label: 'Guia', href: '/explorar/avaliacoes/' },
    { key: 'vai', label: 'OND vAI', href: 'https://web.ondviajar.com.br/ond-vai', center: true },
    { key: 'passaporte', label: 'Passaporte', href: '/explorar/viajante/' },
    { key: 'viagens', label: 'Viagens', href: '/explorar/viagens/' }
  ];
  var bottomNav = element('<nav class="nv-bottom" aria-label="Navegação principal">' + tabs.map(function (tab) {
    if (tab.center) return '<a class="nv-tab nv-center" href="' + tab.href + '" aria-label="Planejar com o OND vAI">' + ICONS.vai.replace('class="vai-orb"', 'class="vai-orb nv-orb"') + '<span>' + tab.label + '</span></a>';
    return '<a class="nv-tab' + (tab.key === activeKey ? ' on' : '') + '" data-tab="' + tab.key + '" href="' + tab.href + '">' + ICONS[tab.key] + '<span>' + tab.label + '</span></a>';
  }).join('') + '</nav>');
  document.body.appendChild(bottomNav);
  document.body.classList.add('nv-has-bottom');
  if (page === 'explorar') {
    var watched = ['topo', 'mundo', 'viagens'];
    var markTab = function () {
      var current = 'explorar';
      ['mundo', 'viagens'].forEach(function (id) {
        var section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top < window.innerHeight * 0.45) current = id;
      });
      bottomNav.querySelectorAll('[data-tab]').forEach(function (tab) { tab.classList.toggle('on', tab.dataset.tab === current); });
    };
    window.addEventListener('scroll', markTab, { passive: true });
    markTab();
  }
  var footer = element('<footer class="nv-footer"><div class="nv-footer-in">' +
    '<div class="nv-footer-brand"><svg viewBox="0 0 951.32 497.26" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OND"><use href="#ond-logo"/></svg><p>Organize, planeje e compre sua viagem com o OND!<br>Passagens, hospedagem e passeios.</p></div>' +
    '<div class="nv-footer-col"><h3>Viajantes</h3><ul><li><a href="https://web.ondviajar.com.br/ond-vai" target="_blank" rel="noopener">Usar na Web</a></li><li><a href="https://play.google.com/store/apps/details?id=com.agamatec.ond" target="_blank" rel="noopener">App Android</a></li><li><a href="https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427" target="_blank" rel="noopener">App iOS</a></li><li><a href="/viagens/">Viagens</a></li><li><a href="/busca/">Buscar</a></li><li><a href="/explorar/#como-funciona">Como funciona</a></li></ul></div>' +
    '<div class="nv-footer-col"><h3>Especialidades</h3><ul><li><a href="/lua-de-mel/">Lua de mel</a></li><li><a href="/excursoes/">Excursões e grupos</a></li></ul></div>' +
    '<div class="nv-footer-col"><h3>Parceiros</h3><ul><li><a href="/agencias.html">Para agências</a></li></ul></div>' +
    '<div class="nv-footer-col"><h3>Empresa</h3><ul><li><a href="/contato/">Contato</a></li><li><a href="mailto:renan@ondviajar.com.br">renan@ondviajar.com.br</a></li><li><a href="https://wa.me/5511943615412" target="_blank" rel="noopener">WhatsApp</a></li></ul></div>' +
    '</div><div class="nv-footer-bottom"><span>© 2026 OND · CNPJ 39.360.492/0001-61 · Agência de turismo cadastrada no Cadastur</span><span>Quem viaja com o OND não volta igual</span></div></footer>');
  (document.querySelector('.main') || document.querySelector('.nv-content') || document.body).appendChild(footer);
  var scrim = element('<div class="nv-scrim"></div>');
  document.body.appendChild(scrim);
  document.body.appendChild(drawer);

  var search = element('<div class="nv-search" role="dialog" aria-modal="true" aria-label="Buscar destino" aria-hidden="true">' +
    '<div class="nv-search-bar"><label class="nv-search-field">' + ICONS.busca + '<input type="search" placeholder="Vai pra ond?" autocomplete="off" aria-label="Buscar destino"></label>' +
    '<button type="button" class="nv-close-search">Fechar</button></div><div class="nv-results" aria-live="polite"></div></div>');
  document.body.appendChild(search);

  if (!document.getElementById('ond-logo') && !document.querySelector('script[src="/assets/ond-logo.js"]')) {
    var logoScript = document.createElement('script'); logoScript.src = '/assets/ond-logo.js'; document.head.appendChild(logoScript);
  }
  if (withShell) {
    document.body.classList.add('nv-shell');
    var rail = element('<nav class="nv-rail" aria-label="Navegação"><a class="nv-logo" href="/explorar/" aria-label="OND, página inicial"><svg viewBox="0 0 951.32 497.26" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OND"><use href="#ond-logo"/></svg></a>' +
      LINKS.map(function (link) {
        return '<a class="nv-item' + (link.key === activeKey ? ' on' : '') + '" data-key="' + link.key + '" href="' + link.href + '">' + ICONS[link.key] + '<span>' + link.label + '</span></a>';
      }).join('') + '</nav>');
    var top = element('<header class="nv-top"><div class="nv-top-in">' +
      '<button type="button" class="nv-search-btn nv-open-search">' + ICONS.busca + 'Vai pra ond?</button><span class="nv-gap"></span>' +
      '</div></header>');
    document.body.insertBefore(top, mobileTop.nextSibling);
    document.body.insertBefore(rail, top);
  } else if (document.querySelector('.main')) {
    var lateTop = element('<header class="nv-top nv-late"><div class="nv-top-in">' +
      '<button type="button" class="nv-search-btn nv-open-search">' + ICONS.busca + 'Vai pra ond?</button></div></header>');
    var mainArea = document.querySelector('.main');
    mainArea.insertBefore(lateTop, mainArea.firstChild);
    var heroSearch = document.getElementById('busca-topo');
    if (heroSearch && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { lateTop.classList.toggle('on', !entries[0].isIntersecting); }, { rootMargin: '-40px 0px 0px 0px' }).observe(heroSearch);
    } else lateTop.classList.add('on');
  }

  function setMenu(open) {
    drawer.classList.toggle('on', open); scrim.classList.toggle('on', open);
    drawer.setAttribute('aria-hidden', String(!open));
    mobileTop.querySelector('.nv-open-menu').setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  mobileTop.querySelector('.nv-open-menu').addEventListener('click', function () { setMenu(true); });
  drawer.querySelector('.nv-close-menu').addEventListener('click', function () { setMenu(false); });
  scrim.addEventListener('click', function () { setMenu(false); });
  drawer.addEventListener('click', function (event) { if (event.target.closest('a')) setMenu(false); });

  var catalog = null;
  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('ond_explorar_catalogo')); } catch (storageError) {}
    var request = cached && cached.length ? Promise.resolve(cached) : fetch(API).then(function (response) { return response.json(); }).then(function (raw) {
      try { sessionStorage.setItem('ond_explorar_catalogo', JSON.stringify(raw)); } catch (storageError) {}
      return raw;
    });
    return request.then(function (raw) { catalog = raw; return raw; });
  }
  function normalize(text) { return (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); }
  var input = search.querySelector('input');
  var results = search.querySelector('.nv-results');
  function renderResults() {
    if (!catalog) { results.innerHTML = '<p class="nv-empty">Carregando os destinos do OND.</p>'; return; }
    var query = normalize(input.value);
    var cities = [], countries = [];
    if (!query) {
      /* foto local leve: a do catálogo chega a 25 MB */
      var TOP = ['rio de janeiro', 'fernando de noronha', 'gramado', 'salvador', 'lisboa', 'paris', 'buenos aires', 'orlando'];
      TOP.forEach(function (name) {
        catalog.some(function (country) { return (country.cities || []).some(function (city) {
          if (normalize(city.name) === name) { cities.push({ city: Object.assign({}, city, { image: '/assets/viagens/' + name.replace(/ /g, '-') + '.webp' }), country: country }); return true; } return false;
        }); });
      });
      if (cities.length < 4) cities = [];
    }
    catalog.forEach(function (country) {
      var countryMatch = query && normalize(country.name).indexOf(query) >= 0;
      if (countryMatch) countries.push(country);
      (country.cities || []).forEach(function (city) {
        if (!query ? city.image && cities.length < 8 && !cities.some(function (item) { return item.city.name === city.name; }) : normalize(city.name).indexOf(query) >= 0 || countryMatch) {
          cities.push({ city: city, country: country });
        }
      });
    });
    if (query) cities.sort(function (first, second) {
      var firstStarts = normalize(first.city.name).indexOf(query) === 0 ? 0 : 1, secondStarts = normalize(second.city.name).indexOf(query) === 0 ? 0 : 1;
      return firstStarts - secondStarts || (second.city.image ? 1 : 0) - (first.city.image ? 1 : 0);
    });
    cities = cities.slice(0, 24);
    if (!cities.length) { results.innerHTML = '<p class="nv-empty">Nenhum destino encontrado.</p>'; return; }
    results.innerHTML = '<h4>' + (query ? 'DESTINOS' : 'PARA COMEÇAR') + '</h4>' + cities.map(function (item, index) {
      var code = (item.city.unlocode || '').replace(/\s+/g, '') || item.city.name;
      return '<a class="nv-result" style="animation-delay:' + Math.min(index, 10) * 30 + 'ms" href="/explorar/destino/?cidade=' + encodeURIComponent(code) + '">' +
        '<img class="thumb" src="' + escapeHtml(item.city.image || '') + '" alt="" loading="lazy"><div><b>' + escapeHtml(item.city.name) + '</b>' +
        '<span><img class="flag" src="/assets/flags/' + item.country.countryCodeIso + '.svg" alt="">' + escapeHtml(item.country.name) + '</span></div></a>';
    }).join('');
  }
  var searchTrigger = null;
  function setSearch(open, from) {
    if (open === search.classList.contains('on')) return;
    var field = search.querySelector('.nv-search-field');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (open) searchTrigger = from || null;
    var trigger = searchTrigger && searchTrigger.offsetParent !== null ? searchTrigger : null;
    if (!document.startViewTransition || reduce || !trigger) { applySearch(open); return; }
    (open ? trigger : field).style.viewTransitionName = 'nv-busca';
    document.documentElement.classList.add('nv-vt-busca');
    var transition = document.startViewTransition(function () {
      (open ? trigger : field).style.viewTransitionName = '';
      (open ? field : trigger).style.viewTransitionName = 'nv-busca';
      applySearch(open);
    });
    ['ready', 'updateCallbackDone'].forEach(function (key) { if (transition[key]) transition[key].catch(function () {}); });
    transition.finished.catch(function () {}).finally(function () {
      trigger.style.viewTransitionName = ''; field.style.viewTransitionName = '';
      document.documentElement.classList.remove('nv-vt-busca');
    });
  }
  function applySearch(open) {
    search.classList.toggle('on', open);
    search.setAttribute('aria-hidden', String(!open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      setTimeout(function () { input.focus(); }, 60);
      renderResults();
      loadCatalog().then(renderResults).catch(function () { results.innerHTML = '<p class="nv-empty">Os destinos não carregaram. Tente de novo em instantes.</p>'; });
    }
  }
  document.addEventListener('click', function (event) { var button = event.target.closest && event.target.closest('.nv-open-search'); if (button) setSearch(true, button); });
  search.querySelector('.nv-close-search').addEventListener('click', function () { setSearch(false); });
  input.addEventListener('input', renderResults);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { setSearch(false); setMenu(false); }
    if (event.key === '/' && page === 'explorar' && !/input|textarea/i.test(document.activeElement.tagName)) { event.preventDefault(); setSearch(true); }
  });
  window.ondOpenSearch = function () { setSearch(true); };

  /* Entrar: janela por cima da página (por enquanto todas as opções levam ao login do app na web) */
  var WEB_LOGIN = 'https://web.ondviajar.com.br/';
  var login = element('<div class="nv-login" role="dialog" aria-modal="true" aria-labelledby="nv-login-t" aria-hidden="true"><div class="nv-login-card">' +
    '<button type="button" class="nv-login-x" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
    '<svg class="nv-login-logo" viewBox="0 0 951.32 497.26" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OND"><use href="#ond-logo"/></svg>' +
    '<h2 id="nv-login-t">Entre no OND</h2><p>Suas viagens, roteiros e passaporte em qualquer tela.</p>' +
    '<a class="nv-login-btn" href="' + WEB_LOGIN + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.5a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.6 2.5-6.2z"/><path d="M12 20.5c2.3 0 4.2-.8 5.5-2.1l-2.7-2.1c-.8.5-1.7.8-2.8.8-2.2 0-4-1.5-4.7-3.4H4.5v2.1a8.5 8.5 0 0 0 7.5 4.7z"/><path d="M7.3 13.7a5 5 0 0 1 0-3.4V8.2H4.5a8.5 8.5 0 0 0 0 7.6z"/><path d="M12 6.9c1.2 0 2.3.4 3.2 1.2l2.4-2.4A8.4 8.4 0 0 0 4.5 8.2l2.8 2.1C8 8.4 9.8 6.9 12 6.9z"/></svg>Continuar com Google</a>' +
    '<a class="nv-login-btn" href="' + WEB_LOGIN + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 3.5c-1 .1-2.2.7-2.9 1.6-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.5.7-.8 1.1-1.9 1-3z"/><path d="M18.6 16.2c-.5 1.1-.8 1.6-1.4 2.6-.9 1.4-2.1 3.1-3.6 3.1-1.3 0-1.7-.9-3.5-.9s-2.2.8-3.5.9c-1.5 0-2.6-1.5-3.5-2.9-2.4-3.8-2.7-8.2-1.2-10.6 1.1-1.7 2.8-2.6 4.4-2.6s2.7.9 4 .9c1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.3 8.3z"/></svg>Continuar com Apple</a>' +
    '<div class="nv-login-ou"><span>ou</span></div>' +
    '<form class="nv-login-form" action="' + WEB_LOGIN + '" method="get"><label class="nv-login-label" for="nv-login-email">Sua conta</label>' +
    '<input class="nv-login-input" id="nv-login-email" type="email" autocomplete="email" placeholder="seu@email.com" required>' +
    '<button class="nv-login-btn line" type="submit">Continuar</button></form>' +
    '</div></div>');
  document.body.appendChild(login);
  if (DEMO_HOST) {
    login.querySelector('.nv-login-card').insertAdjacentHTML('beforeend', '<button type="button" class="nv-login-demo">Entrar com a conta de teste</button>');
    login.querySelector('.nv-login-demo').addEventListener('click', entrarConta);
  }
  document.addEventListener('click', function (event) { if (event.target.closest && event.target.closest('[data-sair]')) { event.preventDefault(); sairConta(); } });
  if (window.ondTemConta()) {
    var drawerEnter = drawer.querySelector('.nv-enter');
    if (drawerEnter) drawerEnter.outerHTML = '<a class="nv-drawer-conta" href="/explorar/viajante/">' + avatarConta(40) + '<span><b>' + CONTA_TESTE.name + '</b>' + '<small>Conta de teste</small>' + '</span></a>' + (window.OndPlano.premium() ? (DEMO_HOST ? '<button class=\"nv-sair\" type="button" data-plano-free><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z\"/></svg>Voltar para o Free</button>' : '') : '<button class=\"nv-sair\" type="button" data-planos-abrir><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z\"/></svg>Assinar o Premium</button>') + '<button type="button" class="nv-sair" data-sair>Sair da conta de teste</button>';
  }
  var loginReturn = null;
  var LOGIN_TEXTOS = {
    padrao: ['Entre no OND', 'Suas viagens, roteiros e passaporte em qualquer tela.'],
    avaliar: ['Avalie os lugares por onde passou', 'Crie uma conta ou entre para contar como foi e ajudar quem vai depois.'],
    viagens: ['Suas viagens num lugar só', 'Crie uma conta ou entre para ver as viagens que você montou com o OND vAI.'],
    interesses: ['Salve seus interesses', 'Crie uma conta ou entre para guardar os lugares que você quer conhecer.'],
    passaporte: ['Crie seu passaporte', 'Com uma conta, os lugares por onde você passou viram carimbos e os roteiros do OND vAI entram sozinhos.'],
    carimbo: ['Marque onde você já foi', 'Crie uma conta ou entre para carimbar os lugares no seu passaporte.'],
    perfil: ['Monte seu perfil', 'Crie uma conta ou entre para escolher capa, foto e contar como você viaja.'],
    resenha: ['Conte como foi', 'Crie uma conta ou entre para publicar sua resenha e ajudar quem vai depois.'],
    seguir: ['Siga quem viaja como você', 'Crie uma conta ou entre para seguir viajantes e ver as resenhas deles primeiro.'],
    curtir: ['Diga o que achou', 'Crie uma conta ou entre para curtir as resenhas.']
  };
  function setLogin(open, motivo) {
    if (open) {
      var textos = LOGIN_TEXTOS[motivo] || LOGIN_TEXTOS.padrao;
      login.querySelector('#nv-login-t').textContent = textos[0];
      login.querySelector('#nv-login-t + p').textContent = textos[1];
    }
    login.classList.toggle('on', open);
    login.setAttribute('aria-hidden', String(!open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) { loginReturn = document.activeElement; setTimeout(function () { login.querySelector('.nv-login-btn').focus(); }, 60); }
    else if (loginReturn && loginReturn.focus) loginReturn.focus();
  }
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest && event.target.closest('.nv-rail-enter, .nv-enter');
    if (!trigger) return;
    event.preventDefault();
    setMenu(false);
    setLogin(true);
  });
  login.querySelector('.nv-login-form').addEventListener('submit', function (event) { event.preventDefault(); window.location.href = WEB_LOGIN; });
  login.addEventListener('click', function (event) { if (event.target === login || event.target.closest('.nv-login-x')) setLogin(false); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && login.classList.contains('on')) setLogin(false); });

  /* OND vAI integrado: qualquer link para o app do vAI abre aqui dentro */
  var vaiPanel = element('<section class="nv-vai" aria-label="OND vAI" aria-hidden="true"><header class="nv-vai-head">' + ICONS.vai + '<b>OND vAI</b><span class="nv-gap"></span>' +
    '<button type="button" class="nv-vai-reset" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><span>Recomeçar</span></button>' +
    '<button type="button" class="nv-vai-x" aria-label="Fechar o OND vAI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
    '<div class="nv-vai-body" id="nv-vai-chat"></div></section>');
  document.body.appendChild(vaiPanel);
  var chatReady = null;
  function loadChat() {
    if (chatReady) return chatReady;
    chatReady = new Promise(function (resolve) {
      if (!document.querySelector('link[href="/assets/vai-chat.css"]')) {
        var sheet = document.createElement('link'); sheet.rel = 'stylesheet'; sheet.href = '/assets/vai-chat.css'; document.head.appendChild(sheet);
      }
      var chatScript = document.createElement('script'); chatScript.src = '/assets/vai-chat.js';
      chatScript.onload = function () { window.OndVaiChat.mount(document.getElementById('nv-vai-chat')); resolve(); };
      document.head.appendChild(chatScript);
    });
    return chatReady;
  }
  /* o link "Planejar com o OND vAI" de uma cidade já chega com a frase pronta */
  function cityFromUrl(url) {
    var match = /[?&]city=([^&]+)/.exec(url || '');
    if (!match) return Promise.resolve('');
    var code = decodeURIComponent(match[1]).replace(/\s+/g, '');
    return loadCatalog().then(function (raw) {
      var name = '';
      raw.forEach(function (country) { (country.cities || []).forEach(function (city) { if ((city.unlocode || '').replace(/\s+/g, '') === code) name = city.name; }); });
      return name;
    }).catch(function () { return ''; });
  }
  function setVai(open, url, texto) {
    if (open && window.ondTourFim) window.ondTourFim();
    /* abre e fecha a partir do botão do OND vAI: a tela nasce dele e volta para ele */
    var origem = Array.prototype.filter.call(document.querySelectorAll('.nv-center .vai-orb, .rail-item[href*="ond-vai"], .nv-item[href*="ond-vai"]'), function (item) { return item.getClientRects().length && item.getBoundingClientRect().width; })[0];
    if (origem) { var r = origem.getBoundingClientRect(), p = vaiPanel.getBoundingClientRect(); vaiPanel.style.setProperty('--vx', Math.round(r.left + r.width / 2 - p.left) + 'px'); vaiPanel.style.setProperty('--vy', Math.round(r.top + r.height / 2 - p.top) + 'px'); }
    vaiPanel.classList.toggle('on', open);
    vaiPanel.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('nv-vai-aberto', open);
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="web.ondviajar.com.br/ond-vai"].rail-item, a[href*="web.ondviajar.com.br/ond-vai"].nv-item'), function (item) { item.classList.toggle('vai-on', open); });
    if (!open) return;
    Promise.all([loadChat(), cityFromUrl(url)]).then(function (results) {
      if (texto) { window.OndVaiChat.prefill(texto); [400, 1200, 2500].forEach(function (ms) { setTimeout(function () { var area = vaiPanel.querySelector('textarea'); if (area && !area.value) window.OndVaiChat.prefill(texto); }, ms); }); }
      else if (results[1]) window.OndVaiChat.prefill('Quero planejar uma viagem para ' + results[1]);
      else window.OndVaiChat.focus();
    });
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="https://web.ondviajar.com.br/ond-vai"]');
    if (!link || link.closest('.nv-vai') || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    var menu = link.closest('details'); if (menu) menu.open = false;
    setMenu(false);
    setVai(true, link.href);
  });
  vaiPanel.querySelector('.nv-vai-x').addEventListener('click', function () { setVai(false); });
  /* recomeçar fica sempre à mão no topo do vAI, só quando já existe conversa */
  var vaiReset = vaiPanel.querySelector('.nv-vai-reset');
  vaiReset.addEventListener('click', function () { if (window.OndVaiChat && window.OndVaiChat.restart) window.OndVaiChat.restart(); });
  document.addEventListener('ond-vai-estado', function (event) { vaiReset.hidden = !(event.detail && event.detail.conversa); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && vaiPanel.classList.contains('on')) setVai(false); });
  window.ondLogin = function (motivo) { setLogin(true, motivo); };
  window.ondOpenVai = function (url, texto) { setMenu(false); setVai(true, url || 'https://web.ondviajar.com.br/ond-vai', texto); };

  /* itens do menu que só funcionam com conta */
  /* conteúdo que depende de conta: aparece apagado e, ao tentar usar, pede para entrar.
     Marcar com data-pede-conta="motivo" (viagens, interesses, passaporte...). */
  function markAccountAreas() {
    var logged = window.ondTemConta();
    document.documentElement.classList.toggle('sem-conta', !logged);
  }
  markAccountAreas();
  document.addEventListener('click', function (event) {
    if (window.ondTemConta() || !event.target.closest) return;
    var area = event.target.closest('[data-pede-conta]');
    if (!area) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setMenu(false);
    setLogin(true, area.getAttribute('data-pede-conta'));
  }, true);

  /* no perfil, o menu acende Interesses quando a seção está na tela (ou o link pede #interesses) */
  function setNavActive(key) {
    Array.prototype.forEach.call(document.querySelectorAll('.nv-rail [data-key], .nv-drawer [data-key]'), function (item) { item.classList.toggle('on', item.getAttribute('data-key') === key); });
  }
  if (page === 'viajante') {
    var wishSection = document.getElementById('interesses');
    var pickKey = function () { return location.hash === '#interesses' ? 'interesses' : 'passaporte'; };
    setNavActive(pickKey());
    window.addEventListener('hashchange', function () { setNavActive(pickKey()); });
    if (wishSection && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (wishSection.hidden) return;
        setNavActive(entries[0].isIntersecting ? 'interesses' : 'passaporte');
      }, { rootMargin: '-35% 0px -45% 0px' }).observe(wishSection);
    }
  }

  /* tour inicial: só na primeira visita ao /explorar */
  var TOUR = [
    { d: '.rail-item[href="#topo"], .nv-item[href="/explorar/"]', m: '.nv-tab[data-tab="explorar"]', t: 'Destinos', x: 'Viagens no Brasil e no mundo para se inspirar. Toque numa cidade para ver resenhas e fotos.' },
    { d: '.rail-item[href="#mundo"]', m: '.nv-tab[data-tab="mundo"]', t: 'Mundo de destinos', x: 'Gire o globo, escolha um país e veja as cidades.' },
    { d: '.rail-item[href="/explorar/viajante/"]', m: '.nv-tab[data-tab="passaporte"]', t: 'Meu passaporte', x: 'Cada lugar que você visita vira um carimbo. Os roteiros do OND vAI entram sozinhos.' },
    { d: '.rail-item[href*="ond-vai"]', m: '.nv-tab.nv-center', t: 'OND vAI', x: 'Conte pra onde quer ir e o OND vAI monta o roteiro com você.' },
    { d: '.nv-rail-enter', m: '.nv-open-menu', t: 'Entrar', x: 'Entre para guardar suas viagens e o seu passaporte.' }
  ];
  function startTour() {
    var phone = window.matchMedia('(max-width: 1023px)').matches;
    var steps = TOUR.filter(function (step) { var target = document.querySelector(phone ? step.m : step.d); return target && target.offsetParent !== null; });
    if (!steps.length) return;
    var spot = element('<div class="nv-tour-spot" aria-hidden="true"></div>');
    var card = element('<div class="nv-tour" role="dialog" aria-modal="false" aria-labelledby="nv-tour-t"><div class="nv-tour-dots"></div><h3 id="nv-tour-t"></h3><p></p>' +
      '<div class="nv-tour-actions"><button type="button" class="nv-tour-skip">Pular</button><button type="button" class="nv-tour-next">Próximo</button></div></div>');
    document.body.appendChild(spot); document.body.appendChild(card);
    document.documentElement.classList.add('nv-tour-on');
    var index = 0;
    window.ondTourFim = finish;
    function finish() {
      document.documentElement.classList.remove('nv-tour-on'); window.ondTourFim = null;
      try { localStorage.setItem('ond-tour-visto', '1'); } catch (error) {}
      spot.classList.add('saindo'); card.classList.add('saindo');
      setTimeout(function () { spot.remove(); card.remove(); }, 250);
      window.removeEventListener('resize', place);
    }
    function place() {
      var step = steps[index];
      var target = document.querySelector(phone ? step.m : step.d);
      if (!target) return finish();
      /* a bolha do vAI vira um círculo; o resto, um recorte que não passa da borda da tela */
      var orb = target.querySelector('.nv-orb'), round = !!orb;
      var box = (orb || target).getBoundingClientRect(), pad = round ? 8 : 4;
      var x1 = Math.max(4, box.left - pad), y1 = Math.max(4, box.top - pad);
      var x2 = Math.min(innerWidth - 4, box.right + pad), y2 = Math.min(innerHeight - 4, box.bottom + pad);
      spot.classList.toggle('redondo', round);
      spot.style.left = x1 + 'px'; spot.style.top = y1 + 'px'; spot.style.width = x2 - x1 + 'px'; spot.style.height = y2 - y1 + 'px';
      var cardWidth = card.offsetWidth, cardHeight = card.offsetHeight, left, top, side;
      if (phone) {
        left = Math.max(16, Math.min(innerWidth - cardWidth - 16, (x1 + x2) / 2 - cardWidth / 2));
        side = y1 > innerHeight / 2 ? 'baixo' : 'cima';
        top = side === 'baixo' ? y1 - cardHeight - 16 : y2 + 16;
        card.style.setProperty('--seta', Math.max(24, Math.min(cardWidth - 24, (x1 + x2) / 2 - left)) + 'px');
      } else {
        side = 'lado';
        left = x2 + 18;
        top = Math.max(16, Math.min(innerHeight - cardHeight - 16, (y1 + y2) / 2 - cardHeight / 2));
        card.style.setProperty('--seta', Math.max(24, Math.min(cardHeight - 24, (y1 + y2) / 2 - top)) + 'px');
      }
      card.dataset.seta = side;
      card.style.left = left + 'px'; card.style.top = top + 'px';
    }
    function show() {
      var step = steps[index];
      card.querySelector('h3').textContent = step.t;
      card.querySelector('p').textContent = step.x;
      card.querySelector('.nv-tour-dots').innerHTML = steps.map(function (item, dot) { return '<i' + (dot === index ? ' class="on"' : '') + '></i>'; }).join('');
      card.querySelector('.nv-tour-next').textContent = index === steps.length - 1 ? 'Começar' : 'Próximo';
      place();
      card.classList.remove('troca'); void card.offsetWidth; card.classList.add('troca');
    }
    card.querySelector('.nv-tour-next').addEventListener('click', function () { if (++index >= steps.length) finish(); else show(); });
    card.querySelector('.nv-tour-skip').addEventListener('click', finish);
    document.addEventListener('keydown', function onKey(event) { if (event.key === 'Escape' && document.body.contains(card)) { finish(); document.removeEventListener('keydown', onKey); } });
    window.addEventListener('resize', place);
    show();
    requestAnimationFrame(function () { spot.classList.add('on'); card.classList.add('on'); card.querySelector('.nv-tour-next').focus({ preventScroll: true }); });
  }
  window.ondTour = startTour;
  if (/^\/explorar\/?(index\.html)?$/.test(location.pathname) &&!/[?&]sem-tour/.test(location.search)) {
    var tourSeen = false;
    try { tourSeen = localStorage.getItem('ond-tour-visto') === '1'; } catch (error) {}
    if (!tourSeen) setTimeout(function () { if (window.scrollY < 200 && !document.querySelector('.nv-login.on, .nv-search.on, .nv-drawer.on, .nv-vai.on')) startTour(); }, 1400);
  }

  /* faixa da edição especial (assets/edicoes-faixa.js): botão de fechar, lembrado por edição */
  function enhanceBanner(banner) {
    var mobileTop = document.querySelector('body > .nv-mtop');
    if (mobileTop && banner.parentNode === document.body && banner.compareDocumentPosition(mobileTop) & Node.DOCUMENT_POSITION_PRECEDING) document.body.insertBefore(banner, mobileTop);
    if (banner.querySelector('.ond-ed-x')) return;
    var cta = banner.querySelector('.ond-ed-cta, a');
    var bannerKey = 'ond-faixa-fechada:' + (cta ? cta.getAttribute('href') : banner.textContent.slice(0, 40));
    var closed = false;
    try { closed = localStorage.getItem(bannerKey) === '1'; } catch (error) {}
    if (closed) { banner.remove(); return; }
    var closeBanner = document.createElement('button');
    closeBanner.type = 'button';
    closeBanner.className = 'ond-ed-x';
    closeBanner.setAttribute('aria-label', 'Fechar aviso da edição especial');
    closeBanner.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    closeBanner.addEventListener('click', function () {
      try { localStorage.setItem(bannerKey, '1'); } catch (error) {}
      banner.classList.add('saindo');
      setTimeout(function () { banner.remove(); }, 280);
    });
    banner.appendChild(closeBanner);
  }
  var existingBanner = document.querySelector('.ond-ed');
  if (existingBanner) enhanceBanner(existingBanner);
  new MutationObserver(function (mutations, observer) {
    var banner = document.querySelector('.ond-ed');
    if (banner) { enhanceBanner(banner); observer.disconnect(); }
  }).observe(document.body, { childList: true });

  /* transição para a página do destino: a foto clicada cresce e vira a capa */
  function clearCapa() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-vt-capa]'), function (node) { node.style.viewTransitionName = ''; node.removeAttribute('data-vt-capa'); });
  }
  function cityLabel(link) {
    var strong = link.querySelector('strong, b');
    if (strong) return strong.textContent.trim();
    var copy = link.cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll('small, img, svg'), function (node) { node.remove(); });
    return copy.textContent.trim();
  }
  window.ondGuardarDestino = function (url, image, name) {
    try { sessionStorage.setItem('ond-destino-pre', JSON.stringify({ url: url, image: image || '', name: name || '' })); } catch (error) {}
  };
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href*="/explorar/destino/?cidade="]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
    var photo = link.querySelector('img:not(.flag)');
    window.ondGuardarDestino(link.pathname + link.search, photo && photo.currentSrc, cityLabel(link));
    clearCapa();
    if (photo) { photo.style.viewTransitionName = 'destino-capa'; photo.setAttribute('data-vt-capa', ''); }
  });
  /* na volta, a capa encolhe de novo para o cartão de onde saiu */
  /* transição abortada (navegação rápida, troca de idioma) não vira erro no console */
  window.addEventListener('pageswap', function (event) {
    if (event.viewTransition) ['ready', 'updateCallbackDone', 'finished'].forEach(function (key) { if (event.viewTransition[key]) event.viewTransition[key].catch(function () {}); });
  });
  window.addEventListener('pagereveal', function (event) {
    if (event.viewTransition) ['ready', 'updateCallbackDone', 'finished'].forEach(function (key) { if (event.viewTransition[key]) event.viewTransition[key].catch(function () {}); });
    clearCapa();
    if (!event.viewTransition || /\/explorar\/destino\//.test(location.pathname)) return;
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('ond-destino-pre') || 'null'); } catch (error) {}
    if (!saved) return;
    var match = Array.prototype.find.call(document.querySelectorAll('a[href*="/explorar/destino/?cidade="]'), function (link) {
      var box = link.getBoundingClientRect();
      return (link.pathname + link.search) === saved.url && box.bottom > 0 && box.top < innerHeight && box.width > 0;
    });
    var photo = match && match.querySelector('img:not(.flag)');
    if (!photo) return;
    photo.style.viewTransitionName = 'destino-capa'; photo.setAttribute('data-vt-capa', '');
    event.viewTransition.finished.finally(clearCapa);
  });
  window.addEventListener('pageshow', function (event) { if (event.persisted) clearCapa(); });

  /* recolher o menu lateral (desktop); a escolha fica guardada neste navegador */
  var sideRail = document.querySelector('.rail, .nv-rail');
  if (sideRail) {
    var logoLink = sideRail.querySelector('.rail-logo, .nv-logo');
    if (logoLink && window.ondTemConta()) { logoLink.classList.add('nv-com-tag'); logoLink.insertAdjacentHTML('beforeend', tagPlano()); }
    if (logoLink) logoLink.insertAdjacentHTML('beforeend', '<svg class="nv-logo-mini" viewBox="0 0 497.26 497.26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><use href="#ond-icon"/></svg>');
    var collapse = element('<button type="button" class="nv-collapse" aria-expanded="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9 4.5v15M15.5 10l-2 2 2 2"/></svg><span>Recolher menu</span></button>');
    if (window.OndIdioma) sideRail.appendChild(element(seletorIdioma('nv-idioma nv-idioma-lateral')));
    sideRail.appendChild(collapse);
    var firstItem = sideRail.querySelector('.rail-items') || sideRail.querySelector('.nv-item');
    if (window.ondTemConta()) {
      firstItem.insertAdjacentHTML('beforebegin', '<details class="nv-conta"><summary>' + avatarConta(36) + '<span class="nv-conta-t"><b>' + CONTA_TESTE.name + '</b>' + '<small>Conta de teste</small>' + '</span></summary>' +
        '<div class="nv-conta-menu"><a href="/explorar/viajante/">' + "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4.5 20.5a7.5 7.5 0 0 1 15 0\"/></svg>" + 'Meu perfil</a>' + (window.OndPlano.premium() ? (DEMO_HOST ? '<button type="button" data-plano-free><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z\"/></svg>Voltar para o Free</button>' : '') : '<button type="button" data-planos-abrir><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z\"/></svg>Assinar o Premium</button>') + '<button type="button" data-sair><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>Sair da conta de teste</button></div></details>');
    } else firstItem.insertAdjacentHTML('beforebegin', '<a class="nv-rail-enter" href="https://web.ondviajar.com.br/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg><span>Entrar</span></a>');
    var railItems = sideRail.querySelectorAll('.rail-item, .nv-item, .nv-rail-enter');
    var setMini = function (mini) {
      document.documentElement.classList.toggle('nv-mini', mini);
      collapse.setAttribute('aria-expanded', String(!mini));
      collapse.setAttribute('aria-label', mini ? 'Expandir menu' : 'Recolher menu');
      collapse.title = mini ? 'Expandir menu' : '';
      Array.prototype.forEach.call(railItems, function (item) {
        var label = item.querySelector('span:not(.vai-orb)');
        item.title = mini && label ? label.textContent : '';
      });
      try { localStorage.setItem('ond-menu-recolhido', mini ? '1' : '0'); } catch (error) {}
    };
    var startMini = false;
    try { startMini = localStorage.getItem('ond-menu-recolhido') === '1'; } catch (error) {}
    setMini(startMini);
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add('nv-anim'); }); });
    collapse.addEventListener('click', function () { setMini(!document.documentElement.classList.contains('nv-mini')); });
  }
})();
