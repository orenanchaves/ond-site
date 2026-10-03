/* Autocomplete de destino nos formulários de cotação.
   Marque o campo com data-destinos (ou data-destinos="origem", que põe o Brasil
   na frente, porque é de lá que a pessoa costuma sair). O catálogo é o mesmo que
   o globo de destinos usa, /api/countries, e divide com ele o cache de sessão:
   quem já abriu o globo não baixa de novo. Digitar à mão continua valendo, a
   lista só poupa digitação. Incluir com
   <script src="/assets/lp-destinos.js" defer></script>. */
(function(){
  if(window.__ondDestinos) return; window.__ondDestinos = true;

  var API = 'https://ond.agamatec.com/api/countries?locale=pt_BR';
  var CACHE = 'ond_globo_destinos';
  var MAX = 8;
  var catalogo = null, baixando = null;

  var CSS = ''
    + '.dst-wrap{position:relative}'
    + '.dst-lista{position:absolute;z-index:40;left:0;right:0;top:calc(100% + 6px);margin:0;padding:6px;list-style:none;'
    + 'background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);border-radius:14px;'
    + 'box-shadow:0 18px 44px rgba(0,0,0,.45);max-height:264px;overflow-y:auto;overscroll-behavior:contain}'
    + '.dst-lista[hidden]{display:none}'
    + '.dst-lista li{padding:9px 11px;border-radius:10px;cursor:pointer;font-size:.93rem;line-height:1.35;color:var(--text,#f0eeff)}'
    + '.dst-lista li[aria-selected="true"],.dst-lista li:hover{background:color-mix(in srgb,var(--purple,#7f11f4) 18%,transparent)}'
    + '.dst-lista small{display:block;font-size:.78rem;color:var(--muted,#9a97b5);margin-top:1px}';

  function pintarCss(){
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  }

  function simples(texto){
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function montarIndice(paises){
    var itens = [];
    paises.forEach(function(pais){
      itens.push({ rotulo: pais.name, detalhe: 'País', pais: pais.name, chave: simples(pais.name) });
      (pais.cities || []).forEach(function(cidade){
        itens.push({
          rotulo: cidade.name,
          detalhe: pais.name,
          pais: pais.name,
          chave: simples(cidade.name + ' ' + pais.name)
        });
      });
    });
    return itens;
  }

  function carregar(){
    if(catalogo) return Promise.resolve(catalogo);
    if(baixando) return baixando;
    var guardado = null;
    try{ guardado = JSON.parse(sessionStorage.getItem(CACHE)); }catch(semStorage){}
    if(guardado && guardado.length){ catalogo = montarIndice(guardado); return Promise.resolve(catalogo); }
    baixando = fetch(API).then(function(resposta){
      if(!resposta.ok) throw new Error('HTTP ' + resposta.status);
      return resposta.json();
    }).then(function(paises){
      try{ sessionStorage.setItem(CACHE, JSON.stringify(paises)); }catch(semStorage){}
      catalogo = montarIndice(paises);
      return catalogo;
    }).catch(function(){ catalogo = []; return catalogo; });
    return baixando;
  }

  function procurar(termo, origem){
    var q = simples(termo);
    if(!q) return [];
    var comeca = [], contem = [];
    for(var i = 0; i < catalogo.length; i++){
      var item = catalogo[i];
      var onde = item.chave.indexOf(q);
      if(onde === 0) comeca.push(item);
      else if(onde > 0) contem.push(item);
      if(comeca.length >= MAX && !origem) break;
    }
    var achados = comeca.concat(contem);
    if(origem){
      achados.sort(function(um, outro){
        return (outro.pais === 'Brasil') - (um.pais === 'Brasil');
      });
    }
    return achados.slice(0, MAX);
  }

  function ligar(campo){
    var origem = campo.getAttribute('data-destinos') === 'origem';
    var casca = document.createElement('div');
    casca.className = 'dst-wrap';
    campo.parentNode.insertBefore(casca, campo);
    casca.appendChild(campo);

    var lista = document.createElement('ul');
    lista.className = 'dst-lista';
    lista.id = 'dst-' + Math.random().toString(36).slice(2, 8);
    lista.setAttribute('role', 'listbox');
    lista.hidden = true;
    casca.appendChild(lista);

    campo.setAttribute('role', 'combobox');
    campo.setAttribute('aria-autocomplete', 'list');
    campo.setAttribute('aria-expanded', 'false');
    campo.setAttribute('aria-controls', lista.id);
    campo.setAttribute('autocomplete', 'off');

    var achados = [], marcado = -1;

    function fechar(){
      lista.hidden = true; lista.innerHTML = '';
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
      achados = []; marcado = -1;
    }

    function marcar(indice){
      var opcoes = lista.children;
      if(!opcoes.length) return;
      if(marcado >= 0 && opcoes[marcado]) opcoes[marcado].setAttribute('aria-selected', 'false');
      marcado = (indice + opcoes.length) % opcoes.length;
      opcoes[marcado].setAttribute('aria-selected', 'true');
      campo.setAttribute('aria-activedescendant', opcoes[marcado].id);
      opcoes[marcado].scrollIntoView({ block: 'nearest' });
    }

    function escolher(indice){
      if(!achados[indice]) return;
      campo.value = achados[indice].rotulo;
      fechar();
    }

    function desenhar(){
      if(!achados.length) return fechar();
      lista.innerHTML = achados.map(function(item, indice){
        return '<li id="' + lista.id + '-' + indice + '" role="option" aria-selected="false" data-i="' + indice + '">'
          + item.rotulo + '<small>' + item.detalhe + '</small></li>';
      }).join('');
      lista.hidden = false;
      campo.setAttribute('aria-expanded', 'true');
      marcado = -1;
    }

    function atualizar(){
      carregar().then(function(){
        achados = procurar(campo.value, origem);
        desenhar();
      });
    }

    campo.addEventListener('focus', carregar);
    campo.addEventListener('input', atualizar);
    campo.addEventListener('blur', function(){ setTimeout(fechar, 120); });
    campo.addEventListener('keydown', function(evento){
      if(evento.key === 'Escape') return fechar();
      if(lista.hidden) return;
      if(evento.key === 'ArrowDown'){ evento.preventDefault(); marcar(marcado + 1); }
      else if(evento.key === 'ArrowUp'){ evento.preventDefault(); marcar(marcado - 1); }
      else if(evento.key === 'Enter' && marcado >= 0){ evento.preventDefault(); escolher(marcado); }
    });
    lista.addEventListener('mousedown', function(evento){
      var opcao = evento.target.closest('li[data-i]');
      if(!opcao) return;
      evento.preventDefault();
      escolher(Number(opcao.getAttribute('data-i')));
    });
  }

  function preparar(){
    var campos = document.querySelectorAll('input[data-destinos]');
    if(!campos.length) return;
    pintarCss();
    [].forEach.call(campos, ligar);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preparar);
  else preparar();
})();
