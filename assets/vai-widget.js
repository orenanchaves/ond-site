/* OND vAI — orbe flutuante (arrastável) + assistente prévia.
   Responde sobre o OND (o que é, o que faz, contato, preço) e simula um roteiro.
   Incluir com: <script src="assets/vai-widget.js" defer></script> */
(function () {
  if (window.__ondVai) return; window.__ondVai = true;

  var PLAY = 'https://play.google.com/store/apps/details?id=com.agamatec.ond';
  var APPSTORE = 'https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427';
  var WEB = 'https://web.ondviajar.com.br/';
  var WA = 'https://wa.me/5511910214133';
  var MAIL = 'renan@agamatec.com';
  var CAL = 'https://calendly.com/renanfr1047/30min';
  // contexto: na LP de agencias/hoteis o vAI responde como B2B (propostas, reunião)
  var B2B = /\/(agencias|hoteis)/.test(location.pathname) || !!document.querySelector('link[href*="ond-b2b"]');

  var SYMBOL = '<svg viewBox="0 0 497.26 497.26"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>';
  var IC_ANDROID = '<svg viewBox="0 0 24 24" style="fill:#3DDC84"><path d="M17.523 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.046 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.405-6.02l1.997-3.46a.42.42 0 00-.72-.42l-2.02 3.5A12.3 12.3 0 0012 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.45a.42.42 0 00-.72.42l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44"/></svg>';
  var IC_APPLE = '<svg viewBox="0 0 24 24" style="fill:currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  var IC_WEB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg>';

  var REPLIES = [
    function (d) { return 'Boa pedida, ' + d + '! 🙌 Dá pra montar um roteiro dia a dia com os melhores pontos, as rotas na ordem certa e onde ficar — em minutos, não horas.'; },
    function (d) { return d + ' é uma ótima escolha! ✨ No app eu monto o roteiro completo, comparo voos e hospedagem e ainda te acompanho durante a viagem.'; },
    function (d) { return 'Adorei — ' + d + '! 🗺️ Te entrego um plano sob medida: o que fazer, quanto custa e como se locomover, tudo organizado pra você só curtir.'; }
  ];

  // respostas fixas (aceitam HTML) — B2C (viajante)
  var ANSWERS_B2C = {
    ola: 'Oi! 👋 Eu sou o <b>OND vAI</b>, seu planejador de viagem. Me pergunta o que quiser — <i>o que é o OND</i>, <i>como funciona</i>, <i>contato</i> — ou já me diz um destino que eu te dou um gostinho do roteiro. ✈️',
    oque: 'O <b>OND</b> é a sua agência de viagem <b>conversacional com IA</b>. 🧭 Em vez de pesquisar em dezenas de sites, você conversa comigo e eu monto o <b>roteiro completo</b> — com voos, hospedagem e passeios — em minutos.',
    faz: 'Eu <b>planejo sua viagem numa conversa</b>: monto o roteiro dia a dia, <b>indico e comparo voos, hotéis e passeios</b>, estimo os custos e ainda te acompanho durante a viagem. Tudo no app — iOS, Android e Web. 📲',
    preco: 'Dá pra <b>começar de graça</b>! 🎉 Você monta e testa o seu roteiro sem pagar nada. Quer experimentar? Baixa o app aqui embaixo. 👇',
    contato: 'Bora falar! 💬<br>📱 WhatsApp: <a href="' + WA + '" target="_blank" rel="noopener">(11) 91021-4133</a><br>✉️ E-mail: <a href="mailto:' + MAIL + '">' + MAIL + '</a><br><span style="opacity:.85">O OND é da <b>Agama Tec</b> — dos fundadores <b>Renan Rodrigues</b> e <b>Renan Chaves</b>.</span>'
  };
  // respostas B2B (agência)
  var ANSWERS_B2B = {
    ola: 'Oi! 👋 Sou o <b>OND vAI</b>. Aqui pra sua <b>agência</b>: me pergunte <i>o que é o OND</i>, <i>como funciona pra agências</i>, <i>o modelo</i>, ou já <i>agende uma reunião</i>. 🤝',
    oque: 'O <b>OND</b> é a <b>plataforma de vendas</b> da sua agência. 🧭 Você monta uma <b>proposta de viagem</b> em minutos e envia um link com a <b>sua marca</b> onde o cliente personaliza tudo — troca passeios, adiciona seguro e upgrades — e fecha. Mais ticket, menos ida e volta no e-mail.',
    faz: 'Você monta a proposta (roteiro, voos, hotéis e preços) em minutos com a IA; o cliente abre o link com a <b>sua marca</b> e <b>personaliza sozinho</b>, adicionando seguro e add-ons; o preço recalcula na hora e a venda fecha. Você acompanha tudo no painel de propostas. 📊',
    preco: 'O modelo é <b>fee fixo mensal + rev-share por venda</b>, e <b>você define o preço</b> que cobra do seu cliente. As condições a gente alinha numa <b>reunião de 30 min</b>, do tamanho da sua operação. 👇',
    marca: 'Sim, é <b>white-label</b>! 🏷️ O portal e a proposta saem com o <b>seu logo, suas cores e seu domínio</b>. O cliente vê a sua agência, não a OND — a tecnologia trabalha nos bastidores.',
    contato: 'Bora conversar! 💬 O melhor caminho é uma <b>reunião de 30 min</b> 👇<br>📱 WhatsApp: <a href="' + WA + '" target="_blank" rel="noopener">(11) 91021-4133</a><br>✉️ E-mail: <a href="mailto:' + MAIL + '">' + MAIL + '</a><br><span style="opacity:.85">O OND é da <b>Agama Tec</b>, dos fundadores <b>Renan Rodrigues</b> e <b>Renan Chaves</b>.</span>'
  };
  var ANSWERS = B2B ? ANSWERS_B2B : ANSWERS_B2C;

  function intentOf(t) {
    var s = (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/(^|\s)(oi|ola|opa|e ?ai|bom dia|boa tarde|boa noite|hello|hi|hey)(\s|!|\?|$)/.test(s)) return 'ola';
    if (B2B && /marca|white ?label|whitelabel|branding|meu logo|meu dominio|minha cara/.test(s)) return 'marca';
    if (B2B && /reuniao|agendar|marcar|demonstra|demo|comecar|contratar|onboarding/.test(s)) return 'contato';
    if (/contato|falar com|fale com|email|e-mail|whats|suporte|fundador|renan|quem criou|quem fez|quem e voc|agama/.test(s)) return 'contato';
    if (/quanto custa|preco|preco|valor|gratis|gratuito|de graca|pagar|assinatura|caro|modelo|rev.?share|comissao/.test(s)) return 'preco';
    if (/o que e|que e o ond|que e isso|what is|voce e|sobre o ond|para que serve|pra que serve/.test(s)) return 'oque';
    if (/o que faz|o que voce faz|como funciona|como voce funciona|como monta|what do you do|recursos|funcionalidade/.test(s)) return 'faz';
    return 'destino';
  }

  var CSS = '\
.ondvai-orb{position:fixed;right:22px;bottom:22px;z-index:99998;width:60px;height:60px;border-radius:50%;border:none;cursor:grab;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7c3fff,#9d6fff);box-shadow:0 8px 24px rgba(124,63,255,.45);animation:ondvai-pulse 2.6s ease-out infinite;transition:transform .18s;touch-action:none}\
.ondvai-orb:hover{transform:scale(1.08)}\
.ondvai-orb.dragging{cursor:grabbing;transform:scale(1.06);animation:none}\
.ondvai-orb svg{width:30px;height:30px;fill:#fff;pointer-events:none}\
.ondvai-orb.hide{display:none}\
@keyframes ondvai-pulse{0%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 0 rgba(124,63,255,.45)}70%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 15px rgba(124,63,255,0)}100%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 0 rgba(124,63,255,0)}}\
.ondvai-bubble{position:fixed;z-index:99997;background:var(--ond-color-surface,#16161f);color:var(--ond-color-text,#f0eeff);border:1px solid var(--ond-color-border,#2a2a44);border-radius:14px;padding:10px 10px 10px 13px;font-size:.82rem;font-weight:600;max-width:216px;box-shadow:0 12px 34px rgba(0,0,0,.5);display:flex;align-items:center;gap:8px;cursor:pointer;animation:ondvai-bub .3s ease}\
.ondvai-bubble .bx{background:none;border:none;color:var(--ond-color-muted,#8888b0);cursor:pointer;font-size:.85rem;line-height:1;padding:0 2px;flex-shrink:0}\
.ondvai-bubble .bx:hover{color:var(--ond-color-text,#f0eeff)}\
@keyframes ondvai-bub{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}\
.ondvai-panel{position:fixed;right:22px;bottom:94px;z-index:99999;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 130px);background:var(--ond-color-surface,#16161f);border:1px solid var(--ond-color-border,#252540);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .22s,transform .24s cubic-bezier(.34,1.56,.64,1);font-family:inherit}\
.ondvai-panel.open{opacity:1;transform:none;pointer-events:auto}\
.ondvai-head{display:flex;align-items:center;gap:10px;padding:13px 16px;background:linear-gradient(135deg,rgba(124,63,255,.18),transparent);border-bottom:1px solid var(--ond-color-border,#252540)}\
.ondvai-hh{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#7c3fff,#9d6fff);display:flex;align-items:center;justify-content:center;flex-shrink:0}\
.ondvai-hh svg{width:18px;height:18px;fill:#fff}\
.ondvai-ht{font-weight:800;font-size:.98rem;color:var(--ond-color-text,#f0eeff);display:flex;align-items:center;gap:7px;line-height:1.2}\
.ondvai-tag{font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#b79bff;background:rgba(124,63,255,.18);border:1px solid rgba(124,63,255,.35);padding:1px 6px;border-radius:20px}\
.ondvai-on{font-size:.72rem;color:#00e676;display:flex;align-items:center;gap:5px;margin-top:2px}\
.ondvai-on::before{content:"";width:6px;height:6px;border-radius:50%;background:#00e676;box-shadow:0 0 6px #00e676}\
.ondvai-x{margin-left:auto;background:none;border:none;color:var(--ond-color-muted,#8888b0);font-size:1.15rem;cursor:pointer;line-height:1;padding:4px}\
.ondvai-x:hover{color:var(--ond-color-text,#f0eeff)}\
.ondvai-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:11px}\
.ondvai-chips{display:flex;flex-wrap:wrap;gap:7px}\
.ondvai-chip{background:var(--ond-color-card,#1a1a2e);border:1px solid var(--ond-color-border,#252540);color:var(--ond-color-text,#f0eeff);font-size:.78rem;font-weight:600;padding:7px 12px;border-radius:50px;cursor:pointer;font-family:inherit}\
.ondvai-chip:hover{border-color:#7c3fff;color:#b79bff}\
.ondvai-msg{max-width:84%;font-size:.9rem;line-height:1.5;padding:11px 14px;border-radius:14px;word-wrap:break-word}\
.ondvai-msg a{color:#b79bff}\
.ondvai-bot{align-self:flex-start;background:var(--ond-color-card,#1a1a2e);color:var(--ond-color-text,#f0eeff);border:1px solid var(--ond-color-border,#252540);border-bottom-left-radius:4px}\
.ondvai-me{align-self:flex-end;background:#7c3fff;color:#fff;border-bottom-right-radius:4px}\
.ondvai-typing{align-self:flex-start;display:flex;gap:4px;padding:13px 14px;background:var(--ond-color-card,#1a1a2e);border:1px solid var(--ond-color-border,#252540);border-radius:14px;border-bottom-left-radius:4px}\
.ondvai-typing span{width:7px;height:7px;border-radius:50%;background:var(--ond-color-muted,#8888b0);animation:ondvai-blink 1.2s infinite}\
.ondvai-typing span:nth-child(2){animation-delay:.2s}.ondvai-typing span:nth-child(3){animation-delay:.4s}\
@keyframes ondvai-blink{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}\
.ondvai-cta{align-self:stretch;background:linear-gradient(135deg,rgba(124,63,255,.14),transparent);border:1px solid rgba(124,63,255,.28);border-radius:14px;padding:14px}\
.ondvai-cta b{display:block;font-size:.85rem;color:var(--ond-color-text,#f0eeff);margin-bottom:10px}\
.ondvai-btns{display:flex;flex-direction:column;gap:8px}\
.ondvai-ab{display:flex;align-items:center;gap:9px;text-decoration:none;padding:10px 14px;border-radius:11px;font-weight:700;font-size:.85rem;border:1px solid var(--ond-color-border,#252540);background:var(--ond-color-surface,#16161f);color:var(--ond-color-text,#f0eeff);transition:transform .12s,border-color .15s}\
.ondvai-ab:hover{transform:translateY(-1px);border-color:#7c3fff}\
.ondvai-ab.pri{background:#7c3fff;color:#fff;border-color:#7c3fff}\
.ondvai-ab svg{width:18px;height:18px;flex-shrink:0}\
.ondvai-foot{padding:11px 14px;border-top:1px solid var(--ond-color-border,#252540)}\
.ondvai-form{display:flex;gap:8px}\
.ondvai-in{flex:1;min-width:0;background:var(--ond-color-bg,#0d0d14);border:1px solid var(--ond-color-border,#252540);border-radius:50px;padding:11px 16px;color:var(--ond-color-text,#f0eeff);font-size:.9rem;outline:none;font-family:inherit}\
.ondvai-in:focus{border-color:#7c3fff}\
.ondvai-snd{background:#7c3fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;color:#fff;flex-shrink:0;font-size:1.15rem;line-height:1}\
.ondvai-snd:hover{background:#9d6fff}\
.ondvai-note{font-size:.66rem;color:var(--ond-color-muted,#8888b0);text-align:center;margin-top:8px}\
@media(max-width:480px){.ondvai-panel{right:10px;left:10px;width:auto;bottom:86px;height:72vh}.ondvai-orb{right:16px;bottom:16px}}';

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function ready() {
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

    var GREET = B2B
      ? 'Oi! 👋 Sou o <b>OND vAI</b>. Aqui pra sua <b>agência</b>: pergunte o que quiser sobre o OND, ou já agende uma reunião. 🤝'
      : 'Oi! 👋 Eu sou o <b>OND vAI</b>. Pergunte qualquer coisa — ou me diga um destino que eu já te dou um gostinho do roteiro. ✈️';
    var CHIPS = B2B
      ? '<button class="ondvai-chip" data-q="O que é o OND?">O que é o OND?</button><button class="ondvai-chip" data-q="Como funciona pra agências?">Como funciona pra agências?</button><button class="ondvai-chip" data-q="Qual o modelo?">Qual o modelo?</button><button class="ondvai-chip" data-q="Agendar reunião">Agendar reunião</button>'
      : '<button class="ondvai-chip" data-q="O que é o OND?">O que é o OND?</button><button class="ondvai-chip" data-q="O que você faz?">O que você faz?</button><button class="ondvai-chip" data-q="Quanto custa?">Quanto custa?</button><button class="ondvai-chip" data-q="Contato">Contato</button>';
    var NOTE = B2B ? 'Prévia do OND vAI — fale com a gente pra ver tudo.' : 'Prévia do OND vAI — o roteiro completo é no app.';
    var PH = B2B ? 'Pergunte sobre o OND pra agências...' : 'Pergunte qualquer coisa pro OND vAI...';

    var root = document.createElement('div');
    root.innerHTML =
      '<button class="ondvai-orb" id="ondvaiOrb" aria-label="Abrir OND vAI">' + SYMBOL + '</button>' +
      '<div class="ondvai-panel" id="ondvaiPanel" role="dialog" aria-label="OND vAI">' +
        '<div class="ondvai-head"><div class="ondvai-hh">' + SYMBOL + '</div><div><div class="ondvai-ht">OND vAI <span class="ondvai-tag">prévia</span></div><div class="ondvai-on">online agora</div></div><button class="ondvai-x" id="ondvaiClose" aria-label="Fechar">✕</button></div>' +
        '<div class="ondvai-body" id="ondvaiBody">' +
          '<div class="ondvai-msg ondvai-bot">' + GREET + '</div>' +
          '<div class="ondvai-chips" id="ondvaiChips">' + CHIPS + '</div>' +
        '</div>' +
        '<div class="ondvai-foot"><form class="ondvai-form" id="ondvaiForm"><input class="ondvai-in" id="ondvaiInput" type="text" placeholder="' + PH + '" autocomplete="off"><button class="ondvai-snd" type="submit" aria-label="Enviar">→</button></form><div class="ondvai-note">' + NOTE + '</div></div>' +
      '</div>';
    document.body.appendChild(root);

    var orb = document.getElementById('ondvaiOrb');
    var panel = document.getElementById('ondvaiPanel');
    var body = document.getElementById('ondvaiBody');
    var form = document.getElementById('ondvaiForm');
    var input = document.getElementById('ondvaiInput');
    var chips = document.getElementById('ondvaiChips');

    var ua = navigator.userAgent || '';
    var isAndroid = /android/i.test(ua);
    var isIOS = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document);

    /* ---------- orbe arrastável ---------- */
    function applyPos(x, y) {
      x = Math.max(8, Math.min(x, window.innerWidth - 68));
      y = Math.max(8, Math.min(y, window.innerHeight - 68));
      orb.style.left = x + 'px'; orb.style.top = y + 'px'; orb.style.right = 'auto'; orb.style.bottom = 'auto';
    }
    try { var sp = JSON.parse(localStorage.getItem('ondvai_orb_pos') || 'null'); if (sp && typeof sp.left === 'number') applyPos(sp.left, sp.top); } catch (e) {}
    var down = null, moved = false, suppressClick = false;
    orb.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, rect: orb.getBoundingClientRect() }; moved = false;
      try { orb.setPointerCapture(e.pointerId); } catch (er) {}
    });
    orb.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      moved = true; orb.classList.add('dragging'); hideBubble();
      applyPos(down.rect.left + dx, down.rect.top + dy);
    });
    orb.addEventListener('pointerup', function () {
      if (!down) return; var wasMoved = moved; down = null; orb.classList.remove('dragging');
      if (wasMoved) { suppressClick = true; var r = orb.getBoundingClientRect(); try { localStorage.setItem('ondvai_orb_pos', JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) })); } catch (e) {} }
    });
    window.addEventListener('resize', function () { var r = orb.getBoundingClientRect(); if (orb.style.left) applyPos(r.left, r.top); });

    /* ---------- abrir / fechar ---------- */
    function open() { hideBubble(); positionPanel(); panel.classList.add('open'); orb.classList.add('hide'); setTimeout(function () { try { input.focus(); } catch (e) {} }, 250); }
    function close() { panel.classList.remove('open'); orb.classList.remove('hide'); }
    function positionPanel() {
      if (window.innerWidth <= 480) { panel.style.left = ''; panel.style.top = ''; panel.style.right = ''; panel.style.bottom = ''; return; }
      var r = orb.getBoundingClientRect(), pw = panel.offsetWidth || 360, ph = panel.offsetHeight || 520;
      var left = Math.min(Math.max(8, r.right - pw), window.innerWidth - pw - 8);
      var top = r.top - ph - 12;
      if (top < 8) { top = Math.min(r.bottom + 12, window.innerHeight - ph - 8); if (top < 8) top = 8; }
      panel.style.left = left + 'px'; panel.style.top = top + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    }
    orb.addEventListener('click', function (e) { if (suppressClick) { suppressClick = false; e.preventDefault(); return; } open(); });
    document.getElementById('ondvaiClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    /* ---------- balão de convite ---------- */
    var bubbleTimer = null;
    function hideBubble() { var b = document.getElementById('ondvaiBubble'); if (b) b.remove(); if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; } }
    function showBubble() {
      if (document.getElementById('ondvaiBubble') || panel.classList.contains('open')) return;
      var b = document.createElement('div'); b.className = 'ondvai-bubble'; b.id = 'ondvaiBubble';
      b.innerHTML = '<span>' + (B2B ? '👋 Dúvidas do OND pra agências?' : '👋 Pergunte qualquer coisa pro OND vAI') + '</span><button class="bx" aria-label="Fechar">✕</button>';
      document.body.appendChild(b);
      var r = orb.getBoundingClientRect(), bw = b.offsetWidth, bh = b.offsetHeight;
      var left = r.left - bw - 12; if (left < 8) left = Math.min(r.right + 12, window.innerWidth - bw - 8);
      var top = Math.max(8, Math.min(r.top + r.height / 2 - bh / 2, window.innerHeight - bh - 8));
      b.style.left = left + 'px'; b.style.top = top + 'px';
      b.querySelector('.bx').addEventListener('click', function (e) { e.stopPropagation(); hideBubble(); });
      b.addEventListener('click', open);
      bubbleTimer = setTimeout(hideBubble, 9000);
    }
    try { if (!sessionStorage.getItem('ondvai_greeted')) { sessionStorage.setItem('ondvai_greeted', '1'); setTimeout(showBubble, 2600); } } catch (e) { setTimeout(showBubble, 2600); }

    /* ---------- conversa ---------- */
    function scroll() { body.scrollTop = body.scrollHeight; }
    function add(cls, html) { var el = document.createElement('div'); el.className = 'ondvai-msg ' + cls; el.innerHTML = html; body.appendChild(el); scroll(); return el; }
    function ctaButtons() {
      var a = ['<a class="ondvai-ab" href="' + PLAY + '" target="_blank" rel="noopener">' + IC_ANDROID + 'Google Play</a>',
               '<a class="ondvai-ab" href="' + APPSTORE + '" target="_blank" rel="noopener">' + IC_APPLE + 'App Store</a>',
               '<a class="ondvai-ab" href="' + WEB + '" target="_blank" rel="noopener">' + IC_WEB + 'Usar na Web</a>'];
      var pri = isAndroid ? 0 : isIOS ? 1 : 2;
      a[pri] = a[pri].replace('class="ondvai-ab"', 'class="ondvai-ab pri"');
      a.unshift(a.splice(pri, 1)[0]);
      return a.join('');
    }
    function appCta(dest) {
      var el = document.createElement('div'); el.className = 'ondvai-cta';
      var t = dest ? 'Quer o roteiro completo de ' + esc(dest) + '? Continue no OND 👇' : 'Baixe o OND e comece agora 👇';
      el.innerHTML = '<b>' + t + '</b><div class="ondvai-btns">' + ctaButtons() + '</div>';
      body.appendChild(el); scroll();
    }
    function typing() { var t = document.createElement('div'); t.className = 'ondvai-typing'; t.innerHTML = '<span></span><span></span><span></span>'; body.appendChild(t); scroll(); return t; }

    function meetingCta() {
      var el = document.createElement('div'); el.className = 'ondvai-cta';
      el.innerHTML = '<b>Vamos falar? Agende 30 min 👇</b><div class="ondvai-btns">' +
        '<a class="ondvai-ab pri" href="' + CAL + '" target="_blank" rel="noopener">📅 Agendar reunião</a>' +
        '<a class="ondvai-ab" href="' + WA + '?text=' + encodeURIComponent('Olá! Tenho uma agência e quero saber mais sobre o OND') + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</div>';
      body.appendChild(el); scroll();
    }
    function reply(text) {
      var intent = intentOf(text);
      var t = typing();
      setTimeout(function () {
        t.remove();
        if (B2B) {
          if (intent === 'destino') {
            add('ondvai-bot', 'Boa! Pra <b>' + esc(text) + '</b> você monta a proposta em segundos aqui na página — roteiro, preços e a sua marca. Quer ver ao vivo? 👇');
            setTimeout(meetingCta, 400);
          } else {
            add('ondvai-bot', ANSWERS[intent] || ANSWERS.oque);
            if (intent === 'faz' || intent === 'preco' || intent === 'marca' || intent === 'contato') setTimeout(meetingCta, 450);
          }
          return;
        }
        if (intent === 'destino') {
          add('ondvai-bot', REPLIES[Math.floor(Math.random() * REPLIES.length)](esc(text)));
          setTimeout(function () { appCta(text); }, 400);
        } else {
          add('ondvai-bot', ANSWERS[intent]);
          if (intent === 'faz' || intent === 'preco') setTimeout(function () { appCta(null); }, 450);
        }
      }, 900);
    }

    function send(text) {
      text = (text || '').trim(); if (!text) return;
      if (chips) { chips.remove(); chips = null; }
      add('ondvai-me', esc(text)); reply(text);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; send(v); });
    if (chips) chips.addEventListener('click', function (e) { var c = e.target.closest('.ondvai-chip'); if (c) send(c.getAttribute('data-q')); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
