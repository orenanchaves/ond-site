/* roteiro-sim.js — simulação do OND vAI montando o roteiro do post (fiel ao app).
   Uso: definir window.RSIM = {...} e ter <div id="roteiro-sim"></div>.
   Depende de app-modal.js (openApp) — já incluído nos posts. */
(function(){
  var cfg = window.RSIM, mount = document.getElementById('roteiro-sim');
  if(!cfg || !mount || window.__rsimDone) return; window.__rsimDone = true;
  var IMG='https://images.unsplash.com/';
  function esc(s){var d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML;}

  /* ---- CSS (escopado em #roteiro-sim) ---- */
  var css = ''
  + '#roteiro-sim{display:flex;flex-direction:column;align-items:center;gap:22px;margin:8px 0 6px}'
  + '#roteiro-sim .phone{position:relative;width:300px;background:#0b0b12;border:9px solid #23232f;border-radius:42px;box-shadow:0 30px 70px rgba(0,0,0,.5);overflow:hidden}'
  + '#roteiro-sim .rscreen{position:relative;background:#f4f1fb;height:560px;overflow:hidden;display:flex;flex-direction:column}'
  + '#roteiro-sim .rot-banner{position:relative;height:104px;background:#3a1078 center/cover;flex:none}'
  + '#roteiro-sim .rot-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,6,46,.4),rgba(20,6,46,0) 60%)}'
  + '#roteiro-sim .rot-ava{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);width:52px;height:52px;border-radius:50%;background:#efe9fb;overflow:hidden;box-shadow:0 0 0 4px #f4f1fb,0 3px 10px rgba(46,10,94,.22);z-index:2}'
  + '#roteiro-sim .rot-ava img{position:absolute;left:-129px;top:-13px;width:260px;height:auto;max-width:none}'
  + '#roteiro-sim .rscroll{flex:1;overflow-y:auto;padding:30px 0 12px;scrollbar-width:none}'
  + '#roteiro-sim .rscroll::-webkit-scrollbar{display:none}'
  + '#roteiro-sim .rot-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:0 13px 2px;margin-bottom:12px}'
  + '#roteiro-sim .rot-tabs::-webkit-scrollbar{display:none}'
  + '#roteiro-sim .ttab{flex:none;padding:7px 11px;border-radius:11px;font-weight:600;font-size:11px;background:#ece8f5;color:#3a3550;white-space:nowrap;border:none;font-family:inherit;cursor:pointer}'
  + '#roteiro-sim .ttab.active{background:#f0a818;color:#3a1a00}'
  + '#roteiro-sim .ttab.loc{background:#ddd6ea;color:#2a2238;font-weight:700}'
  + '#roteiro-sim .rmeta{font-size:11px;color:#6b6680;font-weight:600;margin:-2px 13px 12px}#roteiro-sim .rmeta b{color:#4e1a9e}'
  + '#roteiro-sim .rpane{display:none}#roteiro-sim .rpane.on{display:block}'
  + '#roteiro-sim .gday{background:#fff;border:1px solid #ece6f7;border-radius:13px;margin:0 13px 10px;box-shadow:0 6px 20px rgba(46,10,94,.08);overflow:hidden}'
  + '#roteiro-sim .gday-head{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:12px 13px;text-align:left;font-size:12.5px;color:#2a2438;background:none;border:none;cursor:pointer;font-family:inherit;line-height:1.3}'
  + '#roteiro-sim .gday-head b{color:#4e1a9e;margin-right:5px}'
  + '#roteiro-sim .gday-ar{color:#7b2ff2;transition:transform .25s;font-size:11px;flex:none}#roteiro-sim .gday.open .gday-ar{transform:rotate(180deg)}'
  + '#roteiro-sim .gday-body{max-height:0;overflow:hidden;transition:max-height .4s ease}#roteiro-sim .gday.open .gday-body{max-height:180px}'
  + '#roteiro-sim .ga-row{display:flex;align-items:stretch;gap:5px;overflow-x:auto;scrollbar-width:none;padding:2px 13px 14px}#roteiro-sim .ga-row::-webkit-scrollbar{display:none}'
  + '#roteiro-sim .ga-arrow{align-self:center;color:#7b2ff2;font-weight:700;flex:none;font-size:12px}'
  + '#roteiro-sim .ga-card{position:relative;flex:0 0 150px;display:flex;align-items:center;gap:8px;background:#faf8ff;border:1px solid #eee6fb;border-left:5px solid #00c853;border-radius:11px;padding:8px;min-height:64px}'
  + '#roteiro-sim .ga-num{position:absolute;top:-7px;left:-4px;width:19px;height:19px;border-radius:50%;background:#00c853;color:#063a16;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:1}'
  + '#roteiro-sim .ga-t{font-weight:700;font-size:11px;color:#2a2438;line-height:1.2}'
  + '#roteiro-sim .ga-time{font-size:9.5px;color:#7b2ff2;font-weight:600;margin-top:3px}#roteiro-sim .ga-star{color:#e8a200;font-weight:700}'
  + '#roteiro-sim .ga-thumb{width:40px;height:40px;border-radius:8px;background:#c9b8e8 center/cover;flex:none}#roteiro-sim .ga-audio{position:absolute;right:6px;bottom:5px;font-size:10px}'
  + '#roteiro-sim .day-chips{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:0 13px 12px}#roteiro-sim .day-chips::-webkit-scrollbar{display:none}'
  + '#roteiro-sim .dchip{flex:none;padding:7px 12px;border-radius:16px;font-weight:600;font-size:11px;background:#ece8f5;color:#3a3550;white-space:nowrap;border:none;font-family:inherit;cursor:pointer}#roteiro-sim .dchip.active{background:#f0a818;color:#3a1a00}'
  + '#roteiro-sim .det-row{display:flex;align-items:stretch;gap:6px;overflow-x:auto;scrollbar-width:none;padding:6px 13px 14px}#roteiro-sim .det-row::-webkit-scrollbar{display:none}'
  + '#roteiro-sim .dt-card{position:relative;flex:0 0 188px;background:#fff;border:1px solid #ece6f7;border-left:5px solid #00c853;border-radius:13px;padding:12px;box-shadow:0 6px 20px rgba(46,10,94,.08)}'
  + '#roteiro-sim .dt-num{position:absolute;top:-7px;left:-4px;width:20px;height:20px;border-radius:50%;background:#00c853;color:#063a16;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:1}'
  + '#roteiro-sim .dt-title{font-weight:700;font-size:12.5px;color:#2a2438;text-align:center;line-height:1.25}#roteiro-sim .dt-meta{font-size:11px;color:#7b2ff2;font-weight:700;text-align:center;margin:3px 0 9px}'
  + '#roteiro-sim .dt-img{height:94px;border-radius:9px;background:#c9b8e8 center/cover;margin-bottom:9px}'
  + '#roteiro-sim .comochegar{background:linear-gradient(180deg,#6a1fd0,#5b16c9);border-radius:10px;padding:7px;text-align:center}#roteiro-sim .comochegar>span{color:#fff;font-weight:700;font-size:11px}'
  + '#roteiro-sim .comochegar .modes{display:flex;justify-content:center;gap:12px;margin-top:5px}#roteiro-sim .comochegar .modes span{background:rgba(255,255,255,.18);width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}'
  + '#roteiro-sim .dt-audio{position:absolute;right:9px;bottom:9px;font-size:12px}'
  + '#roteiro-sim .date-banner{background:#7b2ff2;color:#fff;font-weight:800;border-radius:12px;padding:12px;text-align:center;margin:0 13px 12px;font-size:12.5px}'
  + '#roteiro-sim .vg-block{background:#fff;border:1px solid #ece6f7;border-radius:13px;padding:14px;margin:0 13px 10px;box-shadow:0 6px 20px rgba(46,10,94,.06)}#roteiro-sim .vg-block h4{color:#4e1a9e;font-size:12.5px;margin-bottom:10px}'
  + '#roteiro-sim .vg-two{display:flex;gap:9px}#roteiro-sim .vg-card{flex:1;background:#f6f3fc;border-radius:10px;padding:10px;min-width:0}'
  + '#roteiro-sim .vg-card .vg-k{font-size:10px;color:#8a86a0;font-weight:600;display:block}#roteiro-sim .vg-card b{font-size:12px;color:#2a2438;display:block;margin:2px 0}#roteiro-sim .vg-card>span{font-size:10.5px;color:#8a86a0}'
  + '#roteiro-sim .vg-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}#roteiro-sim .vg-head h4{margin:0}#roteiro-sim .vg-count{background:#2a0b54;color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:9px}'
  + '#roteiro-sim .chk{display:flex;align-items:center;gap:9px;font-size:11.5px;color:#33304a;padding:6px 0}#roteiro-sim .chk input{width:15px;height:15px;accent-color:#7b2ff2;flex:none}'
  + '#roteiro-sim .fin-audio{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #ece6f7;border-radius:12px;padding:10px 13px;margin:0 13px 11px;box-shadow:0 6px 20px rgba(46,10,94,.06)}'
  + '#roteiro-sim .fin-play{width:33px;height:33px;border-radius:50%;background:#1b8a3f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex:none}#roteiro-sim .fin-audio b{display:block;font-size:11.5px;color:#4e1a9e}#roteiro-sim .fin-audio span{font-size:10px;color:#8a86a0}'
  + '#roteiro-sim .fin-toggle{display:flex;border-bottom:2px solid #e6e0f2;margin:0 13px 12px}#roteiro-sim .fin-t{flex:1;padding:8px;font-weight:700;font-size:11.5px;color:#8a86a0;border:none;background:none;border-bottom:3px solid transparent;margin-bottom:-2px;font-family:inherit;cursor:pointer}#roteiro-sim .fin-t.active{color:#1b8a3f;border-color:#1b8a3f}'
  + '#roteiro-sim .fin-total{background:linear-gradient(120deg,#7b2ff2,#5e17c7);border-radius:13px;padding:14px 15px;color:#fff;margin:0 13px 10px}#roteiro-sim .fin-total span{font-size:11.5px;opacity:.85}#roteiro-sim .fin-total b{display:block;font-size:22px;margin-top:2px}'
  + '#roteiro-sim .fin-card{background:#fff;border:1px solid #ece6f7;border-radius:12px;padding:12px 14px;margin:0 13px 10px;box-shadow:0 6px 20px rgba(46,10,94,.06)}#roteiro-sim .fin-row{display:flex;justify-content:space-between;font-size:11.5px;color:#33304a;margin-bottom:8px}'
  + '#roteiro-sim .fin-bar{height:8px;background:#e9e3f6;border-radius:6px;overflow:hidden}#roteiro-sim .fin-bar i{display:block;height:100%;background:#00c853;border-radius:6px}'
  + '#roteiro-sim .fin-day{display:flex;align-items:center;justify-content:space-between;background:#e8f7ee;border-radius:11px;padding:11px 14px;margin:0 13px 11px;font-size:11.5px;color:#1b5e20;font-weight:700}#roteiro-sim .fin-day b{font-size:14px}'
  + '#roteiro-sim .fin-list{background:#fff;border:1px solid #ece6f7;border-radius:12px;overflow:hidden;margin:0 13px;box-shadow:0 6px 20px rgba(46,10,94,.06)}#roteiro-sim .fin-li{display:flex;justify-content:space-between;padding:11px 14px;font-size:12px;color:#33304a;border-top:1px solid #f1edf8}#roteiro-sim .fin-li:first-child{border-top:none}#roteiro-sim .fin-li b{color:#4e1a9e}'
  + '#roteiro-sim .rfoot{padding:9px 13px 11px;border-top:1px solid #ece6f7;background:#fff;flex:none;font-size:11px;color:#6b6680}'
  + '#roteiro-sim .rfoot .g{color:#1b5e20;font-weight:700}'
  /* intro "montando" */
  + '#roteiro-sim .rgen{position:absolute;inset:0;background:#f4f1fb;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:5;transition:opacity .4s}'
  + '#roteiro-sim .rgen.hide{opacity:0;pointer-events:none}'
  + '#roteiro-sim .rgen-star{position:relative;width:66px;height:66px;display:flex;align-items:center;justify-content:center}'
  + '#roteiro-sim .rgen-star::before{content:"";position:absolute;inset:0;border-radius:50%;border:3px solid #e6dcfb;border-top-color:#7b2ff2;animation:rgen-spin .9s linear infinite}'
  + '#roteiro-sim .rgen-star svg{width:32px;height:32px;animation:rgen-pulse 1.1s ease-in-out infinite}'
  + '@keyframes rgen-spin{to{transform:rotate(360deg)}}@keyframes rgen-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}'
  + '#roteiro-sim .rgen-t{font-size:14px;font-weight:800;color:#4e1a9e}#roteiro-sim .rgen-play{background:#7b2ff2;color:#fff;border:none;border-radius:22px;padding:11px 20px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px rgba(124,63,255,.32)}'
  /* CTA */
  + '#roteiro-sim .rcta{text-align:center;max-width:420px}'
  + '#roteiro-sim .rcta p{font-size:.95rem;color:var(--muted,#9a97b5);margin:0 0 14px;line-height:1.6}'
  + '#roteiro-sim .rcta-btn{display:inline-flex;align-items:center;gap:8px;background:#7b2ff2;color:#fff;border:none;border-radius:50px;padding:14px 26px;font-size:1rem;font-weight:800;cursor:pointer;font-family:inherit;text-decoration:none;box-shadow:0 6px 24px rgba(124,63,255,.4)}'
  + '#roteiro-sim .rcta-btn:hover{background:#6a1fd0}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---- símbolo OND ---- */
  var SYM='<svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path fill="#7F11F4" d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>';

  /* ---- HTML do telefone ---- */
  mount.innerHTML =
    '<div class="phone"><div class="rscreen">'
    + '<div class="rot-banner" style="background-image:url(\''+esc(cfg.banner)+'\')"><div class="rot-ava"><img src="/assets/ondino.png" alt="Ondino"></div></div>'
    + '<div class="rscroll">'
    +   '<div class="rot-tabs" id="rs-tabs">'
    +     '<span class="ttab loc">'+esc(cfg.flag)+' '+esc(cfg.dest)+'</span>'
    +     '<button class="ttab active" type="button" data-tab="geral">Visão geral</button>'
    +     '<button class="ttab" type="button" data-tab="det">Dia a dia</button>'
    +     '<button class="ttab" type="button" data-tab="viagem">✈️ Viagem</button>'
    +     '<button class="ttab" type="button" data-tab="fin">＄ Financeiro</button>'
    +   '</div>'
    +   '<div class="rmeta" id="rs-meta"></div>'
    +   '<div class="rpane on" id="rs-geral"></div>'
    +   '<div class="rpane" id="rs-det"><div class="day-chips" id="rs-chips"></div><div id="rs-detcards"></div></div>'
    +   '<div class="rpane" id="rs-viagem"></div>'
    +   '<div class="rpane" id="rs-fin"></div>'
    + '</div>'
    + '<div class="rfoot">✨ Montado pelo <b style="color:#7b2ff2">OND vAI</b> · <span class="g">PDF ✓</span> · '+cfg.days.length+' dias</div>'
    + '<div class="rgen" id="rs-gen"><div class="rgen-star">'+SYM+'</div><div class="rgen-t">Montar meu roteiro</div><button class="rgen-play" id="rs-play" type="button">▶ Gerar com o OND vAI</button></div>'
    + '</div></div>'
    + '<div class="rcta"><p>Esse roteiro foi montado em segundos. No app você ajusta, salva em PDF e leva tudo na mão.</p>'
    + '<button class="rcta-btn" type="button" onclick="if(window.openApp){openApp(event)}">📲 Baixar o app grátis</button></div>';

  /* ---- render ---- */
  var el=function(i){return document.getElementById(i);};
  var geralEl=el('rs-geral'), chipsEl=el('rs-chips'), detEl=el('rs-detcards'),
      viagemEl=el('rs-viagem'), finEl=el('rs-fin'), metaEl=el('rs-meta'), tabsEl=el('rs-tabs');
  metaEl.innerHTML='<b>'+esc(cfg.dest)+' '+esc(cfg.flag)+'</b> · '+esc(cfg.meta);

  function actCard(a,n){
    var thumb=a.img?'<div class="ga-thumb" style="background-image:url(\''+IMG+a.img+'?w=120&q=60&auto=format\')"></div>':'';
    var star=a.rate?' <span class="ga-star">★ '+a.rate+'</span>':'';
    var audio=a.img?'<span class="ga-audio">🎧</span>':'';
    return '<div class="ga-card">'+thumb+'<div class="ga-num">'+n+'</div><div><div class="ga-t">'+esc(a.t)+'</div><div class="ga-time">'+esc(a.time)+star+'</div></div>'+audio+'</div>';
  }
  geralEl.innerHTML=cfg.days.map(function(day,i){
    var row=day.acts.map(function(a,k){return actCard(a,k+1);}).join('<span class="ga-arrow">→</span>');
    return '<div class="gday'+(i===0?' open':'')+'"><button class="gday-head" type="button"><span><b>Dia '+(i+1)+'</b> · '+esc(day.title)+'</span><span class="gday-ar">▾</span></button><div class="gday-body"><div class="ga-row">'+row+'</div></div></div>';
  }).join('');
  geralEl.addEventListener('click',function(e){var h=e.target.closest('.gday-head');if(!h)return;h.parentElement.classList.toggle('open');});

  function detCard(a,n){
    var img=a.img?'<div class="dt-img" style="background-image:url(\''+IMG+a.img+'?w=280&q=60&auto=format\')"></div>':'';
    var star=a.rate?' <span class="ga-star">★ '+a.rate+'</span>':'';
    var chegar=a.img?'<div class="comochegar"><span>Como chegar</span><div class="modes"><span>🚌</span><span>🚗</span><span>🚶</span></div></div>':'';
    var audio=a.img?'<span class="dt-audio">🎧</span>':'';
    return '<div class="dt-card"><div class="dt-num">'+n+'</div><div class="dt-title">'+esc(a.t)+'</div><div class="dt-meta">'+esc(a.time)+star+'</div>'+img+chegar+audio+'</div>';
  }
  function selDay(i){
    [].forEach.call(chipsEl.children,function(c,k){c.classList.toggle('active',k===i);});
    detEl.innerHTML='<div class="det-row">'+cfg.days[i].acts.map(function(a,k){return detCard(a,k+1);}).join('<span class="ga-arrow">→</span>')+'</div>';
  }
  chipsEl.innerHTML=cfg.days.map(function(d,i){return '<button class="dchip'+(i===0?' active':'')+'" type="button" data-i="'+i+'">Dia '+(i+1)+'</button>';}).join('');
  chipsEl.addEventListener('click',function(e){var b=e.target.closest('.dchip');if(!b)return;selDay(+b.getAttribute('data-i'));});
  selDay(0);

  var chk=['Documento (passaporte/RG)','Reservas e ingressos','Seguro viagem','Chip / eSIM','Dinheiro local','Protetor solar'];
  viagemEl.innerHTML=
    '<div class="date-banner">'+esc(cfg.meta)+'</div>'+
    '<div class="vg-block"><h4>Voos</h4><div class="vg-two">'+
      '<div class="vg-card"><span class="vg-k">Ida</span><b>✈️ '+esc(cfg.air[0])+'</b><span>sugerido</span></div>'+
      '<div class="vg-card"><span class="vg-k">Volta</span><b>✈️ '+esc(cfg.air[1])+'</b><span>+ '+cfg.days.length+' dias</span></div>'+
    '</div></div>'+
    '<div class="vg-block"><h4>Hospedagem</h4><div class="vg-card" style="background:#faf8ff"><span class="vg-k">Sugestão do OND vAI</span><b>🏨 '+esc(cfg.hotel)+'</b><span>'+(cfg.days.length-1)+' noites</span></div></div>'+
    '<div class="vg-block"><div class="vg-head"><h4>Checklist</h4><span class="vg-count">0/'+chk.length+'</span></div>'+
      chk.map(function(c){return '<label class="chk"><input type="checkbox">'+c+'</label>';}).join('')+'</div>';

  var f=cfg.fin;
  finEl.innerHTML=
    '<div class="fin-audio"><span class="fin-play">▶</span><div><b>Ouvir dicas de orçamento</b><span>Gerado pelo OND vAI</span></div></div>'+
    '<div class="fin-toggle"><button class="fin-t active" type="button">Estimado</button><button class="fin-t" type="button">Real</button></div>'+
    '<div class="fin-total"><span>Total estimado</span><b>'+esc(f.total)+'</b></div>'+
    '<div class="fin-card"><div class="fin-row"><span>Gasto até agora</span><span>R$ 0 de '+esc(f.total)+'</span></div><div class="fin-bar"><i style="width:2%"></i></div></div>'+
    '<div class="fin-day"><span>📅 Gasto diário sugerido</span><b>'+esc(f.dia)+'</b></div>'+
    '<div class="fin-list">'+f.itens.map(function(it){return '<div class="fin-li"><span>'+esc(it[0])+'</span><b>'+esc(it[1])+'</b></div>';}).join('')+'</div>';
  finEl.addEventListener('click',function(e){var b=e.target.closest('.fin-t');if(!b)return;[].forEach.call(finEl.querySelectorAll('.fin-t'),function(x){x.classList.remove('active');});b.classList.add('active');});

  /* abas */
  tabsEl.addEventListener('click',function(e){
    var b=e.target.closest('.ttab[data-tab]'); if(!b) return;
    var t=b.getAttribute('data-tab');
    ['geral','det','viagem','fin'].forEach(function(x){el('rs-'+x).classList.toggle('on',x===t);});
    [].forEach.call(tabsEl.querySelectorAll('.ttab[data-tab]'),function(x){x.classList.toggle('active',x.getAttribute('data-tab')===t);});
  });

  /* intro "montando" -> revela */
  var gen=el('rs-gen'), played=false;
  function reveal(){ if(played) return; played=true;
    var t=gen.querySelector('.rgen-t'); t.textContent='Montando seu roteiro…';
    setTimeout(function(){ gen.classList.add('hide'); },1400);
  }
  el('rs-play').addEventListener('click',reveal);
  try{ var io=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting) reveal(); });},{threshold:.2}); io.observe(mount); }catch(e){ reveal(); }
  setTimeout(reveal, 4000);
})();
