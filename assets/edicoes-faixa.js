(function () {
  var idioma = (document.documentElement.lang || 'pt').slice(0, 2).toLowerCase();
  var FUSO_BRASILIA_MS = 3 * 60 * 60 * 1000;
  var DIA_MS = 24 * 60 * 60 * 1000;
  var CHAVE_CACHE = 'ond-edicoes-destaque-' + idioma;

  function proximaMeiaNoiteBrasilia() {
    var agoraBrasilia = Date.now() - FUSO_BRASILIA_MS;
    return Math.floor(agoraBrasilia / DIA_MS) * DIA_MS + DIA_MS + FUSO_BRASILIA_MS;
  }

  function lerCache() {
    try {
      var guardado = JSON.parse(localStorage.getItem(CHAVE_CACHE) || 'null');
      return guardado && guardado.validoAte > Date.now() && guardado.destaque ? guardado.destaque : null;
    } catch (erro) {
      return null;
    }
  }

  function gravarCache(destaque) {
    try {
      localStorage.setItem(CHAVE_CACHE, JSON.stringify({ validoAte: proximaMeiaNoiteBrasilia(), destaque: destaque }));
    } catch (erro) {}
  }

  function contraste(hex) {
    var canais = [1, 3, 5].map(function (posicao) {
      var valor = parseInt(hex.substr(posicao, 2), 16) / 255;
      return valor <= 0.03928 ? valor / 12.92 : Math.pow((valor + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2] > 0.4 ? '#1E1E1E' : '#FFFFFF';
  }

  function cor(valor, padrao) {
    return /^#[0-9A-Fa-f]{6}$/.test(valor || '') ? valor : padrao;
  }

  function dataDeEstreia(inicio) {
    var partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(inicio || '');
    if (!partes) return '';
    var dia = new Date(Date.UTC(+partes[1], +partes[2] - 1, +partes[3]));
    try {
      return dia.toLocaleDateString(idioma, { day: 'numeric', month: 'long', timeZone: 'UTC' });
    } catch (erro) {
      return partes[3] + '/' + partes[2];
    }
  }

  function desenha(config, destaque) {
    var textos = (config.textos || {})[idioma];
    var paginas = config.paginas || [];
    var emBreve = destaque.emBreve;
    var candidatas = (destaque.edicoes || []).map(function (edicao) {
      var temPagina = idioma === 'pt' && paginas.indexOf(edicao.slug) !== -1;
      return {
        slug: edicao.slug,
        titulo: edicao.title || '',
        cidade: edicao.cityName || '',
        pagina: temPagina ? '/edicoes/' + edicao.slug + '/' : '',
        link: (config.links || {})[edicao.slug] || 'https://web.ondviajar.com.br/editions/' + edicao.slug,
        inicio: edicao.startsAt || '',
        primaria: cor(edicao.primaryColor, '#7F11F4'),
        secundaria: cor(edicao.secondaryColor, '#290756'),
        detalhe: cor(edicao.detailColor, '#11F558')
      };
    }).filter(function (candidata) {
      return !candidata.pagina || location.pathname.indexOf(candidata.pagina) !== 0;
    }).sort(function (primeira, segunda) {
      return emBreve ? primeira.inicio.localeCompare(segunda.inicio) : segunda.inicio.localeCompare(primeira.inicio);
    });
    var edicao = candidatas[0];
    var data = edicao && emBreve ? dataDeEstreia(edicao.inicio) : '';
    if (!textos || !edicao || (emBreve && (!textos.badgeUpcoming || !data))) return;

    var estilo = document.createElement('style');
    estilo.textContent =
      '.ond-ed{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 14px;padding:9px 5%;' +
      'background:var(--ond-ed-sec);color:#fff;font-size:.9rem;line-height:1.35;border-bottom:2px solid var(--ond-ed-pri);position:relative;z-index:201}' +
      '.ond-ed-selo{border:1px solid var(--ond-ed-det);color:var(--ond-ed-det);border-radius:50px;padding:2px 10px;font-size:.72rem;' +
      'font-weight:800;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}' +
      '.ond-ed-tit{color:#fff;font-weight:700;text-decoration:none}a.ond-ed-tit:hover{text-decoration:underline}' +
      '.ond-ed-cid{color:rgba(255,255,255,.75)}.ond-ed-data{color:#fff;font-weight:600}' +
      '.ond-ed-cta{background:var(--ond-ed-pri);color:var(--ond-ed-pri-txt);font-weight:800;border-radius:50px;padding:6px 14px;' +
      'text-decoration:none;white-space:nowrap}.ond-ed-cta:hover{filter:brightness(1.07)}' +
      '@media(max-width:600px){.ond-ed-cid{display:none}}';
    document.head.appendChild(estilo);

    var faixa = document.createElement('aside');
    faixa.className = 'ond-ed';
    faixa.setAttribute('aria-label', textos.badge);
    faixa.style.setProperty('--ond-ed-pri', edicao.primaria);
    faixa.style.setProperty('--ond-ed-sec', edicao.secundaria);
    faixa.style.setProperty('--ond-ed-det', edicao.detalhe);
    faixa.style.setProperty('--ond-ed-pri-txt', contraste(edicao.primaria));

    var selo = document.createElement('span');
    selo.className = 'ond-ed-selo';
    selo.textContent = emBreve ? textos.badgeUpcoming : textos.badge;
    faixa.appendChild(selo);

    var destino = edicao.pagina || (emBreve ? edicao.link : '');
    var titulo = document.createElement(destino ? 'a' : 'span');
    titulo.className = 'ond-ed-tit';
    titulo.textContent = edicao.titulo;
    if (destino) titulo.href = destino;
    if (destino && !edicao.pagina) {
      titulo.target = '_blank';
      titulo.rel = 'noopener';
      titulo.setAttribute('data-edicao', edicao.slug);
    }
    faixa.appendChild(titulo);

    if (edicao.cidade) {
      var cidade = document.createElement('span');
      cidade.className = 'ond-ed-cid';
      cidade.textContent = edicao.cidade;
      faixa.appendChild(cidade);
    }

    if (emBreve) {
      var estreia = document.createElement('span');
      estreia.className = 'ond-ed-data';
      estreia.textContent = textos.upcomingBody.replace('{date}', data);
      faixa.appendChild(estreia);
      inserir(faixa);
      return;
    }

    var botao = document.createElement('a');
    botao.className = 'ond-ed-cta';
    botao.href = edicao.link;
    botao.target = '_blank';
    botao.rel = 'noopener';
    botao.textContent = textos.cta;
    botao.setAttribute('data-edicao', edicao.slug);
    faixa.appendChild(botao);
    inserir(faixa);
  }

  function inserir(faixa) {
    var pular = document.querySelector('body > .skip');
    document.body.insertBefore(faixa, pular ? pular.nextSibling : document.body.firstChild);
  }

  function destaqueDaApi(api) {
    var base = api + '/api/themed-editions/';
    return json(base + 'active?language=' + idioma).then(function (ativas) {
      if (!Array.isArray(ativas)) return null;
      if (ativas.length) return { edicoes: ativas, emBreve: false };
      return json(base + 'upcoming?language=' + idioma).then(function (proximas) {
        return { edicoes: Array.isArray(proximas) ? proximas : [], emBreve: true };
      });
    });
  }

  function json(url) {
    return fetch(url).then(function (resposta) { return resposta.ok ? resposta.json() : null; });
  }

  function carrega() {
    json('/assets/edicoes-config.json').then(function (config) {
      if (!config) return;
      var emCache = lerCache();
      if (emCache) {
        desenha(config, emCache);
        return;
      }
      return destaqueDaApi(config.api).then(function (destaque) {
        if (!destaque) return;
        gravarCache(destaque);
        desenha(config, destaque);
      });
    }).catch(function () {});
  }

  if (document.body) carrega();
  else document.addEventListener('DOMContentLoaded', carrega);
})();
