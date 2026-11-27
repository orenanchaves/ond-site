/* Página /explorar/avaliacoes/: lugares, passeios, restaurantes e hotéis avaliados por viajantes,
   com filtro por cidade e o botão "Adicionar na minha viagem" (assets/adicionar-viagem.js).
   Dados: OND_AVALIACOES (exemplo só no localhost) até o servidor de resenhas existir.
   Aceita ?cidade=Lisboa e ?aba=lugar|passeio|restaurante|hotel.
   Um card por lugar: as avaliações do mesmo lugar (mesma categoria, cidade e nome) se juntam, com a
   nota média e "N avaliações", que abre a lista completa. A capa do card é a foto principal.
   Avaliar: botão "Avaliar um lugar" (lugar do Guia ou lugar novo) e "Avaliar" em cada card. As avaliações
   da conta ficam em OndStore 'guia_avaliacoes' até o servidor de resenhas existir. */
(function () {
  var list = document.getElementById('av-lista');
  var chipsBox = document.getElementById('av-cidades');
  var search = document.getElementById('av-busca');
  document.getElementById('av-lupa').outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  var NAMES = { lugar: ['atração', 'atrações'], passeio: ['passeio', 'passeios'], restaurante: ['restaurante', 'restaurantes'], hotel: ['hotel', 'hotéis'] };
  var TILE = { hotel: '#560fb2', passeio: '#7f11f4', praia: '#0b7a8a', mirante: '#c67810', trilha: '#085e20', comida: '#f59811' };
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var TYPE_ICON = {
    hotel: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/></svg>',
    passeio: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    praia: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 12a8 8 0 0 1 16 0zM12 12v8"/><path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/></svg>',
    mirante: '<svg viewBox="0 0 24 24" ' + st + '><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trilha: '<svg viewBox="0 0 24 24" ' + st + '><path d="m3 20 6-11 4 6 2-3 6 8z"/><circle cx="16" cy="6" r="2"/></svg>',
    comida: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/></svg>'
  };
  var X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function tile(type, extra) { return '<span class="av-tile' + (extra || '') + '" style="background:' + (TILE[type] || TILE.passeio) + '">' + (TYPE_ICON[type] || TYPE_ICON.passeio) + '</span>'; }

  var people = (window.OND_EXEMPLO && OND_EXEMPLO.people) || {};
  var base = (window.OND_AVALIACOES || []).map(function (item) {
    var author = people[item.by] || { name: item.by, handle: item.by, initials: (item.by || '?').slice(0, 2).toUpperCase() };
    return Object.assign({}, item, { author: author });
  });
  function minhas() { return OndStore.read('guia_avaliacoes', []).map(function (item) { return Object.assign({}, item, { author: ME, mine: true }); }); }
  var all = minhas().concat(base);

  /* ── lugares: avaliações do mesmo lugar juntas ── */
  function chave(item) { return item.cat + '|' + normalizeText(item.city) + '|' + normalizeText(item.title); }
  var places = [], porChave = {};
  function agrupar() {
    places = []; porChave = {};
    all.forEach(function (review) {
      var key = chave(review), place = porChave[key];
      if (!place) { place = porChave[key] = { key: key, cat: review.cat, city: review.city, title: review.title, reviews: [] }; places.push(place); }
      place.reviews.push(review);
      ['type', 'iso', 'lat', 'lng', 'minutes', 'meal', 'address'].forEach(function (field) { if (place[field] == null && review[field] != null) place[field] = review[field]; });
    });
    places.forEach(function (place) {
      place.reviews.sort(function (a, b) { return (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || String(b.month || '').localeCompare(String(a.month || '')) || (b.likes || 0) - (a.likes || 0); });
      var soma = 0, likes = 0;
      place.reviews.forEach(function (review) { soma += review.rate; likes += review.likes || 0; });
      place.avg = Math.round(soma / place.reviews.length * 10) / 10;
      place.likes = likes;
      place.mine = place.reviews.some(function (review) { return review.mine; });
      /* a série de fotos do lugar: as de todas as avaliações, a principal de cada uma primeiro, sem repetir */
      var vistas = {};
      place.fotos = [];
      place.reviews.forEach(function (review) {
        [review.photo].concat(review.photos || []).forEach(function (src) { if (src && !vistas[src]) { vistas[src] = 1; place.fotos.push(src); } });
      });
      place.photo = place.fotos[0] || null;
      place.featured = place.reviews[0];
    });
  }
  agrupar();
  function nota(valor) {
    var locale = window.OndIdioma ? OndIdioma.locale : 'pt-BR';
    try { return valor.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch (error) { return String(valor).replace('.', ','); }
  }
  function quantas(n) { return n === 1 ? '1 avaliação' : n + ' avaliações'; }

  var params = new URLSearchParams(location.search);
  var cat = NAMES[params.get('aba')] ? params.get('aba') : 'lugar';
  var city = '', query = '';
  var wantedCity = params.get('cidade');
  if (wantedCity) {
    var known = all.find(function (item) { return normalizeText(item.city) === normalizeText(wantedCity); });
    if (known) { city = known.city; search.value = known.city; }
  }

  function cities() {
    var seen = {};
    places.forEach(function (place) { seen[place.city] = (seen[place.city] || 0) + (place.cat === cat ? 1 : 0); });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, 'pt'); }).map(function (name) { return { name: name, count: seen[name] }; });
  }
  function matches(place) {
    if (place.cat !== cat) return false;
    if (city) return place.city === city;
    if (!query) return true;
    return normalizeText(place.city).indexOf(query) >= 0 || normalizeText(place.title).indexOf(query) >= 0;
  }
  function renderChips() {
    var shown = cities().filter(function (entry) { return !query || normalizeText(entry.name).indexOf(query) >= 0 || entry.name === city; });
    chipsBox.innerHTML = '<button type="button" class="chip' + (!city ? ' on' : '') + '" data-cidade="" aria-pressed="' + !city + '">Todas as cidades</button>' +
      shown.map(function (entry) {
        return '<button type="button" class="chip' + (entry.name === city ? ' on' : '') + '" data-cidade="' + escapeHtml(entry.name) + '" aria-pressed="' + (entry.name === city) + '">' + escapeHtml(entry.name) + (entry.count ? ' <span>' + entry.count + '</span>' : '') + '</button>';
      }).join('');
  }
  function card(place) {
    var review = place.featured, n = place.reviews.length;
    var visual = place.photo ? '<button type="button" class="av-capa" data-av-fotos="' + escapeHtml(place.key) + '" aria-label="Ver fotos"><img class="av-photo" src="' + escapeHtml(place.photo) + '" alt="" loading="lazy">' +
      (place.fotos.length > 1 ? '<span class="av-capa-qtd">' + ICON.camera + '<span>' + place.fotos.length + ' fotos</span></span>' : '') + '</button>' : '';
    return '<article class="review av-card' + (place.photo ? ' com-foto' : '') + '" data-key="' + escapeHtml(place.key) + '">' + visual +
      '<div class="av-card-in">' +
      '<div class="av-card-top">' + (place.photo ? '' : tile(place.type)) +
      '<div class="av-card-title"><h2>' + escapeHtml(place.title) + '</h2><span class="av-city">' + ICON.pin + escapeHtml(place.city) + '</span></div></div>' +
      '<div class="review-rate">' + ondsHtml(place.avg, 18) + (n > 1 ? '<b class="av-media">' + nota(place.avg) + '</b>' : '') + '<span>' + (RATE_LABELS[Math.round(place.avg)] || '') + '</span>' +
      (n > 1 ? '<button type="button" class="av-qtd" data-av-ver="' + escapeHtml(place.key) + '">' + quantas(n) + '</button>' : '') + '</div>' +
      '<p>' + escapeHtml(review.text) + '</p>' +
      '<div class="av-links"><a class="av-maps" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.address || (place.title + ', ' + place.city)) + '" target="_blank" rel="noopener">' + ICON.pin + 'Ver no Google Maps, com fotos e horários</a>' +
      '<button type="button" class="av-avaliar" data-av-avaliar="' + escapeHtml(place.key) + '" data-pede-conta="avaliar">' + ICON.pen + 'Avaliar</button></div>' +
      '<div class="av-card-foot">' +
      '<a class="av-by" href="' + profileUrl(review.author.handle) + '">' + avatarHtml(review.author, 34) + '<span><b>' + escapeHtml(review.author.name) + '</b><small>esteve em ' + monthLong(review.month) + '</small></span></a>' +
      '<button type="button" class="btn btn-sm av-add" data-av-add="' + escapeHtml(place.key) + '" data-pede-conta="viagens">' + ICON.plus + 'Adicionar na minha viagem</button>' +
      '</div></div></article>';
  }
  function render() {
    renderChips();
    var items = places.filter(matches).sort(function (a, b) { return (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || b.avg - a.avg || b.reviews.length - a.reviews.length || b.likes - a.likes; });
    if (!all.length) {
      list.innerHTML = '<div class="av-empty"><b>As avaliações dos viajantes aparecem aqui</b><p>Quem viaja com o OND conta o que valeu a pena em cada cidade.</p></div>';
      return;
    }
    if (!items.length) {
      var where = city ? ' em ' + escapeHtml(city) : query ? ' para "' + escapeHtml(search.value.trim()) + '"' : '';
      list.innerHTML = '<div class="av-empty"><b>Ainda sem avaliações de ' + NAMES[cat][1] + where + '</b><p>Veja outra aba ou outra cidade.</p></div>';
      return;
    }
    list.innerHTML = items.map(card).join('');
  }

  document.querySelectorAll('.av-tabs .tab').forEach(function (tab) {
    tab.classList.toggle('on', tab.dataset.cat === cat);
    tab.setAttribute('aria-selected', String(tab.dataset.cat === cat));
    tab.addEventListener('click', function () {
      cat = tab.dataset.cat;
      document.querySelectorAll('.av-tabs .tab').forEach(function (other) { other.classList.toggle('on', other === tab); other.setAttribute('aria-selected', String(other === tab)); });
      render();
    });
  });
  chipsBox.addEventListener('click', function (event) {
    var chip = event.target.closest('[data-cidade]');
    if (!chip) return;
    city = chip.dataset.cidade; query = '';
    search.value = city;
    render();
  });
  search.addEventListener('input', function () {
    query = normalizeText(search.value);
    city = '';
    var exact = all.find(function (item) { return normalizeText(item.city) === query; });
    if (exact) city = exact.city;
    render();
  });
  render();

  if (!document.querySelector('.scrim')) { var scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim); }

  /* ── todas as avaliações de um lugar ── */
  var ver = document.createElement('div');
  ver.className = 'sheet av-sheet av-ver-sheet';
  ver.id = 'av-ver';
  ver.setAttribute('role', 'dialog'); ver.setAttribute('aria-modal', 'true'); ver.setAttribute('aria-labelledby', 'av-ver-titulo');
  document.body.appendChild(ver);
  function abrirLista(place) {
    ver.innerHTML = '<button class="x" data-close aria-label="Fechar">' + ICON.close + '</button>' +
      '<h2 id="av-ver-titulo">Avaliações de ' + escapeHtml(place.title) + '</h2>' +
      mosaico(place) +
      '<div class="av-ver-resumo">' + (place.photo ? '' : tile(place.type)) +
        '<div><div class="av-ver-nota"><b>' + nota(place.avg) + '</b>' + ondsHtml(place.avg, 20) + '</div><span>' + quantas(place.reviews.length) + '</span> · <span>' + escapeHtml(place.city) + '</span></div></div>' +
      '<div class="av-ver-lista">' + place.reviews.map(function (review) {
        var fotos = [review.photo].concat(review.photos || []).filter(Boolean);
        return '<div class="av-ver-item">' +
          '<a class="av-by" href="' + profileUrl(review.author.handle) + '">' + avatarHtml(review.author, 36) + '<span><b>' + escapeHtml(review.author.name) + '</b><small>esteve em ' + monthLong(review.month) + '</small></span></a>' +
          '<div class="review-rate">' + ondsHtml(review.rate, 15) + '<span>' + (RATE_LABELS[review.rate] || '') + '</span></div>' +
          '<p>' + escapeHtml(review.text) + '</p>' +
          (fotos.length ? '<div class="av-ver-fotos">' + fotos.map(function (src) { return '<button type="button" data-av-foto="' + place.fotos.indexOf(src) + '" aria-label="Ver foto"><img src="' + escapeHtml(src) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-line" data-av-avaliar="' + escapeHtml(place.key) + '" data-pede-conta="avaliar">' + ICON.pen + 'Avaliar</button>' +
      '<button type="button" class="btn btn-primary" data-av-add="' + escapeHtml(place.key) + '" data-pede-conta="viagens">' + ICON.plus + 'Adicionar na minha viagem</button></div>';
    lugarAberto = place;
    openSheet('av-ver');
    ver.scrollTop = 0;
  }

  /* mosaico: a principal grande e mais duas ao lado; "+N" na última quando tem mais */
  var lugarAberto = null;
  function mosaico(place) {
    var f = place.fotos;
    if (!f.length) return '';
    var celula = function (i, extra) {
      return '<button type="button" class="av-mos-' + (i === 0 ? 'a' : 'b') + '" data-av-foto="' + i + '" aria-label="Ver foto"><img src="' + escapeHtml(f[i]) + '" alt="" loading="lazy">' + (extra || '') + '</button>';
    };
    var resto = f.length - 3;
    return '<div class="av-mos av-mos-' + Math.min(f.length, 3) + '">' + celula(0) + (f[1] ? celula(1) : '') +
      (f[2] ? celula(2, resto > 0 ? '<span class="av-mos-mais">+' + resto + '</span>' : '') : '') + '</div>';
  }


  /* ── avaliar um lugar (do Guia ou novo) ── */
  var CAT_UM = { lugar: 'Atração', passeio: 'Passeio', restaurante: 'Restaurante', hotel: 'Hotel' };
  var CAT_TIPO = { lugar: 'mirante', passeio: 'passeio', restaurante: 'comida', hotel: 'hotel' };
  var MAX_FOTOS = 4;
  var sheet = document.createElement('div');
  sheet.className = 'sheet av-sheet av-rate-sheet';
  sheet.id = 'av-avaliar';
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'av-r-titulo');
  sheet.innerHTML = '<button class="x" data-close aria-label="Fechar">' + ICON.close + '</button>' +
    '<h2 id="av-r-titulo">Avaliar um lugar</h2>' +
    '<div class="av-r-fixo" hidden></div>' +
    '<div class="av-r-capa" id="av-r-capa"></div>' +
    '<div class="av-r-livre">' +
      '<div class="field"><span class="label" id="av-r-tipo-l">Tipo</span><div class="av-r-tipos" role="radiogroup" aria-labelledby="av-r-tipo-l">' +
        Object.keys(CAT_UM).map(function (key) { return '<button type="button" class="chip" role="radio" aria-checked="false" data-r-cat="' + key + '">' + CAT_UM[key] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field av-r-duo"><div><label for="av-r-cidade">Cidade</label><input class="input" id="av-r-cidade" list="av-r-cidades" placeholder="Ex.: Lisboa" autocomplete="off"></div>' +
        '<div><label for="av-r-lugar">Qual lugar?</label><input class="input" id="av-r-lugar" list="av-r-lugares" placeholder="Nome do lugar" autocomplete="off"></div></div>' +
      '<datalist id="av-r-cidades"></datalist><datalist id="av-r-lugares"></datalist>' +
      '<div class="av-r-novo" hidden>' + ICON.plus + '<div><b>Lugar novo no Guia</b><small>Ele entra no Guia com a sua avaliação.</small></div></div>' +
      '<div class="field av-r-end" hidden><label for="av-r-end">Endereço ou link do Google Maps (opcional)</label><input class="input" id="av-r-end" placeholder="Rua e número, ou o link do lugar" autocomplete="off"></div>' +
    '</div>' +
    '<div class="field"><span class="label">Sua nota</span><div class="picker" id="av-r-picker"></div><div class="rate-label" id="av-r-nota"></div></div>' +
    '<div class="field"><label for="av-r-texto">Conte como foi</label><textarea class="input" id="av-r-texto" placeholder="O que valeu a pena, o que evitar, uma dica pra quem vai."></textarea></div>' +
    '<div class="field"><label for="av-r-mes">Quando você foi?</label><input class="input av-r-mes" type="month" id="av-r-mes"></div>' +
    '<div class="sheet-actions"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-primary" id="av-r-publicar">Publicar avaliação</button></div>';
  document.body.appendChild(sheet);

  var $ = function (sel) { return sheet.querySelector(sel); };
  var fixo = null, rCat = cat, notaEscolhida = 0, fotos = [];
  var picker = $('#av-r-picker');
  for (var v = 1; v <= 5; v++) picker.insertAdjacentHTML('beforeend', '<button type="button" data-value="' + v + '" aria-label="' + v + ' de 5">' + ondSymbol(0) + '</button>');
  function pintar(valor) {
    picker.querySelectorAll('button').forEach(function (b) { b.querySelector('.ond').style.setProperty('--fill', (+b.dataset.value <= valor ? 100 : 0) + '%'); b.setAttribute('aria-pressed', String(+b.dataset.value === notaEscolhida)); });
    $('#av-r-nota').textContent = RATE_LABELS[valor] || '';
  }
  picker.addEventListener('mouseover', function (e) { var b = e.target.closest('button'); if (b) pintar(+b.dataset.value); });
  picker.addEventListener('mouseleave', function () { pintar(notaEscolhida); });
  picker.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; notaEscolhida = +b.dataset.value; pintar(notaEscolhida); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });

  /* fotos: a primeira é a principal (capa do lugar no Guia); tocar numa miniatura a torna principal */
  var INPUT_FOTO = '<input type="file" accept="image/*" multiple hidden>';
  function desenharFotos() {
    var box = $('#av-r-capa');
    if (!fotos.length) {
      box.innerHTML = '<label class="av-r-drop">' + ICON.camera + '<b>Adicionar fotos</b><small>A foto principal vira a capa do lugar no Guia.</small>' + INPUT_FOTO + '</label>';
      return;
    }
    box.innerHTML = '<div class="av-r-principal"><img src="' + fotos[0] + '" alt=""><span class="av-r-tag">Principal</span>' +
      '<button type="button" class="av-r-tirar" data-tirar="0" aria-label="Remover foto">' + X_ICON + '</button></div>' +
      '<div class="av-r-minis">' + fotos.map(function (src, i) {
        return '<button type="button" class="av-r-mini' + (i === 0 ? ' on' : '') + '" data-principal="' + i + '" aria-label="Usar como principal" aria-pressed="' + (i === 0) + '"><img src="' + src + '" alt=""></button>';
      }).join('') + (fotos.length < MAX_FOTOS ? '<label class="av-r-mais" aria-label="Adicionar fotos">' + ICON.plus + INPUT_FOTO + '</label>' : '') + '</div>' +
      (fotos.length > 1 ? '<small class="av-r-dica">Toque numa foto para deixá-la como principal.</small>' : '');
  }

  function lugarExistente(categoria, cidade, titulo) {
    if (!normalizeText(cidade) || !normalizeText(titulo)) return null;
    return porChave[chave({ cat: categoria, city: cidade, title: titulo })] || null;
  }
  function marcarTipo() {
    sheet.querySelectorAll('[data-r-cat]').forEach(function (b) { var on = b.dataset.rCat === rCat; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
  }
  function sugestoes() {
    var cidades = {}; places.forEach(function (place) { cidades[place.city] = 1; });
    $('#av-r-cidades').innerHTML = Object.keys(cidades).sort(function (a, b) { return a.localeCompare(b, 'pt'); }).map(function (c) { return '<option value="' + escapeHtml(c) + '">'; }).join('');
    var c = normalizeText($('#av-r-cidade').value);
    $('#av-r-lugares').innerHTML = places.filter(function (place) { return place.cat === rCat && (!c || normalizeText(place.city) === c); })
      .map(function (place) { return '<option value="' + escapeHtml(place.title) + '">'; }).join('');
    var nome = $('#av-r-lugar').value.trim(), cidade = $('#av-r-cidade').value.trim();
    var novo = nome.length >= 3 && cidade.length >= 2 && !lugarExistente(rCat, cidade, nome);
    $('.av-r-novo').hidden = !novo; $('.av-r-end').hidden = !novo;
  }
  function abrir(place) {
    fixo = place || null; notaEscolhida = 0; fotos = [];
    desenharFotos();
    $('#av-r-texto').value = ''; $('#av-r-end').value = ''; $('#av-r-mes').value = currentMonth(); $('#av-r-mes').max = currentMonth();
    $('.av-r-livre').hidden = !!fixo; $('.av-r-fixo').hidden = !fixo;
    if (fixo) {
      $('#av-r-titulo').textContent = 'Avaliar ' + fixo.title;
      $('.av-r-fixo').innerHTML = '<div class="av-sheet-place">' + tile(fixo.type) + '<div><b>' + escapeHtml(fixo.title) + '</b><span><span>' + CAT_UM[fixo.cat] + '</span> · <span>' + escapeHtml(fixo.city) + '</span></span></div></div>';
    } else {
      $('#av-r-titulo').textContent = 'Avaliar um lugar';
      rCat = cat; marcarTipo();
      $('#av-r-cidade').value = city || ''; $('#av-r-lugar').value = '';
      sugestoes();
    }
    pintar(0);
    openSheet('av-avaliar');
    sheet.scrollTop = 0;
    setTimeout(function () { (fixo ? picker.querySelector('button') : $('#av-r-cidade').value ? $('#av-r-lugar') : $('#av-r-cidade')).focus({ preventScroll: true }); }, 80);
  }
  sheet.addEventListener('click', function (e) {
    var tipo = e.target.closest('[data-r-cat]');
    if (tipo) { rCat = tipo.dataset.rCat; marcarTipo(); sugestoes(); return; }
    var mini = e.target.closest('[data-principal]');
    if (mini) { var i = +mini.dataset.principal; if (i > 0) { fotos.unshift(fotos.splice(i, 1)[0]); desenharFotos(); } return; }
    var tirar = e.target.closest('[data-tirar]');
    if (tirar) { fotos.splice(+tirar.dataset.tirar, 1); desenharFotos(); }
  });
  $('#av-r-cidade').addEventListener('input', sugestoes);
  $('#av-r-lugar').addEventListener('input', sugestoes);

  /* foto reduzida para 1200 px antes de guardar, para caber no navegador */
  function reduzir(arquivo, pronto) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, 1200 / Math.max(img.width, img.height));
        var tela = document.createElement('canvas'); tela.width = Math.round(img.width * escala); tela.height = Math.round(img.height * escala);
        tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
        pronto(tela.toDataURL('image/jpeg', 0.8));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }
  sheet.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('#av-r-capa input[type="file"]')) return;
    /* mantém a ordem em que a pessoa escolheu: a primeira escolhida é a principal */
    var arquivos = Array.from(e.target.files).slice(0, Math.max(0, MAX_FOTOS - fotos.length));
    var lidas = [], faltam = arquivos.length;
    arquivos.forEach(function (arquivo, i) {
      reduzir(arquivo, function (url) {
        lidas[i] = url;
        if (--faltam === 0) { lidas.forEach(function (u) { if (u && fotos.length < MAX_FOTOS) fotos.push(u); }); desenharFotos(); }
      });
    });
  });

  $('#av-r-publicar').addEventListener('click', function () {
    var texto = $('#av-r-texto').value.trim();
    var categoria = fixo ? fixo.cat : rCat;
    var cidade = fixo ? fixo.city : $('#av-r-cidade').value.trim();
    var titulo = fixo ? fixo.title : $('#av-r-lugar').value.trim();
    if (!cidade || !titulo || !notaEscolhida || !texto) { toast('Preencha a cidade e o lugar, dê a nota e conte como foi'); return; }
    var existe = fixo || lugarExistente(categoria, cidade, titulo);
    var nova = {
      id: 'eu-' + Date.now(), cat: categoria, type: existe ? existe.type : CAT_TIPO[categoria],
      title: existe ? existe.title : titulo, city: existe ? existe.city : cidade,
      iso: existe ? existe.iso : undefined, lat: existe ? existe.lat : undefined, lng: existe ? existe.lng : undefined,
      minutes: existe ? existe.minutes : undefined, meal: existe ? existe.meal : undefined,
      address: existe ? existe.address : ($('#av-r-end').value.trim() || undefined), novo: !existe || undefined,
      rate: notaEscolhida, text: texto, month: $('#av-r-mes').value || currentMonth(), likes: 0,
      by: ME.handle, photo: fotos[0], photos: fotos.length > 1 ? fotos.slice(1) : undefined
    };
    var salvas = OndStore.read('guia_avaliacoes', []); salvas.unshift(nova); OndStore.write('guia_avaliacoes', salvas);
    all = minhas().concat(base);
    agrupar();
    closeSheets();
    cat = categoria; city = nova.city; query = ''; search.value = nova.city;
    document.querySelectorAll('.av-tabs .tab').forEach(function (tab) { var on = tab.dataset.cat === cat; tab.classList.toggle('on', on); tab.setAttribute('aria-selected', String(on)); });
    render();
    var key = chave(nova);
    var cartao = Array.prototype.find.call(list.querySelectorAll('[data-key]'), function (el) { return el.dataset.key === key; });
    if (cartao) { cartao.classList.add('av-novo'); cartao.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    toast(existe ? 'Avaliação publicada no Guia' : 'Lugar novo publicado no Guia');
  });

  /* cliques: avaliar, ver todas, adicionar na viagem (no card e na lista do lugar) */
  document.addEventListener('click', function (e) {
    var botao = e.target.closest('[data-av-avaliar]');
    if (botao) { closeSheets(); var key = botao.getAttribute('data-av-avaliar'); abrir(key ? porChave[key] : null); return; }
    var foto = e.target.closest('[data-av-foto]');
    if (foto && lugarAberto) { ondVerFotos(lugarAberto.fotos, +foto.dataset.avFoto); return; }
    var capa = e.target.closest('[data-av-fotos]');
    if (capa && porChave[capa.dataset.avFotos]) { abrirLista(porChave[capa.dataset.avFotos]); return; }
    var verTodas = e.target.closest('[data-av-ver]');
    if (verTodas && porChave[verTodas.dataset.avVer]) { abrirLista(porChave[verTodas.dataset.avVer]); return; }
    var add = e.target.closest('[data-av-add]');
    if (add && porChave[add.dataset.avAdd] && window.OndAddViagem) { closeSheets(); OndAddViagem.open(OndAddViagem.fromAvaliacao(porChave[add.dataset.avAdd])); }
  });
})();
