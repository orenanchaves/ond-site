/* Globo 3D dos destinos OND — componente autônomo.
   Injeta CSS + HTML e define openGlobe()/closeGlobe() globais.
   Incluir com: <script src="/assets/globe.js" defer></script>
   e chamar em qualquer botão: onclick="openGlobe(event)".

   Canvas 2D puro, sem libs. A terra é uma máscara de bits (Natural Earth 110m)
   varrida em anéis de latitude com densidade corrigida por cos(lat); a ordem dos
   pontos aqui é a MESMA usada para gerar a máscara — não mexer sem regerar.

   Bandeiras são desenhadas em CSS (ver .gl-flag): emoji de bandeira NÃO renderiza
   no Windows — vira "BR", "US". Por isso nada de emoji aqui. */
(function(){
  if(window.__ondGlobe) return; window.__ondGlobe = true;

  var MASK='///n//z///w/L//4f4f//8D/gf///AA/A////wAAMA//f/8AAAwAE/f/8AAACAAAfP/4AAAAAAAAIAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAQAAAAAAOAAAAAAAAAAAAADAAAAAAA4AAAAAAAAAAAACAQAAAAAAHwAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAABQAwAAAAAAD8AAAAAAAAAAAAA8AAAAAAAAAf4AAAAEAAAAAAYD8AAAAAAAAAP8AAAADwAAAAAHz/gAAAAAAAAA/4AAAAPwAAAAAP//gAAAAAAAAAf+AAAAH8AAAAAD//8AAAAAAAAAB/4AAAAf4AAAAAH//4AAAAAAAAAB/8AAAAP/GAAAAB//+AAAAAAAAAAP/8AAAA/8YAAAAD//wCAAAAAAAAAP/8AAAB/4MAAAAAf/4AAAAAAAAAAH//AAAAf/DgAAAAB/8AAYAAAAAAAB//8AAAB//GAAAAAD+YAAAAAAAAAAD//8AAAB//iAAAAAAuIAAAAAAAAAAB///AAAAf/wAAAAAABAAAAAAAAAAAA///4AAAH/+AAAAAAAACAAAAAAAAAAH///gAAAf/wAAAAAYAHQAAAAAAAAAAf///AAAB//AAAAACAAPQAAAAAAAAAA///4AAAD//AAAAAILA+IAAAAAAAAAA///AAAAH//gAAAAZ6BQAAAAAAAAAAA//4AAAAH//wAAAAx6AAAAAAAAAAAAAf/4AAAAH//4AAAAo4AAAAAAAAAAAAAP/4AAAAH//8AAABQYAAAAAAAAAAAAAP/gAAB+///8AAAAgIAAAAAAAAAAAAC/4AAAP////4AAgEAGAAAAAAAAAAAAh/AAAB/////gAYAiCgAAAAAAAAAAAMEAAAAf////EAHABwEAAAAAAAAAAAOAAAAAP////YADgD4EAAAAAAAAAABYAAAAAP///+eAHgXwAAAAAAAAAAAfwQgAAA////z+AfB+BAAAAAAAAAAPmGgAAAP///5/gPw/QAAAAAAAAAAHgEAAAAP///7/w/9/wAAAAAAAAAAeAAAAAA////f8P///oAAAAAAAAAfgAAAAAP///fz////wAAAAAAAAC/AgAAAAf//9+/////AAAAAAAAAv/YAAAAD/////////gAAAAAAAB//4AAAAH/3D/////+IAAAAAAAf//AAAAB/AB/////8MAAAAAAD//+AAAAB8AP/////EYAAAAAB//+AAAAODL/n///8QgAAAAAP//4AAADwe/z///+4QAAAAAf//8AAAPicmP////AAAAAAH//9AAAD14d/////IAAAAB///wAAA/+ef////AAAAAD//+YAAf///////gAAAAf//4gAAf//////+AAAAH/+/gAHf//////wgAAH//fwACH//////jABAf/z4AAjP////8CACB/8PAAAT////+CAc//hgAAOP////5Af//CDAB3/////YH//TGEDf////////keYHv////n/rs8Af////jy65+AwP//AA5x8AE/5gARB8AIcAAHj4ARiACXxgAAAfECAA8AAAAAAAAA';
  var STEP=2, LAT_MAX=88, RAD=Math.PI/180, TAU=Math.PI*2;
  var UNS='https://images.unsplash.com/', Q='?w=600&q=70&auto=format';

  /* Destinos do app (const DEST do OND_App_Clone.html).
     4 fotos do app estavam quebradas (Lisboa/Floripa davam 404, Salvador vinha um
     outdoor e Gramado uns Alpes nevados) — substituídas por fotos conferidas. */
  var DEST=[
    {n:'Orlando',        c:'Estados Unidos', cc:'US', lat: 28.5383, lon: -81.3792, img:UNS+'photo-1597466599360-3b9775841aec'+Q, d:'Parques, filas e logística de família. O OND encaixa tudo com folga pra descansar.'},
    {n:'Miami',          c:'Estados Unidos', cc:'US', lat: 25.7617, lon: -80.1918, img:UNS+'photo-1506966953602-c20cc11f75e3'+Q, d:'Praia, outlet e vida noturna. Roteiro que equilibra sol e compras.'},
    {n:'Nova Iorque',    c:'Estados Unidos', cc:'US', lat: 40.7128, lon: -74.0060, img:UNS+'photo-1496442226666-8d4d0e62e6e9'+Q, d:'Museu, show e caminhada. O OND cabe o dia sem te deixar exausto.'},
    {n:'Lisboa',         c:'Portugal',       cc:'PT', lat: 38.7223, lon:  -9.1393, img:UNS+'photo-1585208798174-6cedd86e019a'+Q, d:'Miradouros, bairros e bacalhau. Roteiro a pé, com pausa pro pastel.', href:'/blog/roteiro-lisboa/', cta:'Ver roteiro'},
    {n:'Paris',          c:'França',         cc:'FR', lat: 48.8566, lon:   2.3522, img:UNS+'photo-1502602898657-3e91760cbb34'+Q, d:'Museus com hora marcada e bairros pra andar sem pressa.'},
    {n:'Rio de Janeiro', c:'Brasil',         cc:'BR', lat:-22.9068, lon: -43.1729, img:UNS+'photo-1483729558449-99ef09a8c325'+Q, d:'Praia, trilha e vista. O OND organiza o dia pelo tempo e pela maré.'},
    {n:'Buenos Aires',   c:'Argentina',      cc:'AR', lat:-34.6037, lon: -58.3816, img:UNS+'photo-1589909202802-8f4aadce1849'+Q, d:'Bairros, parrilla e tango. Câmbio e caminhada no mesmo roteiro.', href:'/blog/roteiro-buenos-aires/', cta:'Ver roteiro'},
    {n:'Gramado',        c:'Brasil',         cc:'BR', lat:-29.3747, lon: -50.8760, img:UNS+'photo-1668717342337-7185f43d60ea'+Q, d:'Frio, fondue e Natal Luz. O OND resolve a serra sem fila.'},
    {n:'Salvador',       c:'Brasil',         cc:'BR', lat:-12.9777, lon: -38.5016, img:UNS+'photo-1640884216864-b26b780ff102'+Q, d:'Pelô, farol e axé. O roteiro respeita o pôr do sol.'},
    {n:'Florianópolis',  c:'Brasil',         cc:'BR', lat:-27.5954, lon: -48.5480, img:UNS+'photo-1689301109191-ff1f55d2e243'+Q, d:'Praia, trilha e beach club. Norte ou sul, o OND escolhe pelo seu dia.'}
  ];

  /* ── CSS ── */
  var css=''
  /* acima do orb do vAI (z-index 99999) — senão ele flutua sobre o globo e rouba o clique dos pins */
  +'.gl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(5px);z-index:100000;opacity:0;pointer-events:none;transition:opacity .22s}'
  +'.gl-overlay.open{opacity:1;pointer-events:all}'
  +'.gl-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-52%) scale(.97);z-index:100001;'
    +'width:calc(100% - 40px);max-width:980px;height:min(620px, calc(100vh - 60px));'
    +'background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);border-radius:22px;overflow:hidden;'
    +'box-shadow:0 30px 80px rgba(0,0,0,.65);display:flex;opacity:0;pointer-events:none;'
    +'transition:opacity .24s,transform .28s cubic-bezier(.34,1.56,.64,1)}'
  +'.gl-modal.open{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
  +'.gl-close{position:absolute;top:14px;right:14px;z-index:6;width:34px;height:34px;border-radius:50%;'
    +'background:rgba(0,0,0,.35);border:1px solid var(--border,#2a2a3a);color:var(--muted,#8b8ba7);'
    +'font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s,border-color .2s}'
  +'.gl-close:hover{color:var(--text,#f0eeff);border-color:var(--purple,#7c3fff)}'

  /* ── BANDEIRAS EM CSS (emoji de bandeira não renderiza no Windows) ── */
  +'.gl-flag{display:inline-block;position:relative;overflow:hidden;flex-shrink:0;width:22px;height:15px;border-radius:2px;'
    +'background:#8b8ba7;box-shadow:0 0 0 1px rgba(255,255,255,.16) inset,0 1px 3px rgba(0,0,0,.4)}'
  /* Brasil: verde, losango amarelo (clip-path) e círculo azul */
  +'.gl-flag[data-cc="BR"]{background:#009c3b}'
  +'.gl-flag[data-cc="BR"]::before{content:"";position:absolute;inset:13% 7%;background:#ffdf00;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}'
  +'.gl-flag[data-cc="BR"]::after{content:"";position:absolute;left:50%;top:50%;width:36%;height:52%;transform:translate(-50%,-50%);background:#002776;border-radius:50%}'
  /* EUA: 13 listras, cantão azul e as estrelas como trama de pontos */
  +'.gl-flag[data-cc="US"]{background:repeating-linear-gradient(#b22234 0 7.69%,#fff 7.69% 15.38%)}'
  +'.gl-flag[data-cc="US"]::before{content:"";position:absolute;left:0;top:0;width:40%;height:53.8%;background:#3c3b6e}'
  +'.gl-flag[data-cc="US"]::after{content:"";position:absolute;left:0;top:0;width:40%;height:53.8%;'
    +'background-image:radial-gradient(#fff .55px,transparent .6px);background-size:2.1px 2.1px;background-position:.8px .8px}'
  /* Portugal: verde/vermelho 2:3, esfera armilar e escudo aproximados */
  +'.gl-flag[data-cc="PT"]{background:linear-gradient(90deg,#006600 0 40%,#ff0000 40% 100%)}'
  +'.gl-flag[data-cc="PT"]::before{content:"";position:absolute;left:40%;top:50%;width:42%;height:60%;box-sizing:border-box;'
    +'transform:translate(-50%,-50%);border:1.1px solid #ffe900;border-radius:50%}'
  +'.gl-flag[data-cc="PT"]::after{content:"";position:absolute;left:40%;top:50%;width:17%;height:26%;box-sizing:border-box;'
    +'transform:translate(-50%,-50%);background:#fff;border:.9px solid #ff0000;border-radius:1px}'
  /* França: exata */
  +'.gl-flag[data-cc="FR"]{background:linear-gradient(90deg,#002395 0 33.33%,#fff 33.33% 66.66%,#ed2939 66.66% 100%)}'
  /* Argentina: celeste/branco/celeste e o Sol de Maio como disco */
  +'.gl-flag[data-cc="AR"]{background:linear-gradient(#74acdf 0 33.33%,#fff 33.33% 66.66%,#74acdf 66.66% 100%)}'
  +'.gl-flag[data-cc="AR"]::before{content:"";position:absolute;left:50%;top:50%;width:24%;height:35%;'
    +'transform:translate(-50%,-50%);background:#f6b40e;border-radius:50%;box-shadow:0 0 0 .7px #85340a}'

  /* palco do globo */
  +'.gl-stage{position:relative;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;overflow:hidden;'
    +'background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--purple,#7c3fff) 13%,transparent),transparent 62%)}'
  +'.gl-canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}'
  +'.gl-canvas.grabbing{cursor:grabbing}'

  /* ── BALÃO DE CONVERSA ancorado no pin (posição vem do canvas, visual é 100% CSS) ── */
  +'.gl-bubble{position:absolute;left:0;top:0;z-index:3;display:none;align-items:center;gap:8px;'
    +'padding:7px 11px;border-radius:12px;background:var(--surface,#16161f);border:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent);'
    +'box-shadow:0 10px 28px rgba(0,0,0,.5);white-space:nowrap;pointer-events:none;line-height:1.25;'
    +'transform:translate(-50%,calc(-100% - 14px));transition:opacity .18s}'
  +'.gl-bubble.on{display:flex}'
  /* rabinho do balão */
  +'.gl-bubble::after{content:"";position:absolute;left:50%;bottom:-6px;width:10px;height:10px;'
    +'transform:translateX(-50%) rotate(45deg);background:var(--surface,#16161f);'
    +'border-right:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent);'
    +'border-bottom:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent)}'
  +'.gl-bubble-n{font-size:.82rem;font-weight:700;color:var(--text,#f0eeff);line-height:1.15}'
  +'.gl-bubble-c{font-size:.68rem;color:var(--muted,#8b8ba7);line-height:1.15}'

  /* ── BARRA DE DIGITAÇÃO ── */
  +'.gl-searchwrap{position:absolute;left:16px;right:16px;bottom:14px;z-index:4}'
  +'.gl-bar{display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:50px;'
    +'background:color-mix(in srgb,var(--surface,#16161f) 92%,transparent);backdrop-filter:blur(10px);'
    +'border:1px solid var(--border,#2a2a3a);transition:border-color .2s,box-shadow .2s}'
  +'.gl-bar:focus-within{border-color:var(--purple,#7c3fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--purple,#7c3fff) 18%,transparent)}'
  +'.gl-bar svg{width:16px;height:16px;color:var(--muted,#8b8ba7);flex-shrink:0}'
  +'.gl-input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--text,#f0eeff);'
    +'font-family:inherit;font-size:.88rem}'
  +'.gl-input::placeholder{color:var(--muted2,#5a5a72)}'
  /* sugestões como balõezinhos de conversa, subindo da barra */
  +'.gl-sugs{position:absolute;left:0;right:0;bottom:calc(100% + 9px);display:none;flex-direction:column;gap:6px;'
    +'max-height:220px;overflow-y:auto;padding:2px}'
  +'.gl-sugs.on{display:flex}'
  +'.gl-sug{display:flex;align-items:center;gap:9px;width:100%;text-align:left;cursor:pointer;'
    +'padding:8px 12px;border-radius:14px 14px 14px 4px;font-family:inherit;'
    +'background:color-mix(in srgb,var(--surface,#16161f) 94%,transparent);backdrop-filter:blur(10px);'
    +'border:1px solid var(--border,#2a2a3a);color:var(--text,#f0eeff);'
    +'transition:border-color .16s,background .16s,transform .12s}'
  +'.gl-sug:hover,.gl-sug.pre{border-color:color-mix(in srgb,var(--purple,#7c3fff) 55%,transparent);'
    +'background:color-mix(in srgb,var(--purple,#7c3fff) 15%,transparent);transform:translateX(2px)}'
  +'.gl-sug-n{font-size:.85rem;font-weight:600}'
  +'.gl-sug-c{font-size:.72rem;color:var(--muted,#8b8ba7);margin-left:auto}'
  +'.gl-sug-empty{padding:9px 12px;font-size:.8rem;color:var(--muted,#8b8ba7);'
    +'background:color-mix(in srgb,var(--surface,#16161f) 94%,transparent);border:1px solid var(--border,#2a2a3a);border-radius:14px 14px 14px 4px}'

  /* painel */
  +'.gl-panel{width:320px;flex-shrink:0;border-left:1px solid var(--border,#2a2a3a);background:var(--bg,#0d0d14);'
    +'padding:26px 22px;overflow-y:auto;display:flex;flex-direction:column}'
  +'.gl-kicker{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--purple-light,#9d6fff)}'
  +'.gl-title{font-size:1.15rem;font-weight:800;letter-spacing:-.02em;margin:8px 0 5px;color:var(--text,#f0eeff)}'
  +'.gl-sub{font-size:.82rem;color:var(--muted,#8b8ba7);line-height:1.55}'
  +'.gl-list{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}'
  +'.gl-li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;cursor:pointer;'
    +'border:1px solid transparent;color:var(--text,#f0eeff);font-size:.88rem;text-align:left;background:none;width:100%;'
    +'font-family:inherit;transition:background .16s,border-color .16s}'
  +'.gl-li:hover{background:color-mix(in srgb,var(--purple,#7c3fff) 11%,transparent);border-color:color-mix(in srgb,var(--purple,#7c3fff) 34%,transparent)}'
  +'.gl-li.on{background:color-mix(in srgb,var(--green,#00e676) 12%,transparent);border-color:color-mix(in srgb,var(--green,#00e676) 42%,transparent)}'
  +'.gl-li-km{margin-left:auto;font-size:.7rem;color:var(--muted2,#5a5a72);font-variant-numeric:tabular-nums}'
  /* botão de localização */
  +'.gl-geo{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:10px 14px;'
    +'border-radius:50px;border:1px dashed color-mix(in srgb,var(--purple,#7c3fff) 45%,transparent);background:none;'
    +'color:var(--purple-light,#9d6fff);font-family:inherit;font-size:.8rem;font-weight:600;cursor:pointer;'
    +'transition:background .18s,border-color .18s}'
  +'.gl-geo:hover:not(:disabled){background:color-mix(in srgb,var(--purple,#7c3fff) 12%,transparent);border-style:solid}'
  +'.gl-geo:disabled{opacity:.6;cursor:default}'
  +'.gl-geo svg{width:14px;height:14px}'
  +'.gl-geo-msg{font-size:.74rem;color:var(--muted2,#5a5a72);text-align:center;margin-top:8px;line-height:1.5}'
  /* card do destino */
  +'.gl-card{display:none;flex-direction:column;flex:1}'
  +'.gl-card.on{display:flex}'
  +'.gl-back{background:none;border:none;color:var(--muted,#8b8ba7);font-size:.8rem;cursor:pointer;padding:0;margin-bottom:14px;'
    +'text-align:left;font-family:inherit;transition:color .2s}'
  +'.gl-back:hover{color:var(--text,#f0eeff)}'
  +'.gl-card-img{width:100%;height:150px;border-radius:14px;background:var(--card,#1a1a26) center/cover no-repeat;margin-bottom:14px;flex-shrink:0}'
  +'.gl-card-name{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff);display:flex;align-items:center;gap:9px}'
  +'.gl-card-c{font-size:.78rem;color:var(--muted,#8b8ba7);margin-top:3px}'
  +'.gl-card-d{font-size:.85rem;color:var(--muted,#8b8ba7);line-height:1.65;margin-top:10px}'
  +'.gl-card-km{font-size:.78rem;color:var(--purple-light,#9d6fff);margin-top:10px;font-weight:600}'
  +'.gl-card-cta{margin-top:auto;padding-top:18px}'
  +'.gl-btn{display:block;text-align:center;background:var(--purple,#7c3fff);color:#fff;padding:12px 20px;border-radius:50px;'
    +'font-size:.88rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;width:100%;font-family:inherit;'
    +'transition:background .2s,transform .15s}'
  +'.gl-btn:hover{background:var(--purple-light,#9d6fff);transform:translateY(-1px)}'
  /* mobile: globo em cima, painel embaixo */
  +'@media(max-width:820px){'
    +'.gl-modal{flex-direction:column;height:min(660px, calc(100vh - 40px))}'
    +'.gl-stage{flex:0 0 48%}'
    +'.gl-panel{width:auto;border-left:none;border-top:1px solid var(--border,#2a2a3a);flex:1;padding:20px 18px}'
    +'.gl-card-img{height:110px}'
    +'.gl-searchwrap{left:12px;right:12px;bottom:10px}'
  +'}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var flag=function(d){ return '<span class="gl-flag" data-cc="'+d.cc+'" role="img" aria-label="Bandeira: '+d.c+'"></span>' };

  /* ── HTML ── */
  var host=document.createElement('div');
  host.innerHTML=''
  +'<div class="gl-overlay" id="globeOverlay"></div>'
  +'<div class="gl-modal" id="globeModal" role="dialog" aria-modal="true" aria-label="Destinos OND">'
    +'<button class="gl-close" aria-label="Fechar">✕</button>'
    +'<div class="gl-stage">'
      +'<canvas class="gl-canvas" id="globeCanvas"></canvas>'
      +'<div class="gl-bubble" id="glBubble"><span class="gl-flag" id="glBubbleFlag"></span>'
        +'<span><span class="gl-bubble-n" id="glBubbleN"></span><br><span class="gl-bubble-c" id="glBubbleC"></span></span></div>'
      +'<div class="gl-searchwrap">'
        +'<div class="gl-sugs" id="glSugs"></div>'
        +'<div class="gl-bar">'
          +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
          +'<input class="gl-input" id="glInput" type="text" autocomplete="off" placeholder="Pra onde você quer ir?" aria-label="Buscar destino">'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<aside class="gl-panel">'
      +'<div class="gl-home" id="glHome">'
        +'<span class="gl-kicker">Destinos OND</span>'
        +'<h3 class="gl-title">'+DEST.length+' destinos no globo</h3>'
        +'<p class="gl-sub">Clique num ponto verde, busque na barra — ou escolha aqui que o globo gira até ele.</p>'
        +'<ul class="gl-list" id="glList"></ul>'
        +'<button class="gl-geo" id="glGeo">'
          +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
          +'Ativar localização</button>'
        +'<p class="gl-geo-msg" id="glGeoMsg"></p>'
      +'</div>'
      +'<div class="gl-card" id="glCard">'
        +'<button class="gl-back" id="glBack">← Todos os destinos</button>'
        +'<div class="gl-card-img" id="glImg"></div>'
        +'<h3 class="gl-card-name" id="glName"></h3>'
        +'<p class="gl-card-c" id="glC"></p>'
        +'<p class="gl-card-d" id="glD"></p>'
        +'<p class="gl-card-km" id="glKm"></p>'
        +'<div class="gl-card-cta"><a class="gl-btn" id="glCta"></a></div>'
      +'</div>'
    +'</aside>'
  +'</div>';
  document.body.appendChild(host);

  var ov=document.getElementById('globeOverlay'), md=document.getElementById('globeModal');
  var cv=document.getElementById('globeCanvas'), ctx=cv.getContext('2d');
  var elHome=document.getElementById('glHome'), elCard=document.getElementById('glCard');
  var elImg=document.getElementById('glImg'), elName=document.getElementById('glName');
  var elC=document.getElementById('glC'), elD=document.getElementById('glD');
  var elKm=document.getElementById('glKm'), elCta=document.getElementById('glCta');
  var elList=document.getElementById('glList'), elInput=document.getElementById('glInput');
  var elSugs=document.getElementById('glSugs'), elBub=document.getElementById('glBubble');
  var elBubFlag=document.getElementById('glBubbleFlag'), elBubN=document.getElementById('glBubbleN');
  var elBubC=document.getElementById('glBubbleC');
  var elGeo=document.getElementById('glGeo'), elGeoMsg=document.getElementById('glGeoMsg');

  /* lista lateral */
  DEST.forEach(function(d,i){
    var li=document.createElement('li');
    li.innerHTML='<button class="gl-li" data-i="'+i+'">'+flag(d)+'<span>'+d.n+'</span><span class="gl-li-km" data-km="'+i+'"></span></button>';
    elList.appendChild(li);
  });
  elList.addEventListener('click',function(e){ var b=e.target.closest('.gl-li'); if(b) select(+b.dataset.i) });
  document.getElementById('glBack').addEventListener('click',function(){ select(-1) });
  md.querySelector('.gl-close').addEventListener('click',function(){ closeGlobe() });
  ov.addEventListener('click',function(){ closeGlobe() });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape'||!isOpen) return;
    if(elSugs.classList.contains('on')){ hideSugs(); elInput.blur(); return }  // 1º Esc fecha a busca
    closeGlobe();
  });

  /* ── máscara de terra -> vetores unitários ── */
  var PTS=null;
  function buildPts(){
    var bin=atob(MASK), out=[], i=0;
    for(var lat=-LAT_MAX; lat<=LAT_MAX+1e-9; lat+=STEP){
      var count=Math.max(1, Math.round(Math.cos(lat*RAD)*180));
      for(var j=0;j<count;j++){
        var bit=(bin.charCodeAt(i>>3)>>(7-(i&7)))&1;
        if(bit){
          var lo=(-180+360*j/count)*RAD, la=lat*RAD, cl=Math.cos(la);
          out.push(cl*Math.sin(lo), Math.sin(la), cl*Math.cos(lo));
        }
        i++;
      }
    }
    return out; // flat [x,y,z, ...]
  }
  function vecOf(lat,lon){ var la=lat*RAD, lo=lon*RAD, cl=Math.cos(la); return [cl*Math.sin(lo), Math.sin(la), cl*Math.cos(lo)] }
  DEST.forEach(function(d){ d.v=vecOf(d.lat,d.lon) });

  /* ── estado ── */
  /* vista inicial sobre o Atlântico (~45°O, 3°S): abre mostrando as Américas e a
     Europa, que é onde estão os destinos. yaw=-lon, pitch=lat centralizam um ponto. */
  var yaw=0.79, pitch=-0.05, vyaw=0, isOpen=false, raf=0, sel=-1, hover=-1;
  var drag=false, lastX=0, lastY=0, moved=0, fly=null, t0=0, ME=null;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPIN=reduce?0:0.0022;
  var hit=[];

  function resize(){
    var dpr=Math.min(window.devicePixelRatio||1, 2);
    var w=cv.clientWidth, h=cv.clientHeight;
    if(!w||!h) return;
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  if(window.ResizeObserver) new ResizeObserver(resize).observe(cv);
  window.addEventListener('resize',resize);

  function draw(ts){
    raf=requestAnimationFrame(draw);
    if(!t0) t0=ts;
    var w=cv.clientWidth, h=cv.clientHeight;
    if(!w||!h) return;

    if(fly){
      var k=Math.min(1,(ts-fly.t)/620), e=1-Math.pow(1-k,3);
      yaw=fly.y0+fly.dy*e; pitch=fly.p0+fly.dp*e;
      if(k>=1) fly=null;
    } else if(!drag){
      if(sel<0) yaw+=SPIN;          // gira sozinho só quando nada está selecionado
      yaw+=vyaw; vyaw*=0.94;
      if(Math.abs(vyaw)<1e-5) vyaw=0;
    }

    var R=Math.min(w,h)*0.40, cx=w/2, cy=h/2;
    ctx.clearRect(0,0,w,h);

    var g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.05,cx,cy,R);
    g.addColorStop(0,'rgba(124,63,255,.22)'); g.addColorStop(.65,'rgba(124,63,255,.06)'); g.addColorStop(1,'rgba(10,10,18,.30)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R+0.5,0,TAU);
    ctx.strokeStyle='rgba(124,63,255,.30)'; ctx.lineWidth=1; ctx.stroke();

    var cyw=Math.cos(yaw), syw=Math.sin(yaw), cpt=Math.cos(pitch), spt=Math.sin(pitch);
    function project(v){
      var x=v[0]*cyw+v[2]*syw, z1=-v[0]*syw+v[2]*cyw;
      var y=v[1]*cpt-z1*spt, z=v[1]*spt+z1*cpt;
      return [cx+x*R, cy-y*R, z];
    }

    /* pontos de terra, agrupados por profundidade (poucos fills = rápido) */
    var B=5, buckets=[[],[],[],[],[]];
    for(var i=0;i<PTS.length;i+=3){
      var px=PTS[i], py=PTS[i+1], pz=PTS[i+2];
      var x=px*cyw+pz*syw, z1=-px*syw+pz*cyw;
      var y=py*cpt-z1*spt, z=py*spt+z1*cpt;
      if(z<=0.02) continue;
      buckets[Math.min(B-1,(z*B)|0)].push(cx+x*R, cy-y*R);
    }
    for(var b=0;b<B;b++){
      var arr=buckets[b]; if(!arr.length) continue;
      var dp=(b+0.5)/B;
      ctx.globalAlpha=0.18+0.72*dp;
      ctx.fillStyle='#7c3fff';
      var rr=0.9+dp*1.0;
      ctx.beginPath();
      for(var k2=0;k2<arr.length;k2+=2){ ctx.moveTo(arr[k2]+rr,arr[k2+1]); ctx.arc(arr[k2],arr[k2+1],rr,0,TAU) }
      ctx.fill();
    }
    ctx.globalAlpha=1;

    /* "você está aqui" */
    if(ME){
      var m=project(ME.v);
      if(m[2]>0.04){
        var ma=0.4+0.6*m[2], pl=(Math.sin((ts-t0)/620)+1)/2;
        ctx.globalAlpha=ma*0.3*(0.4+0.6*pl);
        ctx.beginPath(); ctx.arc(m[0],m[1],7+pl*6,0,TAU); ctx.fillStyle='#f0eeff'; ctx.fill();
        ctx.globalAlpha=ma;
        ctx.beginPath(); ctx.arc(m[0],m[1],4,0,TAU); ctx.fillStyle='#f0eeff'; ctx.fill();
        ctx.beginPath(); ctx.arc(m[0],m[1],4,0,TAU); ctx.strokeStyle='#7c3fff'; ctx.lineWidth=1.6; ctx.stroke();
        ctx.globalAlpha=Math.min(1,ma+0.2);
        ctx.font='700 11px Onest, system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.lineWidth=3; ctx.strokeStyle='rgba(13,13,20,.9)';
        ctx.strokeText('Você está aqui', m[0], m[1]-9);
        ctx.fillStyle='#f0eeff'; ctx.fillText('Você está aqui', m[0], m[1]-9);
      }
    }

    /* pins dos destinos */
    hit.length=0;
    var pulse=(Math.sin((ts-t0)/460)+1)/2;
    for(var n=0;n<DEST.length;n++){
      var p=project(DEST[n].v), sx=p[0], sy=p[1], z3=p[2];
      if(z3<=0.04) continue;
      hit.push(sx,sy,n);
      var on=(n===sel), hv=(n===hover), a=0.35+0.65*z3;
      ctx.globalAlpha=a*(on?0.5:0.28)*(0.45+0.55*pulse);
      ctx.beginPath(); ctx.arc(sx,sy,(on?9:6)+pulse*(on?5:3),0,TAU);
      ctx.fillStyle='#00e676'; ctx.fill();
      ctx.globalAlpha=a;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.6,0,TAU); ctx.fillStyle='#00e676'; ctx.fill();
      ctx.globalAlpha=a*0.9;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.6,0,TAU);
      ctx.strokeStyle='rgba(13,13,20,.85)'; ctx.lineWidth=1.2; ctx.stroke();
      /* o rótulo do selecionado quem mostra é o balão CSS (com a bandeira) */
      if((z3>0.25||hv) && !on){
        ctx.globalAlpha=hv?Math.min(1,a+0.25):a*0.62;
        ctx.font='600 11px Onest, system-ui, sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.lineWidth=3; ctx.strokeStyle='rgba(13,13,20,.9)';
        ctx.strokeText(DEST[n].n, sx, sy-9);
        ctx.fillStyle=hv?'#00e676':'#f0eeff';
        ctx.fillText(DEST[n].n, sx, sy-9);
      }
    }
    ctx.globalAlpha=1;

    /* posiciona o balão no pin selecionado (esconde se foi pro outro lado) */
    if(sel>=0){
      var q=project(DEST[sel].v);
      if(q[2]>0.04){ elBub.classList.add('on'); elBub.style.transform='translate('+q[0]+'px,'+q[1]+'px) translate(-50%,calc(-100% - 14px))' }
      else elBub.classList.remove('on');
    } else elBub.classList.remove('on');
  }

  /* ── interação ── */
  function pick(ev){
    var r=cv.getBoundingClientRect(), mx=ev.clientX-r.left, my=ev.clientY-r.top, best=-1, bd=18*18;
    for(var i=0;i<hit.length;i+=3){
      var dx=hit[i]-mx, dy=hit[i+1]-my, d2=dx*dx+dy*dy;
      if(d2<bd){ bd=d2; best=hit[i+2] }
    }
    return best;
  }
  cv.addEventListener('pointerdown',function(e){
    drag=true; moved=0; lastX=e.clientX; lastY=e.clientY; vyaw=0;
    if(cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
    cv.classList.add('grabbing'); hideSugs();
  });
  cv.addEventListener('pointermove',function(e){
    if(!drag){ var p=pick(e); if(p!==hover){ hover=p; cv.style.cursor=p>=0?'pointer':'grab' } return }
    var dx=e.clientX-lastX, dy=e.clientY-lastY;
    moved+=Math.abs(dx)+Math.abs(dy);
    yaw+=dx*0.006; vyaw=dx*0.0012;
    pitch=Math.max(-1.35,Math.min(1.35,pitch+dy*0.006));
    lastX=e.clientX; lastY=e.clientY; fly=null;
  });
  cv.addEventListener('pointerup',function(e){
    drag=false; cv.classList.remove('grabbing');
    if(moved<5) select(pick(e));   // clique curto = seleção
  });
  cv.addEventListener('pointercancel',function(){ drag=false; cv.classList.remove('grabbing') });

  function flyTo(lat,lon){
    var ty=-lon*RAD, tp=lat*RAD;
    var dy=((ty-yaw)%TAU+TAU+Math.PI)%TAU-Math.PI;   // caminho mais curto
    fly={t:performance.now(), y0:yaw, dy:dy, p0:pitch, dp:tp-pitch};
  }

  function select(i){
    sel=i;
    [].forEach.call(elList.querySelectorAll('.gl-li'),function(b){ b.classList.toggle('on', +b.dataset.i===i) });
    if(i<0){ elCard.classList.remove('on'); elHome.style.display=''; elBub.classList.remove('on'); return }
    var d=DEST[i];
    elHome.style.display='none'; elCard.classList.add('on');
    elImg.style.backgroundImage="url('"+d.img+"')";
    elName.innerHTML=flag(d)+'<span>'+d.n+'</span>';
    elC.textContent=d.c;
    elD.textContent=d.d;
    elKm.textContent=ME?('A '+fmtKm(haversine(ME.lat,ME.lon,d.lat,d.lon))+' de você'):'';
    elBubFlag.setAttribute('data-cc',d.cc);
    elBubFlag.setAttribute('aria-label','Bandeira: '+d.c);
    elBubN.textContent=d.n; elBubC.textContent=d.c;
    if(d.href){ elCta.textContent=d.cta||'Ver roteiro'; elCta.href=d.href; elCta.onclick=null }
    else{ elCta.textContent='Montar no app'; elCta.href='#app';
          elCta.onclick=function(ev){ ev.preventDefault(); if(window.openApp) openApp(ev); else location.href='/links.html' } }
    hideSugs(); elInput.value='';
    flyTo(d.lat,d.lon);
  }

  /* ── busca ── */
  /* tira acento pra "florianopolis" achar "Florianópolis" */
  var norm=function(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim() };
  function hideSugs(){ elSugs.classList.remove('on'); elSugs.innerHTML='' }
  function showSugs(){
    var q=norm(elInput.value);
    var hits=DEST.map(function(d,i){ return {d:d,i:i} }).filter(function(o){
      return !q || norm(o.d.n).indexOf(q)>=0 || norm(o.d.c).indexOf(q)>=0;
    });
    if(!hits.length){
      elSugs.innerHTML='<div class="gl-sug-empty">Ainda não temos esse destino — mas o OND vAI monta pra você no app.</div>';
      elSugs.classList.add('on'); return;
    }
    elSugs.innerHTML=hits.map(function(o,k){
      return '<button class="gl-sug'+(k===0&&q?' pre':'')+'" data-i="'+o.i+'">'+flag(o.d)
        +'<span class="gl-sug-n">'+o.d.n+'</span><span class="gl-sug-c">'+o.d.c+'</span></button>';
    }).join('');
    elSugs.classList.add('on');
  }
  elInput.addEventListener('focus',showSugs);
  elInput.addEventListener('input',showSugs);
  elSugs.addEventListener('click',function(e){ var b=e.target.closest('.gl-sug'); if(b) select(+b.dataset.i) });
  elInput.addEventListener('keydown',function(e){
    if(e.key!=='Enter') return;
    e.preventDefault();
    var first=elSugs.querySelector('.gl-sug');
    if(first) select(+first.dataset.i);
  });
  document.addEventListener('click',function(e){
    if(!isOpen) return;
    if(!e.target.closest('.gl-searchwrap')) hideSugs();
  });

  /* ── "você está aqui" ── */
  function haversine(la1,lo1,la2,lo2){
    var R=6371, dLa=(la2-la1)*RAD, dLo=(lo2-lo1)*RAD;
    var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1*RAD)*Math.cos(la2*RAD)*Math.sin(dLo/2)*Math.sin(dLo/2);
    return 2*R*Math.asin(Math.min(1,Math.sqrt(a)));
  }
  function fmtKm(k){ return (k<10?k.toFixed(1):Math.round(k).toLocaleString('pt-BR'))+' km' }
  function paintKm(){
    if(!ME) return;
    DEST.forEach(function(d,i){
      var el=elList.querySelector('[data-km="'+i+'"]');
      if(el) el.textContent=fmtKm(haversine(ME.lat,ME.lon,d.lat,d.lon));
    });
  }
  elGeo.addEventListener('click',function(){
    if(!navigator.geolocation){ elGeoMsg.textContent='Seu navegador não suporta localização.'; return }
    elGeo.disabled=true; elGeoMsg.textContent='Pedindo permissão…';
    navigator.geolocation.getCurrentPosition(function(pos){
      ME={lat:pos.coords.latitude, lon:pos.coords.longitude};
      ME.v=vecOf(ME.lat,ME.lon);
      elGeo.style.display='none';
      elGeoMsg.textContent='📍 Você está aqui — distâncias calculadas a partir da sua posição.';
      paintKm();
      if(sel<0) flyTo(ME.lat,ME.lon);
      else elKm.textContent='A '+fmtKm(haversine(ME.lat,ME.lon,DEST[sel].lat,DEST[sel].lon))+' de você';
    },function(err){
      elGeo.disabled=false;
      elGeoMsg.textContent=err.code===1?'Permissão negada. Você pode liberar nas configurações do navegador.'
        :'Não consegui pegar sua localização agora.';
    },{enableHighAccuracy:false, timeout:10000, maximumAge:600000});
  });

  window.openGlobe=function(e){
    if(e&&e.preventDefault) e.preventDefault();
    if(!PTS) PTS=buildPts();
    isOpen=true;
    ov.classList.add('open'); md.classList.add('open');
    document.body.style.overflow='hidden';
    resize();
    /* pinta o primeiro frame na hora: não espera o rAF (que pode demorar se a aba
       acabou de ganhar foco). O próprio draw() agenda os seguintes. */
    if(!raf){ t0=0; draw(performance.now()) }
  };
  window.closeGlobe=function(){
    isOpen=false;
    ov.classList.remove('open'); md.classList.remove('open');
    document.body.style.overflow='';
    hideSugs();
    if(raf){ cancelAnimationFrame(raf); raf=0 }   // não queima CPU fechado
  };
})();
