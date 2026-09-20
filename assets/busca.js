/* Busca do site numa janela por cima da página.
   Qualquer link para /busca/ abre a janela; sem JavaScript, o link leva à página /busca/.
   O índice é o mesmo da página: /assets/busca.json (destinos, posts e páginas). */
(function () {
  var CSS = '.obx-ov{position:fixed;inset:0;background:rgba(5,4,12,.62);backdrop-filter:blur(3px);z-index:99990;opacity:0;pointer-events:none;transition:opacity .18s}'
    + '.obx-ov.on{opacity:1;pointer-events:auto}'
    + '.obx{position:fixed;z-index:99991;left:50%;top:12vh;transform:translate(-50%,-8px);width:min(640px,calc(100vw - 28px));max-height:76vh;display:flex;flex-direction:column;'
    + 'background:var(--ond-color-surface,#16161f);border:1px solid var(--ond-color-border,#2a2a44);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}'
    + '.obx.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}'
    + '.obx .bx-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--ond-color-border,#2a2a44)}'
    + '.obx .bx-top svg{width:19px;height:19px;color:var(--ond-color-muted,#8888b0);flex:none}'
    + '.bx-in{flex:1;min-width:0;font:inherit;font-size:1.02rem;color:var(--ond-color-text,#f0eeff);background:transparent;border:0;outline:none;padding:4px 0}'
    + '.bx-in::placeholder{color:var(--ond-color-muted,#8888b0)}'
    + '.bx-x{background:none;border:0;color:var(--ond-color-muted,#8888b0);font-size:1.2rem;line-height:1;cursor:pointer;padding:6px;border-radius:8px}'
    + '.bx-x:hover{color:var(--ond-color-text,#f0eeff)}'
    + '.bx-l{list-style:none;margin:0;padding:8px;overflow-y:auto;overscroll-behavior:contain}'
    + '.obx .bx-l a{display:block;padding:11px 12px;border-radius:12px;text-decoration:none;color:var(--ond-color-text,#f0eeff)}'
    + '.obx .bx-l a:hover,.obx .bx-l a.sel{background:color-mix(in srgb,var(--ond-color-primary,#7f11f4) 16%,transparent)}'
    + '.bx-k{display:block;font-size:.7rem;font-weight:700;color:var(--ond-color-primaryHover,#b794ff);margin-bottom:2px}'
    + '.bx-t{display:block;font-weight:700;line-height:1.3}'
    + '.bx-d{display:block;font-size:.86rem;line-height:1.45;color:var(--ond-color-muted,#8888b0);margin-top:2px}'
    + '.bx-vazio{padding:16px 14px;color:var(--ond-color-muted,#8888b0);line-height:1.6}'
    + '.bx-vazio a{color:var(--ond-color-primaryHover,#b794ff)}'
    + '.bx-dica{padding:10px 16px 14px;color:var(--ond-color-muted,#8888b0);font-size:.8rem;border-top:1px solid var(--ond-color-border,#2a2a44)}'
    + '.bx-in:focus-visible,.bx-x:focus-visible,.obx .bx-l a:focus-visible{outline:2px solid var(--ond-color-primaryHover,#b794ff);outline-offset:2px}'
    + '@media(prefers-reduced-motion:reduce){.bx,.obx-ov{transition:none}}';

  var LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var dados = null, carregando = false, ov, cx, campo, lista, antes = null, sel = -1;

  function sem(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function monta() {
    var est = document.createElement('style'); est.textContent = CSS; document.head.appendChild(est);
    ov = document.createElement('div'); ov.className = 'obx-ov';
    cx = document.createElement('div'); cx.className = 'obx'; cx.id = 'ondBuscaBox'; cx.setAttribute('role', 'dialog');
    cx.setAttribute('aria-modal', 'true'); cx.setAttribute('aria-label', 'Buscar no site');
    cx.innerHTML = '<div class="bx-top">' + LUPA
      + '<input class="bx-in" type="search" autocomplete="off" placeholder="Destino, mês, quanto custa…" aria-label="O que você procura">'
      + '<button class="bx-x" type="button" aria-label="Fechar">✕</button></div>'
      + '<ul class="bx-l"></ul><p class="bx-dica">Use as setas para escolher e Enter para abrir.</p>';
    document.body.appendChild(ov); document.body.appendChild(cx);
    campo = cx.querySelector('.bx-in'); lista = cx.querySelector('.bx-l');
    ov.addEventListener('click', fecha);
    cx.querySelector('.bx-x').addEventListener('click', fecha);
    campo.addEventListener('input', function () { sel = -1; mostra(campo.value) });
    cx.addEventListener('keydown', function (e) {
      var itens = lista.querySelectorAll('a');
      if (e.key === 'Escape') { fecha(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!itens.length) return;
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : itens.length - 1)) % itens.length;
        itens.forEach(function (a, i) { a.classList.toggle('sel', i === sel) });
        itens[sel].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && sel >= 0 && itens[sel]) { e.preventDefault(); location.href = itens[sel].href }
    });
    cx.inert = true;
  }

  function mostra(q) {
    var termos = sem(q).split(/\s+/).filter(Boolean);
    if (!dados) { lista.innerHTML = '<li class="bx-vazio">Carregando…</li>'; return }
    if (!termos.length) {
      lista.innerHTML = '<li class="bx-vazio">Busque entre ' + dados.length + ' páginas: destinos, posts e seções do site.</li>';
      return;
    }
    var achados = dados.filter(function (i) {
      return termos.every(function (t) { return i.b.indexOf(t) >= 0 })
    }).slice(0, 12);
    lista.innerHTML = achados.length
      ? achados.map(function (i) {
          return '<li><a href="' + i.u + '"><span class="bx-k">' + i.k + '</span><span class="bx-t">' + i.t + '</span>'
            + (i.d ? '<span class="bx-d">' + i.d + '</span>' : '') + '</a></li>';
        }).join('')
      : '<li class="bx-vazio">Nada com esse termo. Tente o nome do destino, ou <a href="https://wa.me/5511943615412?text=Ol%C3%A1%2C%20OND%21%20Estou%20procurando%20uma%20viagem." target="_blank" rel="noopener">pergunte pro OND no WhatsApp</a>.</li>';
  }

  function carrega() {
    if (dados || carregando) return;
    carregando = true;
    fetch('/assets/busca.json').then(function (r) { return r.json() })
      .then(function (j) { dados = j; mostra(campo.value) })
      .catch(function () { lista.innerHTML = '<li class="bx-vazio">A busca não carregou. Abra a <a href="/busca/">página de busca</a>.</li>' });
  }

  function abre(e) {
    if (e) e.preventDefault();
    if (!ov) monta();
    antes = document.activeElement;
    cx.inert = false; ov.classList.add('on'); cx.classList.add('on');
    document.body.style.overflow = 'hidden';
    carrega(); mostra(campo.value || '');
    setTimeout(function () { campo.focus() }, 40);
  }

  function fecha() {
    if (!ov) return;
    ov.classList.remove('on'); cx.classList.remove('on'); cx.inert = true;
    document.body.style.overflow = '';
    if (antes && antes.focus) { try { antes.focus() } catch (e) {} }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href$="/busca/"], a[href="/busca/"]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0 && location.pathname !== '/busca/') abre(e);
  });
  document.addEventListener('keydown', function (e) {
    var campoAtivo = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    if (!campoAtivo && (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) { abre(e) }
  });
  window.ondBusca = abre;
})();
