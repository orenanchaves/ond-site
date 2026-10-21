(function(){
  var head=document.querySelector('.hv-head[data-dados]'); if(!head) return;
  var sw=head.querySelector('.hv-sw'), tabs=[].slice.call(sw.querySelectorAll('[role="tab"]'));
  var gradePais=document.getElementById('hv-pais'), gradeMundo=document.getElementById('hv-mundo');
  var cfg=head.dataset, CARDS=6, PROXIMOS=4, MINIMO=3;
  function vai(t){
    tabs.forEach(function(b){ var on=b===t; b.setAttribute('aria-selected',on); b.tabIndex=on?0:-1;
      var p=document.getElementById(b.getAttribute('aria-controls')); p.hidden=!on; if(on){ p.classList.remove('entra'); void p.offsetWidth; p.classList.add('entra') } });
  }
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){ vai(b) });
    b.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ var n=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length]; n.focus(); vai(n) } });
  });
  var visitante=window.ondPaisVisitante; if(!visitante||!window.fetch) return;
  var pais=visitante.detecta(cfg.paisPadrao); if(pais===cfg.paisPadrao) return;
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }
  function enumera(nomes){
    try{ return new Intl.ListFormat(cfg.idioma,{type:'conjunction'}).format(nomes) }catch(e){}
    return nomes.length<2?nomes.join(''):nomes.slice(0,-1).join(', ')+' '+cfg.e+' '+nomes[nomes.length-1];
  }
  function card(d,grande){
    var src=grande?d.g:d.i, webp=grande?d.gw:d.w;
    return '<a class="ht'+(grande?' ht-big':'')+'" href="/'+cfg.pasta+'viagens/'+esc(d.s)+'/"><picture>'
      +(webp?'<source srcset="'+esc(webp)+'" type="image/webp">':'')
      +'<img src="'+esc(src)+'" alt="'+esc(d.a)+'" width="800" height="500" loading="lazy"></picture>'
      +'<span class="ht-t"><b>'+esc(d.t)+'</b><span>'+esc(d.r)+'</span></span></a>';
  }
  function grade(lista,ancora){
    var visiveis=lista.length===CARDS+1?CARDS+1:CARDS;
    var html=lista.slice(0,visiveis).map(function(d,n){ return card(d,n===0) }).join('');
    var resto=lista.slice(visiveis);
    if(resto.length){
      html+='<a class="ht ht-mais" href="/'+cfg.pasta+'viagens/#'+ancora+'"><b>'+esc(cfg.mais.replace('{n}',resto.length))+'</b><span>'
        +esc(enumera(resto.slice(0,PROXIMOS).map(function(d){ return d.t })))+'</span></a>';
    }
    return html;
  }
  fetch(cfg.dados).then(function(r){ return r.ok?r.json():null }).then(function(itens){
    if(!itens||!itens.length) return;
    var locais=itens.filter(function(d){ return d.c===pais });
    var divide=locais.length>=MINIMO;
    var mundo=divide?itens.filter(function(d){ return d.c!==pais }):itens;
    if(divide){
      tabs[0].textContent=visitante.nomeador(cfg.idioma)(pais);
      gradePais.innerHTML=grade(locais,'nacionais');
    }
    gradeMundo.innerHTML=grade(mundo,'internacionais');
    sw.hidden=!divide;
    if(divide){ vai(tabs[0]) } else { gradePais.hidden=true; gradeMundo.hidden=false }
  }).catch(function(){});
})();
