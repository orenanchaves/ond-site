/* OND vAI no topo do site: réplica da conversa do app web, com o painel "Sua viagem".
   Simulação roteirizada (sem IA): reconhece os 30 destinos de assets/vai-destinos.js,
   pergunta quando, quem vai e de onde sai, monta a viagem no painel e fecha no WhatsApp
   da agência com a viagem inteira escrita (serve de briefing pra página de proposta).
   Destino fora da lista vai direto pro WhatsApp. Uso: <div id="vaiHero"></div> + os dois scripts. */
(function(){
  var root=document.getElementById('vaiHero');
  if(!root||!window.OND_VAI_DESTINOS) return;
  var NUM='5511910214133';
  var DEST=window.OND_VAI_DESTINOS;
  var SYMBOL='<svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>';
  var I={
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.25.7-1.44 1.33-2.01 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93-4.29-5.08-4.49-.14-.2-1.21-1.61-1.21-3.08s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37h.57c.18.01.43-.07.67.51.25.6.84 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.28 1.66 2.07 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.64-.07.17-.2.74-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.71-.17 1.41z"/></svg>'
  };
  var SUGS=[['BRA','Réveillon no Rio de Janeiro'],['BRA','Fim de semana em Gramado'],['USA','Família pra Orlando em julho'],['MDV','Lua de mel nas Maldivas'],['ARG','Primeira viagem: Buenos Aires'],['FRA','5 dias em Paris']];

  var css=''
  +'.vh2{--v-bg:#f6f2fd;--v-side:#eee5fb;--v-deep:#3b0a78;--v-p:#7f11f4;--v-txt:#2a2438;--v-mut:#6b6480;--v-line:#e1d8f4;'
    +'display:grid;grid-template-columns:340px 1fr;height:clamp(640px,82vh,820px);background:var(--v-bg);border:1px solid var(--v-line);border-radius:26px;overflow:hidden;color:var(--v-txt);box-shadow:0 30px 80px rgba(46,10,94,.18);text-align:left}'
  +'.vh2 *{box-sizing:border-box}'
  +'.vh2-side{background:var(--v-side);border-right:1px solid var(--v-line);display:flex;flex-direction:column;min-height:0}'
  +'.vh2-sh{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--v-line)}'
  +'.vh2-sh b{color:var(--v-deep);font-size:1rem}'
  +'.vh2-ib{width:34px;height:34px;border-radius:10px;border:none;background:transparent;color:var(--v-p);display:flex;align-items:center;justify-content:center;cursor:pointer}'
  +'.vh2-ib:hover{background:rgba(127,17,244,.1)}.vh2-ib svg{width:19px;height:19px}'
  +'.vh2-sb{flex:1;overflow-y:auto;min-height:0}'
  +'.vh2-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--v-mut);font-size:.9rem;line-height:1.5}'
  +'.vh2-empty svg{width:34px;height:34px;color:#a87bf0;margin-bottom:12px}'
  +'.vt2-ban{position:relative;height:150px;background:#ddd center/cover no-repeat}'
  +'.vt2-ban::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(20,6,50,.75),rgba(20,6,50,0) 60%)}'
  +'.vt2-ban div{position:absolute;left:16px;right:16px;bottom:12px;z-index:1;color:#fff}'
  +'.vt2-ban small{font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.85}'
  +'.vt2-ban h3{font-size:1.35rem;font-weight:800;letter-spacing:-.02em;margin:2px 0 0;color:#fff}'
  +'.vt2-in{padding:14px 16px 20px}'
  +'.vt2-meta{display:grid;gap:7px;margin-bottom:14px}'
  +'.vt2-meta div{display:flex;gap:9px;align-items:flex-start;font-size:.85rem;line-height:1.35}'
  +'.vt2-meta svg{width:16px;height:16px;color:var(--v-p);flex-shrink:0;margin-top:1px}'
  +'.vt2-meta i{font-style:normal;color:#b3a9c7}'
  +'.vt2-h{font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--v-mut);margin:14px 0 8px}'
  +'.vt2-day{background:#fff;border:1px solid var(--v-line);border-radius:12px;padding:9px 12px;margin-bottom:7px;animation:vh2in .35s ease both}'
  +'.vt2-day b{display:block;font-size:.72rem;color:var(--v-p);letter-spacing:.03em}'
  +'.vt2-day span{font-size:.88rem;font-weight:600}'
  +'.vt2-inc{display:flex;flex-wrap:wrap;gap:6px}'
  +'.vt2-inc span{font-size:.76rem;font-weight:700;background:#fff;border:1px solid var(--v-line);border-radius:50px;padding:4px 10px}'
  +'.vt2-preco{margin-top:14px;font-size:.84rem;color:var(--v-mut)}'
  +'.vt2-wa{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;background:#25D366;color:#062b14;border-radius:50px;padding:12px 14px;font-weight:800;text-decoration:none;font-size:.92rem}'
  +'.vt2-wa svg{width:18px;height:18px}.vt2-was{display:flex;flex-direction:column;gap:8px;margin-top:12px}.vt2-was .vt2-wa{margin-top:0}.vt2-wa2{background:#fff;color:#1a7f45;border:1.5px solid #25D366}.vh2-msg .vt2-was{flex-direction:row;flex-wrap:wrap}'
  +'.vh2-main{display:flex;flex-direction:column;min-width:0;min-height:0;position:relative}'
  +'.vh2-welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}'
  +'.vh2-lab{font-size:.78rem;font-weight:800;letter-spacing:.14em;color:var(--v-p);margin-top:26px}'
  +'.vh2-tit{font-size:clamp(1.5rem,2.6vw,2.2rem);font-weight:800;color:var(--v-deep);letter-spacing:-.02em;margin:6px 0 6px;line-height:1.15}'
  +'.vh2-sub{font-size:.95rem;color:var(--v-mut);max-width:520px;line-height:1.5}'
  +'.vh2-disc{font-size:.74rem;color:#8d86a0;margin-top:8px}'
  +'.vh2-sl{font-size:.72rem;font-weight:800;letter-spacing:.08em;color:var(--v-mut);margin:24px 0 10px}'
  +'.vh2-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:640px}'
  +'.vh2-chip{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:.86rem;font-weight:600;color:#5b1fb0;background:#ece2fb;border:1px solid transparent;border-radius:50px;padding:8px 14px;cursor:pointer;transition:background .2s,border-color .2s}'
  +'.vh2-chip:hover{background:#e2d3fa;border-color:#c7a9f5}'
  +'.vh2-chip img{width:20px;height:14px;border-radius:2px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.08)}'
  /* orb 3D */
  +'.vh2-orb{position:relative;width:132px;height:132px;display:flex;align-items:center;justify-content:center;animation:vh2float 5s ease-in-out infinite}'
  +'.vh2-orb::before{content:"";position:absolute;inset:-34px;border-radius:50%;background:conic-gradient(from 0deg,rgba(127,17,244,0),rgba(157,111,255,.55),rgba(0,230,118,.25),rgba(127,17,244,0) 60%);filter:blur(14px);animation:vh2spin 7s linear infinite}'
  +'.vh2-orb::after{content:"";position:absolute;inset:-18px;border-radius:50%;border:1.5px solid rgba(127,17,244,.14);box-shadow:0 0 0 18px rgba(127,17,244,.05)}'
  +'.vh2-ball{position:relative;z-index:1;width:132px;height:132px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
    +'background:radial-gradient(circle at 30% 24%,#fff 0,#f0e3ff 5%,#c197ff 18%,#8b2cf5 48%,#5a0fbf 74%,#2c0766 100%);'
    +'box-shadow:inset -16px -20px 34px rgba(18,0,52,.55),inset 12px 14px 26px rgba(255,255,255,.28),0 26px 60px rgba(127,17,244,.5),0 0 0 1px rgba(255,255,255,.35)}'
  +'.vh2-ball::after{content:"";position:absolute;top:12%;left:20%;width:42%;height:26%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(255,255,255,.75),rgba(255,255,255,0) 70%);transform:rotate(-24deg)}'
  +'.vh2-ball svg{width:56px;height:56px;fill:#fff;filter:drop-shadow(0 4px 10px rgba(40,0,90,.45));position:relative;z-index:1}'
  +'@keyframes vh2float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'
  +'@keyframes vh2spin{to{transform:rotate(360deg)}}'
  +'@keyframes vh2in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
  +'.vh2-body[hidden]{display:none!important}.vh2-welcome>*{flex-shrink:0}'
  +'.vh2-body{flex:1;overflow-y:auto;padding:22px 26px 8px;display:flex;flex-direction:column;gap:10px;min-height:0}'
  +'.vh2-msg{max-width:78%;padding:11px 15px;border-radius:16px;font-size:.95rem;line-height:1.5;animation:vh2in .25s ease both}'
  +'.vh2-msg.ai{align-self:flex-start;background:#fff;border:1px solid var(--v-line);border-bottom-left-radius:5px;box-shadow:0 4px 14px rgba(46,10,94,.06)}'
  +'.vh2-msg.me{align-self:flex-end;background:var(--v-p);color:#fff;border-bottom-right-radius:5px}'
  +'.vh2-msg.typing{display:flex;gap:4px;padding:14px}'
  +'.vh2-msg.typing i{width:7px;height:7px;border-radius:50%;background:#b9a7e8;animation:vh2blink 1s infinite}'
  +'.vh2-msg.typing i:nth-child(2){animation-delay:.2s}.vh2-msg.typing i:nth-child(3){animation-delay:.4s}'
  +'@keyframes vh2blink{0%,100%{opacity:.35}50%{opacity:1}}'
  +'.vh2-msg .vt2-wa{display:inline-flex;padding:10px 16px}'
  +'.vh2-quick{display:flex;flex-wrap:wrap;gap:8px;padding:6px 26px 8px}'
  +'.vh2-q{font:inherit;font-size:.85rem;font-weight:600;color:var(--v-p);background:#fff;border:1.5px solid var(--v-p);border-radius:50px;padding:7px 14px;cursor:pointer}'
  +'.vh2-q:hover{background:#f1e8fd}'
  +'.vh2-dock{padding:10px 26px 20px}'
  +'.vh2-in{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--v-line);border-radius:30px;padding:6px 6px 6px 8px;box-shadow:0 8px 24px rgba(46,10,94,.08)}'
  +'.vh2-in:focus-within{border-color:#b98cf7;box-shadow:0 0 0 4px rgba(127,17,244,.12)}'
  +'.vh2-in input{flex:1;min-width:0;border:none;outline:none;background:transparent;font:inherit;font-size:1rem;color:var(--v-txt);padding:10px 12px}'
  +'.vh2-go{width:46px;height:46px;border-radius:50%;border:none;background:var(--v-p);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}'
  +'.vh2-go svg{width:20px;height:20px}'
  +'@media(max-width:900px){.vh2{grid-template-columns:1fr;height:auto}.vh2-side{order:2;border-right:none;border-top:1px solid var(--v-line)}.vh2-side.vazio{display:none}.vh2-main{height:min(640px,86vh)}.vh2-sb{max-height:none;overflow:visible}.vh2-welcome{padding:18px}.vh2-welcome{min-height:0;overflow-y:auto;padding:22px 14px 8px}.vh2-orb,.vh2-ball{width:84px;height:84px}.vh2-orb::after{inset:-12px}.vh2-ball svg{width:36px;height:36px}.vh2-lab{margin-top:18px}.vh2-sub{font-size:.9rem}.vh2-sl{margin:16px 0 8px}.vh2-chips{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;width:calc(100% + 28px);margin:0 -14px;padding:2px 14px 6px;scrollbar-width:none}.vh2-chip{flex:0 0 auto}.vh2-body,.vh2-quick{padding-left:16px;padding-right:16px}.vh2-dock{padding:8px 12px 14px}.vh2-msg{max-width:88%}}'
  +'@media(prefers-reduced-motion:reduce){.vh2-orb,.vh2-orb::before{animation:none}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  root.classList.add('vh2');
  root.innerHTML=''
  +'<aside class="vh2-side vazio" aria-label="Sua viagem">'
    +'<div class="vh2-sh"><b>Sua viagem</b><button type="button" class="vh2-ib" data-act="reset" aria-label="Recomeçar a conversa" title="Recomeçar">'+I.reset+'</button></div>'
    +'<div class="vh2-sb"><div class="vh2-empty">'+I.map+'Conforme a gente conversa, sua viagem vai aparecendo aqui.</div></div>'
  +'</aside>'
  +'<div class="vh2-main">'
    +'<div class="vh2-welcome">'
      +'<div class="vh2-orb"><div class="vh2-ball">'+SYMBOL+'</div></div>'
      +'<div class="vh2-lab">OND VAI</div>'
      +'<h2 class="vh2-tit">Oi! Pra onde você quer viajar?</h2>'
      +'<p class="vh2-sub">Conta o destino e eu simulo a viagem na hora. Depois a agência OND cota e compra tudo com você no WhatsApp.</p>'
      +'<p class="vh2-disc">Simulação do OND vAI. A cotação final é feita por uma pessoa da agência OND.</p>'
      +'<div class="vh2-sl">SUGESTÕES PRA COMEÇAR</div>'
      +'<div class="vh2-chips">'+SUGS.map(function(s){return '<button type="button" class="vh2-chip" data-sug="'+s[1]+'"><img src="/assets/flags/'+s[0]+'.svg" alt="" width="20" height="14" loading="lazy">'+s[1]+'</button>'}).join('')+'</div>'
    +'</div>'
    +'<div class="vh2-body" hidden aria-live="polite"></div>'
    +'<div class="vh2-quick"></div>'
    +'<form class="vh2-dock"><div class="vh2-in"><input type="text" autocomplete="off" placeholder="Escreva pra onde você quer ir" aria-label="Pra onde você quer ir?"><button class="vh2-go" type="submit" aria-label="Enviar">'+I.send+'</button></div></form>'
  +'</div>';

  var side=root.querySelector('.vh2-side'), sb=root.querySelector('.vh2-sb'), welcome=root.querySelector('.vh2-welcome'),
      body=root.querySelector('.vh2-body'), quick=root.querySelector('.vh2-quick'), form=root.querySelector('.vh2-dock'), input=form.querySelector('input');
  var st2={step:'dest', d:null, quando:'', quem:'', saida:''}, timers=[];
  function later(fn,ms){ timers.push(setTimeout(fn,ms)) }
  function esc(s){ var x=document.createElement('div'); x.textContent=s; return x.innerHTML }
  function norm(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim() }
  var MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var MESES_TXT=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function acha(txt){
    var t=' '+norm(txt)+' ', best=null, bl=0;
    DEST.forEach(function(d){ d.alias.forEach(function(a){ if(t.indexOf(' '+a+' ')>=0 && a.length>bl){ best=d; bl=a.length } }) });
    return best;
  }
  function quandoDe(txt){
    var t=norm(txt);
    if(/reveillon|ano novo/.test(t)) return 'Réveillon';
    if(/carnaval/.test(t)) return 'Carnaval';
    if(/feriado/.test(t)) return 'Feriado prolongado';
    if(/fim de semana/.test(t)) return 'Um fim de semana';
    for(var i=0;i<12;i++) if((' '+t+' ').indexOf(' '+MESES[i]+' ')>=0) return MESES_TXT[i][0].toUpperCase()+MESES_TXT[i].slice(1);
    return '';
  }
  function quemDe(txt){
    var t=norm(txt);
    if(/lua de mel|casal|namorad|marido|esposa|noiv/.test(t)) return 'Casal';
    if(/familia|filho|filha|crianca/.test(t)) return 'Família com crianças';
    if(/amig|galera|turma/.test(t)) return 'Amigos';
    if(/sozinh|so eu|solo/.test(t)) return 'Só eu';
    return '';
  }
  var PESSOAL='5511953353347';
  function wa(msg,origem){
    return '<div class="vt2-was"><a class="vt2-wa" href="https://wa.me/'+NUM+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener" data-vai-wa="'+esc(origem)+'">'+I.wa+'Enviar pro WhatsApp do OND</a>'
      +'<a class="vt2-wa vt2-wa2" href="https://wa.me/'+PESSOAL+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener" data-vai-wa="'+esc(origem)+' (Renan Chaves)">'+I.wa+'Falar com o Renan Chaves</a></div>';
  }
  document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('[data-vai-wa]'); if(a&&window.gtag) gtag('event','whatsapp_click',{destino:a.getAttribute('data-vai-wa'),pagina:'vai-home'}) });

  function show(){ if(!body.hidden) return; welcome.style.display='none'; body.hidden=false }
  function msg(who,html){ show(); var d=document.createElement('div'); d.className='vh2-msg '+who; d.innerHTML=html; body.appendChild(d); body.scrollTop=body.scrollHeight; return d }
  function ai(html,chips,delay){
    quick.innerHTML=''; var t=msg('ai typing','<i></i><i></i><i></i>');
    later(function(){ t.remove(); msg('ai',html); setChips(chips||[]) }, delay||650);
  }
  function setChips(list){ quick.innerHTML=list.map(function(c){ return '<button type="button" class="vh2-q" data-q="'+esc(c)+'">'+esc(c)+'</button>' }).join('') }

  function dias(d){ var n=parseInt(d.dias,10)||4; return Math.max(3,Math.min(n,6)) }
  function plano(d){
    var n=dias(d), h=d.destaques, out=[];
    for(var i=0;i<n;i++){
      var t = i===0 ? 'Chegada: '+(h[0]||'primeiro passeio')
            : (h[i] || (i===n-1 ? 'Último passeio e volta pra casa' : 'Dia livre pra aproveitar'));
      out.push(t);
    }
    return out;
  }
  function brief(d){
    var p=plano(d), L=['Olá, OND! Quero cotar esta viagem que simulei no site:','','*Viagem para '+d.nome+'* ('+d.regiao+')'];
    L.push('Quando: '+(st2.quando||'a definir'));
    L.push('Quem vai: '+(st2.quem||'a definir'));
    L.push('Saindo de: '+(st2.saida||'a definir'));
    L.push('Duração sugerida: '+d.dias);
    L.push('Melhor época: '+d.epoca);
    if(d.doc) L.push('Documento: '+d.doc);
    L.push('','Programação:');
    p.forEach(function(t,i){ L.push('Dia '+(i+1)+': '+t) });
    L.push('','Incluir: passagens, hospedagem e passeios.','(simulação feita no OND vAI do site)');
    return L.join('\n');
  }
  function painel(final){
    var d=st2.d; if(!d) return;
    side.classList.remove('vazio');
    var p=plano(d);
    sb.innerHTML=''
    +'<div class="vt2-ban" style="background-image:url(\''+d.img+'\')"><div><small>'+esc(d.regiao)+'</small><h3>'+esc(d.titulo)+'</h3></div></div>'
    +'<div class="vt2-in">'
      +'<div class="vt2-meta">'
        +'<div>'+I.cal+'<span>'+(st2.quando?esc(st2.quando):'<i>Quando?</i>')+' · '+esc(d.dias)+'</span></div>'
        +'<div>'+I.users+'<span>'+(st2.quem?esc(st2.quem):'<i>Quem vai?</i>')+'</span></div>'
        +'<div>'+I.plane+'<span>'+(st2.saida?'Saindo de '+esc(st2.saida):'<i>Saindo de onde?</i>')+'</span></div>'
        +'<div>'+I.sun+'<span>Melhor época: '+esc(d.epoca)+'</span></div>'
      +'</div>'
      +'<div class="vt2-h">Programação sugerida</div>'
      +p.map(function(t,i){ return '<div class="vt2-day" style="animation-delay:'+(i*0.06)+'s"><b>DIA '+(i+1)+'</b><span>'+esc(t)+'</span></div>' }).join('')
      +'<div class="vt2-h">A agência cuida de</div>'
      +'<div class="vt2-inc"><span>Passagens</span><span>Hospedagem</span><span>Passeios</span><span>Suporte humano</span></div>'
      +(final?'<div class="vt2-preco">Preço sob consulta, cotado com as suas datas.</div>'+wa(brief(d),d.nome):'')
    +'</div>';
  }

  var MOBILE=function(){ return window.matchMedia('(max-width:900px)').matches };
  function responde(txt){
    txt=String(txt||'').trim(); if(!txt) return;
    msg('me',esc(txt)); quick.innerHTML='';
    var t=norm(txt);
    if(st2.step==='dest'){
      if(/nao sei|qualquer|me ajuda|sugest/.test(t)){
        return ai('Bora descobrir juntos! Um especialista da agência OND te ajuda a escolher o destino certo pro seu momento e orçamento.<br>'+wa('Olá, OND! Quero viajar e ainda não sei pra onde. Me ajudam a escolher? (vim pelo OND vAI do site)','sem destino'),['Recomeçar']);
      }
      var d=acha(txt);
      if(!d){
        return ai('Que destino bom! Esse eu prefiro passar direto pra um especialista da agência OND, que cota com você no WhatsApp.<br>'+wa('Olá, OND! Quero viajar para: '+txt+'. (vim pelo OND vAI do site)','fora da lista: '+txt),['Tentar outro destino']);
      }
      st2.d=d; st2.quando=quandoDe(txt); st2.quem=quemDe(txt);
      painel(false);
      var intro='Boa escolha! '+esc(d.desc)+' A melhor época é '+esc(d.epoca.charAt(0).toLowerCase()+d.epoca.slice(1))+'.';
      if(!st2.quando){ st2.step='quando'; return ai(intro+'<br><br>Quando você quer ir?',['Neste feriado','Réveillon','Janeiro','Julho','Ainda não sei']) }
      if(!st2.quem){ st2.step='quem'; return ai(intro+'<br><br>Anotei: '+esc(st2.quando)+'. Quem vai nessa viagem?',['Só eu','Casal','Família com crianças','Amigos']) }
      st2.step='saida'; return ai(intro+'<br><br>E você sai de qual cidade?',['São Paulo','Rio de Janeiro','Belo Horizonte','Brasília']);
    }
    if(st2.step==='quando'){
      st2.quando=/ainda nao sei/.test(t)?'Datas flexíveis':(quandoDe(txt)||txt); painel(false);
      if(!st2.quem){ st2.step='quem'; return ai('Anotado. Quem vai nessa viagem?',['Só eu','Casal','Família com crianças','Amigos']) }
      st2.step='saida'; return ai('Anotado. E você sai de qual cidade?',['São Paulo','Rio de Janeiro','Belo Horizonte','Brasília']);
    }
    if(st2.step==='quem'){
      st2.quem=quemDe(txt)||txt; painel(false); st2.step='saida';
      return ai('Perfeito. E você sai de qual cidade?',['São Paulo','Rio de Janeiro','Belo Horizonte','Brasília']);
    }
    if(st2.step==='saida'){
      st2.saida=txt; st2.step='fim';
      quick.innerHTML=''; var tp=msg('ai typing','<i></i><i></i><i></i>');
      later(function(){ tp.remove(); msg('ai','Simulando passagens, hospedagem e passeios pra '+esc(st2.d.nome)+'…') },700);
      later(function(){
        painel(true);
        msg('ai','Pronto! Sua viagem pra <b>'+esc(st2.d.nome)+'</b> está '+(MOBILE()?'logo abaixo':'no painel ao lado')+'. Quer que a agência OND cote tudo com você? A conversa já vai com a viagem montada.<br>'+wa(brief(st2.d),st2.d.nome));
        setChips(['Mudar a data','Recomeçar']);
      },1900);
      return;
    }
    if(st2.step==='fim'){
      if(/mudar a data/.test(t)){ st2.step='quando'; return ai('Claro! Pra quando você quer mudar?',['Neste feriado','Réveillon','Janeiro','Julho','Ainda não sei']) }
      var d2=acha(txt);
      if(d2){ reset(true); return responde(txt) }
      return ai('Posso simular outro destino ou te passar pra agência agora.<br>'+wa(brief(st2.d),st2.d.nome),['Recomeçar']);
    }
  }
  function reset(silent){
    timers.forEach(clearTimeout); timers=[];
    st2={step:'dest',d:null,quando:'',quem:'',saida:''};
    body.innerHTML=''; body.hidden=true; quick.innerHTML=''; welcome.style.display='';
    side.classList.add('vazio'); sb.innerHTML='<div class="vh2-empty">'+I.map+'Conforme a gente conversa, sua viagem vai aparecendo aqui.</div>';
    if(!silent) try{ input.focus({preventScroll:true}) }catch(e){}
  }
  form.addEventListener('submit',function(e){ e.preventDefault(); var v=input.value; input.value=''; responde(v) });
  root.addEventListener('click',function(e){
    var s=e.target.closest('[data-sug]'); if(s){ responde(s.getAttribute('data-sug')); return }
    var q=e.target.closest('[data-q]');
    if(q){ var v=q.getAttribute('data-q'); if(v==='Recomeçar'||v==='Tentar outro destino'){ reset(); if(v==='Tentar outro destino'){ show(); ai('Pra onde mais você quer ir?') } return } responde(v); return }
    if(e.target.closest('[data-act="reset"]')) reset();
  });
  var modal=document.getElementById('vai'), ehModal=modal&&modal.classList.contains('vai-modal');
  function abre(sug){
    if(ehModal){ var jaAberto=!modal.hidden; modal.hidden=false; document.body.style.overflow='hidden'; if(!jaAberto && location.hash!=='#vai'){ try{ history.pushState({vai:1},'','#vai') }catch(e){} } }
    else { window.scrollTo({top:Math.max(0,root.getBoundingClientRect().top+window.pageYOffset-72),behavior:'smooth'}) }
    setTimeout(function(){ try{ input.focus({preventScroll:true}) }catch(e){} if(sug && st2.step==='dest' && body.hidden) responde(sug) },ehModal?250:600);
  }
  function esconde(){ modal.hidden=true; document.body.style.overflow='' }
  function fecha(){ if(!ehModal) return; if(history.state&&history.state.vai){ history.back(); return } esconde(); if(location.hash==='#vai') history.replaceState(null,'',location.pathname+location.search) }
  window.addEventListener('popstate',function(){ if(ehModal && location.hash!=='#vai' && !modal.hidden) esconde() });
  window.ondVaiOpen=abre; window.ondVaiFocus=function(){ abre('') };
  document.addEventListener('click',function(e){
    var o=e.target.closest&&e.target.closest('[data-vai-open]'); if(o){ e.preventDefault(); abre(o.getAttribute('data-vai-open')); return }
    if(e.target.closest&&e.target.closest('[data-vai-close]')) fecha();
    if(e.target.closest&&e.target.closest('[data-vai-new]')){ reset(); }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&ehModal&&!modal.hidden) fecha() });
  if(location.hash==='#vai') setTimeout(function(){ abre('') },300);
})();
