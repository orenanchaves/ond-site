/* PDF do roteiro: monta o documento A4 a partir do mesmo roteiro da página /explorar/roteiro/
   (OND_ROTEIROS + o que foi editado neste navegador) e imprime. ?id=<roteiro>&imprimir=1 já abre
   a janela de salvar. */
(function () {
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || 'noronha-2027';
  var main = document.getElementById('pdf');
  var base = (window.OND_ROTEIROS || []).find(function (trip) { return trip.id === id; });
  document.getElementById('pdf-voltar').href = '/explorar/roteiro/?id=' + encodeURIComponent(id);
  if (!base) { main.innerHTML = '<p style="text-align:center;padding:80px 0;color:#6b6a6a">Esse roteiro não foi encontrado.</p>'; return; }
  var trip = JSON.parse(JSON.stringify(base));
  var saved = window.OndStore ? OndStore.read('roteiro_' + id, null) : null;
  if (saved) ['days', 'saved', 'checklist', 'notes', 'title', 'cover', 'stays', 'transports'].forEach(function (key) { if (saved[key] !== undefined) trip[key] = saved[key]; });
  var people = (window.OndStore && OndStore.read('roteiro_pessoas_' + id, null)) || trip.people || [];
  if (!trip.days || !trip.days.length) {
    trip.days = [];
    for (var c = new Date(trip.start + 'T12:00:00'), e = new Date(trip.end + 'T12:00:00'); c <= e; c.setDate(c.getDate() + 1)) trip.days.push({ date: c.toISOString().slice(0, 10), title: '', items: [] });
  }

  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    voo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M10.5 13.5 3 11l1-2 8 1 4-5.5a1.8 1.8 0 0 1 2.8 2.2L15 12l1 8-2 1-2.5-7.5"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/></svg>',
    passeio: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    praia: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 12a8 8 0 0 1 16 0zM12 12v8"/><path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/></svg>',
    mirante: '<svg viewBox="0 0 24 24" ' + st + '><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trilha: '<svg viewBox="0 0 24 24" ' + st + '><path d="m3 20 6-11 4 6 2-3 6 8z"/><circle cx="16" cy="6" r="2"/></svg>',
    comida: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/></svg>',
    trem: '<svg viewBox="0 0 24 24" ' + st + '><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M9 21l-2-4M15 21l2-4"/></svg>',
    carro: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2M7.5 13.5h.01M16.5 13.5h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + st + '><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    sol: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    nuvens: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 18z"/></svg>',
    chuva: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>'
  };
  var TILE = { voo: '#290756', hotel: '#560fb2', passeio: '#7f11f4', praia: '#0b7a8a', mirante: '#c67810', trilha: '#085e20', comida: '#f59811', trem: '#290756', carro: '#290756' };
  var DAY_COLORS = ['#7f11f4', '#f59811', '#085e20', '#290756', '#c67810', '#560fb2'];
  var WEEK = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function parse(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function longDate(iso) { var d = parse(iso); return d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function weekDate(iso) { var d = parse(iso); return WEEK[d.getDay()] + ', ' + longDate(iso); }
  function range() {
    var a = parse(trip.start), b = parse(trip.end);
    if (a.getFullYear() !== b.getFullYear()) return longDate(trip.start) + ' de ' + a.getFullYear() + ' a ' + longDate(trip.end) + ' de ' + b.getFullYear();
    if (a.getMonth() === b.getMonth()) return a.getDate() + ' a ' + b.getDate() + ' de ' + MESES[a.getMonth()] + ' de ' + a.getFullYear();
    return longDate(trip.start) + ' a ' + longDate(trip.end) + ' de ' + b.getFullYear();
  }
  function duration(min) { return min >= 60 ? Math.floor(min / 60) + 'h' + (min % 60 ? String(min % 60).padStart(2, '0') : '') : min + ' min'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function logo(cls) { return '<div class="' + cls + '"><svg viewBox="0 0 951.32 497.26" role="img" aria-label="OND"><use href="#ond-logo"/></svg></div>'; }

  /* paradas da viagem: hospedagens (com cidade) ou a cidade do roteiro */
  var stops = [];
  (trip.stays || []).forEach(function (stay) {
    var city = stay.city || trip.city || trip.title;
    var last = stops[stops.length - 1];
    if (last && last.city === city) last.nights += stay.nights || 0;
    else stops.push({ city: city, nights: stay.nights || 0 });
  });
  if (!stops.length) stops.push({ city: trip.city || trip.title, nights: Math.max(0, trip.days.length - 1) });
  var legs = trip.transports || [];
  var countries = {}; if (trip.country) countries[trip.country] = 1;
  (trip.stays || []).forEach(function (stay) { if (stay.country) countries[stay.country] = 1; });
  var nCountries = Object.keys(countries).length || 1;

  function capa() {
    var facts = [[trip.days.length, trip.days.length === 1 ? 'dia' : 'dias'], [stops.length, stops.length === 1 ? 'destino' : 'destinos']];
    if (nCountries > 1) facts.push([nCountries, 'países']);
    var acts = trip.days.reduce(function (sum, day) { return sum + day.items.length; }, 0);
    if (acts) facts.push([acts, acts === 1 ? 'programa' : 'programas']);
    return '<section class="folha capa" data-parte="capa"' + (trip.cover ? ' style="background-image:url(\'' + esc(trip.cover) + '\')"' : '') + '>' +
      logo('capa-logo') +
      '<div><h1 class="capa-titulo">' + esc(trip.title) + '</h1><p class="capa-datas">' + range() + '</p>' +
      '<div class="capa-fatos">' + facts.map(function (f) { return '<div><b>' + f[0] + '</b><span>' + f[1] + '</span></div>'; }).join('') + '</div>' +
      (people.length ? '<div class="capa-pessoas">' + people.map(function (p) { return '<i style="background:' + esc(p.color || '#7f11f4') + '">' + esc(p.initials || (p.name || '?').slice(0, 2)) + '</i>'; }).join('') + '<span>' + people.map(function (p) { return esc((p.name || '').split(' ')[0]); }).join(', ') + '</span></div>' : '') +
      '</div></section>';
  }

  /* mapa desenhado: pontos de cada dia com a cor do dia, sem depender de tiles */
  function mapa() {
    var pts = [];
    trip.days.forEach(function (day, d) { day.items.forEach(function (item) { if (item.lat != null && item.lng != null) pts.push({ lat: +item.lat, lng: +item.lng, d: d }); }); });
    if (pts.length < 2) return '';
    var minLat = Math.min.apply(null, pts.map(function (p) { return p.lat; })), maxLat = Math.max.apply(null, pts.map(function (p) { return p.lat; }));
    var minLng = Math.min.apply(null, pts.map(function (p) { return p.lng; })), maxLng = Math.max.apply(null, pts.map(function (p) { return p.lng; }));
    var W = 720, H = 230, pad = 30, k = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    var spanX = Math.max((maxLng - minLng) * k, 1e-4), spanY = Math.max(maxLat - minLat, 1e-4);
    var scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    var offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2;
    function xy(p) { return [offX + (p.lng - minLng) * k * scale, offY + (maxLat - p.lat) * scale]; }
    var grid = ''; for (var gx = 40; gx < W; gx += 40) grid += '<path d="M' + gx + ' 0V' + H + '"/>'; for (var gy = 40; gy < H; gy += 40) grid += '<path d="M0 ' + gy + 'H' + W + '"/>';
    var paths = '', dots = '';
    trip.days.forEach(function (day, d) {
      var list = pts.filter(function (p) { return p.d === d; }).map(xy), color = DAY_COLORS[d % DAY_COLORS.length];
      if (list.length > 1) paths += '<path d="M' + list.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" opacity=".75"/>';
      list.forEach(function (q) { dots += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="6.5" fill="' + color + '" stroke="#fff" stroke-width="2.5"/>'; });
    });
    var legend = trip.days.map(function (day, d) { return pts.some(function (p) { return p.d === d; }) ? '<span style="display:inline-flex;align-items:center;gap:1.5mm;margin-right:4mm;font-size:8.5pt;color:#6b6a6a"><i style="width:2.6mm;height:2.6mm;border-radius:50%;background:' + DAY_COLORS[d % DAY_COLORS.length] + '"></i>Dia ' + (d + 1) + '</span>' : ''; }).join('');
    return '<div class="mapa"><svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><g stroke="#e8def8" stroke-width="1">' + grid + '</g>' + paths + dots + '</svg></div><div style="margin:-2mm 0 6mm">' + legend + '</div>';
  }

  function visaoGeral() {
    var rota = '<div class="rota">' + stops.map(function (s, i) {
      var hop = i ? '<span class="rota-hop">' + (I[(legs[i] && legs[i].kind)] || I.voo) + '</span>' : '';
      return hop + '<span class="rota-parada"><span class="rota-num">' + (i + 1) + '</span><b>' + esc(s.city) + '</b>' + (s.nights ? '<small>' + plural(s.nights, 'noite', 'noites') + '</small>' : '') + '</span>';
    }).join('') + '</div>';
    var transp = legs.length ? '<div class="cartao cartao-largo"><h3>Transporte</h3>' + legs.map(function (leg, i) {
      var when = longDate(leg.date) + (leg.time ? ', ' + leg.time + (leg.arrive ? ' às ' + leg.arrive : '') : '');
      var label = i === 0 ? 'Ida' : i === legs.length - 1 ? 'Volta' : 'Trecho';
      return '<div class="linha"><span class="linha-ic">' + (I[leg.kind] || I.voo) + '</span><span class="linha-t"><b>' + esc(leg.from) + ' para ' + esc(leg.to) + '</b><small>' + label + ' · ' + when + (leg.detail ? ' · ' + esc(leg.detail) : '') + '</small></span>' + (leg.code ? '<span class="linha-cod">' + esc(leg.code) + '</span>' : '') + '</div>';
    }).join('') + '</div>' : '';
    var hosp = (trip.stays || []).length ? '<div class="cartao cartao-largo"><h3>Hospedagem</h3>' + trip.stays.map(function (stay) {
      return '<div class="linha"><span class="linha-ic">' + I.hotel + '</span><span class="linha-t"><b>' + esc(stay.name) + '</b><small>' + esc(stay.city || trip.city || '') + ' · ' + longDate(stay.checkIn) + ' a ' + longDate(stay.checkOut) + ' · ' + plural(stay.nights, 'noite', 'noites') + (stay.detail ? ' · ' + esc(stay.detail) : '') + '</small>' + enderecoHtml(stay, stay.name) + '</span></div>';
    }).join('') + '</div>' : '';
    var info = trip.destino;
    var saber = info && info.fatos ? '<div class="cartao cartao-largo"><h3>Bom saber</h3><dl class="fatos">' + info.fatos.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl></div>' : '';
    var clima = trip.weather && trip.weather.length ? '<div class="cartao cartao-largo"><h3>Previsão do tempo</h3><div class="clima">' + trip.weather.map(function (w) { return '<div><small>' + parse(w.day).getDate() + '/' + String(parse(w.day).getMonth() + 1).padStart(2, '0') + '</small>' + (I[w.sky] || I.sol) + '<b>' + w.min + '° a ' + w.max + '°</b></div>'; }).join('') + '</div></div>' : '';
    var trans = (trip.transfers || []).length ? '<div class="cartao cartao-largo"><h3>Como circular</h3>' + trip.transfers.map(function (t) { return '<div class="linha"><span class="linha-ic">' + I.carro + '</span><span class="linha-t"><b>' + esc(t.label) + '</b><small>' + esc(t.detail) + '</small></span></div>'; }).join('') + '</div>' : '';
    return '<section class="folha" data-parte="resumo"><div class="folha-in"><div class="sec"><h2 class="sec-t">Visão geral</h2>' +
      (info && info.tagline ? '<p class="sec-sub">' + esc(info.tagline) + '</p>' : '') + rota + mapa() +
      '<div class="grade">' + transp + hosp + trans + saber + clima + '</div></div></div></section>';
  }

  function diaADia() {
    var weather = {}; (trip.weather || []).forEach(function (w) { weather[w.day] = w; });
    return '<section class="folha" data-parte="dias"><div class="folha-in"><h2 class="sec-t">Dia a dia</h2>' + trip.days.map(function (day, d) {
      var color = DAY_COLORS[d % DAY_COLORS.length], w = weather[day.date];
      var head = '<div class="dia-cab"><span class="dia-num" style="background:' + color + '"><b>' + (d + 1) + '</b><small>DIA</small></span><div><h3>' + esc(day.title || 'Dia livre') + '</h3><p>' + weekDate(day.date) + '</p></div>' +
        (w ? '<span class="dia-clima">' + (I[w.sky] || I.sol) + w.min + '° a ' + w.max + '°</span>' : '') + '</div>';
      var items = day.items.length ? day.items.map(function (item) {
        return '<div class="ativ"><div class="ativ-hora"><b>' + esc(item.time || '') + '</b>' + (item.minutes ? '<small>' + duration(item.minutes) + '</small>' : '') + '</div>' +
          '<div class="ativ-ic"><span style="background:' + (TILE[item.type] || '#7f11f4') + '">' + (I[item.type] || I.passeio) + '</span></div>' +
          '<div class="ativ-t"><b>' + esc(item.title) + (item.booked ? '<span class="selo">Reservado</span>' : '') + '</b>' + enderecoHtml(item, item.title) + (item.note ? '<p>' + esc(item.note) + '</p>' : '') + '</div></div>';
      }).join('') : '<p class="dia-vazio">Sem programa marcado. Dia para descobrir sem pressa.</p>';
      return '<article class="dia">' + head + items + '</article>';
    }).join('') + '</div></section>';
  }

  function levar() {
    var list = trip.checklist || [], info = trip.destino || {};
    var check = '<div class="cartao"><h3>O que levar</h3>' + (list.length ? '<ul class="check">' + list.map(function (item) { return '<li class="' + (item.done ? 'feito' : '') + '"><i>' + (item.done ? I.check : '') + '</i>' + esc(item.text) + '</li>'; }).join('') + '</ul>' : '<div class="pautado"></div>') + '</div>';
    var notas = '<div class="cartao"><h3>Anotações</h3>' + (trip.notes ? '<p class="notas">' + esc(trip.notes) + '</p>' : '') + '<div class="pautado" style="margin-top:3mm"></div></div>';
    var dicas = info.dicas && info.dicas.length ? '<div class="cartao"><h3>Dicas</h3><ul class="dicas">' + info.dicas.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '';
    var ver = info.destaques && info.destaques.length ? '<div class="cartao"><h3>Não deixe de ver</h3><ul class="dicas">' + info.destaques.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '';
    var salvos = (trip.saved || []).length ? '<div class="cartao cartao-largo"><h3>Lugares salvos</h3><ul class="dicas">' + trip.saved.map(function (p) { return '<li>' + esc(p.title) + '</li>'; }).join('') + '</ul></div>' : '';
    var tel = info.telefones && info.telefones.length ? '<div class="cartao cartao-largo"><h3>Telefones úteis</h3><div class="tel">' + info.telefones.map(function (t) { return '<span>' + esc(t[0]) + '<b>' + esc(t[1]) + '</b></span>'; }).join('') + '</div></div>' : '';
    return '<section class="folha" data-parte="levar"><div class="folha-in"><h2 class="sec-t">Para não esquecer</h2><div class="grade">' + check + notas + dicas + ver + salvos + tel + '</div>' +
      '<div class="fim">' + logo('fim-logo') + '<b>Viaje mais. Planeje menos.</b><small>ondviajar.com.br</small></div></div></section>';
  }

  /* endereço de cada lugar: o que a pessoa escreveu, senão o Photon (OpenStreetMap) acha pelo nome perto
     do ponto ou pela coordenada. Fica guardado em 'ond-enderecos' para não buscar de novo. */
  var enderecos = [];
  function enderecoHtml(lugar, nome) {
    if (lugar.lat == null || lugar.lng == null) return '';
    var escrito = lugar.address || (lugar.place && lugar.place !== nome ? lugar.place : '');
    var i = enderecos.push({ lat: +lugar.lat, lng: +lugar.lng, nome: nome || '', escrito: escrito }) - 1;
    return '<a class="end" data-end="' + i + '" href="https://www.google.com/maps/search/?api=1&query=' + lugar.lat + ',' + lugar.lng + '">' + esc(escrito) + '</a>';
  }
  function lerCache() { try { return JSON.parse(localStorage.getItem('ond-enderecos')) || {}; } catch (error) { return {}; } }
  function chaveDe(e) { return e.lat.toFixed(5) + ',' + e.lng.toFixed(5) + '|' + e.nome.toLowerCase(); }
  function distKm(a, b) { var r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos((a.lat + b.lat) * r / 2), y = (b.lat - a.lat) * r; return Math.sqrt(x * x + y * y) * 6371; }
  function valido(f) { var pr = f.properties || {}; return pr.osm_key !== 'boundary' && !/timezone/i.test(pr.osm_value + ' ' + (pr.name || '')) && !!(pr.street || pr.city || pr.district || pr.locality); }
  function formatar(pr, nome) {
    var partes = [];
    if (pr.street) partes.push(pr.street + (pr.housenumber ? ', ' + pr.housenumber : ''));
    var bairro = pr.district || pr.locality;
    if (bairro && bairro !== pr.city) partes.push(bairro);
    if (pr.city) partes.push(pr.city); else if (pr.county) partes.push(pr.county);
    if (!pr.street && pr.name && pr.name !== nome && partes.indexOf(pr.name) < 0) partes.unshift(pr.name);
    return partes.join(', ');
  }
  function buscarEndereco(e) {
    var perto = function (f) { return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }; };
    var porNome = e.nome ? fetch('https://photon.komoot.io/api/?lang=default&limit=3&q=' + encodeURIComponent(e.nome) + '&lat=' + e.lat + '&lon=' + e.lng).then(function (r) { return r.json(); })
      .then(function (data) { var hit = (data.features || []).find(function (f) { return valido(f) && distKm(e, perto(f)) < 2; }); return hit ? formatar(hit.properties, e.nome) : ''; }).catch(function () { return ''; }) : Promise.resolve('');
    return porNome.then(function (achado) {
      if (achado) return achado;
      return fetch('https://photon.komoot.io/reverse?lang=default&limit=3&lat=' + e.lat + '&lon=' + e.lng).then(function (r) { return r.json(); })
        .then(function (data) { var f = (data.features || []).filter(valido)[0]; return f ? formatar(f.properties, e.nome) : ''; }).catch(function () { return ''; });
    });
  }
  var enderecosProntos = null;
  function completarEnderecos() {
    var cache = lerCache(), faltam = [], status = document.getElementById('pdf-end-status');
    var por = function (i, texto) { Array.prototype.forEach.call(main.querySelectorAll('[data-end="' + i + '"]'), function (a) { a.textContent = texto; }); };
    enderecos.forEach(function (e, i) {
      if (e.escrito) return;
      var k = chaveDe(e);
      if (cache[k] != null) por(i, cache[k]); else faltam.push(i);
    });
    if (!faltam.length) return Promise.resolve();
    var feitos = 0;
    var aviso = function () { if (status) { status.hidden = false; status.textContent = 'Buscando endereços, ' + feitos + ' de ' + faltam.length; } };
    aviso();
    return faltam.reduce(function (corrente, i) {
      return corrente.then(function () {
        var e = enderecos[i];
        return buscarEndereco(e).then(function (texto) { return texto || new Promise(function (resolve) { setTimeout(resolve, 1500); }).then(function () { return buscarEndereco(e); }); }).then(function (texto) {
          if (texto) cache[chaveDe(e)] = texto; por(i, texto); feitos++; aviso();
          try { localStorage.setItem('ond-enderecos', JSON.stringify(cache)); } catch (error) {}
          return new Promise(function (resolve) { setTimeout(resolve, 250); });
        });
      });
    }, Promise.resolve()).then(function () { if (status) status.hidden = true; });
  }

  main.innerHTML = capa() + visaoGeral() + diaADia() + levar();
  enderecosProntos = completarEnderecos();
  document.title = 'Roteiro ' + trip.title + ' | OND';

  /* rodapé de cada página do PDF: nome da viagem e número da página */
  var foot = document.createElement('style');
  foot.textContent = '@page{@bottom-left{content:"' + trip.title.replace(/"/g, "'") + ' · OND";font:600 8pt Onest,sans-serif;color:#9a93a8;margin-left:15mm}@bottom-right{content:counter(page) " / " counter(pages);font:600 8pt Onest,sans-serif;color:#9a93a8;margin-right:15mm}}@page capa{@bottom-left{content:none}@bottom-right{content:none}}';
  document.head.appendChild(foot);

  /* o que entra no PDF */
  var PARTES = [['capa', 'Capa'], ['resumo', 'Visão geral'], ['dias', 'Dia a dia'], ['levar', 'Para não esquecer']];
  var box = document.getElementById('pdf-opcoes');
  box.innerHTML = PARTES.map(function (p) { return '<label><input type="checkbox" data-parte="' + p[0] + '" checked>' + p[1] + '</label>'; }).join('');
  box.addEventListener('change', function (event) {
    var input = event.target; if (!input.dataset.parte) return;
    if (!box.querySelectorAll('input:checked').length) { input.checked = true; return; }
    main.querySelector('.folha[data-parte="' + input.dataset.parte + '"]').classList.toggle('oculto', !input.checked);
  });

  function ready() {
    var imgs = [];
    if (trip.cover) imgs.push(new Promise(function (resolve) { var img = new Image(); img.onload = img.onerror = resolve; img.src = trip.cover; }));
    var limite = new Promise(function (resolve) { setTimeout(resolve, 30000); });
    return Promise.all(imgs.concat([document.fonts ? document.fonts.ready : Promise.resolve(), Promise.race([enderecosProntos || Promise.resolve(), limite])]));
  }
  document.getElementById('pdf-salvar').addEventListener('click', function () { ready().then(function () { window.print(); }); });
  if (params.get('imprimir') === '1') ready().then(function () { setTimeout(function () { window.print(); }, 250); });
})();
