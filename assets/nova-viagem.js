/* Página /explorar/viagens/nova/: começar de um roteiro pronto ou em branco, juntar destinos
   (cidades e países) e ver a logística entre eles antes de criar a viagem. */
(function () {
  var root = document.getElementById('nova');
  if (!root) return;
  var DAY = 86400000;
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    mais: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 5v14M5 12h14"/></svg>',
    voo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M10.5 13.5 3 11l1-2 8 1 4-5.5a1.8 1.8 0 0 1 2.8 2.2L15 12l1 8-2 1-2.5-7.5"/></svg>',
    trem: '<svg viewBox="0 0 24 24" ' + st + '><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M9 21l-2-4M15 21l2-4"/><circle cx="9" cy="13.5" r=".6"/><circle cx="15" cy="13.5" r=".6"/></svg>',
    carro: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 16V12l2-5h10l2 5v4M3 16h18v3H3zM5 12h14"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/></svg>',
    cima: '<svg viewBox="0 0 24 24" ' + st + '><path d="m6 15 6-6 6 6"/></svg>',
    baixo: '<svg viewBox="0 0 24 24" ' + st + '><path d="m6 9 6 6 6-6"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M6 6l12 12M18 6 6 18"/></svg>',
    rota: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/></svg>',
    importar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 15V3M7 10l5 5 5-5M5 21h14"/></svg>',
    busca: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  };
  var RAIL = { FRA: 1, CHE: 1, ITA: 1, ESP: 1, PRT: 1, DEU: 1, NLD: 1, BEL: 1, AUT: 1, GBR: 1, JPN: 1, CZE: 1, HUN: 1, DNK: 1, SWE: 1, CHN: 1, KOR: 1 };
  var ISO3 = 'AR:ARG,AT:AUT,AU:AUS,BE:BEL,BO:BOL,BR:BRA,CA:CAN,CH:CHE,CL:CHL,CN:CHN,CO:COL,CR:CRI,CU:CUB,CZ:CZE,DE:DEU,DK:DNK,EC:ECU,EG:EGY,ES:ESP,FI:FIN,FR:FRA,GB:GBR,GR:GRC,HR:HRV,HU:HUN,ID:IDN,IE:IRL,IL:ISR,IN:IND,IS:ISL,IT:ITA,JP:JPN,KR:KOR,MA:MAR,MV:MDV,MX:MEX,MY:MYS,NL:NLD,NO:NOR,NZ:NZL,PA:PAN,PE:PER,PH:PHL,PL:POL,PT:PRT,PY:PRY,SE:SWE,SG:SGP,TH:THA,TR:TUR,US:USA,UY:URY,VN:VNM,ZA:ZAF,AE:ARE';
  var iso2to3 = {}; ISO3.split(',').forEach(function (pair) { pair = pair.split(':'); iso2to3[pair[0]] = pair[1]; });

  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function norm(text) { return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function parse(value) { return new Date(value + 'T12:00:00'); }
  function addDays(value, count) { return iso(new Date(parse(value).getTime() + count * DAY)); }
  function ddmm(value) { var p = value.split('-'); return p[2] + '/' + p[1]; }
  function flag(code) { return code ? '<img class="nv-flag" src="/assets/flags/' + code + '.svg" alt="">' : ''; }
  function hm(hours) { var h = Math.floor(hours), m = Math.round((hours - h) * 60); return h + 'h' + (m ? String(m).padStart(2, '0') : ''); }
  function km(a, b) {
    var rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  /* estimativa do trecho: voo longe, trem entre países com malha boa, carro ou ônibus no resto */
  function hop(a, b) {
    var line = km(a, b), kind = b.via;
    if (!kind) kind = line > 900 ? 'voo' : (RAIL[a.iso] && RAIL[b.iso]) ? 'trem' : line > 500 ? 'voo' : 'carro';
    var dist = kind === 'voo' ? line : line * (kind === 'trem' ? 1.15 : 1.25);
    var hours = kind === 'voo' ? 1 + dist / 750 : kind === 'trem' ? dist / 120 : dist / 75;
    hours = Math.max(.5, Math.round(hours * 2) / 2);
    var label = { voo: 'Voo', trem: 'Trem', carro: 'Carro ou ônibus' }[kind];
    return { kind: kind, km: Math.round(dist / 10) * 10, hours: hours, text: label + ', cerca de ' + hm(hours) + ' · ' + (Math.round(dist / 10) * 10).toLocaleString('pt-BR') + ' km' };
  }

  /* ── estado ── */
  var today = new Date(); today.setHours(12, 0, 0, 0);
  var state = { title: '', titleAuto: true, start: addDays(iso(today), 60), from: 'São Paulo', stops: [], cover: '' };
  function nights() { return state.stops.reduce(function (sum, stop) { return sum + stop.nights; }, 0); }
  function autoTitle() {
    var names = []; state.stops.forEach(function (stop) { if (names.indexOf(stop.city) < 0) names.push(stop.city); });
    var tpls = []; state.stops.forEach(function (stop) { if (stop.from && tpls.indexOf(stop.from) < 0) tpls.push(stop.from); });
    if (tpls.length && state.stops.every(function (stop) { return stop.from; })) return tpls.map(function (id) { return prontos.find(function (tpl) { return tpl.id === id; }).title; }).join(' + ');
    if (names.length > 3) return names[0] + ' a ' + names[names.length - 1];
    return names.length > 2 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names.join(' e ');
  }

  /* ── roteiro gerado a partir das paradas ── */
  function item(time, type, title, place, minutes) { return { time: time, type: type, title: title, lat: place.lat, lng: place.lng, minutes: minutes }; }
  function later(time, minutes) { var p = time.split(':'), t = Math.min(22 * 60, +p[0] * 60 + +p[1] + minutes); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
  function buildTrip() {
    var stops = state.stops, start = state.start, days = [], legs = [], stays = [], cursor = 0;
    var end = addDays(start, nights());
    legs.push({ kind: 'voo', from: state.from || 'Sua cidade', to: stops[0].city, date: start, time: '', arrive: '', detail: 'A reservar', code: '' });
    stops.forEach(function (stop, s) {
      var checkIn = addDays(start, cursor);
      stays.push({ name: 'Hospedagem em ' + stop.city, city: stop.city, checkIn: checkIn, checkOut: addDays(start, cursor + stop.nights), nights: stop.nights, detail: 'A reservar', lat: stop.lat, lng: stop.lng });
      for (var n = 0; n < stop.nights; n++) {
        var day = { date: addDays(start, cursor + n), title: stop.city, items: [] };
        if (n === 0) {
          var arrive = '15:00';
          if (s === 0) day.items.push(item('12:00', 'voo', 'Chegada em ' + stop.city, stop, 60));
          else {
            var prev = stops[s - 1], info = hop(prev, stop), verb = { voo: 'Voo', trem: 'Trem', carro: 'Estrada' }[info.kind];
            day.title = prev.city + ' → ' + stop.city;
            day.items.push(item('09:00', info.kind === 'voo' ? 'voo' : 'passeio', verb + ' de ' + prev.city + ' para ' + stop.city, stop, Math.round(info.hours * 60)));
            arrive = info.hours > 5 ? later('09:00', info.hours * 60 + 30) : '15:00';
            legs.push({ kind: info.kind, from: prev.city, to: stop.city, date: day.date, time: '', arrive: '', detail: info.text, code: '' });
          }
          day.items.push(item(arrive, 'hotel', 'Check-in', stop, 60));
          (stop.dias && stop.dias[0] || []).forEach(function (row) { day.items.push(row); });
          if (stop.titulos && stop.titulos[0] && s === 0) day.title = stop.titulos[0];
        } else if (stop.dias) {
          (stop.dias[n] || []).forEach(function (row) { day.items.push(row); });
          day.title = stop.titulos && stop.titulos[n] || (day.items.length ? stop.city : stop.city + ', dia livre');
        } else {
          (stop.plan && stop.plan[n - 1] || []).forEach(function (row) { day.items.push({ time: row[0], type: row[1], title: row[2], lat: row[3], lng: row[4], minutes: row[5] }); });
          if (!day.items.length) day.title = stop.city + ', dia livre';
        }
        days.push(day);
      }
      cursor += stop.nights;
    });
    var last = stops[stops.length - 1];
    days.push({ date: end, title: 'Volta para casa', items: [item('10:00', 'hotel', 'Check-out', last, 30), item('13:00', 'voo', 'Voo de volta', last, 60)] });
    legs.push({ kind: 'voo', from: last.city, to: state.from || 'Sua cidade', date: end, time: '', arrive: '', detail: 'A reservar', code: '' });
    var countries = []; stops.forEach(function (stop) { if (countries.indexOf(stop.country) < 0) countries.push(stop.country); });
    var me = window.ME || { name: 'Você', initials: 'VC', color: '#7f11f4' };
    return {
      id: 'v-' + Date.now().toString(36), title: state.title.trim() || autoTitle(), created: true,
      country: countries.join(', '), iso: stops[0].iso, city: stops.length === 1 ? stops[0].city : '',
      cover: state.cover || stops.map(function (stop) { return stop.image; }).filter(Boolean)[0] || '',
      start: start, end: end, status: 'planejando',
      people: [{ name: me.name, initials: me.initials, color: me.color || '#7f11f4', role: 'Dono do roteiro' }],
      center: [stops[0].lat, stops[0].lng], zoom: stops.length > 1 ? 5 : 12,
      transports: legs, stays: stays, days: days, checklist: [], saved: []
    };
  }

  /* ── tela ── */
  var meusModelos = window.OndModelos ? OndModelos.listar() : [];
  var comprados = window.OndModelos ? OndModelos.comprados() : [];
  var prontos = meusModelos.concat(window.OND_PRONTOS || []);
  /* modelos à venda de outros viajantes: no protótipo vêm do arquivo de exemplo, só no localhost */
  var exemplo = null;
  if (window.IS_DEMO) {
    exemplo = document.createElement('script'); exemplo.src = '/assets/modelos-exemplo.js';
    exemplo.onload = function () { prontos = meusModelos.concat(window.OND_MODELOS_COMUNIDADE || [], window.OND_PRONTOS || []); renderProntos(); };
    document.head.appendChild(exemplo);
  }
  function comprarModelo(tpl) {
    if (!(window.ondTemConta && window.ondTemConta())) { var pede = document.createElement('button'); pede.hidden = true; pede.setAttribute('data-pede-conta', 'viagens'); document.body.appendChild(pede); pede.click(); pede.remove(); return; }
    var total = tpl.stops.reduce(function (sum, stop) { return sum + stop.nights; }, 0) + 1;
    var box = document.createElement('div'); box.className = 'nv-planos nv-compra'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'nv-compra-t');
    box.innerHTML = '<div class="nv-planos-card"><button type="button" class="nv-login-x" data-compra-fechar aria-label="Fechar">' + I.fechar + '</button>' +
      (coverOf(tpl) ? '<img class="nv-compra-img" src="' + esc(coverOf(tpl)) + '" alt="">' : '') +
      '<h2 id="nv-compra-t">' + esc(tpl.title) + '</h2><p class="nv-planos-sub">Roteiro de ' + esc(tpl.autor) + ' · ' + total + ' dias · ' + tpl.stops.map(function (stop) { return esc(stop.city); }).join(' · ') + '</p>' +
      (tpl.resumo ? '<p class="nv-compra-txt">' + esc(tpl.resumo) + '</p>' : '') +
      '<p class="nv-pl-preco nv-compra-preco"><small>R$</small><b>' + esc(tpl.preco) + '</b></p><small class="nv-pl-nota">Pagamento único. O roteiro fica seu e você muda o que quiser.</small>' +
      '<button type="button" class="nv-pl-btn" data-compra-ok>Comprar roteiro</button>' +
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? '<small class="nv-planos-demo">Compra de teste, sem cobrança.</small>' : '') + '</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('on'); box.querySelector('[data-compra-ok]').focus({ preventScroll: true }); });
    function fechar() { box.classList.remove('on'); setTimeout(function () { box.remove(); }, 250); }
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.closest('[data-compra-fechar]')) return fechar();
      if (event.target.closest('[data-compra-ok]')) { OndModelos.comprar(tpl.id); comprados.push(tpl.id); fechar(); renderProntos(); useTemplate(tpl); }
    });
  }
  var CONTINENTES = ['Europa', 'Ásia', 'América do Sul', 'Brasil', 'América do Norte'];
  var regiao = 'todos', estilo = '';
  function coverOf(tpl) {
    if (tpl.cover) return tpl.cover;
    for (var i = 0; i < tpl.stops.length; i++) {
      var hit = catalog.find(function (city) { return norm(city.name) === norm(tpl.stops[i].city) && city.image; });
      if (hit) return hit.image;
    }
    return '';
  }
  function isClose(tpl) {
    if (tpl.stops.length < 2) return false;
    for (var i = 1; i < tpl.stops.length; i++) if (hop(tpl.stops[i - 1], tpl.stops[i]).km > 600) return false;
    return true;
  }
  function inCategory(tpl) {
    if (tpl.autor) return regiao === 'todos' && !estilo;
    if (regiao !== 'todos' && tpl.continente !== regiao) return false;
    if (!estilo) return true;
    if (estilo === 'perto') return isClose(tpl);
    return (' ' + tpl.estilos + ' ').indexOf(' ' + estilo + ' ') >= 0;
  }
  function renderTema(visivel) {
    var temaEl = document.getElementById('nv-tema'), lista = prontos.filter(function (tpl) { return tpl.tema === 'jogo'; });
    temaEl.hidden = !visivel || !lista.length;
    if (temaEl.hidden) return;
    lista.forEach(function (tpl, index) { tpl.order = index + 1; });
    temaEl.innerHTML = '<div class="nv-tema-topo"><h2 id="nv-tema-t">Grandes Tours pela Autualidade</h2><p>As cidades de verdade que viraram cenário de jogo, passando pelos lugares que você já conhece da tela.</p></div>' +
      '<div class="nv-tema-lista">' + lista.map(prontoCard).join('') + '</div><small class="nv-tema-aviso">O OND não é afiliado a nenhum jogo, editora ou marca.</small>';
  }
  function renderProntos() {
    var destaque = regiao === 'todos' && !estilo;
    renderTema(destaque);
    var shown = prontos.filter(inCategory).filter(function (tpl) { return !(destaque && tpl.tema); });
    shown.forEach(function (tpl, index) { tpl.order = index + 1; });
    grid.innerHTML = '<button type="button" class="nv-pronto nv-branco" data-branco style="--i:0"><span class="nv-branco-ic">' + I.mais + '</span><span class="nv-pronto-txt"><b>Começar em branco</b><small>Escolha os destinos, as noites e a data.</small></span></button>' +
      '<button type="button" class="nv-pronto nv-branco" data-importar style="--i:0"><span class="nv-branco-ic">' + I.importar + '</span><span class="nv-pronto-txt"><b>Importar roteiro' + (window.OndPlano && !OndPlano.premium() ? ' <span class="nv-plano-tag premium">Premium</span>' : '') + '</b><small>Traga um PDF, um texto ou um arquivo e vire roteiro OND.</small></span></button>' +
      shown.map(prontoCard).join('') +
      (shown.length ? '' : '<p class="nv-vazio">Nenhum roteiro pronto com esse filtro. Comece em branco ou troque a região.</p>');
    cats.querySelectorAll('[data-regiao]').forEach(function (button) { button.setAttribute('aria-selected', String(button.dataset.regiao === regiao)); });
    cats.querySelectorAll('[data-cat]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.cat === estilo)); });
  }
  function legendaModelo(tpl) {
    if (!tpl.autor) return '';
    if (!tpl.origem) return (tpl.preco && comprados.indexOf(tpl.id) < 0 ? 'R$ ' + esc(tpl.preco) + ' · ' : 'Comprado · ') + 'por ' + esc(tpl.autor) + ' · ';
    return (tpl.preco ? 'Seu roteiro à venda por R$ ' + esc(tpl.preco) : tpl.publicado ? 'Seu modelo publicado' : 'Seu modelo') + ' · ';
  }
  function prontoCard(tpl) {
    var total = tpl.stops.reduce(function (sum, stop) { return sum + stop.nights; }, 0) + 1;
    var codes = []; tpl.stops.forEach(function (stop) { if (codes.indexOf(stop.iso) < 0) codes.push(stop.iso); });
    return '<button type="button" class="nv-pronto" data-pronto="' + tpl.id + '" style="--i:' + (tpl.order || 0) + '"><span class="nv-pronto-img">' + (coverOf(tpl) ? '<img src="' + esc(coverOf(tpl)) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="nv-pronto-txt"><span class="nv-flags">' + codes.map(flag).join('') + '</span><b>' + esc(tpl.title) + '</b>' +
      '<small>' + legendaModelo(tpl) + total + ' dias · ' + tpl.stops.map(function (stop) { return esc(stop.city); }).join(' · ') + '</small></span></button>';
  }
  root.innerHTML =
    '<h1 class="nv-h1" id="nova-titulo">Nova viagem</h1>' +
    '<p class="nv-sub">Comece de um roteiro pronto ou em branco. Dá para juntar destinos e montar a rota entre eles.</p>' +
    '<div class="nv-filtros" id="nv-cats">' +
    '<div class="nv-regioes" role="tablist" aria-label="Região"><button type="button" role="tab" data-regiao="todos">Todo o mundo</button>' +
    CONTINENTES.map(function (name) { return '<button type="button" role="tab" data-regiao="' + name + '">' + name + '</button>'; }).join('') + '</div>' +
    '<div class="nv-cats" aria-label="Estilo">' +
    (window.OND_ESTILOS || []).map(function (pair) { return '<button type="button" data-cat="' + pair[0] + '">' + pair[1] + '</button>'; }).join('') +
    '<button type="button" data-cat="perto">Perto um do outro</button></div></div>' +
    '<section class="nv-tema" id="nv-tema" aria-labelledby="nv-tema-t"></section>' +
    '<div class="nv-prontos" id="nv-prontos"></div>' +
    '<div class="nv-builder">' +
    '<div class="nv-form">' +
    '<h2 class="nv-h2">Sua viagem</h2>' +
    '<label class="nv-campo"><span>Nome da viagem</span><input class="input" id="nv-titulo" maxlength="60" placeholder="Ex.: Eurotour com a família"></label>' +
    '<div class="nv-linha"><label class="nv-campo"><span>Saindo de</span><input class="input" id="nv-origem" maxlength="40"></label>' +
    '<label class="nv-campo"><span>Data de ida</span><input class="input" type="date" id="nv-data"></label></div>' +
    '<div class="nv-campo"><span>Destinos</span><ol class="nv-paradas" id="nv-paradas"></ol>' +
    '<div class="nv-busca"><span class="nv-busca-ic">' + I.busca + '</span><input class="input" id="nv-busca" autocomplete="off" placeholder="Adicionar cidade ou país" role="combobox" aria-expanded="false" aria-controls="nv-sug"><div class="nv-sug" id="nv-sug" role="listbox" hidden></div></div><div class="nv-perto" id="nv-perto"></div></div>' +
    '<div class="nv-resumo" id="nv-resumo"></div>' +
    '<div class="nv-acoes"><button type="button" class="btn btn-primary" id="nv-criar">Criar viagem</button></div>' +
    '</div>' +
    '<div class="nv-mapa-col"><div class="nv-mapa"><canvas id="nv-globo" aria-label="Globo com a rota da viagem"></canvas></div></div>' +
    '</div>';

  var titleInput = document.getElementById('nv-titulo'), fromInput = document.getElementById('nv-origem'), dateInput = document.getElementById('nv-data');
  var grid = document.getElementById('nv-prontos'), cats = document.getElementById('nv-cats'), near = [];
  var list = document.getElementById('nv-paradas'), search = document.getElementById('nv-busca'), sug = document.getElementById('nv-sug');
  fromInput.value = state.from; dateInput.value = state.start; dateInput.min = iso(today);
  titleInput.addEventListener('input', function () { state.title = titleInput.value; state.titleAuto = !titleInput.value.trim(); });
  fromInput.addEventListener('input', function () { state.from = fromInput.value.trim(); });
  dateInput.addEventListener('change', function () { if (dateInput.value) { state.start = dateInput.value; render(); } });

  var uid = 0, shownIds = {};
  function renderNear() {
    var box = document.getElementById('nv-perto'), last = state.stops[state.stops.length - 1];
    if (!last || !catalog.length) { box.innerHTML = ''; near = []; return; }
    var taken = {}; state.stops.forEach(function (stop) { taken[norm(stop.city)] = true; });
    near = catalog.filter(function (city) { return !taken[norm(city.name)] && city.latitude != null; }).map(function (city) {
      return { city: city.name, country: city.countryName, iso: city.iso, lat: city.latitude, lng: city.longitude, image: city.image, nights: 2 };
    }).map(function (stop) { stop.dist = km(last, stop); return stop; }).filter(function (stop) { return stop.dist < 900 && state.stops.every(function (other) { return km(other, stop) > 30; }); })
      .sort(function (a, b) { return a.dist - b.dist; }).slice(0, 5);
    box.innerHTML = near.length ? '<span>Perto de ' + esc(last.city) + '</span>' + near.map(function (stop, index) {
      return '<button type="button" data-perto="' + index + '">' + I.mais + esc(stop.city) + '<small>' + Math.round(stop.dist / 10) * 10 + ' km</small></button>';
    }).join('') : '';
  }
  function render() {
    state.stops.forEach(function (stop) { if (!stop.uid) stop.uid = ++uid; });
    if (state.titleAuto) titleInput.placeholder = state.stops.length ? autoTitle() : 'Ex.: Eurotour com a família';
    var date = state.start;
    list.innerHTML = state.stops.map(function (stop, index) {
      var html = '';
      if (index > 0) {
        var info = hop(state.stops[index - 1], stop);
        html += '<li class="nv-trecho"><span class="nv-trecho-ic">' + I[info.kind] + '</span><span>' + info.text + '</span><small>' + ddmm(date) + '</small></li>';
      }
      var range = ddmm(date) + ' a ' + ddmm(addDays(date, stop.nights));
      date = addDays(date, stop.nights);
      var fresh = !shownIds[stop.uid];
      return html.replace('<li class="nv-trecho">', '<li class="nv-trecho' + (fresh ? ' nv-novo' : '') + '">') + '<li class="nv-parada' + (fresh ? ' nv-novo' : '') + '"><span class="nv-num">' + (index + 1) + '</span>' + flag(stop.iso) +
        '<span class="nv-parada-txt"><b>' + esc(stop.city) + '</b><small>' + esc(stop.country) + ' · ' + range + '</small></span>' +
        '<span class="nv-noites"><button type="button" data-menos="' + index + '" aria-label="Uma noite a menos em ' + esc(stop.city) + '">−</button><span>' + stop.nights + (stop.nights === 1 ? ' noite' : ' noites') + '</span><button type="button" data-mais="' + index + '" aria-label="Uma noite a mais em ' + esc(stop.city) + '">+</button></span>' +
        '<span class="nv-ordem"><button type="button" data-subir="' + index + '" aria-label="Subir ' + esc(stop.city) + '"' + (index ? '' : ' disabled') + '>' + I.cima + '</button><button type="button" data-descer="' + index + '" aria-label="Descer ' + esc(stop.city) + '"' + (index < state.stops.length - 1 ? '' : ' disabled') + '>' + I.baixo + '</button>' +
        '<button type="button" data-tirar="' + index + '" aria-label="Tirar ' + esc(stop.city) + '">' + I.fechar + '</button></span></li>';
    }).join('') || '<li class="nv-vazio">Escolha um roteiro pronto acima ou adicione o primeiro destino.</li>';
    var resumo = document.getElementById('nv-resumo');
    if (!state.stops.length) resumo.innerHTML = '';
    else {
      var codes = []; state.stops.forEach(function (stop) { if (codes.indexOf(stop.country) < 0) codes.push(stop.country); });
      var cities = []; state.stops.forEach(function (stop) { if (cities.indexOf(stop.city) < 0) cities.push(stop.city); });
      var total = 0; for (var i = 1; i < state.stops.length; i++) total += hop(state.stops[i - 1], state.stops[i]).km;
      resumo.innerHTML = '<span><b>' + (nights() + 1) + '</b> dias</span><span><b>' + cities.length + '</b> ' + (cities.length === 1 ? 'cidade' : 'cidades') + '</span><span><b>' + codes.length + '</b> ' + (codes.length === 1 ? 'país' : 'países') + '</span>' +
        '<span class="nv-datas">' + ddmm(state.start) + ' a ' + ddmm(addDays(state.start, nights())) + (total ? ' · ' + total.toLocaleString('pt-BR') + ' km entre destinos' : '') + '</span>' +
        (state.stops.length > 2 ? '<button type="button" class="tool nv-otimizar" data-otimizar>' + I.rota + 'Ordenar pela rota mais curta</button>' : '');
    }
    shownIds = {}; state.stops.forEach(function (stop) { shownIds[stop.uid] = true; });
    renderNear();
    drawMap();
  }

  /* ── globo com a rota (o mesmo da aba Mundo) ── */
  var globe = null, lastKey = '';
  function drawMap() {
    if (!window.createOndGlobe) return;
    if (!globe) globe = window.createOndGlobe(document.getElementById('nv-globo'), { flightSeconds: 1.6, onPin: function (pin) { globe.flyTo(pin.latitude, pin.longitude, 2.4); } });
    globe.setPins(state.stops.map(function (stop, index) { return { latitude: stop.lat, longitude: stop.lng, label: (index + 1) + '. ' + stop.city }; }));
    globe.setRoute(state.stops.map(function (stop) { return [stop.lat, stop.lng]; }));
    var key = state.stops.map(function (stop) { return stop.lat + ',' + stop.lng; }).join('|');
    if (!state.stops.length || key === lastKey) { lastKey = key; return; }
    lastKey = key;
    var rad = Math.PI / 180, x = 0, y = 0, z = 0;
    state.stops.forEach(function (stop) { var c = Math.cos(stop.lat * rad); x += c * Math.sin(stop.lng * rad); y += Math.sin(stop.lat * rad); z += c * Math.cos(stop.lng * rad); });
    var mid = { lat: Math.atan2(y, Math.sqrt(x * x + z * z)) / rad, lng: Math.atan2(x, z) / rad };
    var spread = state.stops.reduce(function (most, stop) { return Math.max(most, km(mid, stop) / 111); }, 0);
    globe.flyTo(mid.lat, mid.lng, spread < 4 ? 4 : spread < 10 ? 3 : spread < 22 ? 2.2 : spread < 45 ? 1.5 : 1);
  }

  /* ── ações ── */
  function addStop(stop) { state.stops.push(stop); render(); }
  function useTemplate(tpl) {
    var joining = state.stops.length > 0;
    if (!joining) { state.template = tpl; state.cover = tpl.cover; }
    tpl.stops.forEach(function (stop) { state.stops.push(Object.assign({ from: tpl.id }, JSON.parse(JSON.stringify(stop)))); });
    render();
    toast(joining ? tpl.title + ' juntou na sua viagem' : tpl.title + ' entrou na sua viagem');
    var builder = document.querySelector('.nv-builder'), box = builder.getBoundingClientRect();
    if (box.top > innerHeight * 0.7) builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function shortestRoute() {
    var rest = state.stops.slice(1), route = [state.stops[0]];
    while (rest.length) {
      var here = route[route.length - 1], best = 0;
      rest.forEach(function (stop, index) { if (km(here, stop) < km(here, rest[best])) best = index; });
      route.push(rest.splice(best, 1)[0]);
    }
    state.stops = route; render(); toast('Destinos na ordem da rota mais curta');
  }
  root.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    var data = button.dataset;
    if (data.pronto) { var escolhido = prontos.find(function (tpl) { return tpl.id === data.pronto; }); if (escolhido.preco && !escolhido.origem && comprados.indexOf(escolhido.id) < 0) return comprarModelo(escolhido); return useTemplate(escolhido); }
    if (data.importar != null) { if (window.OndPlano && !window.OndPlano.pode('importar')) { window.OndPlano.pedir('importar'); return; } if (window.ondImportar) window.ondImportar.abrir(); return; }
    if (data.branco != null) { search.focus(); search.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (data.mais != null) { state.stops[+data.mais].nights = Math.min(30, state.stops[+data.mais].nights + 1); return render(); }
    if (data.menos != null) { state.stops[+data.menos].nights = Math.max(1, state.stops[+data.menos].nights - 1); return render(); }
    if (data.subir != null) { var a = +data.subir; state.stops.splice(a - 1, 0, state.stops.splice(a, 1)[0]); return render(); }
    if (data.descer != null) { var b = +data.descer; state.stops.splice(b + 1, 0, state.stops.splice(b, 1)[0]); return render(); }
    if (data.tirar != null) {
      var row = button.closest('.nv-parada'); row.classList.add('nv-saindo');
      var prevLeg = row.previousElementSibling; if (prevLeg && prevLeg.classList.contains('nv-trecho')) prevLeg.classList.add('nv-saindo');
      setTimeout(function () { state.stops.splice(+data.tirar, 1); if (!state.stops.length) { state.template = null; state.cover = ''; } render(); }, 220);
      return;
    }
    if (data.regiao || data.cat) { if (data.regiao) { if (data.regiao === regiao) return; regiao = data.regiao; } else estilo = data.cat === estilo ? '' : data.cat; grid.classList.add('nv-trocando'); setTimeout(function () { renderProntos(); grid.classList.remove('nv-trocando'); }, 160); return; }
    if (data.perto != null) { var pick = near[+data.perto]; if (pick) { delete pick.dist; addStop(pick); } return; }
    if (data.otimizar != null) return shortestRoute();
    if (button.id === 'nv-criar') return create();
  });
  function create() {
    if (!(window.ondTemConta && window.ondTemConta())) {
      var trigger = document.createElement('button'); trigger.hidden = true; trigger.setAttribute('data-pede-conta', 'viagens');
      document.body.appendChild(trigger); trigger.click(); trigger.remove(); return;
    }
    if (!state.stops.length) { toast('Adicione pelo menos um destino'); search.focus(); return; }
    if (window.OndPlano && !window.OndPlano.pode('viagens')) { window.OndPlano.pedir('viagens'); return; }
    salvar(buildTrip());
  }
  function salvar(trip) {
    if (!(window.ondTemConta && window.ondTemConta())) {
      var trigger = document.createElement('button'); trigger.hidden = true; trigger.setAttribute('data-pede-conta', 'viagens');
      document.body.appendChild(trigger); trigger.click(); trigger.remove(); return;
    }
    if (window.OndPlano && !window.OndPlano.pode('viagens')) { window.OndPlano.pedir('viagens'); return; }
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem('ond_comunidade_viagens_criadas')) || []; } catch (storageError) {}
    stored.unshift(trip);
    try { localStorage.setItem('ond_comunidade_viagens_criadas', JSON.stringify(stored)); } catch (storageError) { toast('Não deu para salvar neste navegador'); return; }
    location.href = '/explorar/roteiro/?id=' + encodeURIComponent(trip.id);
  }

  /* ── busca de destino: catálogo do OND primeiro, mapa aberto (Photon) para o resto ── */
  var catalog = [], options = [], active = -1, timer = null, seq = 0;
  if (typeof loadCatalog === 'function') loadCatalog().then(function (cities) { catalog = cities; renderProntos(); renderNear(); }).catch(function () {});
  function fromCatalog(query) {
    var q = norm(query);
    return catalog.filter(function (city) { return norm(city.name).indexOf(q) === 0 || norm(city.countryName).indexOf(q) === 0; }).slice(0, 6).map(function (city) {
      return { city: city.name, country: city.countryName, iso: city.iso, lat: city.latitude, lng: city.longitude, image: city.image, nights: 3 };
    });
  }
  function fromPhoton(query) {
    return fetch('https://photon.komoot.io/api/?limit=6&osm_tag=place&q=' + encodeURIComponent(query)).then(function (response) { return response.json(); }).then(function (data) {
      return (data.features || []).filter(function (feature) { return /city|town|village|island|municipality/.test(feature.properties.osm_value || feature.properties.type || ''); }).map(function (feature) {
        var p = feature.properties;
        return { city: p.name, country: p.country || '', iso: iso2to3[p.countrycode] || '', lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0], nights: 2, extra: p.state || '' };
      });
    }).catch(function () { return []; });
  }
  function showOptions() {
    sug.hidden = !options.length; search.setAttribute('aria-expanded', String(!!options.length));
    sug.innerHTML = options.map(function (option, index) {
      return '<button type="button" role="option" data-opcao="' + index + '" aria-selected="' + (index === active) + '">' + flag(option.iso) + '<span><b>' + esc(option.city) + '</b><small>' + esc([option.extra, option.country].filter(Boolean).join(', ')) + '</small></span></button>';
    }).join('');
  }
  function pick(index) {
    var option = options[index]; if (!option) return;
    addStop(option); search.value = ''; options = []; active = -1; showOptions(); search.focus();
  }
  search.addEventListener('input', function () {
    var query = search.value.trim(), mine = ++seq;
    clearTimeout(timer);
    if (query.length < 2) { options = []; showOptions(); return; }
    options = fromCatalog(query); active = -1; showOptions();
    if (options.length >= 4 || query.length < 3) return;
    timer = setTimeout(function () {
      fromPhoton(query).then(function (found) {
        if (mine !== seq) return;
        var seen = {}; options.forEach(function (option) { seen[norm(option.city) + option.iso] = true; });
        options = options.concat(found.filter(function (option) { return !seen[norm(option.city) + option.iso]; })).slice(0, 7);
        showOptions();
      });
    }, 300);
  });
  search.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!options.length) return; active = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length; showOptions(); }
    else if (event.key === 'Enter') { event.preventDefault(); pick(active < 0 ? 0 : active); }
    else if (event.key === 'Escape') { options = []; showOptions(); }
  });
  sug.addEventListener('mousedown', function (event) { var button = event.target.closest('[data-opcao]'); if (button) { event.preventDefault(); pick(+button.dataset.opcao); } });
  search.addEventListener('blur', function () { setTimeout(function () { options = []; showOptions(); }, 150); });

  /* usado pelo importador (importar-roteiro.js) */
  window.ondNovaViagem = {
    catalogo: function () { return catalog; },
    carregar: function (data) {
      state.stops = data.stops; state.template = null; state.cover = data.cover || '';
      if (data.start) { state.start = data.start; dateInput.value = data.start; }
      if (data.from) { state.from = data.from; fromInput.value = data.from; }
      if (data.title) { state.title = data.title; state.titleAuto = false; titleInput.value = data.title; }
      render();
      document.querySelector('.nv-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    salvar: salvar
  };
  var start = new URLSearchParams(location.search).get('pronto');
  var ida = new URLSearchParams(location.search).get('ida');
  if (ida && /^\d{4}-\d{2}-\d{2}$/.test(ida) && ida > iso(today)) { state.start = ida; dateInput.value = ida; }
  renderProntos();
  render();
  function abrirInicial() { var tpl = prontos.find(function (item) { return item.id === start; }); if (!tpl) return false; if (tpl.preco && !tpl.origem && comprados.indexOf(tpl.id) < 0) comprarModelo(tpl); else useTemplate(tpl); return true; }
  if (start && !abrirInicial() && exemplo) exemplo.addEventListener('load', function () { setTimeout(abrirInicial, 0); });
})();
