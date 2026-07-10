/* "Teste o app" — popup do OND com 3 caminhos: iOS, Android e Web.
   Componente autônomo: injeta CSS + HTML e define openApp()/closeApp() globais.
   Incluir em cada página com: <script src="assets/app-modal.js" defer></script>
   e chamar em qualquer botão: onclick="openApp(event)". */
(function(){
  if(window.__ondAppModal) return; window.__ondAppModal = true;

  var PLAY = 'https://play.google.com/store/apps/details?id=com.agamatec.ond';
  var APPSTORE = 'https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427';
  var WEB = 'https://web.ondviajar.com.br/';

  var IC_ANDROID = '<svg viewBox="0 0 24 24" width="24" height="24" style="fill:#3DDC84"><path d="M17.523 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.046 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.405-6.02l1.997-3.46a.42.42 0 00-.72-.42l-2.02 3.5A12.3 12.3 0 0012 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.45a.42.42 0 00-.72.42l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44"/></svg>';
  var IC_APPLE = '<svg viewBox="0 0 24 24" width="23" height="23" style="fill:currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  var IC_WEB = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg>';

  var css = ''
  + '.appdl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);z-index:900;opacity:0;pointer-events:none;transition:opacity .2s}'
  + '.appdl-overlay.open{opacity:1;pointer-events:all}'
  + '.appdl-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-52%) scale(.96);z-index:901;width:calc(100% - 40px);max-width:430px;background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);border-radius:20px;padding:30px 28px;box-shadow:0 24px 64px rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .22s,transform .25s cubic-bezier(.34,1.56,.64,1)}'
  + '.appdl-modal.open{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
  + '.appdl-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px}'
  + '.appdl-title{font-size:1.24rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff)}'
  + '.appdl-sub{font-size:.85rem;color:var(--muted,#9a97b5);margin:2px 0 22px}'
  + '.appdl-close{background:none;border:1px solid var(--border,#2a2a3a);border-radius:50%;width:32px;height:32px;cursor:pointer;color:var(--muted,#9a97b5);font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .15s,color .15s}'
  + '.appdl-close:hover{border-color:var(--purple,#7c3fff);color:var(--text,#f0eeff)}'
  + '.appdl-opts{display:flex;flex-direction:column;gap:10px}'
  + '.appdl-opt{display:flex;align-items:center;gap:14px;background:var(--card,#1c1c26);border:1px solid var(--border,#2a2a3a);border-radius:14px;padding:15px 18px;text-decoration:none;color:var(--text,#f0eeff);transition:border-color .15s,transform .15s}'
  + '.appdl-opt:hover{transform:translateX(4px)}'
  + '.appdl-opt.ios:hover{border-color:#e6e6ea}.appdl-opt.android:hover{border-color:#3DDC84}.appdl-opt.web:hover{border-color:var(--purple,#7c3fff)}'
  + '.appdl-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
  + '.appdl-opt.ios .appdl-ic{background:color-mix(in srgb, var(--text,#f0eeff) 10%, transparent);border:1px solid color-mix(in srgb, var(--text,#f0eeff) 18%, transparent);color:var(--text,#f0eeff)}'
  + '.appdl-opt.android .appdl-ic{background:rgba(61,220,132,.12);border:1px solid rgba(61,220,132,.3)}'
  + '.appdl-opt.web .appdl-ic{background:var(--purple-dim,rgba(124,63,255,.14));border:1px solid color-mix(in srgb, var(--purple,#7c3fff) 25%, transparent);color:var(--purple-light,#9d6fff)}'
  + '.appdl-lbl{font-size:.95rem;font-weight:700;margin-bottom:2px}'
  + '.appdl-desc{font-size:.78rem;color:var(--muted,#9a97b5)}'
  + '.appdl-arrow{margin-left:auto;color:var(--muted2,#6b6880);font-size:.95rem;flex-shrink:0}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function opt(cls, href, ic, lbl, desc){
    return '<a href="'+href+'" class="appdl-opt '+cls+'" target="_blank" rel="noopener">'
      + '<div class="appdl-ic">'+ic+'</div>'
      + '<div><div class="appdl-lbl">'+lbl+'</div><div class="appdl-desc">'+desc+'</div></div>'
      + '<div class="appdl-arrow">→</div></a>';
  }
  var html = ''
  + '<div class="appdl-overlay" id="appOverlay"></div>'
  + '<div class="appdl-modal" id="appModal" role="dialog" aria-modal="true" aria-label="Teste o app OND">'
  +   '<div class="appdl-head"><div class="appdl-title">Teste o OND grátis</div>'
  +     '<button class="appdl-close" onclick="closeApp()" aria-label="Fechar">✕</button></div>'
  +   '<div class="appdl-sub">Escolha por onde começar — leva menos de 1 minuto.</div>'
  +   '<div class="appdl-opts">'
  +     opt('ios', APPSTORE, IC_APPLE, 'App Store', 'iPhone e iPad')
  +     opt('android', PLAY, IC_ANDROID, 'Google Play', 'Celular e tablet Android')
  +     opt('web', WEB, IC_WEB, 'Abrir na Web', 'Sem instalar, direto no navegador')
  +   '</div>'
  + '</div>';
  var wrap = document.createElement('div'); wrap.innerHTML = html;
  while(wrap.firstChild) document.body.appendChild(wrap.firstChild);

  window.openApp = function(e){ if(e && e.preventDefault) e.preventDefault();
    document.getElementById('appOverlay').classList.add('open');
    document.getElementById('appModal').classList.add('open');
    document.body.style.overflow='hidden'; };
  window.closeApp = function(){
    document.getElementById('appOverlay').classList.remove('open');
    document.getElementById('appModal').classList.remove('open');
    document.body.style.overflow=''; };
  document.getElementById('appOverlay').addEventListener('click', window.closeApp);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.closeApp(); });
})();
