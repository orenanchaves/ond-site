/* Cotação pelo WhatsApp do OND: formulário "pra onde / quando / quantas pessoas"
   e botões de pedido rápido. Nada é enviado pelo site: monta a mensagem e abre o
   WhatsApp oficial (11) 91021-4133. Incluir com <script src="/assets/cotar.js" defer></script>. */
(function(){
  if(window.__ondCotar) return; window.__ondCotar = true;
  var NUM = '5511910214133';
  function abrir(msg, origem){
    if(window.gtag) gtag('event','whatsapp_click',{destino:origem||'cotacao',pagina:location.pathname});
    window.open('https://wa.me/'+NUM+'?text='+encodeURIComponent(msg),'_blank','noopener');
  }
  document.addEventListener('submit', function(e){
    var f = e.target.closest && e.target.closest('form.cot-form');
    if(!f) return;
    e.preventDefault();
    var v = function(n){ var el=f.elements[n]; return el ? String(el.value||'').trim() : '' };
    var linhas = ['Olá, OND! Quero cotar uma viagem.'];
    linhas.push('Destino: ' + (v('destino') || 'ainda não sei, quero ajuda pra escolher'));
    if(v('quando')) linhas.push('Quando: ' + v('quando'));
    if(v('pessoas')) linhas.push('Quem vai: ' + v('pessoas'));
    if(v('saida')) linhas.push('Saindo de: ' + v('saida'));
    linhas.push('(vim pelo site)');
    abrir(linhas.join('\n'), v('destino') || 'cotacao');
  });
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-cot-msg]');
    if(!b) return;
    e.preventDefault();
    abrir(b.getAttribute('data-cot-msg'), b.getAttribute('data-cot-origem') || 'atalho');
  });
})();
