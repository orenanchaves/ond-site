/* Cotação pelo WhatsApp do OND: formulário "pra onde / quando / quantas pessoas"
   e botões de pedido rápido. Nada é enviado pelo site: monta a mensagem e abre o
   WhatsApp oficial (11) 94361-5412. Incluir com <script src="/assets/cotar.js" defer></script>. */
(function(){
  if(window.__ondCotar) return; window.__ondCotar = true;
  var NUM = '5511943615412';
  function abrir(msg, origem){
    if(window.gtag) gtag('event','whatsapp_click',{destino:origem||'cotacao',pagina:location.pathname});
    window.open('https://wa.me/'+NUM+'?text='+encodeURIComponent(msg),'_blank','noopener');
  }
  document.addEventListener('submit', function(e){
    var f = e.target.closest && e.target.closest('form.cot-form');
    if(!f) return;
    e.preventDefault();
    var v = function(n){ var el=f.elements[n]; return el ? String(el.value||'').trim() : '' };
    var linhas = ['Olá, OND! Quero cotar uma viagem.'];
    linhas.push('Destino: ' + (v('destino') || 'ainda não sei, quero ajuda pra escolher'));
    if(v('quando')) linhas.push('Quando: ' + v('quando'));
    if(v('pessoas')) linhas.push('Quem vai: ' + v('pessoas'));
    if(v('saida')) linhas.push('Saindo de: ' + v('saida'));
    linhas.push('(vim pelo site)');
    abrir(linhas.join('\n'), v('destino') || 'cotacao');
  });
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-cot-msg]');
    if(!b) return;
    e.preventDefault();
    abrir(b.getAttribute('data-cot-msg'), b.getAttribute('data-cot-origem') || 'atalho');
  });

  var ICONES = {
    adultos: 'M400-80v-280h-80v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240h-80v280H400Zm80-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z',
    criancas: 'M430.5-680.5Q410-701 410-730t20.5-49.5Q451-800 480-800t49.5 20.5Q550-759 550-730t-20.5 49.5Q509-660 480-660t-49.5-20.5ZM400-160v-200h-40v-180q0-33 23.5-56.5T440-620h80q33 0 56.5 23.5T600-540v180h-40v200H400Z',
    bebes: 'M477-80q-42 0-81.5-9T324-112q-46-20-75-48.5T220-224v-231q0-31 23.5-57t60.5-46q38-20 83.5-31t92.5-11q47 0 92.5 11t83.5 31q38 20 61 46t23 57v231q0 17-7.5 33T711-161q-14 14-32.5 26.5T637-112q1-5 3-28 0-58-41-99t-99-41q-43 0-76 23t-50 59q32 8 58.5 11t46.5 3q17 0 27.5-1t13.5-1v104q-11 1-21.5 1.5T477-80Zm123-220q33 0 56.5-23.5T680-380q0-33-23.5-56.5T600-460q-33 0-56.5 23.5T520-380q0 33 23.5 56.5T600-300ZM480-640q50 0 85-34.5t35-85.5q0-50-35-85t-85-35q-51 0-85.5 35T360-760q0 51 34.5 85.5T480-640Z'
  };
  var GRUPOS = [
    { id: 'adultos', rotulo: 'Adultos', sub: '12 anos ou mais', min: 1, inicial: 2, um: 'adulto', varios: 'adultos' },
    { id: 'criancas', rotulo: 'Crianças', sub: '2 a 11 anos', min: 0, inicial: 0, um: 'criança', varios: 'crianças' },
    { id: 'bebes', rotulo: 'Bebês', sub: 'até 1 ano', min: 0, inicial: 0, um: 'bebê', varios: 'bebês' }
  ];
  var briefing = null, atual = null, contagem = {}, gruposDestino = null;

  function carregarGruposDestino(){
    if(!gruposDestino) gruposDestino = fetch('/assets/grupos-destinos.json')
      .then(function(r){ return r.json(); }).catch(function(){ return {}; });
    return gruposDestino;
  }

  function montarBriefing(){
    var css = ''
      + '.brf-fundo{position:fixed;inset:0;z-index:100020;background:rgba(5,5,10,.72);opacity:0;pointer-events:none;transition:opacity .2s}'
      + '.brf-fundo.open{opacity:1;pointer-events:all}'
      + '.brf{position:fixed;top:50%;left:50%;transform:translate(-50%,-48%) scale(.97);z-index:100021;width:calc(100% - 32px);max-width:460px;max-height:calc(100% - 32px);overflow-y:auto;background:var(--card,#16161f);color:var(--text,#f0eeff);border:1px solid var(--border,#2a2a3a);border-radius:22px;padding:26px 22px 20px;box-shadow:0 24px 64px rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .2s,transform .25s cubic-bezier(.34,1.56,.64,1)}'
      + '.brf.open{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
      + '.brf-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:var(--muted,#9a97b5);font-size:24px;line-height:1;cursor:pointer}'
      + '.brf h2{font-size:1.3rem;font-weight:800;letter-spacing:-.01em;line-height:1.25;padding-right:30px}'
      + '.brf>p{margin-top:8px;color:var(--muted,#9a97b5);font-size:.9rem;line-height:1.5}'
      + '.brf [hidden]{display:none!important}'
      + '.brf form{display:grid;gap:12px;margin-top:18px}'
      + '.brf-datas{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
      + '.brf-pessoas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'
      + '.brf-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;border:1px solid var(--border,#2a2a3a);border-radius:12px;color:var(--muted,#9a97b5);text-align:center}'
      + '.brf-tile.on{border-color:var(--purple,#7f11f4);color:var(--purple-light,var(--purple,#7f11f4));background:var(--purple-dim,rgba(127,17,244,.12))}'
      + '.brf-tile svg{width:28px;height:28px}'
      + '.brf-tile b{font-size:.8rem;font-weight:700}'
      + '.brf-tile small{font-size:.7rem;line-height:1.2}'
      + '.brf-cont{display:flex;align-items:center;gap:8px;margin-top:4px}'
      + '.brf-cont button{width:28px;height:28px;border-radius:50%;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:1rem;font-weight:700;line-height:1;cursor:pointer}'
      + '.brf-cont button:disabled{opacity:.35;cursor:default}'
      + '.brf-cont span{min-width:16px;font-weight:800;color:var(--text,#f0eeff)}'
      + '.brf .cot-go{width:100%;margin-top:4px}'
      + '.brf-direto{display:block;margin-top:12px;text-align:center;font-size:.85rem;color:var(--muted,#9a97b5);text-decoration:underline}'
      + '.brf-erro{color:#ff8a80;font-size:.82rem}'
      + '.brf-convite .cot-go{display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:18px}'
      + '.brf-convite small{display:block;margin-top:14px;font-size:.76rem;line-height:1.45;color:var(--muted,#9a97b5)}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var tiles = GRUPOS.map(function(g){
      return '<div class="brf-tile" data-grupo="' + g.id + '"><svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="' + ICONES[g.id] + '"/></svg>'
        + '<b>' + g.rotulo + '</b><small>' + g.sub + '</small>'
        + '<div class="brf-cont"><button type="button" data-passo="-1" aria-label="Menos ' + g.rotulo.toLowerCase() + '">&minus;</button><span aria-live="polite"></span><button type="button" data-passo="1" aria-label="Mais ' + g.rotulo.toLowerCase() + '">+</button></div></div>';
    }).join('');
    var fundo = document.createElement('div'); fundo.className = 'brf-fundo';
    var caixa = document.createElement('div'); caixa.className = 'brf';
    caixa.setAttribute('role', 'dialog'); caixa.setAttribute('aria-modal', 'true'); caixa.setAttribute('aria-labelledby', 'brfTitulo');
    caixa.innerHTML = '<button type="button" class="brf-x" aria-label="Fechar">&times;</button>'
      + '<h2 id="brfTitulo"></h2>'
      + '<p>Esses são os dados que o seu parceiro de viagem precisa para cotar preços reais de passagem e hospedagem, sem idas e vindas.</p>'
      + '<form novalidate>'
      + '<label class="cot-f"><span>Seu nome</span><input name="nome" autocomplete="given-name" required></label>'
      + '<div class="brf-datas"><label class="cot-f"><span>Ida</span><input type="date" name="ida" required></label><label class="cot-f"><span>Volta</span><input type="date" name="volta" required></label></div>'
      + '<div class="cot-f"><span>Quem vai</span><div class="brf-pessoas">' + tiles + '</div></div>'
      + '<div class="brf-erro" role="alert" hidden></div>'
      + '<button class="cot-go" type="submit">Pedir cotação no WhatsApp</button>'
      + '</form>'
      + '<a class="brf-direto" href="#">Prefiro falar direto no WhatsApp</a>'
      + '<div class="brf-convite" hidden><h2>Seja o primeiro a saber</h2>'
      + '<p class="brf-convite-txt"></p>'
      + '<a class="cot-go" target="_blank" rel="noopener">Quero receber as ofertas</a>'
      + '<a class="brf-direto brf-agora-nao" href="#">Agora não</a>'
      + '<small>Só ofertas do destino, sem spam. Você sai quando quiser.</small></div>';
    document.body.appendChild(fundo); document.body.appendChild(caixa);
    var form = caixa.querySelector('form'), erro = caixa.querySelector('.brf-erro');
    var ida = form.elements.ida, volta = form.elements.volta;
    fundo.addEventListener('click', fecharBriefing);
    caixa.querySelector('.brf-x').addEventListener('click', fecharBriefing);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && caixa.classList.contains('open')) fecharBriefing(); });
    ida.addEventListener('change', function(){
      volta.min = ida.value || hojeIso();
      if(volta.value && ida.value && volta.value < ida.value) volta.value = '';
    });
    caixa.querySelector('.brf-pessoas').addEventListener('click', function(e){
      var b = e.target.closest('button[data-passo]'); if(!b) return;
      var id = b.closest('.brf-tile').getAttribute('data-grupo');
      var g = GRUPOS.filter(function(x){ return x.id === id; })[0];
      contagem[id] = Math.max(g.min, contagem[id] + Number(b.getAttribute('data-passo')));
      pintarContagem();
    });
    caixa.querySelector('.brf-direto').addEventListener('click', function(e){
      e.preventDefault();
      var msg = decodeURIComponent((atual.href.split('?text=')[1] || '').replace(/\+/g, ' '));
      fecharBriefing();
      abrir(msg, atual.destino);
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var nome = String(form.elements.nome.value || '').trim();
      var falta = !nome ? 'Conte seu nome.' : !ida.value ? 'Escolha a data de ida.' : !volta.value ? 'Escolha a data de volta.' : volta.value < ida.value ? 'A volta precisa ser depois da ida.' : '';
      if(falta){ erro.textContent = falta; erro.hidden = false; return; }
      var quem = GRUPOS.filter(function(g){ return contagem[g.id] > 0; }).map(function(g){
        return contagem[g.id] + ' ' + (contagem[g.id] === 1 ? g.um : g.varios);
      });
      var quemTexto = quem.length > 1 ? quem.slice(0, -1).join(', ') + ' e ' + quem[quem.length - 1] : quem[0];
      var linhas = [
        'Olá, OND! Quero comprar uma viagem para ' + atual.destinoFrase + '. Vi no catálogo: ' + atual.link,
        'Nome: ' + nome,
        'Datas: ' + dataBr(ida.value) + ' a ' + dataBr(volta.value),
        'Quem vai: ' + quemTexto
      ];
      abrir(linhas.join('\n'), atual.destino);
      mostrarConvite();
    });
    caixa.querySelector('.brf-agora-nao').addEventListener('click', function(e){ e.preventDefault(); fecharBriefing(); });
    caixa.querySelector('.brf-convite .cot-go').addEventListener('click', function(){
      if(window.gtag) gtag('event', 'grupo_entrar', { destino: atual.destino, pagina: location.pathname });
      fecharBriefing();
    });
    briefing = { fundo: fundo, caixa: caixa, form: form, erro: erro, convite: caixa.querySelector('.brf-convite') };
  }

  function hojeIso(){
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function dataBr(iso){ var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function pintarContagem(){
    GRUPOS.forEach(function(g){
      var tile = briefing.caixa.querySelector('[data-grupo="' + g.id + '"]');
      tile.querySelector('span').textContent = contagem[g.id];
      tile.querySelector('[data-passo="-1"]').disabled = contagem[g.id] <= g.min;
      tile.classList.toggle('on', contagem[g.id] > 0);
    });
  }
  function mostrarConvite(){
    var destinoDoConvite = atual;
    carregarGruposDestino().then(function(mapa){
      if(atual !== destinoDoConvite) return;
      pintarConvite(mapa[atual.slug]);
    });
  }
  function pintarConvite(link){
    if(!link || !briefing.caixa.classList.contains('open')){ fecharBriefing(); return; }
    briefing.convite.querySelector('.brf-convite-txt').textContent = 'Quando cai uma tarifa boa para ' + atual.destinoFrase
      + ', a gente avisa no grupo antes de qualquer lugar. São poucas vagas por viagem e costumam sumir no mesmo dia.';
    briefing.convite.querySelector('.cot-go').href = link;
    [].forEach.call(briefing.caixa.children, function(bloco){
      if(!bloco.classList.contains('brf-x')) bloco.hidden = !bloco.classList.contains('brf-convite');
    });
    if(window.gtag) gtag('event', 'grupo_convite', { destino: atual.destino, pagina: location.pathname });
  }
  function abrirBriefing(cta){
    if(!briefing) montarBriefing();
    carregarGruposDestino();
    var card = cta.closest('article.dc');
    var msgOriginal = decodeURIComponent((cta.href.split('?text=')[1] || '').replace(/\+/g, ' '));
    var frase = (msgOriginal.match(/viagem para (.+?)\. Vi no cat/) || [])[1] || cta.getAttribute('data-wa');
    atual = {
      href: cta.href,
      destino: cta.getAttribute('data-wa') || 'catalogo',
      destinoFrase: frase,
      slug: card && card.id ? card.id : '',
      link: 'https://ondviajar.com.br/viagens/' + (card && card.id ? '#' + card.id : '')
    };
    [].forEach.call(briefing.caixa.children, function(bloco){
      bloco.hidden = bloco.classList.contains('brf-convite');
    });
    briefing.caixa.querySelector('#brfTitulo').textContent = 'Sua viagem para ' + frase;
    briefing.form.reset();
    briefing.erro.hidden = true;
    briefing.form.elements.ida.min = hojeIso();
    briefing.form.elements.volta.min = hojeIso();
    GRUPOS.forEach(function(g){ contagem[g.id] = g.inicial; });
    pintarContagem();
    briefing.fundo.classList.add('open'); briefing.caixa.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ briefing.form.elements.nome.focus(); }, 60);
    if(window.gtag) gtag('event', 'briefing_open', { destino: atual.destino, pagina: location.pathname });
  }
  function fecharBriefing(){
    briefing.fundo.classList.remove('open'); briefing.caixa.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function(e){
    var cta = e.target.closest && e.target.closest('a.dc-cta');
    if(!cta) return;
    e.preventDefault();
    abrirBriefing(cta);
  });
})();
