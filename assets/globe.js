/* Globo 3D dos destinos OND, componente autônomo.
   Injeta CSS + HTML e define openGlobe()/closeGlobe() globais.
   Incluir com: <script src="/assets/globe.js" defer></script>
   e chamar em qualquer botão: onclick="openGlobe(event)".

   Canvas 2D puro, sem libs. A terra é uma máscara de bits (Natural Earth 110m)
   varrida em anéis de latitude com densidade corrigida por cos(lat); a ordem dos
   pontos aqui é a MESMA usada para gerar a máscara, não mexer sem regerar.

   Navegação em 2 níveis, espelhando o app: o globo abre mostrando um pin por PAÍS
   e, ao escolher um, troca para os destinos daquele país. */
(function(){
  if(window.__ondGlobe) return; window.__ondGlobe = true;

  var MASK='///n//z///w/L//4f4f//8D/gf///AA/A////wAAMA//f/8AAAwAE/f/8AAACAAAfP/4AAAAAAAAIAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAQAAAAAAOAAAAAAAAAAAAADAAAAAAA4AAAAAAAAAAAACAQAAAAAAHwAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAABQAwAAAAAAD8AAAAAAAAAAAAA8AAAAAAAAAf4AAAAEAAAAAAYD8AAAAAAAAAP8AAAADwAAAAAHz/gAAAAAAAAA/4AAAAPwAAAAAP//gAAAAAAAAAf+AAAAH8AAAAAD//8AAAAAAAAAB/4AAAAf4AAAAAH//4AAAAAAAAAB/8AAAAP/GAAAAB//+AAAAAAAAAAP/8AAAA/8YAAAAD//wCAAAAAAAAAP/8AAAB/4MAAAAAf/4AAAAAAAAAAH//AAAAf/DgAAAAB/8AAYAAAAAAAB//8AAAB//GAAAAAD+YAAAAAAAAAAD//8AAAB//iAAAAAAuIAAAAAAAAAAB///AAAAf/wAAAAAABAAAAAAAAAAAA///4AAAH/+AAAAAAAACAAAAAAAAAAH///gAAAf/wAAAAAYAHQAAAAAAAAAAf///AAAB//AAAAACAAPQAAAAAAAAAA///4AAAD//AAAAAILA+IAAAAAAAAAA///AAAAH//gAAAAZ6BQAAAAAAAAAAA//4AAAAH//wAAAAx6AAAAAAAAAAAAAf/4AAAAH//4AAAAo4AAAAAAAAAAAAAP/4AAAAH//8AAABQYAAAAAAAAAAAAAP/gAAB+///8AAAAgIAAAAAAAAAAAAC/4AAAP////4AAgEAGAAAAAAAAAAAAh/AAAB/////gAYAiCgAAAAAAAAAAAMEAAAAf////EAHABwEAAAAAAAAAAAOAAAAAP////YADgD4EAAAAAAAAAABYAAAAAP///+eAHgXwAAAAAAAAAAAfwQgAAA////z+AfB+BAAAAAAAAAAPmGgAAAP///5/gPw/QAAAAAAAAAAHgEAAAAP///7/w/9/wAAAAAAAAAAeAAAAAA////f8P///oAAAAAAAAAfgAAAAAP///fz////wAAAAAAAAC/AgAAAAf//9+/////AAAAAAAAAv/YAAAAD/////////gAAAAAAAB//4AAAAH/3D/////+IAAAAAAAf//AAAAB/AB/////8MAAAAAAD//+AAAAB8AP/////EYAAAAAB//+AAAAODL/n///8QgAAAAAP//4AAADwe/z///+4QAAAAAf//8AAAPicmP////AAAAAAH//9AAAD14d/////IAAAAB///wAAA/+ef////AAAAAD//+YAAf///////gAAAAf//4gAAf//////+AAAAH/+/gAHf//////wgAAH//fwACH//////jABAf/z4AAjP////8CACB/8PAAAT////+CAc//hgAAOP////5Af//CDAB3/////YH//TGEDf////////keYHv////n/rs8Af////jy65+AwP//AA5x8AE/5gARB8AIcAAHj4ARiACXxgAAAfECAA8AAAAAAAAA';
  var STEP=2, LAT_MAX=88, RAD=Math.PI/180, TAU=Math.PI*2;
  /* cidades que tem ficha no catalogo /viagens/ */
  var CAT={'Rio de Janeiro':'rio-de-janeiro','Natal':'natal','Maceió':'maceio','Foz do Iguaçu':'foz-do-iguacu','Salvador':'salvador',
    'Florianópolis':'florianopolis','Gramado':'gramado','Barreirinhas':'lencois-maranhenses','Santo Amaro do Maranhão':'lencois-maranhenses',
    'Buenos Aires':'buenos-aires','Bariloche':'bariloche','Santiago':'santiago','Puerto Natales':'patagonia','El Calafate':'patagonia',
    'El Chaltén':'patagonia','Cusco':'machu-picchu','Cancún':'cancun','Orlando':'orlando','Nova Iorque':'nova-york','Lisboa':'lisboa',
    'Paris':'paris','Roma':'roma','Tóquio':'japao','Quioto':'japao','Osaka':'japao'};
  var WA_NUM='5511910214133';
  var UNS='https://images.unsplash.com/', Q='?w=600&q=70&auto=format';

  /* fotos conferidas uma a uma (as do app clone vinham 4 quebradas) */
  var IMG={
    'Orlando':UNS+'photo-1597466599360-3b9775841aec'+Q,
    'Miami':UNS+'photo-1506966953602-c20cc11f75e3'+Q,
    'Nova Iorque':UNS+'photo-1496442226666-8d4d0e62e6e9'+Q,
    'Lisboa':UNS+'photo-1585208798174-6cedd86e019a'+Q,
    'Paris':UNS+'photo-1502602898657-3e91760cbb34'+Q,
    'Rio de Janeiro':UNS+'photo-1483729558449-99ef09a8c325'+Q,
    'Buenos Aires':UNS+'photo-1589909202802-8f4aadce1849'+Q,
    'Gramado':UNS+'photo-1668717342337-7185f43d60ea'+Q,
    'Salvador':UNS+'photo-1640884216864-b26b780ff102'+Q,
    'Florianópolis':UNS+'photo-1689301109191-ff1f55d2e243'+Q
  };
  /* destinos que já têm roteiro publicado no blog */
  var POST={ 'Lisboa':'/blog/roteiro-lisboa/', 'Buenos Aires':'/blog/roteiro-buenos-aires/' };

  /* lojas do app (mesmos links do app-modal.js), o seletor do globo é próprio
     porque o popup global fica em z-index 901, atrás do globo (100001). */
  var PLAY='https://play.google.com/store/apps/details?id=com.agamatec.ond';
  var APPSTORE='https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427';
  var WEB='https://web.ondviajar.com.br/';
  var IC_ANDROID='<svg viewBox="0 0 24 24" width="24" height="24" style="fill:#3DDC84"><path d="M17.523 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.046 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.405-6.02l1.997-3.46a.42.42 0 00-.72-.42l-2.02 3.5A12.3 12.3 0 0012 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.45a.42.42 0 00-.72.42l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44"/></svg>';
  var IC_APPLE='<svg viewBox="0 0 24 24" width="23" height="23" style="fill:currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  var IC_WEB='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg>';

  var PAISES=[];

  /* ── CSS ── */
  var css=''
  /* acima do orb do vAI (z-index 99999), senão ele flutua sobre o globo e rouba o clique dos pins */
  +'.gl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(5px);z-index:100000;opacity:0;pointer-events:none;transition:opacity .22s}'
  +'.gl-overlay.open{opacity:1;pointer-events:all}'
  +'.gl-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-52%) scale(.97);z-index:100001;'
    +'width:calc(100% - 40px);max-width:1020px;height:min(640px, calc(100vh - 60px));'
    +'background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);border-radius:22px;overflow:hidden;'
    +'box-shadow:0 30px 80px rgba(0,0,0,.65);display:flex;opacity:0;pointer-events:none;'
    +'transition:opacity .24s,transform .28s cubic-bezier(.34,1.56,.64,1)}'
  +'.gl-modal.open{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
  +'.gl-close{position:absolute;top:14px;right:14px;z-index:6;width:34px;height:34px;border-radius:50%;'
    +'background:rgba(0,0,0,.35);border:1px solid var(--border,#2a2a3a);color:var(--muted,#8b8ba7);'
    +'font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s,border-color .2s}'
  +'.gl-close:hover{color:var(--text,#f0eeff);border-color:var(--purple,#7f11f4)}'

  +'.gl-flag{display:inline-block;flex-shrink:0;width:22px;height:15px;border-radius:2px;object-fit:cover;vertical-align:middle;'
    +'background:#8b8ba7;box-shadow:0 1px 3px rgba(0,0,0,.4)}'
  +'.gl-flag.big{width:54px;height:37px;border-radius:4px}'

  /* palco do globo */
  +'.gl-stage{position:relative;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;overflow:hidden;'
    +'background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--purple,#7f11f4) 13%,transparent),transparent 62%)}'
  +'.gl-canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}'
  +'.gl-canvas.grabbing{cursor:grabbing}'

  /* ── BALÃO DE CONVERSA ancorado no pin (posição vem do canvas, visual é 100% CSS) ── */
  +'.gl-bubble{position:absolute;left:0;top:0;z-index:3;display:none;align-items:center;gap:8px;'
    +'padding:7px 11px;border-radius:12px;background:var(--surface,#16161f);border:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent);'
    +'box-shadow:0 10px 28px rgba(0,0,0,.5);white-space:nowrap;pointer-events:none;line-height:1.25;'
    +'transform:translate(-50%,calc(-100% - 14px))}'
  +'.gl-bubble.on{display:flex}'
  +'.gl-bubble::after{content:"";position:absolute;left:50%;bottom:-6px;width:10px;height:10px;'
    +'transform:translateX(-50%) rotate(45deg);background:var(--surface,#16161f);'
    +'border-right:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent);'
    +'border-bottom:1px solid color-mix(in srgb,var(--green,#00e676) 45%,transparent)}'
  +'.gl-bubble-n{font-size:.82rem;font-weight:700;color:var(--text,#f0eeff)}'
  +'.gl-bubble-c{font-size:.68rem;color:var(--muted,#8b8ba7)}'

  /* ── BARRA DE DIGITAÇÃO ── */
  +'.gl-searchwrap{position:absolute;left:16px;right:16px;bottom:14px;z-index:4}'
  +'.gl-bar{display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:50px;'
    +'background:color-mix(in srgb,var(--surface,#16161f) 92%,transparent);backdrop-filter:blur(10px);'
    +'border:1px solid var(--border,#2a2a3a);transition:border-color .2s,box-shadow .2s}'
  +'.gl-bar:focus-within{border-color:var(--purple,#7f11f4);box-shadow:0 0 0 3px color-mix(in srgb,var(--purple,#7f11f4) 18%,transparent)}'
  +'.gl-bar svg{width:16px;height:16px;color:var(--muted,#8b8ba7);flex-shrink:0}'
  +'.gl-input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--text,#f0eeff);'
    +'font-family:inherit;font-size:.88rem}'
  +'.gl-input::placeholder{color:var(--muted2,#5a5a72)}'
  /* sugestões como balõezinhos de conversa, subindo da barra */
  +'.gl-sugs{position:absolute;left:0;right:0;bottom:calc(100% + 9px);display:none;flex-direction:column;gap:6px;'
    +'max-height:min(300px,42vh);overflow-y:auto;padding:2px}'
  +'.gl-sugs.on{display:flex}'
  +'.gl-sug{display:flex;align-items:center;gap:9px;width:100%;text-align:left;cursor:pointer;'
    +'padding:8px 12px;border-radius:14px 14px 14px 4px;font-family:inherit;'
    +'background:color-mix(in srgb,var(--surface,#16161f) 94%,transparent);backdrop-filter:blur(10px);'
    +'border:1px solid var(--border,#2a2a3a);color:var(--text,#f0eeff);'
    +'transition:border-color .16s,background .16s,transform .12s}'
  +'.gl-sug:hover,.gl-sug.pre{border-color:color-mix(in srgb,var(--purple,#7f11f4) 55%,transparent);'
    +'background:color-mix(in srgb,var(--purple,#7f11f4) 15%,transparent);transform:translateX(2px)}'
  +'.gl-sug-n{font-size:.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'.gl-sug-c{font-size:.72rem;color:var(--muted,#8b8ba7);margin-left:auto;flex-shrink:0}'
  +'.gl-sug-empty{padding:9px 12px;font-size:.8rem;color:var(--muted,#8b8ba7);'
    +'background:color-mix(in srgb,var(--surface,#16161f) 94%,transparent);border:1px solid var(--border,#2a2a3a);border-radius:14px 14px 14px 4px}'

  /* painel */
  +'.gl-panel{width:340px;flex-shrink:0;border-left:1px solid var(--border,#2a2a3a);background:var(--bg,#0d0d14);'
    +'padding:24px 20px;overflow-y:auto;display:flex;flex-direction:column}'
  +'.gl-kicker{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--purple-light,#9d6fff)}'
  +'.gl-title{font-size:1.12rem;font-weight:800;letter-spacing:-.02em;margin:8px 0 5px;color:var(--text,#f0eeff);display:flex;align-items:center;gap:9px}'
  +'.gl-sub{font-size:.8rem;color:var(--muted,#8b8ba7);line-height:1.55}'
  /* grade de países */
  +'.gl-countries{list-style:none;margin:14px 0 0;padding:0}'
  /* cabeçalho de continente */
  +'.gl-cont{margin-top:16px}.gl-cont:first-child{margin-top:4px}'
  +'.gl-cont-h{display:flex;align-items:baseline;gap:7px;margin:0 0 8px 2px}'
  +'.gl-cont-t{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--purple-light,#9d6fff)}'
  +'.gl-cont-q{font-size:.68rem;color:var(--muted2,#5a5a72)}'
  +'.gl-cont-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'
  +'.gl-c{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:11px;cursor:pointer;width:100%;'
    +'border:1px solid transparent;background:none;color:var(--text,#f0eeff);font-family:inherit;font-size:.8rem;text-align:left;'
    +'transition:background .16s,border-color .16s}'
  +'.gl-c:hover{background:color-mix(in srgb,var(--purple,#7f11f4) 11%,transparent);border-color:color-mix(in srgb,var(--purple,#7f11f4) 34%,transparent)}'
  +'.gl-c-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'.gl-c-q{margin-left:auto;font-size:.68rem;color:var(--muted2,#5a5a72);flex-shrink:0}'
  /* lista de cidades */
  +'.gl-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}'
  +'.gl-li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;cursor:pointer;'
    +'border:1px solid transparent;color:var(--text,#f0eeff);font-size:.87rem;text-align:left;background:none;width:100%;'
    +'font-family:inherit;transition:background .16s,border-color .16s}'
  +'.gl-li:hover{background:color-mix(in srgb,var(--purple,#7f11f4) 11%,transparent);border-color:color-mix(in srgb,var(--purple,#7f11f4) 34%,transparent)}'
  +'.gl-li.on{background:color-mix(in srgb,var(--green,#00e676) 12%,transparent);border-color:color-mix(in srgb,var(--green,#00e676) 42%,transparent)}'
  +'.gl-li-km{margin-left:auto;font-size:.7rem;color:var(--muted2,#5a5a72);font-variant-numeric:tabular-nums;flex-shrink:0}'
  +'.gl-back{background:none;border:none;color:var(--muted,#8b8ba7);font-size:.8rem;cursor:pointer;padding:0;margin-bottom:12px;'
    +'text-align:left;font-family:inherit;transition:color .2s}'
  +'.gl-back:hover{color:var(--text,#f0eeff)}'
  /* botão de localização */
  +'.gl-geo{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:10px 14px;'
    +'border-radius:50px;border:1px dashed color-mix(in srgb,var(--purple,#7f11f4) 45%,transparent);background:none;'
    +'color:var(--purple-light,#9d6fff);font-family:inherit;font-size:.8rem;font-weight:600;cursor:pointer;'
    +'transition:background .18s,border-color .18s}'
  +'.gl-geo:hover:not(:disabled){background:color-mix(in srgb,var(--purple,#7f11f4) 12%,transparent);border-style:solid}'
  +'.gl-geo:disabled{opacity:.6;cursor:default}'
  +'.gl-geo svg{width:14px;height:14px}'
  +'.gl-geo-msg{font-size:.74rem;color:var(--muted2,#5a5a72);text-align:center;margin-top:8px;line-height:1.5}'
  /* card do destino */
  +'.gl-card{display:none;flex-direction:column;flex:1}'
  +'.gl-card.on{display:flex}'
  +'.gl-card-img{width:100%;height:148px;border-radius:14px;background:var(--card,#1a1a26) center/cover no-repeat;margin-bottom:14px;flex-shrink:0}'
  /* sem foto: bandeira grande sobre gradiente (não inventa imagem errada) */
  +'.gl-card-img.noimg{display:flex;align-items:center;justify-content:center;'
    +'background:linear-gradient(135deg,color-mix(in srgb,var(--purple,#7f11f4) 30%,transparent),color-mix(in srgb,var(--purple,#7f11f4) 8%,transparent));'
    +'border:1px solid var(--border,#2a2a3a)}'
  +'.gl-card-name{font-size:1.22rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff);display:flex;align-items:center;gap:9px}'
  +'.gl-card-c{font-size:.78rem;color:var(--muted,#8b8ba7);margin-top:3px}'
  +'.gl-card-d{font-size:.85rem;color:var(--muted,#8b8ba7);line-height:1.65;margin-top:10px}'
  +'.gl-card-km{font-size:.78rem;color:var(--purple-light,#9d6fff);margin-top:10px;font-weight:600}'
  +'.gl-card-cta{margin-top:auto;padding-top:18px}'
  +'.gl-btn{display:block;text-align:center;background:var(--purple,#7f11f4);color:#fff;padding:12px 20px;border-radius:50px;'
    +'font-size:.88rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;width:100%;font-family:inherit;'
    +'transition:background .2s,transform .15s}'
  +'.gl-btn:hover{background:var(--purple-light,#9d6fff);transform:translateY(-1px)}'
  +'.gl-btn.wa{background:#25D366;color:#062b14;font-weight:800}.gl-btn.wa:hover{background:#2ee070}'
  /* link secundário (roteiro do blog, quando existe) */
  +'.gl-btn2{display:block;text-align:center;margin-top:10px;color:var(--purple-light,#9d6fff);'
    +'font-size:.82rem;font-weight:600;text-decoration:none}'
  +'.gl-btn2:hover{text-decoration:underline}'

  /* ── SELETOR "montar viagem" (iOS/Android/Web), acima do globo ── */
  +'.gl-tio{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);z-index:100010;'
    +'opacity:0;pointer-events:none;transition:opacity .2s}'
  +'.gl-tio.on{opacity:1;pointer-events:all}'
  +'.gl-tm{position:fixed;top:50%;left:50%;transform:translate(-50%,-52%) scale(.96);z-index:100011;'
    +'width:calc(100% - 40px);max-width:430px;background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);'
    +'border-radius:20px;padding:28px;box-shadow:0 24px 64px rgba(0,0,0,.6);opacity:0;pointer-events:none;'
    +'transition:opacity .22s,transform .25s cubic-bezier(.34,1.56,.64,1)}'
  +'.gl-tm.on{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
  +'.gl-t-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px}'
  +'.gl-t-title{font-size:1.18rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff);display:flex;align-items:center;gap:9px}'
  +'.gl-t-close{background:none;border:1px solid var(--border,#2a2a3a);border-radius:50%;width:32px;height:32px;cursor:pointer;'
    +'color:var(--muted,#8b8ba7);font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;'
    +'transition:border-color .15s,color .15s}'
  +'.gl-t-close:hover{border-color:var(--purple,#7f11f4);color:var(--text,#f0eeff)}'
  +'.gl-t-sub{font-size:.84rem;color:var(--muted,#8b8ba7);margin:2px 0 20px}'
  +'.gl-t-opts{display:flex;flex-direction:column;gap:10px}'
  +'.gl-t-opt{display:flex;align-items:center;gap:14px;background:var(--card,#1c1c26);border:1px solid var(--border,#2a2a3a);'
    +'border-radius:14px;padding:14px 16px;text-decoration:none;color:var(--text,#f0eeff);transition:border-color .15s,transform .15s}'
  +'.gl-t-opt:hover{transform:translateX(4px)}'
  +'.gl-t-opt.ios:hover{border-color:#e6e6ea}.gl-t-opt.android:hover{border-color:#3DDC84}.gl-t-opt.web:hover{border-color:var(--purple,#7f11f4)}'
  +'.gl-t-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
  +'.gl-t-opt.ios .gl-t-ic{background:color-mix(in srgb,var(--text,#f0eeff) 10%,transparent);border:1px solid color-mix(in srgb,var(--text,#f0eeff) 18%,transparent);color:var(--text,#f0eeff)}'
  +'.gl-t-opt.android .gl-t-ic{background:rgba(61,220,132,.12);border:1px solid rgba(61,220,132,.3)}'
  +'.gl-t-opt.web .gl-t-ic{background:var(--purple-dim,rgba(127, 17, 244,.14));border:1px solid color-mix(in srgb,var(--purple,#7f11f4) 25%,transparent);color:var(--purple-light,#9d6fff)}'
  +'.gl-t-lbl{font-size:.95rem;font-weight:700;margin-bottom:2px}'
  +'.gl-t-desc{font-size:.78rem;color:var(--muted,#8b8ba7)}'
  +'.gl-t-arrow{margin-left:auto;color:var(--muted2,#6b6880);flex-shrink:0}'
  /* mobile: globo em cima, painel embaixo */
  +'@media(max-width:820px){'
    +'.gl-modal{flex-direction:column;height:min(680px, calc(100vh - 40px))}'
    +'.gl-stage{flex:0 0 44%}'
    +'.gl-panel{width:auto;border-left:none;border-top:1px solid var(--border,#2a2a3a);flex:1;padding:18px 16px}'
    +'.gl-card-img{height:108px}'
    +'.gl-searchwrap{left:12px;right:12px;bottom:10px}'
    /* no mobile o palco é baixo: a lista não pode subir além dele */
    +'.gl-sugs{max-height:min(190px,28vh)}'
  +'}';
  var stEl=document.createElement('style'); stEl.textContent=css; document.head.appendChild(stEl);

  /* ── índice plano de destinos (pra busca e pros pins) ── */
  var CITIES=[];
  var CATALOG_API='https://ond.agamatec.com/api/countries?locale=pt_BR', CATALOG_KEY='ond_globo_destinos', catalogState='idle';
  function averageOf(cities,field){ return cities.reduce(function(sum,city){ return sum+city[field] },0)/cities.length }
  function applyCatalog(countries){
    PAISES=countries.map(function(country){
      var cities=(country.cities||[]).filter(function(city){ return city.latitude!=null && city.longitude!=null })
        .map(function(city){ return {n:city.name, lat:city.latitude, lon:city.longitude, u:(city.unlocode||'').replace(/\s+/g,'')} });
      return {n:country.name, cc:country.countryCodeIso, cities:cities};
    }).filter(function(country){ return country.cc && country.cities.length })
      .sort(function(first,second){ return first.n.localeCompare(second.n,'pt') });
    CITIES=[];
    PAISES.forEach(function(p,pi){
      p.i=pi; p.lat=averageOf(p.cities,'lat'); p.lon=averageOf(p.cities,'lon'); p.v=vecOf(p.lat,p.lon); p.q=norm(p.n);
      p.cities.forEach(function(c,ci){
        c.p=p; c.pi=pi; c.ci=ci; c.v=vecOf(c.lat,c.lon); c.q=norm(c.n);
        c.cat=CAT[c.n]||null; c.img=IMG[c.n]||(c.cat?'/assets/viagens/'+c.cat+'.jpg':null); c.href=POST[c.n]||null;
        CITIES.push(c);
      });
    });
    elWorldTit.textContent=CITIES.length+' destinos em '+PAISES.length+' países';
    renderCountries();
    elLoad.style.display='none'; elWorld.style.display=''; elInput.disabled=false;
  }
  function loadCatalog(){
    if(catalogState==='loading'||catalogState==='ready') return;
    var cached=null;
    try{ cached=JSON.parse(sessionStorage.getItem(CATALOG_KEY)) }catch(storageError){}
    if(cached&&cached.length){ applyCatalog(cached); catalogState='ready'; return }
    catalogState='loading';
    elLoadMsg.textContent='Buscando os destinos do OND…'; elRetry.style.display='none';
    fetch(CATALOG_API).then(function(response){
      if(!response.ok) throw new Error('HTTP '+response.status);
      return response.json();
    }).then(function(countries){
      applyCatalog(countries); catalogState='ready';
      try{ sessionStorage.setItem(CATALOG_KEY, JSON.stringify(countries)) }catch(storageError){}
    }).catch(function(){
      catalogState='failed';
      elLoadMsg.textContent='Os destinos não carregaram. Tente de novo em instantes.'; elRetry.style.display='';
    });
  }

  function flagSrc(cc){ return '/assets/flags/'+cc+'.svg' }
  function flag(cc,cls){ return '<img class="gl-flag'+(cls?' '+cls:'')+'" src="'+flagSrc(cc)+'" alt="Bandeira" loading="lazy">' }

  /* ── HTML ── */
  var host=document.createElement('div');
  host.innerHTML=''
  +'<div class="gl-overlay" id="globeOverlay"></div>'
  +'<div class="gl-modal" id="globeModal" role="dialog" aria-modal="true" aria-label="Destinos OND">'
    +'<button class="gl-close" aria-label="Fechar">✕</button>'
    +'<div class="gl-stage">'
      +'<canvas class="gl-canvas" id="globeCanvas"></canvas>'
      +'<div class="gl-bubble" id="glBubble"><img class="gl-flag" id="glBubbleFlag" alt="">'
        +'<span><span class="gl-bubble-n" id="glBubbleN"></span><br><span class="gl-bubble-c" id="glBubbleC"></span></span></div>'
      +'<div class="gl-searchwrap">'
        +'<div class="gl-sugs" id="glSugs"></div>'
        +'<div class="gl-bar">'
          +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
          +'<input class="gl-input" id="glInput" type="text" disabled autocomplete="off" placeholder="Pra onde você quer ir?" aria-label="Buscar destino">'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<aside class="gl-panel">'
      /* nível 0: países */
      +'<div id="glLoad" style="padding-right:40px"><p class="gl-sub" id="glLoadMsg"></p><button class="gl-geo" id="glRetry" style="display:none">Tentar de novo</button></div>'
      +'<div id="glWorld" style="display:none">'
        +'<span class="gl-kicker">Explorar</span>'
        +'<h3 class="gl-title" id="glWorldTit"></h3>'
        +'<p class="gl-sub">Escolha um país no globo ou aqui, depois clique no destino.</p>'
        +'<div class="gl-countries" id="glCountries"></div>'
        +'<button class="gl-geo" id="glGeo">'
          +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
          +'Ativar localização</button>'
        +'<p class="gl-geo-msg" id="glGeoMsg"></p>'
      +'</div>'
      /* nível 1: cidades do país */
      +'<div id="glCountry" style="display:none">'
        +'<button class="gl-back" data-to="world">← Todos os países</button>'
        +'<h3 class="gl-title" id="glCountryTit"></h3>'
        +'<p class="gl-sub" id="glCountrySub"></p>'
        +'<ul class="gl-list" id="glList"></ul>'
      +'</div>'
      /* nível 2: destino */
      +'<div class="gl-card" id="glCard">'
        +'<button class="gl-back" id="glBackCity"></button>'
        +'<div class="gl-card-img" id="glImg"></div>'
        +'<h3 class="gl-card-name" id="glName"></h3>'
        +'<p class="gl-card-c" id="glC"></p>'
        +'<p class="gl-card-d" id="glD"></p>'
        +'<p class="gl-card-km" id="glKm"></p>'
        +'<div class="gl-card-cta"><a class="gl-btn" id="glCta"></a>'
          +'<a class="gl-btn2" id="glRot" style="display:none"></a></div>'
      +'</div>'
    +'</aside>'
  +'</div>'
  /* seletor "montar viagem", fora do modal, z-index acima do globo */
  +'<div class="gl-tio" id="glTripOv"></div>'
  +'<div class="gl-tm" id="glTripModal" role="dialog" aria-modal="true" aria-label="Montar viagem com OND vAI">'
    +'<div class="gl-t-head"><div class="gl-t-title" id="glTripTitle"></div>'
      +'<button class="gl-t-close" id="glTripClose" aria-label="Fechar">✕</button></div>'
    +'<div class="gl-t-sub" id="glTripSub"></div>'
    +'<div class="gl-t-opts">'
      +'<a class="gl-t-opt ios" id="glTripIos" href="'+APPSTORE+'" target="_blank" rel="noopener"><div class="gl-t-ic">'+IC_APPLE+'</div>'
        +'<div><div class="gl-t-lbl">App Store</div><div class="gl-t-desc">iPhone e iPad</div></div><div class="gl-t-arrow">→</div></a>'
      +'<a class="gl-t-opt android" id="glTripAndroid" href="'+PLAY+'" target="_blank" rel="noopener"><div class="gl-t-ic">'+IC_ANDROID+'</div>'
        +'<div><div class="gl-t-lbl">Google Play</div><div class="gl-t-desc">Celular e tablet Android</div></div><div class="gl-t-arrow">→</div></a>'
      +'<a class="gl-t-opt web" id="glTripWeb" href="'+WEB+'" target="_blank" rel="noopener"><div class="gl-t-ic">'+IC_WEB+'</div>'
        +'<div><div class="gl-t-lbl">Abrir na Web</div><div class="gl-t-desc">Sem instalar, direto no navegador</div></div><div class="gl-t-arrow">→</div></a>'
    +'</div>'
  +'</div>';
  document.body.appendChild(host);

  var ov=document.getElementById('globeOverlay'), md=document.getElementById('globeModal');
  var cv=document.getElementById('globeCanvas'), ctx=cv.getContext('2d');
  var elWorld=document.getElementById('glWorld'), elCountry=document.getElementById('glCountry');
  var elCard=document.getElementById('glCard'), elCountries=document.getElementById('glCountries');
  var elList=document.getElementById('glList'), elCTit=document.getElementById('glCountryTit');
  var elCSub=document.getElementById('glCountrySub'), elBackCity=document.getElementById('glBackCity');
  var elImg=document.getElementById('glImg'), elName=document.getElementById('glName');
  var elC=document.getElementById('glC'), elD=document.getElementById('glD');
  var elKm=document.getElementById('glKm'), elCta=document.getElementById('glCta');
  var elRot=document.getElementById('glRot');
  var elTripOv=document.getElementById('glTripOv'), elTripModal=document.getElementById('glTripModal');
  var elTripTitle=document.getElementById('glTripTitle'), elTripSub=document.getElementById('glTripSub');
  var elTripIos=document.getElementById('glTripIos'), elTripAndroid=document.getElementById('glTripAndroid'), elTripWeb=document.getElementById('glTripWeb');
  var elWorldTit=document.getElementById('glWorldTit'), elLoad=document.getElementById('glLoad');
  var elLoadMsg=document.getElementById('glLoadMsg'), elRetry=document.getElementById('glRetry');
  elRetry.addEventListener('click',loadCatalog);
  var elInput=document.getElementById('glInput'), elSugs=document.getElementById('glSugs');
  var elBub=document.getElementById('glBubble'), elBubFlag=document.getElementById('glBubbleFlag');
  var elBubN=document.getElementById('glBubbleN'), elBubC=document.getElementById('glBubbleC');
  var elGeo=document.getElementById('glGeo'), elGeoMsg=document.getElementById('glGeoMsg');

  /* países agrupados por continente (data-p continua o índice em PAISES) */
  var CONT={ BRA:'América do Sul',ARG:'América do Sul',CHL:'América do Sul',COL:'América do Sul',
    URY:'América do Sul',PRY:'América do Sul',VEN:'América do Sul',PER:'América do Sul',
    USA:'América do Norte',MEX:'América do Norte',CAN:'América do Norte',PAN:'América do Norte',DOM:'América do Norte',
    DEU:'Europa',ITA:'Europa',LUX:'Europa',ROU:'Europa',FIN:'Europa',DNK:'Europa',GBR:'Europa',HRV:'Europa',
    GRC:'Europa',SWE:'Europa',NOR:'Europa',FRA:'Europa',BEL:'Europa',PRT:'Europa',SVN:'Europa',POL:'Europa',
    MNE:'Europa',NLD:'Europa',ESP:'Europa',ISL:'Europa',TUR:'Europa',AUT:'Europa',ALB:'Europa',MCO:'Europa',
    HUN:'Europa',CZE:'Europa',CHE:'Europa',
    JPN:'Ásia',CHN:'Ásia',THA:'Ásia',MDV:'Ásia', ZAF:'África',MAR:'África', ARE:'Oriente Médio' };
  var CONT_ORDER=['América do Sul','América do Norte','Europa','Oriente Médio','Ásia','África','Oceania'];
  function renderCountries(){
    var grp={};
    PAISES.forEach(function(p,i){ var k=CONT[p.cc]||'Outros'; (grp[k]=grp[k]||[]).push(i) });
    var html='';
    CONT_ORDER.concat(Object.keys(grp).filter(function(k){ return CONT_ORDER.indexOf(k)<0 })).forEach(function(cont){
      var idxs=grp[cont]; if(!idxs) return;
      var dest=idxs.reduce(function(s,i){ return s+PAISES[i].cities.length },0);
      html+='<div class="gl-cont"><div class="gl-cont-h"><span class="gl-cont-t">'+cont+'</span>'
        +'<span class="gl-cont-q">'+idxs.length+' '+(idxs.length===1?'país':'países')+' · '+dest+' destinos</span></div>'
        +'<div class="gl-cont-grid">'+idxs.map(function(i){ var p=PAISES[i];
          return '<button class="gl-c" data-p="'+i+'">'+flag(p.cc)
            +'<span class="gl-c-n">'+p.n+'</span><span class="gl-c-q">'+p.cities.length+'</span></button>';
        }).join('')+'</div></div>';
    });
    elCountries.innerHTML=html;
  }
  elCountries.addEventListener('click',function(e){ var b=e.target.closest('.gl-c'); if(b) openCountry(+b.dataset.p) });
  elList.addEventListener('click',function(e){ var b=e.target.closest('.gl-li'); if(b) openCity(+b.dataset.p, +b.dataset.c) });
  md.addEventListener('click',function(e){
    var b=e.target.closest('.gl-back'); if(!b) return;
    if(b.dataset.to==='world') showWorld(); else openCountry(+b.dataset.p);
  });
  md.querySelector('.gl-close').addEventListener('click',function(){ closeGlobe() });
  ov.addEventListener('click',function(){ closeGlobe() });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape'||!isOpen) return;
    if(elTripModal.classList.contains('on')){ closeTrip(); return }             // 1º Esc fecha o seletor
    if(elSugs.classList.contains('on')){ hideSugs(); elInput.blur(); return }   // depois a busca
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
    return out;
  }
  function vecOf(lat,lon){ var la=lat*RAD, lo=lon*RAD, cl=Math.cos(la); return [cl*Math.sin(lo), Math.sin(la), cl*Math.cos(lo)] }

  /* ── estado ── */
  /* vista inicial sobre o Atlântico (~20°O, 15°N): pega Américas, Europa e África
     no mesmo enquadramento. yaw=-lon, pitch=lat centralizam um ponto. */
  var yaw=0.35, pitch=0.26, vyaw=0, isOpen=false, raf=0;
  /* zoom: 18 dos 28 países são europeus e ficam amontoados sem ele.
     zoomTo anima; ao abrir um país aproxima, ao voltar pro mundo afasta. */
  var zoom=1, zoomTo=1, ZMIN=1, ZMAX=5;
  var mode='world', selP=-1, selC=-1, hover=-1;
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

  /* o que está plotado agora: países (mundo) ou cidades (país aberto) */
  function pins(){ return mode==='world' ? PAISES : PAISES[selP].cities }
  function selIdx(){ return mode==='world' ? selP : selC }

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
      if(mode==='world' && selP<0) yaw+=SPIN;  // gira só no mundo pristino; clicou em algo, para
      yaw+=vyaw; vyaw*=0.94;
      if(Math.abs(vyaw)<1e-5) vyaw=0;
    }

    zoom+=(zoomTo-zoom)*0.12;                    // aproxima suave
    if(Math.abs(zoomTo-zoom)<0.002) zoom=zoomTo;
    var R=Math.min(w,h)*0.40*zoom, cx=w/2, cy=h/2;
    ctx.clearRect(0,0,w,h);

    var g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.05,cx,cy,R);
    g.addColorStop(0,'rgba(127, 17, 244,.22)'); g.addColorStop(.65,'rgba(127, 17, 244,.06)'); g.addColorStop(1,'rgba(10,10,18,.30)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R+0.5,0,TAU);
    ctx.strokeStyle='rgba(127, 17, 244,.30)'; ctx.lineWidth=1; ctx.stroke();

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
      ctx.fillStyle='#7f11f4';
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
        ctx.beginPath(); ctx.arc(m[0],m[1],4,0,TAU); ctx.strokeStyle='#7f11f4'; ctx.lineWidth=1.6; ctx.stroke();
        ctx.globalAlpha=Math.min(1,ma+0.2);
        ctx.font='700 11px Onest, system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.lineWidth=3; ctx.strokeStyle='rgba(13,13,20,.9)';
        ctx.strokeText('Você está aqui', m[0], m[1]-9);
        ctx.fillStyle='#f0eeff'; ctx.fillText('Você está aqui', m[0], m[1]-9);
      }
    }

    /* pins (países no mundo, cidades dentro de um país) */
    var list=pins(), si=selIdx();
    hit.length=0;
    var pulse=(Math.sin((ts-t0)/460)+1)/2;
    /* com muitos pins juntos o rótulo vira sopa: só desenha o que couber */
    var labels=[];
    for(var n=0;n<list.length;n++){
      var p=project(list[n].v), sx=p[0], sy=p[1], z3=p[2];
      if(z3<=0.04) continue;
      hit.push(sx,sy,n);
      var on=(n===si), hv=(n===hover), a=0.35+0.65*z3;
      ctx.globalAlpha=a*(on?0.5:0.28)*(0.45+0.55*pulse);
      ctx.beginPath(); ctx.arc(sx,sy,(on?9:6)+pulse*(on?5:3),0,TAU);
      ctx.fillStyle='#00e676'; ctx.fill();
      ctx.globalAlpha=a;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.4,0,TAU); ctx.fillStyle='#00e676'; ctx.fill();
      ctx.globalAlpha=a*0.9;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.4,0,TAU);
      ctx.strokeStyle='rgba(13,13,20,.85)'; ctx.lineWidth=1.2; ctx.stroke();
      if(!on && (z3>0.3||hv)) labels.push({x:sx,y:sy,t:list[n].n,a:a,hv:hv,z:z3});
    }
    /* rótulos: prioriza os da frente e descarta os que colidem */
    ctx.font='600 11px Onest, system-ui, sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    labels.sort(function(A,B){ return (B.hv?9:B.z)-(A.hv?9:A.z) });
    var placed=[];
    for(var L=0;L<labels.length;L++){
      var lb=labels[L], hw=ctx.measureText(lb.t).width/2+3, ly=lb.y-9;
      var clash=false;
      for(var q=0;q<placed.length;q++){
        var o=placed[q];
        if(Math.abs(o.y-ly)<13 && Math.abs(o.x-lb.x)<(o.hw+hw)){ clash=true; break }
      }
      if(clash) continue;
      placed.push({x:lb.x,y:ly,hw:hw});
      ctx.globalAlpha=lb.hv?Math.min(1,lb.a+0.25):lb.a*0.62;
      ctx.lineWidth=3; ctx.strokeStyle='rgba(13,13,20,.9)';
      ctx.strokeText(lb.t, lb.x, ly);
      ctx.fillStyle=lb.hv?'#00e676':'#f0eeff';
      ctx.fillText(lb.t, lb.x, ly);
    }
    ctx.globalAlpha=1;

    /* balão no pin selecionado (esconde se foi pro outro lado) */
    if(si>=0 && list[si]){
      var q2=project(list[si].v);
      if(q2[2]>0.04){ elBub.classList.add('on'); elBub.style.transform='translate('+q2[0]+'px,'+q2[1]+'px) translate(-50%,calc(-100% - 14px))' }
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
    if(moved>=5) return;                       // arrastou, não clicou
    var i=pick(e);
    if(i<0) return;
    if(mode==='world') openCountry(i); else openCity(selP, i);
  });
  cv.addEventListener('pointercancel',function(){ drag=false; cv.classList.remove('grabbing') });
  cv.addEventListener('wheel',function(e){
    e.preventDefault();
    zoomTo=Math.max(ZMIN,Math.min(ZMAX, zoomTo*(e.deltaY<0?1.18:1/1.18)));
  },{passive:false});
  /* pinch no mobile */
  var pinch=0;
  cv.addEventListener('touchmove',function(e){
    if(e.touches.length!==2) return;
    e.preventDefault();
    var dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
    var dist=Math.sqrt(dx*dx+dy*dy);
    if(pinch) zoomTo=Math.max(ZMIN,Math.min(ZMAX, zoomTo*(dist/pinch)));
    pinch=dist;
  },{passive:false});
  cv.addEventListener('touchend',function(){ pinch=0 });

  function flyTo(lat,lon,z){
    var ty=-lon*RAD, tp=lat*RAD;
    var dy=((ty-yaw)%TAU+TAU+Math.PI)%TAU-Math.PI;   // caminho mais curto
    fly={t:performance.now(), y0:yaw, dy:dy, p0:pitch, dp:tp-pitch};
    if(z) zoomTo=z;
  }
  function setBubble(n,c,cc){
    elBubFlag.src=flagSrc(cc); elBubFlag.alt='Bandeira: '+c;
    elBubN.textContent=n; elBubC.textContent=c;
  }

  /* ── navegação ── */
  function showWorld(){
    mode='world'; selP=-1; selC=-1; hover=-1;
    elWorld.style.display=''; elCountry.style.display='none'; elCard.classList.remove('on');
    elBub.classList.remove('on'); hideSugs(); elInput.value='';
    zoomTo=1;
  }
  function openCountry(pi){
    var p=PAISES[pi];
    mode='country'; selP=pi; selC=-1; hover=-1;
    elWorld.style.display='none'; elCountry.style.display=''; elCard.classList.remove('on');
    elCTit.innerHTML=flag(p.cc)+'<span>Destinos em '+p.n+'</span>';
    elCSub.textContent=p.cities.length+(p.cities.length===1?' destino no OND':' destinos no OND');
    elList.innerHTML=p.cities.map(function(c,ci){
      return '<li><button class="gl-li" data-p="'+pi+'" data-c="'+ci+'"><span>'+c.n+'</span>'
        +'<span class="gl-li-km" data-km="'+ci+'"></span></button></li>';
    }).join('');
    paintKm();
    setBubble(p.n, p.cities.length+' destinos', p.cc);
    hideSugs(); elInput.value='';
    flyTo(p.lat,p.lon,2.4);
  }
  function openCity(pi,ci){
    if(mode!=='country'||selP!==pi){   // veio da busca: entra no país antes
      openCountry(pi);
    }
    var p=PAISES[pi], c=p.cities[ci];
    selC=ci; mode='country';
    elWorld.style.display='none'; elCountry.style.display='none'; elCard.classList.add('on');
    [].forEach.call(elList.querySelectorAll('.gl-li'),function(b){ b.classList.toggle('on', +b.dataset.c===ci) });
    elBackCity.textContent='← Destinos em '+p.n;
    elBackCity.dataset.p=pi;
    if(c.img){ elImg.className='gl-card-img'; elImg.style.backgroundImage="url('"+c.img+"')"; elImg.innerHTML='' }
    else{ elImg.className='gl-card-img noimg'; elImg.style.backgroundImage=''; elImg.innerHTML=flag(p.cc,'big') }
    elName.innerHTML=flag(p.cc)+'<span>'+c.n+'</span>';
    elC.textContent=p.n;
    elD.textContent=c.d||('Monte seu roteiro em '+c.n+' com o OND vAI: o que fazer, em que ordem e quanto custa.');
    elKm.textContent=ME?('A '+fmtKm(haversine(ME.lat,ME.lon,c.lat,c.lon))+' de você'):'';
    setBubble(c.n, p.n, p.cc);
    /* CTA principal: comprar a viagem com o OND pelo WhatsApp */
    elCta.className='gl-btn wa'; elCta.textContent='Quero comprar essa viagem';
    elCta.href='https://wa.me/'+WA_NUM+'?text='+encodeURIComponent('Olá, OND! Quero comprar uma viagem para '+c.n+' ('+p.n+'). Vi no globo de destinos do site.');
    elCta.target='_blank'; elCta.rel='noopener';
    elCta.onclick=function(){ if(window.gtag) gtag('event','whatsapp_click',{destino:c.n,pagina:'globo'}) };
    /* secundário: ficha do catálogo > roteiro do blog > montar no OND vAI */
    elRot.style.display=''; elRot.removeAttribute('target'); elRot.onclick=null;
    if(c.cat){ elRot.textContent='Ver detalhes da viagem →'; elRot.href='/viagens/#'+c.cat;
      elRot.onclick=function(){ closeGlobe() } }
    else if(c.href){ elRot.textContent='Ver roteiro de '+c.n+' →'; elRot.href=c.href }
    else { elRot.textContent='Planejar grátis no OND vAI'; elRot.href='#';
      elRot.onclick=function(ev){ ev.preventDefault(); openTrip(c, p) } }
    hideSugs(); elInput.value='';
    flyTo(c.lat,c.lon,3.2);
  }

  /* ── seletor "montar viagem" (iOS/Android/Web) ── */
  function openTrip(city,country){
    elTripTitle.innerHTML=flag(country.cc)+'<span>Montar viagem para '+city.n+'</span>';
    elTripSub.textContent='Abra o OND vAI e monte seu roteiro em '+city.n+', escolha por onde começar.';
    var appLinks=window.ondAppLinks, deepLinkPath=appLinks.deepLinkPathFor(city.u);
    elTripModal.dataset.path=deepLinkPath;
    elTripWeb.href=appLinks.webLinkFor(deepLinkPath);
    elTripIos.href=APPSTORE; elTripAndroid.href=PLAY;
    if(deepLinkPath) appLinks.resolveStoreLink(deepLinkPath,function(branchUrl){
      if(elTripModal.dataset.path!==deepLinkPath) return;
      elTripIos.href=branchUrl; elTripAndroid.href=branchUrl;
    });
    elTripOv.classList.add('on'); elTripModal.classList.add('on');
  }
  function closeTrip(){ elTripOv.classList.remove('on'); elTripModal.classList.remove('on') }
  elTripOv.addEventListener('click',closeTrip);
  document.getElementById('glTripClose').addEventListener('click',closeTrip);
  elTripModal.addEventListener('click',function(e){ if(e.target.closest('.gl-t-opt')) closeTrip() });

  /* ── busca (global: cidades + países) ── */
  var norm=function(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim() };
  function hideSugs(){ elSugs.classList.remove('on'); elSugs.innerHTML='' }
  function showSugs(){
    var q=norm(elInput.value), items=[];
    if(!q){
      items=PAISES.map(function(p){ return {t:'p', n:p.n, c:p.cities.length+' destinos', cc:p.cc, pi:p.i} });
    } else {
      PAISES.forEach(function(p){
        if(p.q.indexOf(q)>=0) items.push({t:'p', n:p.n, c:p.cities.length+' destinos', cc:p.cc, pi:p.i});
      });
      CITIES.forEach(function(c){
        if(c.q.indexOf(q)>=0) items.push({t:'c', n:c.n, c:c.p.n, cc:c.p.cc, pi:c.pi, ci:c.ci});
      });
      items.sort(function(A,B){       // quem começa com o termo vem primeiro
        var a=norm(A.n).indexOf(q)===0?0:1, b=norm(B.n).indexOf(q)===0?0:1;
        return a-b;
      });
    }
    if(!items.length){
      elSugs.innerHTML='<div class="gl-sug-empty">Ainda não temos esse destino, mas o OND vAI monta pra você no app.</div>';
      elSugs.classList.add('on'); return;
    }
    elSugs.innerHTML=items.slice(0,40).map(function(o,k){
      return '<button class="gl-sug'+(k===0&&q?' pre':'')+'" data-t="'+o.t+'" data-p="'+o.pi+'"'
        +(o.t==='c'?' data-c="'+o.ci+'"':'')+'>'+flag(o.cc)
        +'<span class="gl-sug-n">'+o.n+'</span><span class="gl-sug-c">'+o.c+'</span></button>';
    }).join('');
    elSugs.classList.add('on');
  }
  function takeSug(b){ if(b.dataset.t==='p') openCountry(+b.dataset.p); else openCity(+b.dataset.p, +b.dataset.c) }
  elInput.addEventListener('focus',showSugs);
  elInput.addEventListener('input',showSugs);
  elSugs.addEventListener('click',function(e){ var b=e.target.closest('.gl-sug'); if(b) takeSug(b) });
  elInput.addEventListener('keydown',function(e){
    if(e.key!=='Enter') return;
    e.preventDefault();
    var first=elSugs.querySelector('.gl-sug');
    if(first) takeSug(first);
  });
  document.addEventListener('click',function(e){
    if(isOpen && !e.target.closest('.gl-searchwrap')) hideSugs();
  });

  /* ── "você está aqui" ── */
  function haversine(la1,lo1,la2,lo2){
    var R=6371, dLa=(la2-la1)*RAD, dLo=(lo2-lo1)*RAD;
    var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1*RAD)*Math.cos(la2*RAD)*Math.sin(dLo/2)*Math.sin(dLo/2);
    return 2*R*Math.asin(Math.min(1,Math.sqrt(a)));
  }
  function fmtKm(k){ return (k<10?k.toFixed(1):Math.round(k).toLocaleString('pt-BR'))+' km' }
  function paintKm(){
    if(!ME||selP<0) return;
    PAISES[selP].cities.forEach(function(c,ci){
      var el=elList.querySelector('[data-km="'+ci+'"]');
      if(el) el.textContent=fmtKm(haversine(ME.lat,ME.lon,c.lat,c.lon));
    });
  }
  elGeo.addEventListener('click',function(){
    if(!navigator.geolocation){ elGeoMsg.textContent='Seu navegador não suporta localização.'; return }
    elGeo.disabled=true; elGeoMsg.textContent='Pedindo permissão…';
    navigator.geolocation.getCurrentPosition(function(pos){
      ME={lat:pos.coords.latitude, lon:pos.coords.longitude};
      ME.v=vecOf(ME.lat,ME.lon);
      /* qual destino do OND está mais perto? */
      var best=null;
      CITIES.forEach(function(c){
        var k=haversine(ME.lat,ME.lon,c.lat,c.lon);
        if(!best||k<best.k) best={k:k,c:c};
      });
      elGeo.style.display='none';
      elGeoMsg.innerHTML='📍 Você está aqui.<br>Destino OND mais perto: <b>'+best.c.n+'</b> ('+fmtKm(best.k)+').';
      paintKm();
      if(selIdx()<0) flyTo(ME.lat,ME.lon);
    },function(err){
      elGeo.disabled=false;
      elGeoMsg.textContent=err.code===1?'Permissão negada. Você pode liberar nas configurações do navegador.'
        :'Não consegui pegar sua localização agora.';
    },{enableHighAccuracy:false, timeout:10000, maximumAge:600000});
  });

  window.openGlobe=function(e){
    if(e&&e.preventDefault) e.preventDefault();
    if(!PTS) PTS=buildPts();
    loadCatalog();
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
    hideSugs(); closeTrip();
    if(raf){ cancelAnimationFrame(raf); raf=0 }   // não queima CPU fechado
  };
})();
