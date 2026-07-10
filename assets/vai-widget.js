/* OND vAI — orbe flutuante + simulação (prévia) que encaminha pro app.
   Widget autônomo: injeta CSS + HTML e trata a interação. Incluir em cada página com:
   <script src="assets/vai-widget.js" defer></script>  */
(function () {
  if (window.__ondVai) return; window.__ondVai = true;

  var PLAY = 'https://play.google.com/store/apps/details?id=com.agamatec.ond';
  var APPSTORE = 'https://apps.apple.com/br/app/ond-assistente-de-viagem/id6758392427';
  var WEB = 'https://web.ondviajar.com.br/';

  // rosa dos ventos (símbolo OND)
  var SYMBOL = '<svg viewBox="0 0 497.26 497.26"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>';
  var IC_ANDROID = '<svg viewBox="0 0 24 24" style="fill:#3DDC84"><path d="M17.523 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.046 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.405-6.02l1.997-3.46a.42.42 0 00-.72-.42l-2.02 3.5A12.3 12.3 0 0012 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.45a.42.42 0 00-.72.42l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44"/></svg>';
  var IC_APPLE = '<svg viewBox="0 0 24 24" style="fill:currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  var IC_WEB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg>';

  var REPLIES = [
    function (d) { return 'Boa pedida, ' + d + '! 🙌 Dá pra montar um roteiro dia a dia com os melhores pontos, as rotas na ordem certa e onde ficar — em minutos, não horas.'; },
    function (d) { return d + ' é uma ótima escolha! ✨ No app eu monto o roteiro completo, comparo voos e hospedagem e ainda te acompanho durante a viagem.'; },
    function (d) { return 'Adorei — ' + d + '! 🗺️ Te entrego um plano sob medida: o que fazer, quanto custa e como se locomover, tudo organizado pra você só curtir.'; }
  ];

  var CSS = '\
.ondvai-orb{position:fixed;right:22px;bottom:22px;z-index:99998;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7c3fff,#9d6fff);box-shadow:0 8px 24px rgba(124,63,255,.45);animation:ondvai-pulse 2.6s ease-out infinite;transition:transform .18s}\
.ondvai-orb:hover{transform:scale(1.08)}\
.ondvai-orb svg{width:30px;height:30px;fill:#fff}\
.ondvai-orb.hide{display:none}\
@keyframes ondvai-pulse{0%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 0 rgba(124,63,255,.45)}70%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 15px rgba(124,63,255,0)}100%{box-shadow:0 8px 24px rgba(124,63,255,.45),0 0 0 0 rgba(124,63,255,0)}}\
.ondvai-label{position:absolute;right:70px;top:50%;transform:translateY(-50%);background:#16161f;color:#f0eeff;border:1px solid #2a2a44;font-size:.8rem;font-weight:600;padding:7px 12px;border-radius:10px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s;box-shadow:0 6px 18px rgba(0,0,0,.4)}\
.ondvai-orb:hover .ondvai-label{opacity:1}\
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
.ondvai-msg{max-width:84%;font-size:.9rem;line-height:1.5;padding:11px 14px;border-radius:14px;word-wrap:break-word}\
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

    var root = document.createElement('div');
    root.innerHTML =
      '<button class="ondvai-orb" id="ondvaiOrb" aria-label="Abrir OND vAI"><span class="ondvai-label">Fale com o OND vAI</span>' + SYMBOL + '</button>' +
      '<div class="ondvai-panel" id="ondvaiPanel" role="dialog" aria-label="OND vAI">' +
        '<div class="ondvai-head"><div class="ondvai-hh">' + SYMBOL + '</div><div><div class="ondvai-ht">OND vAI <span class="ondvai-tag">prévia</span></div><div class="ondvai-on">online agora</div></div><button class="ondvai-x" id="ondvaiClose" aria-label="Fechar">✕</button></div>' +
        '<div class="ondvai-body" id="ondvaiBody"><div class="ondvai-msg ondvai-bot">Oi! ✈️ Pra onde você quer ir? Me diz o destino que eu já te dou um gostinho do roteiro.</div></div>' +
        '<div class="ondvai-foot"><form class="ondvai-form" id="ondvaiForm"><input class="ondvai-in" id="ondvaiInput" type="text" placeholder="Ex: Paris, Nordeste, Machu Picchu..." autocomplete="off"><button class="ondvai-snd" type="submit" aria-label="Enviar">→</button></form><div class="ondvai-note">Prévia do OND vAI — o roteiro completo é no app.</div></div>' +
      '</div>';
    document.body.appendChild(root);

    var orb = document.getElementById('ondvaiOrb');
    var panel = document.getElementById('ondvaiPanel');
    var body = document.getElementById('ondvaiBody');
    var form = document.getElementById('ondvaiForm');
    var input = document.getElementById('ondvaiInput');

    var ua = navigator.userAgent || '';
    var isAndroid = /android/i.test(ua);
    var isIOS = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document);

    function open() { panel.classList.add('open'); orb.classList.add('hide'); setTimeout(function () { input.focus(); }, 250); }
    function close() { panel.classList.remove('open'); orb.classList.remove('hide'); }
    orb.addEventListener('click', open);
    document.getElementById('ondvaiClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    function scroll() { body.scrollTop = body.scrollHeight; }
    function add(cls, html) { var el = document.createElement('div'); el.className = 'ondvai-msg ' + cls; el.innerHTML = html; body.appendChild(el); scroll(); return el; }

    function ctaButtons() {
      var play = '<a class="ondvai-ab" href="' + PLAY + '" target="_blank" rel="noopener">' + IC_ANDROID + 'Google Play</a>';
      var app = '<a class="ondvai-ab" href="' + APPSTORE + '" target="_blank" rel="noopener">' + IC_APPLE + 'App Store</a>';
      var web = '<a class="ondvai-ab" href="' + WEB + '" target="_blank" rel="noopener">' + IC_WEB + 'Usar na Web</a>';
      var arr = [play, app, web];
      // destaca o do aparelho detectado (marca .pri e joga pro topo)
      var pri = isAndroid ? 0 : isIOS ? 1 : 2;
      arr[pri] = arr[pri].replace('class="ondvai-ab"', 'class="ondvai-ab pri"');
      arr.unshift(arr.splice(pri, 1)[0]);
      return arr.join('');
    }

    var asked = false;
    function respond(dest) {
      var typing = document.createElement('div'); typing.className = 'ondvai-typing'; typing.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typing); scroll();
      setTimeout(function () {
        typing.remove();
        var reply = REPLIES[Math.floor(Math.random() * REPLIES.length)](dest);
        add('ondvai-bot', reply);
        setTimeout(function () {
          var cta = document.createElement('div'); cta.className = 'ondvai-cta';
          cta.innerHTML = '<b>Quer o roteiro completo de ' + esc(dest) + '? Continue no OND 👇</b><div class="ondvai-btns">' + ctaButtons() + '</div>';
          body.appendChild(cta); scroll();
        }, 400);
      }, 1100);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dest = (input.value || '').trim();
      if (!dest) return;
      add('ondvai-me', esc(dest));
      input.value = '';
      if (!asked) { asked = true; }
      respond(dest);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
