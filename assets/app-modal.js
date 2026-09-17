/* "Teste o app", popup do OND com 3 caminhos: iOS, Android e Web.
   Componente autônomo: injeta CSS + HTML e define openApp()/closeApp() globais.
   Incluir em cada página com: <script src="assets/app-modal.js" defer></script>
   e chamar em qualquer botão: onclick="openApp(event)". */
(function(){
  if(window.__ondAppModal) return; window.__ondAppModal = true;

  var PLAY = 'https://play.google.com/store/apps/details?id=com.agamatec.ond';
  var APPSTORE = 'https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427';
  var WEB = 'https://web.ondviajar.com.br/ond-vai'; // conversa direto, sem onboarding
  var BRANCH_KEY = 'key_live_ozugiBzv6sFYSdQEuUSBdimbyqduX09m', PARTNER_KEY = 'ond_parceiro';

  var pageParams = new URLSearchParams(location.search);
  var partner = pageParams.get('partner');
  try{
    if(partner) sessionStorage.setItem(PARTNER_KEY, partner); else partner = sessionStorage.getItem(PARTNER_KEY);
  }catch(storageError){}
  var branchLinks = {};

  /* Anúncio: guarda os identificadores do clique (gclid/gbraid/wbraid, gad_*, utm_*) e a cidade
     da URL de chegada na sessão, pra seguirem pro web app e pra loja em qualquer página visitada. */
  var AD_KEYS = ['gclid','gbraid','wbraid','gad_campaignid','gad_source','utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
  var AD_STORAGE_KEY = 'ond_anuncio';
  var adParams = new URLSearchParams();
  AD_KEYS.forEach(function(key){ var value = pageParams.get(key); if(value) adParams.set(key, value); });
  var landingCity = pageParams.get('city') || '';
  try{
    if(adParams.toString()){
      if(landingCity) adParams.set('city', landingCity);
      sessionStorage.setItem(AD_STORAGE_KEY, adParams.toString());
    } else {
      adParams = new URLSearchParams(sessionStorage.getItem(AD_STORAGE_KEY) || '');
    }
  }catch(storageError){}
  if(!landingCity) landingCity = adParams.get('city') || '';
  adParams.delete('city');
  var fromAd = !!(adParams.get('gclid') || adParams.get('gbraid') || adParams.get('wbraid'));

  function withLandingContext(url){
    if(url.pathname.indexOf('/ond-vai') !== 0) return url;
    if(landingCity && !url.searchParams.has('city')) url.searchParams.set('city', landingCity);
    if(partner && !url.searchParams.has('partner')) url.searchParams.set('partner', partner);
    return url;
  }
  function withAdParams(href){
    var url = withLandingContext(new URL(href));
    adParams.forEach(function(value, key){ if(!url.searchParams.has(key)) url.searchParams.set(key, value); });
    return url.toString();
  }

  function deepLinkPathFor(unlocode){
    var deepLinkParams = new URLSearchParams();
    var city = (unlocode || '').replace(/\s+/g, '');
    if(city) deepLinkParams.set('city', city);
    if(partner) deepLinkParams.set('partner', partner);
    return deepLinkParams.toString() ? '/ond-vai?' + deepLinkParams.toString() : '';
  }
  function webLinkFor(deepLinkPath){ return deepLinkPath ? 'https://web.ondviajar.com.br' + deepLinkPath : WEB; }
  function resolveStoreLink(deepLinkPath, onLink){
    if(branchLinks[deepLinkPath]){ onLink(branchLinks[deepLinkPath]); return; }
    fetch('https://api2.branch.io/v1/url', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        branch_key: BRANCH_KEY,
        channel: fromAd ? 'google_ads' : 'site',
        feature: fromAd ? 'search_ads_lp' : 'popup_app',
        campaign: fromAd ? (adParams.get('gad_campaignid') || '') : (partner || ''),
        data: {
          '$deeplink_path': deepLinkPath,
          gclid: adParams.get('gclid') || '', gbraid: adParams.get('gbraid') || '', wbraid: adParams.get('wbraid') || '',
          gad_campaignid: adParams.get('gad_campaignid') || '',
          '$android_url': PLAY, '$ios_url': APPSTORE, '$fallback_url': 'https://ondviajar.com.br/'
        }
      })
    }).then(function(response){ return response.json(); }).then(function(result){
      if(!result || !result.url) return;
      branchLinks[deepLinkPath] = result.url;
      onLink(result.url);
    }).catch(function(){});
  }
  window.ondAppLinks = { deepLinkPathFor: deepLinkPathFor, webLinkFor: webLinkFor, resolveStoreLink: resolveStoreLink };

  /* Celular: o objetivo é baixar o app, não usar a web. Todo link pro web app vira a loja
     (link Branch que, com o app instalado, abre direto a conversa do OND vAI). */
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  var isMobile = isIOS || /Android/i.test(navigator.userAgent);
  window.ondAppLinks.isMobile = isMobile;
  if(isMobile){
    document.addEventListener('click', function(e){
      var link = e.target.closest && e.target.closest('a[href^="https://web.ondviajar.com.br"]');
      if(!link) return;
      e.preventDefault(); e.stopPropagation();
      var url = withLandingContext(new URL(link.href)), store = isIOS ? APPSTORE : PLAY, done = false;
      function go(href){ if(done) return; done = true; location.href = href; }
      if(window.gtag) gtag('event', 'mobile_web_to_store', { path: url.pathname + url.search });
      setTimeout(function(){ go(store); }, 1500);
      resolveStoreLink(url.pathname + url.search, go);
    }, true);
  } else {
    document.addEventListener('click', function(e){
      var link = e.target.closest && e.target.closest('a[href^="https://web.ondviajar.com.br"]');
      if(link) link.href = withAdParams(link.href);
    }, true);
  }

  /* Botões de loja da página, pra quem chegou por anúncio: link Branch com o clique do anúncio. */
  if(fromAd){
    var adStoreLink = null;
    resolveStoreLink(deepLinkPathFor(landingCity), function(branchUrl){ adStoreLink = branchUrl; });
    document.addEventListener('click', function(e){
      var storeLink = e.target.closest && e.target.closest('a[href*="play.google.com"], a[href*="apps.apple.com"]');
      if(!storeLink) return;
      var store = storeLink.href.indexOf('play.google.com') !== -1 ? 'google_play' : 'app_store';
      if(window.gtag) gtag('event', 'ad_store_redirect', { store: store, gad_campaignid: adParams.get('gad_campaignid') || '' });
      if(adStoreLink) storeLink.href = adStoreLink;
    }, true);
  }

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
  + '.appdl-close:hover{border-color:var(--purple,#7f11f4);color:var(--text,#f0eeff)}'
  + '.appdl-opts{display:flex;flex-direction:column;gap:10px}'
  + '.appdl-opt{display:flex;align-items:center;gap:14px;background:var(--card,#1c1c26);border:1px solid var(--border,#2a2a3a);border-radius:14px;padding:15px 18px;text-decoration:none;color:var(--text,#f0eeff);transition:border-color .15s,transform .15s}'
  + '.appdl-opt:hover{transform:translateX(4px)}'
  + '.appdl-opt.ios:hover{border-color:#e6e6ea}.appdl-opt.android:hover{border-color:#3DDC84}.appdl-opt.web:hover{border-color:var(--purple,#7f11f4)}'
  + '.appdl-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
  + '.appdl-opt.ios .appdl-ic{background:color-mix(in srgb, var(--text,#f0eeff) 10%, transparent);border:1px solid color-mix(in srgb, var(--text,#f0eeff) 18%, transparent);color:var(--text,#f0eeff)}'
  + '.appdl-opt.android .appdl-ic{background:rgba(61,220,132,.12);border:1px solid rgba(61,220,132,.3)}'
  + '.appdl-opt.web .appdl-ic{background:var(--purple-dim,rgba(127, 17, 244,.14));border:1px solid color-mix(in srgb, var(--purple,#7f11f4) 25%, transparent);color:var(--purple-light,#9d6fff)}'
  + '.appdl-lbl{font-size:.95rem;font-weight:700;margin-bottom:2px}'
  + '.appdl-desc{font-size:.78rem;color:var(--muted,#9a97b5)}'
  + '.appdl-arrow{margin-left:auto;color:var(--muted2,#6b6880);font-size:.95rem;flex-shrink:0}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function opt(cls, id, href, ic, lbl, desc){
    return '<a href="'+href+'" id="'+id+'" class="appdl-opt '+cls+'" target="_blank" rel="noopener">'
      + '<div class="appdl-ic">'+ic+'</div>'
      + '<div><div class="appdl-lbl">'+lbl+'</div><div class="appdl-desc">'+desc+'</div></div>'
      + '<div class="appdl-arrow">→</div></a>';
  }
  var html = ''
  + '<div class="appdl-overlay" id="appOverlay"></div>'
  + '<div class="appdl-modal" id="appModal" role="dialog" aria-modal="true" aria-label="Teste o app OND">'
  +   '<div class="appdl-head"><div class="appdl-title" id="appTitle">Teste o OND grátis</div>'
  +     '<button class="appdl-close" onclick="closeApp()" aria-label="Fechar">✕</button></div>'
  +   '<div class="appdl-sub" id="appSub">Escolha por onde começar, leva menos de 1 minuto.</div>'
  +   '<div class="appdl-opts">'
  +     opt('ios', 'appIos', APPSTORE, IC_APPLE, 'App Store', 'iPhone e iPad')
  +     opt('android', 'appAndroid', PLAY, IC_ANDROID, 'Google Play', 'Celular e tablet Android')
  +     opt('web', 'appWeb', WEB, IC_WEB, 'Abrir na Web', 'Sem instalar, direto no navegador')
  +   '</div>'
  + '</div>';
  var wrap = document.createElement('div'); wrap.innerHTML = html;
  while(wrap.firstChild) document.body.appendChild(wrap.firstChild);

  var elModal = document.getElementById('appModal'), elTitle = document.getElementById('appTitle'), elSub = document.getElementById('appSub');
  var elIos = document.getElementById('appIos'), elAndroid = document.getElementById('appAndroid'), elWeb = document.getElementById('appWeb');
  if(isMobile){ elWeb.style.display = 'none'; (isIOS ? elAndroid : elIos).style.display = 'none'; }

  window.openApp = function(e, unlocode, cityName){ if(e && e.preventDefault) e.preventDefault();
    var deepLinkPath = deepLinkPathFor(unlocode);
    elModal.dataset.path = deepLinkPath;
    elTitle.textContent = cityName ? 'Montar viagem para ' + cityName : 'Teste o OND grátis';
    elSub.textContent = cityName ? 'Abra o OND vAI e monte seu roteiro em ' + cityName + ', escolha por onde começar.' : 'Escolha por onde começar, leva menos de 1 minuto.';
    elWeb.href = webLinkFor(deepLinkPath); elIos.href = APPSTORE; elAndroid.href = PLAY;
    if(deepLinkPath) resolveStoreLink(deepLinkPath, function(branchUrl){
      if(elModal.dataset.path !== deepLinkPath) return;
      elIos.href = branchUrl; elAndroid.href = branchUrl;
    });
    document.getElementById('appOverlay').classList.add('open');
    elModal.classList.add('open');
    document.body.style.overflow='hidden'; };
  window.closeApp = function(){
    document.getElementById('appOverlay').classList.remove('open');
    document.getElementById('appModal').classList.remove('open');
    document.body.style.overflow=''; };
  document.getElementById('appOverlay').addEventListener('click', window.closeApp);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.closeApp(); });
})();
