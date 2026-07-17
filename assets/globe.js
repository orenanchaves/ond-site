/* Globo 3D dos destinos OND — componente autônomo.
   Injeta CSS + HTML e define openGlobe()/closeGlobe() globais.
   Incluir com: <script src="/assets/globe.js" defer></script>
   e chamar em qualquer botão: onclick="openGlobe(event)".

   Canvas 2D puro, sem libs. A terra é uma máscara de bits (Natural Earth 110m)
   varrida em anéis de latitude com densidade corrigida por cos(lat); a ordem dos
   pontos aqui é a MESMA usada para gerar a máscara — não mexer sem regerar. */
(function(){
  if(window.__ondGlobe) return; window.__ondGlobe = true;

  var MASK='///n//z///w/L//4f4f//8D/gf///AA/A////wAAMA//f/8AAAwAE/f/8AAACAAAfP/4AAAAAAAAIAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAQAAAAAAOAAAAAAAAAAAAADAAAAAAA4AAAAAAAAAAAACAQAAAAAAHwAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAABQAwAAAAAAD8AAAAAAAAAAAAA8AAAAAAAAAf4AAAAEAAAAAAYD8AAAAAAAAAP8AAAADwAAAAAHz/gAAAAAAAAA/4AAAAPwAAAAAP//gAAAAAAAAAf+AAAAH8AAAAAD//8AAAAAAAAAB/4AAAAf4AAAAAH//4AAAAAAAAAB/8AAAAP/GAAAAB//+AAAAAAAAAAP/8AAAA/8YAAAAD//wCAAAAAAAAAP/8AAAB/4MAAAAAf/4AAAAAAAAAAH//AAAAf/DgAAAAB/8AAYAAAAAAAB//8AAAB//GAAAAAD+YAAAAAAAAAAD//8AAAB//iAAAAAAuIAAAAAAAAAAB///AAAAf/wAAAAAABAAAAAAAAAAAA///4AAAH/+AAAAAAAACAAAAAAAAAAH///gAAAf/wAAAAAYAHQAAAAAAAAAAf///AAAB//AAAAACAAPQAAAAAAAAAA///4AAAD//AAAAAILA+IAAAAAAAAAA///AAAAH//gAAAAZ6BQAAAAAAAAAAA//4AAAAH//wAAAAx6AAAAAAAAAAAAAf/4AAAAH//4AAAAo4AAAAAAAAAAAAAP/4AAAAH//8AAABQYAAAAAAAAAAAAAP/gAAB+///8AAAAgIAAAAAAAAAAAAC/4AAAP////4AAgEAGAAAAAAAAAAAAh/AAAB/////gAYAiCgAAAAAAAAAAAMEAAAAf////EAHABwEAAAAAAAAAAAOAAAAAP////YADgD4EAAAAAAAAAABYAAAAAP///+eAHgXwAAAAAAAAAAAfwQgAAA////z+AfB+BAAAAAAAAAAPmGgAAAP///5/gPw/QAAAAAAAAAAHgEAAAAP///7/w/9/wAAAAAAAAAAeAAAAAA////f8P///oAAAAAAAAAfgAAAAAP///fz////wAAAAAAAAC/AgAAAAf//9+/////AAAAAAAAAv/YAAAAD/////////gAAAAAAAB//4AAAAH/3D/////+IAAAAAAAf//AAAAB/AB/////8MAAAAAAD//+AAAAB8AP/////EYAAAAAB//+AAAAODL/n///8QgAAAAAP//4AAADwe/z///+4QAAAAAf//8AAAPicmP////AAAAAAH//9AAAD14d/////IAAAAB///wAAA/+ef////AAAAAD//+YAAf///////gAAAAf//4gAAf//////+AAAAH/+/gAHf//////wgAAH//fwACH//////jABAf/z4AAjP////8CACB/8PAAAT////+CAc//hgAAOP////5Af//CDAB3/////YH//TGEDf////////keYHv////n/rs8Af////jy65+AwP//AA5x8AE/5gARB8AIcAAHj4ARiACXxgAAAfECAA8AAAAAAAAA';
  var STEP=2, LAT_MAX=88, RAD=Math.PI/180, TAU=Math.PI*2;
  var UNS='https://images.unsplash.com/';

  var DEST=[
    {n:'Orlando',            f:'🇺🇸', lat: 28.5383, lon: -81.3792, img:UNS+'photo-1597466599360-3b9775841aec?w=600&q=70&auto=format', d:'Parques, compras e logística de família — o OND encaixa filas, deslocamento e descanso.'},
    {n:'Lisboa',             f:'🇵🇹', lat: 38.7223, lon:  -9.1393, img:UNS+'photo-1585208798174-6cedd86e019a?w=600&q=70&auto=format', d:'Miradouros, bairros e bacalhau. Roteiro a pé, com pausa pro pastel.', href:'/blog/roteiro-lisboa/', cta:'Ver roteiro'},
    {n:'Rio de Janeiro',     f:'🇧🇷', lat:-22.9068, lon: -43.1729, img:'/assets/blog/brasil-rio.jpg',   d:'Praia, trilha e vista. O OND organiza o dia pelo tempo e pela maré.'},
    {n:'Buenos Aires',       f:'🇦🇷', lat:-34.6037, lon: -58.3816, img:UNS+'photo-1612294037637-ec328d0e075e?w=600&q=70&auto=format', d:'Bairros, parrilla e tango. Câmbio e caminhada no mesmo roteiro.', href:'/blog/roteiro-buenos-aires/', cta:'Ver roteiro'},
    {n:'Paris',              f:'🇫🇷', lat: 48.8566, lon:   2.3522, img:'/assets/blog/paris.jpg',        d:'Museus com hora marcada e bairros pra andar sem pressa.'},
    {n:'Machu Picchu',       f:'🇵🇪', lat:-13.1631, lon: -72.5450, img:'/assets/blog/machu-picchu.jpg', d:'Altitude, trem e ingresso com data. O OND cuida da ordem certa.'},
    {n:'Fernando de Noronha',f:'🇧🇷', lat: -3.8576, lon: -32.4297, img:'/assets/blog/noronha.jpg',      d:'Taxa, ICMBio e maré. As praias na hora certa do dia.'},
    {n:'Patagônia',          f:'🇦🇷', lat:-49.3000, lon: -72.9000, img:'/assets/blog/patagonia.jpg',    d:'Vento, trilha e distância. Roteiro que respeita o clima.'},
    {n:'Bora Bora',          f:'🇵🇫', lat:-16.5004, lon:-151.7415, img:'/assets/blog/bora-bora.jpg',    d:'Lagoa, bangalô e transfer de barco. Menos planilha, mais água azul.'}
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
  +'.gl-close{position:absolute;top:14px;right:14px;z-index:5;width:34px;height:34px;border-radius:50%;'
    +'background:rgba(0,0,0,.35);border:1px solid var(--border,#2a2a3a);color:var(--muted,#8b8ba7);'
    +'font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s,border-color .2s}'
  +'.gl-close:hover{color:var(--text,#f0eeff);border-color:var(--purple,#7c3fff)}'
  /* palco do globo */
  +'.gl-stage{position:relative;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;'
    +'background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--purple,#7c3fff) 13%,transparent),transparent 62%)}'
  +'.gl-canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}'
  +'.gl-canvas.grabbing{cursor:grabbing}'
  +'.gl-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:.72rem;color:var(--muted2,#5a5a72);pointer-events:none}'
  /* painel */
  +'.gl-panel{width:320px;flex-shrink:0;border-left:1px solid var(--border,#2a2a3a);background:var(--bg,#0d0d14);'
    +'padding:26px 22px;overflow-y:auto;display:flex;flex-direction:column}'
  +'.gl-kicker{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--purple-light,#9d6fff)}'
  +'.gl-title{font-size:1.15rem;font-weight:800;letter-spacing:-.02em;margin:8px 0 5px;color:var(--text,#f0eeff)}'
  +'.gl-sub{font-size:.82rem;color:var(--muted,#8b8ba7);line-height:1.55}'
  +'.gl-list{list-style:none;margin:18px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}'
  +'.gl-li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;cursor:pointer;'
    +'border:1px solid transparent;color:var(--text,#f0eeff);font-size:.88rem;text-align:left;background:none;width:100%;'
    +'font-family:inherit;transition:background .16s,border-color .16s}'
  +'.gl-li:hover{background:color-mix(in srgb,var(--purple,#7c3fff) 11%,transparent);border-color:color-mix(in srgb,var(--purple,#7c3fff) 34%,transparent)}'
  +'.gl-li.on{background:color-mix(in srgb,var(--green,#00e676) 12%,transparent);border-color:color-mix(in srgb,var(--green,#00e676) 42%,transparent)}'
  +'.gl-li-flag{font-size:1.05rem;line-height:1}'
  +'.gl-li-dot{width:6px;height:6px;border-radius:50%;background:var(--green,#00e676);margin-left:auto;opacity:0;transition:opacity .16s}'
  +'.gl-li.on .gl-li-dot{opacity:1}'
  /* card do destino */
  +'.gl-card{display:none;flex-direction:column;flex:1}'
  +'.gl-card.on{display:flex}'
  +'.gl-back{background:none;border:none;color:var(--muted,#8b8ba7);font-size:.8rem;cursor:pointer;padding:0;margin-bottom:14px;'
    +'text-align:left;font-family:inherit;transition:color .2s}'
  +'.gl-back:hover{color:var(--text,#f0eeff)}'
  +'.gl-card-img{width:100%;height:150px;border-radius:14px;background:var(--card,#1a1a26) center/cover no-repeat;margin-bottom:14px;flex-shrink:0}'
  +'.gl-card-name{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff);display:flex;align-items:center;gap:8px}'
  +'.gl-card-d{font-size:.85rem;color:var(--muted,#8b8ba7);line-height:1.65;margin-top:8px}'
  +'.gl-card-cta{margin-top:auto;padding-top:18px}'
  +'.gl-btn{display:block;text-align:center;background:var(--purple,#7c3fff);color:#fff;padding:12px 20px;border-radius:50px;'
    +'font-size:.88rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;width:100%;font-family:inherit;'
    +'transition:background .2s,transform .15s}'
  +'.gl-btn:hover{background:var(--purple-light,#9d6fff);transform:translateY(-1px)}'
  /* mobile: globo em cima, painel embaixo */
  +'@media(max-width:820px){'
    +'.gl-modal{flex-direction:column;height:min(640px, calc(100vh - 40px))}'
    +'.gl-stage{flex:0 0 46%}'
    +'.gl-panel{width:auto;border-left:none;border-top:1px solid var(--border,#2a2a3a);flex:1;padding:20px 18px}'
    +'.gl-card-img{height:110px}'
  +'}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ── HTML ── */
  var host=document.createElement('div');
  host.innerHTML=''
  +'<div class="gl-overlay" id="globeOverlay"></div>'
  +'<div class="gl-modal" id="globeModal" role="dialog" aria-modal="true" aria-label="Destinos OND">'
    +'<button class="gl-close" aria-label="Fechar">✕</button>'
    +'<div class="gl-stage"><canvas class="gl-canvas" id="globeCanvas"></canvas>'
      +'<p class="gl-hint">Arraste pra girar · clique num destino</p></div>'
    +'<aside class="gl-panel">'
      +'<div class="gl-home" id="glHome">'
        +'<span class="gl-kicker">Destinos OND</span>'
        +'<h3 class="gl-title">'+DEST.length+' destinos no globo</h3>'
        +'<p class="gl-sub">Clique num ponto verde — ou escolha aqui que o globo gira até ele.</p>'
        +'<ul class="gl-list" id="glList"></ul>'
      +'</div>'
      +'<div class="gl-card" id="glCard">'
        +'<button class="gl-back" id="glBack">← Todos os destinos</button>'
        +'<div class="gl-card-img" id="glImg"></div>'
        +'<h3 class="gl-card-name" id="glName"></h3>'
        +'<p class="gl-card-d" id="glD"></p>'
        +'<div class="gl-card-cta"><a class="gl-btn" id="glCta"></a></div>'
      +'</div>'
    +'</aside>'
  +'</div>';
  document.body.appendChild(host);

  var ov=document.getElementById('globeOverlay'), md=document.getElementById('globeModal');
  var cv=document.getElementById('globeCanvas'), ctx=cv.getContext('2d');
  var elHome=document.getElementById('glHome'), elCard=document.getElementById('glCard');
  var elImg=document.getElementById('glImg'), elName=document.getElementById('glName');
  var elD=document.getElementById('glD'), elCta=document.getElementById('glCta');
  var elList=document.getElementById('glList');

  /* lista lateral */
  DEST.forEach(function(d,i){
    var li=document.createElement('li');
    li.innerHTML='<button class="gl-li" data-i="'+i+'"><span class="gl-li-flag">'+d.f+'</span><span>'+d.n+'</span><span class="gl-li-dot"></span></button>';
    elList.appendChild(li);
  });
  elList.addEventListener('click',function(e){
    var b=e.target.closest('.gl-li'); if(b) select(+b.dataset.i);
  });
  document.getElementById('glBack').addEventListener('click',function(){ select(-1) });
  md.querySelector('.gl-close').addEventListener('click',function(){ closeGlobe() });
  ov.addEventListener('click',function(){ closeGlobe() });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&isOpen) closeGlobe() });

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
    return out; // flat [x,y,z, x,y,z, ...]
  }

  /* destinos -> vetores */
  DEST.forEach(function(d){
    var la=d.lat*RAD, lo=d.lon*RAD, cl=Math.cos(la);
    d.v=[cl*Math.sin(lo), Math.sin(la), cl*Math.cos(lo)];
  });

  /* ── estado ── */
  /* vista inicial sobre o Atlântico (~45°O, 3°S): abre mostrando as Américas e a
     Europa, que é onde estão 8 dos 9 destinos. yaw=-lon, pitch=lat centralizam um ponto. */
  var yaw=0.79, pitch=-0.05, vyaw=0, isOpen=false, raf=0, sel=-1, hover=-1;
  var drag=false, lastX=0, lastY=0, moved=0, fly=null, t0=0;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPIN=reduce?0:0.0022;
  var hit=[]; // posições de tela dos pins visíveis

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

    /* animação de voo até um destino */
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

    /* atmosfera + corpo da esfera */
    var g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.05,cx,cy,R);
    g.addColorStop(0,'rgba(124,63,255,.22)'); g.addColorStop(.65,'rgba(124,63,255,.06)'); g.addColorStop(1,'rgba(10,10,18,.30)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R+0.5,0,TAU);
    ctx.strokeStyle='rgba(124,63,255,.30)'; ctx.lineWidth=1; ctx.stroke();

    var cyw=Math.cos(yaw), syw=Math.sin(yaw), cpt=Math.cos(pitch), spt=Math.sin(pitch);

    /* pontos de terra, agrupados por profundidade (poucos fills = rápido) */
    var B=5, buckets=[[],[],[],[],[]];
    for(var i=0;i<PTS.length;i+=3){
      var px=PTS[i], py=PTS[i+1], pz=PTS[i+2];
      var x=px*cyw+pz*syw, z1=-px*syw+pz*cyw;
      var y=py*cpt-z1*spt, z=py*spt+z1*cpt;
      if(z<=0.02) continue;                     // só o hemisfério da frente
      buckets[Math.min(B-1,(z*B)|0)].push(cx+x*R, cy-y*R);
    }
    for(var b=0;b<B;b++){
      var arr=buckets[b]; if(!arr.length) continue;
      var d=(b+0.5)/B;
      ctx.globalAlpha=0.18+0.72*d;
      ctx.fillStyle='#7c3fff';
      var r=0.9+d*1.0;
      ctx.beginPath();
      for(var k2=0;k2<arr.length;k2+=2){ ctx.moveTo(arr[k2]+r,arr[k2+1]); ctx.arc(arr[k2],arr[k2+1],r,0,TAU) }
      ctx.fill();
    }
    ctx.globalAlpha=1;

    /* pins dos destinos */
    hit.length=0;
    var pulse=(Math.sin((ts-t0)/460)+1)/2;
    for(var n=0;n<DEST.length;n++){
      var v=DEST[n].v;
      var x2=v[0]*cyw+v[2]*syw, z2=-v[0]*syw+v[2]*cyw;
      var y2=v[1]*cpt-z2*spt, z3=v[1]*spt+z2*cpt;
      if(z3<=0.04) continue;
      var sx=cx+x2*R, sy=cy-y2*R;
      hit.push(sx,sy,n);
      var on=(n===sel), hv=(n===hover);
      var a=0.35+0.65*z3;
      /* halo pulsante */
      ctx.globalAlpha=a*(on?0.5:0.28)*(0.45+0.55*pulse);
      ctx.beginPath(); ctx.arc(sx,sy,(on?9:6)+pulse*(on?5:3),0,TAU);
      ctx.fillStyle='#00e676'; ctx.fill();
      /* ponto */
      ctx.globalAlpha=a;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.6,0,TAU);
      ctx.fillStyle=on?'#00e676':'#00e676'; ctx.fill();
      ctx.globalAlpha=a*0.9;
      ctx.beginPath(); ctx.arc(sx,sy,on?5:3.6,0,TAU);
      ctx.strokeStyle='rgba(13,13,20,.85)'; ctx.lineWidth=1.2; ctx.stroke();
      /* rótulo */
      if(z3>0.25||on){
        ctx.globalAlpha=(on||hv)?Math.min(1,a+0.25):a*0.62;
        ctx.font=(on?'700 ':'600 ')+'11px Onest, system-ui, sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.lineWidth=3; ctx.strokeStyle='rgba(13,13,20,.9)';
        ctx.strokeText(DEST[n].n, sx, sy-9);
        ctx.fillStyle=(on||hv)?'#00e676':'#f0eeff';
        ctx.fillText(DEST[n].n, sx, sy-9);
      }
    }
    ctx.globalAlpha=1;
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
    cv.setPointerCapture(e.pointerId); cv.classList.add('grabbing');
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
    if(moved<5){ var p=pick(e); select(p) }   // clique curto = seleção
  });
  cv.addEventListener('pointercancel',function(){ drag=false; cv.classList.remove('grabbing') });

  function select(i){
    sel=i;
    [].forEach.call(elList.querySelectorAll('.gl-li'),function(b){ b.classList.toggle('on', +b.dataset.i===i) });
    if(i<0){ elCard.classList.remove('on'); elHome.style.display=''; return }
    var d=DEST[i];
    elHome.style.display='none'; elCard.classList.add('on');
    elImg.style.backgroundImage="url('"+d.img+"')";
    elName.innerHTML='<span>'+d.f+'</span><span>'+d.n+'</span>';
    elD.textContent=d.d;
    if(d.href){ elCta.textContent=d.cta||'Ver roteiro'; elCta.href=d.href; elCta.onclick=null }
    else{ elCta.textContent='Montar no app'; elCta.href='#app';
          elCta.onclick=function(ev){ ev.preventDefault(); if(window.openApp) openApp(ev); else location.href='/links.html' } }
    /* gira até o destino: yaw=-lon, pitch=lat centraliza o ponto */
    var ty=-d.lon*RAD, tp=d.lat*RAD;
    var dy=((ty-yaw)%TAU+TAU+Math.PI)%TAU-Math.PI;   // caminho mais curto
    fly={t:performance.now(), y0:yaw, dy:dy, p0:pitch, dp:tp-pitch};
  }

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
    if(raf){ cancelAnimationFrame(raf); raf=0 }   // não queima CPU fechado
  };
})();
