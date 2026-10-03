/* Amplia uma imagem em tela cheia nas landing pages de campanha.
   Vale para qualquer <img data-cheia="caminho">: o cartao mostra o recorte e o
   clique abre a imagem inteira. Fecha no clique, no Esc e no botao, e devolve o
   foco para a imagem de onde saiu. Incluir com
   <script src="/assets/lp-amplia.js" defer></script>. */
(function(){
  if(window.__ondAmplia) return; window.__ondAmplia = true;

  var CSS = ''
    + '.amp-fundo{position:fixed;inset:0;z-index:100030;background:rgba(5,5,10,.92);display:flex;'
    + 'align-items:center;justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .2s}'
    + '.amp-fundo.open{opacity:1;pointer-events:all}'
    + '.amp-fundo img{max-width:100%;max-height:100%;width:auto;height:auto;border-radius:12px;'
    + 'box-shadow:0 24px 64px rgba(0,0,0,.6);transform:scale(.97);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}'
    + '.amp-fundo.open img{transform:scale(1)}'
    + '.amp-x{position:fixed;top:16px;right:16px;width:42px;height:42px;border:0;border-radius:50%;'
    + 'background:rgba(255,255,255,.12);color:#fff;font-size:26px;line-height:1;cursor:pointer}'
    + '.amp-x:hover{background:rgba(255,255,255,.22)}'
    + '.amp-legenda{position:fixed;left:0;right:0;bottom:18px;text-align:center;padding:0 24px;'
    + 'font-size:.85rem;color:rgba(255,255,255,.72)}'
    + 'img[data-cheia]{cursor:zoom-in}';

  var fundo, foto, legenda, voltarPara;

  function montar(){
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    fundo = document.createElement('div');
    fundo.className = 'amp-fundo';
    fundo.setAttribute('role', 'dialog');
    fundo.setAttribute('aria-modal', 'true');
    fundo.hidden = true;
    fundo.innerHTML = '<button type="button" class="amp-x" aria-label="Fechar">&times;</button>'
      + '<img alt=""><p class="amp-legenda"></p>';
    foto = fundo.querySelector('img');
    legenda = fundo.querySelector('.amp-legenda');
    fundo.addEventListener('click', function(e){ if(e.target !== foto) fechar(); });
    document.body.appendChild(fundo);
  }

  function abrir(img){
    if(!fundo) montar();
    voltarPara = img;
    foto.src = img.getAttribute('data-cheia');
    foto.alt = img.alt || '';
    legenda.textContent = img.alt || '';
    fundo.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ fundo.classList.add('open'); });
    fundo.querySelector('.amp-x').focus();
  }

  function fechar(){
    if(!fundo || fundo.hidden) return;
    fundo.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function(){ fundo.hidden = true; foto.removeAttribute('src'); }, 200);
    if(voltarPara) voltarPara.focus();
  }

  document.addEventListener('click', function(e){
    var img = e.target.closest && e.target.closest('img[data-cheia]');
    if(!img) return;
    e.preventDefault();
    abrir(img);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') return fechar();
    if(e.key !== 'Enter' && e.key !== ' ') return;
    var img = document.activeElement;
    if(img && img.matches && img.matches('img[data-cheia]')){ e.preventDefault(); abrir(img); }
  });

  /* a imagem precisa receber foco e anunciar que abre, para quem navega por teclado */
  function preparar(){
    [].forEach.call(document.querySelectorAll('img[data-cheia]'), function(img){
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      if(img.alt) img.setAttribute('aria-label', 'Ampliar: ' + img.alt);
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preparar);
  else preparar();
})();
