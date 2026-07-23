/* OND — GA4 + consentimento (LGPD), componente único pro site todo.
   - Consent Mode v2: analytics/ads NEGADOS por padrão; só liberam ao aceitar.
   - Carrega o GA4 só se a página ainda não carregou (a agencias já carrega no <head>).
   - Injeta um banner de cookies discreto; a escolha fica no localStorage e vale
     pra todas as páginas (mesmo domínio).
   Incluir com: <script src="/assets/analytics.js" defer></script> */
(function(){
  if(window.__ondAnalytics) return; window.__ondAnalytics = true;
  var GA_ID = 'G-EC1FKH0HES';           // mesma propriedade do backend
  var KEY = 'ond_consent';               // 'granted' | 'denied'

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch(_){}

  /* Consent Mode: padrão negado (precisa vir ANTES do config nesta página) */
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });
  if(stored === 'granted') grant();

  /* Carrega o GA4 só se ninguém já carregou nesta página (evita init duplo na agencias) */
  if(!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')){
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function grant(){
    gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted',
      ad_personalization: 'granted', analytics_storage: 'granted'
    });
  }
  function save(v){ try{ localStorage.setItem(KEY, v); }catch(_){} }

  /* já escolheu antes -> não mostra banner */
  if(stored === 'granted' || stored === 'denied') return;

  /* ── banner ── */
  var css = ''
  + '.ond-ck{position:fixed;left:16px;right:16px;bottom:16px;z-index:100050;max-width:560px;margin:0 auto;'
    + 'background:var(--surface,#16161f);color:var(--text,#f0eeff);border:1px solid var(--border,#2a2a3a);'
    + 'border-radius:16px;padding:16px 18px;box-shadow:0 16px 48px rgba(0,0,0,.5);'
    + 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-family:inherit;'
    + 'transform:translateY(140%);transition:transform .35s cubic-bezier(.34,1.56,.64,1)}'
  + '.ond-ck.on{transform:translateY(0)}'
  + '.ond-ck-txt{flex:1;min-width:200px;font-size:.82rem;line-height:1.55;color:var(--muted,#9a97b5)}'
  + '.ond-ck-txt b{color:var(--text,#f0eeff);font-weight:700}'
  + '.ond-ck-btns{display:flex;gap:8px;flex-shrink:0}'
  + '.ond-ck-btn{border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;'
    + 'padding:9px 16px;border-radius:50px;transition:transform .15s,background .2s,border-color .2s}'
  + '.ond-ck-btn:hover{transform:translateY(-1px)}'
  + '.ond-ck-no{background:none;color:var(--muted,#9a97b5);border:1px solid var(--border,#2a2a3a)}'
  + '.ond-ck-no:hover{color:var(--text,#f0eeff);border-color:var(--muted,#9a97b5)}'
  + '.ond-ck-yes{background:var(--ond-color-primary,#7c3fff);color:#fff}'
  + '@media(max-width:520px){.ond-ck{flex-direction:column;align-items:stretch}.ond-ck-btns{justify-content:flex-end}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var el = document.createElement('div');
  el.className = 'ond-ck'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Aviso de cookies');
  el.innerHTML = ''
    + '<div class="ond-ck-txt">Usamos cookies pra entender como o site é usado e melhorar sua experiência. '
    + 'Você decide. <b>Sem cookies de análise até você aceitar.</b></div>'
    + '<div class="ond-ck-btns">'
    + '<button class="ond-ck-btn ond-ck-no" type="button">Só o essencial</button>'
    + '<button class="ond-ck-btn ond-ck-yes" type="button">Aceitar</button>'
    + '</div>';
  document.body.appendChild(el);
  setTimeout(function(){ el.classList.add('on'); }, 40);

  function close(){ el.classList.remove('on'); setTimeout(function(){ el.remove(); }, 400); }
  el.querySelector('.ond-ck-yes').addEventListener('click', function(){ grant(); save('granted'); close(); });
  el.querySelector('.ond-ck-no').addEventListener('click', function(){ save('denied'); close(); });
})();
