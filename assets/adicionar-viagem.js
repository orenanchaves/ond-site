/* "Adicionar na minha viagem": folha que leva um lugar avaliado (lugar, passeio, restaurante ou
   hotel) para um roteiro da conta, escolhendo em que dia entra. Sugere o melhor dia (o dia na
   mesma cidade com menos coisa marcada) e um horário livre. Hotel vira a hospedagem da cidade.
   Grava no mesmo formato da página do roteiro (roteiro.js): OndStore 'roteiro_<id>'.
   Precisa de comunidade.js e de OND_ROTEIROS (roteiros-exemplo.js + viagens-criadas.js).
   Uso: OndAddViagem.open({ title, cat, type, city, lat, lng, minutes, meal }) */
(function () {
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    hotel: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/></svg>',
    passeio: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    praia: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 12a8 8 0 0 1 16 0zM12 12v8"/><path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/></svg>',
    mirante: '<svg viewBox="0 0 24 24" ' + st + '><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trilha: '<svg viewBox="0 0 24 24" ' + st + '><path d="m3 20 6-11 4 6 2-3 6 8z"/><circle cx="16" cy="6" r="2"/></svg>',
    comida: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/></svg>',
    voo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M10.5 13.5 3 11l1-2 8 1 4-5.5a1.8 1.8 0 0 1 2.8 2.2L15 12l1 8-2 1-2.5-7.5"/></svg>',
    mais: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 5v14M5 12h14"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    seta: '<svg viewBox="0 0 24 24" ' + st + '><path d="m10 6 6 6-6 6"/></svg>',
    sugestao: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    salvar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
  };
  var TILE = { voo: '#290756', hotel: '#560fb2', passeio: '#7f11f4', praia: '#0b7a8a', mirante: '#c67810', trilha: '#085e20', comida: '#f59811' };
  var CAT_TYPE = { lugar: 'mirante', passeio: 'passeio', restaurante: 'comida', hotel: 'hotel' };
  var TYPICAL = { passeio: '09:00', trilha: '08:00', praia: '09:00', mirante: '16:30', comida: '12:30' };
  var DURATION = { passeio: 120, trilha: 150, praia: 120, mirante: 60 };
  var WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var NEAR_KM = 50;

  function tile(type, size) {
    return '<span class="av-tile" style="background:' + (TILE[type] || TILE.passeio) + (size ? ';--t:' + size + 'px' : '') + '">' + (I[type] || I.passeio) + '</span>';
  }
  function parse(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function ddmm(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
  function dayShort(iso) { return WEEK[parse(iso).getDay()] + ', ' + ddmm(iso); }
  function range(trip) {
    var a = parse(trip.start), b = parse(trip.end);
    var same = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    return a.getDate() + (same ? '' : ' de ' + MES[a.getMonth()]) + ' a ' + b.getDate() + ' de ' + MES[b.getMonth()] + ' de ' + b.getFullYear();
  }
  function toMin(time) { var p = String(time || '00:00').split(':'); return +p[0] * 60 + (+p[1] || 0); }
  function fromMin(total) { total = Math.max(0, Math.min(23 * 60 + 30, total)); return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0'); }
  function km(a, b) {
    if (a == null || b == null || a.lat == null || b.lat == null) return Infinity;
    var rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  function same(a, b) { return normalizeText(a) === normalizeText(b); }
  function contains(text, part) { return !!part && normalizeText(text).indexOf(normalizeText(part)) >= 0; }

  /* ── viagens: a base de OND_ROTEIROS com o que a pessoa já mudou no roteiro ── */
  var KEYS = ['days', 'saved', 'checklist', 'notes', 'title', 'cover', 'stays', 'transports'];
  function loadTrip(base) {
    var trip = JSON.parse(JSON.stringify(base));
    if (!trip.days || !trip.days.length) {
      trip.days = [];
      for (var cursor = parse(trip.start), stop = parse(trip.end); cursor <= stop; cursor.setDate(cursor.getDate() + 1)) {
        trip.days.push({ date: cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0'), title: '', items: [] });
      }
    }
    var saved = OndStore.read('roteiro_' + trip.id, null);
    if (saved) KEYS.forEach(function (key) { if (saved[key] !== undefined) trip[key] = saved[key]; });
    trip.saved = trip.saved || [];
    return trip;
  }
  function saveTrip(trip) {
    var stored = OndStore.read('roteiro_' + trip.id, null) || {};
    KEYS.forEach(function (key) { if (trip[key] !== undefined) stored[key] = trip[key]; });
    OndStore.write('roteiro_' + trip.id, stored);
  }
  function todayIso() { var now = new Date(); return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'); }
  function myTrips() {
    var today = todayIso();
    return (window.OND_ROTEIROS || []).filter(function (trip) { return trip && trip.id && trip.start && trip.end && trip.end >= today; })
      .sort(function (a, b) { return a.start.localeCompare(b.start); });
  }

  /* ── em que dias a pessoa está na cidade do lugar ── */
  function stayCity(trip, stay) { return stay.city || ((trip.stays || []).length === 1 ? trip.city : ''); }
  function staysIn(trip, place) {
    return (trip.stays || []).filter(function (stay) { return same(stayCity(trip, stay), place.city) || km(stay, place) < NEAR_KM; });
  }
  function dayInCity(trip, day, place) {
    var stays = trip.stays || [];
    for (var index = 0; index < stays.length; index++) {
      var stay = stays[index];
      if (stay.checkIn && day.date >= stay.checkIn && day.date < (stay.checkOut || stay.checkIn) && (same(stayCity(trip, stay), place.city) || km(stay, place) < NEAR_KM)) return true;
    }
    if (contains(day.title, place.city)) return true;
    if (day.items.some(function (item) { return item.type !== 'voo' && (km(item, place) < NEAR_KM || contains(item.title, place.city)); })) return true;
    var cities = stays.map(function (stay) { return stayCity(trip, stay); }).filter(Boolean);
    return !day.items.length && same(trip.city, place.city) && cities.every(function (city) { return same(city, place.city); });
  }

  /* ── horário livre no dia ── */
  function busyOf(day) {
    return day.items.map(function (item) { var start = toMin(item.time); return [start, start + (item.minutes || 60)]; });
  }
  function isFree(busy, start, minutes) { return busy.every(function (slot) { return start + minutes <= slot[0] || start >= slot[1]; }); }
  function inWindow(busy, from, to, prefer, minutes) {
    var options = [];
    for (var time = from; time <= to; time += 30) options.push(time);
    busy.forEach(function (slot) { if (slot[1] >= from && slot[1] <= to) options.push(slot[1]); });
    options.sort(function (a, b) { return Math.abs(a - prefer) - Math.abs(b - prefer) || a - b; });
    for (var index = 0; index < options.length; index++) if (isFree(busy, options[index], minutes)) return options[index];
    return null;
  }
  function afterLast(day, busy) {
    var end = busy.reduce(function (last, slot) { return Math.max(last, slot[1]); }, 0);
    return Math.ceil(end / 30) * 30;
  }
  /* devolve { time, minutes, why } */
  function slotFor(day, place) {
    var type = place.type, busy = busyOf(day);
    if (type === 'comida') {
      var meals = { almoco: { from: 11 * 60 + 30, to: 14 * 60, prefer: 12 * 60 + 30, minutes: 60, why: 'no almoço' }, jantar: { from: 19 * 60, to: 21 * 60 + 30, prefer: 20 * 60, minutes: 90, why: 'no jantar' } };
      var order = place.meal === 'jantar' ? ['jantar', 'almoco'] : ['almoco', 'jantar'];
      for (var index = 0; index < order.length; index++) {
        var meal = meals[order[index]];
        var time = inWindow(busy, meal.from, meal.to, meal.prefer, meal.minutes);
        if (time != null) return { time: fromMin(time), minutes: meal.minutes, why: meal.why };
      }
      return { time: fromMin(afterLast(day, busy)), minutes: 90, why: 'depois do último programa do dia' };
    }
    var minutes = place.minutes || DURATION[type] || 90;
    var typical = toMin(TYPICAL[type] || '10:00');
    if (!day.items.length) return { time: fromMin(typical), minutes: minutes, why: 'com o dia livre' };
    if (isFree(busy, typical, minutes)) return { time: fromMin(typical), minutes: minutes, why: 'num horário livre' };
    var ends = busy.map(function (slot) { return Math.ceil(slot[1] / 30) * 30; }).filter(function (end) { return end >= typical && end <= 21 * 60; }).sort(function (a, b) { return a - b; });
    for (var e = 0; e < ends.length; e++) {
      if (isFree(busy, ends[e], minutes)) {
        var before = day.items.filter(function (item) { return toMin(item.time) + (item.minutes || 60) <= ends[e]; }).pop();
        return { time: fromMin(ends[e]), minutes: minutes, why: before ? 'depois de ' + before.title : 'num horário livre' };
      }
    }
    var last = day.items[day.items.length - 1];
    return { time: fromMin(afterLast(day, busy)), minutes: minutes, why: 'depois de ' + last.title };
  }

  /* ── o melhor dia: na mesma cidade, com menos coisa marcada, sem voo se der ── */
  function suggest(trip, place) {
    var inCity = [];
    trip.days.forEach(function (day, index) { if (dayInCity(trip, day, place)) inCity.push(index); });
    if (!inCity.length) return { inCity: inCity, day: -1 };
    var best = inCity.slice().sort(function (a, b) { return score(trip.days[a]) - score(trip.days[b]) || a - b; })[0];
    return { inCity: inCity, day: best, slot: slotFor(trip.days[best], place) };
  }
  function score(day) {
    var hasFlight = day.items.some(function (item) { return item.type === 'voo'; });
    return day.items.length + (hasFlight ? 3 : 0);
  }
  function whereIs(trip, place) {
    var title = normalizeText(place.title);
    for (var d = 0; d < trip.days.length; d++) {
      if (trip.days[d].items.some(function (item) { return normalizeText(item.title) === title; })) return { day: d };
    }
    if (trip.saved.some(function (item) { return normalizeText(item.title) === title; })) return { saved: true };
    return null;
  }

  /* ── gravar ── */
  function addToDay(trip, dayIndex, place, time, minutes) {
    var day = trip.days[dayIndex];
    var item = { time: time, type: place.type, title: place.title, lat: place.lat, lng: place.lng, minutes: minutes, fonte: 'avaliacoes' };
    var at = day.items.findIndex(function (other) { return toMin(other.time) > toMin(time); });
    if (at < 0) day.items.push(item); else day.items.splice(at, 0, item);
    saveTrip(trip);
    return day.items.indexOf(item);
  }
  function addToSaved(trip, place) {
    var title = normalizeText(place.title);
    if (trip.saved.some(function (item) { return normalizeText(item.title) === title; })) return false;
    trip.saved.push({ type: place.type, title: place.title, lat: place.lat, lng: place.lng });
    saveTrip(trip);
    return true;
  }
  function setStay(trip, place, stay) {
    var old = { lat: stay.lat, lng: stay.lng };
    stay.name = place.title; stay.city = stay.city || place.city; stay.detail = 'A reservar';
    stay.lat = place.lat; stay.lng = place.lng;
    trip.days.forEach(function (day) {
      if (day.date < stay.checkIn || day.date > stay.checkOut) return;
      day.items.forEach(function (item) { if (item.type === 'hotel' && km(item, old) < 1) { item.lat = place.lat; item.lng = place.lng; } });
    });
    saveTrip(trip);
  }
  function newStay(trip, place, inCity) {
    var first = trip.days[inCity[0]].date, last = trip.days[inCity[inCity.length - 1]].date;
    if (last === first && inCity[0] + 1 < trip.days.length) last = trip.days[inCity[0] + 1].date;
    var nights = Math.max(1, Math.round((parse(last) - parse(first)) / 86400000));
    trip.stays = (trip.stays || []).concat([{ name: place.title, city: place.city, checkIn: first, checkOut: last, nights: nights, detail: 'A reservar', lat: place.lat, lng: place.lng }])
      .sort(function (a, b) { return a.checkIn < b.checkIn ? -1 : 1; });
    saveTrip(trip);
  }
  function tripUrl(trip, extra) { return '/explorar/roteiro/?id=' + encodeURIComponent(trip.id) + (extra || ''); }

  /* ── a folha ── */
  var sheet, body, place, trip, plan;
  function ensureSheet() {
    if (sheet) return;
    if (!document.querySelector('.scrim')) { var scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim); }
    sheet = document.createElement('div');
    sheet.className = 'sheet av-sheet';
    sheet.id = 'adicionar-viagem';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'av-sheet-titulo');
    sheet.innerHTML = '<button class="x" data-close aria-label="Fechar">' + ICON.close + '</button><div class="av-sheet-body"></div>';
    document.body.appendChild(sheet);
    body = sheet.querySelector('.av-sheet-body');
    sheet.addEventListener('click', onClick);
    sheet.addEventListener('change', onChange);
  }
  function placeLine() {
    return '<div class="av-sheet-place">' + tile(place.type, 40) + '<div><b>' + escapeHtml(place.title) + '</b><span>' + escapeHtml(place.city) + '</span></div></div>';
  }
  function showTrips() {
    trip = null;
    var trips = myTrips();
    var html = '<h2 id="av-sheet-titulo">Adicionar na minha viagem</h2>' + placeLine();
    if (!trips.length) {
      html += '<p class="av-note">Você ainda não tem uma viagem marcada. Crie uma e volte aqui para encaixar ' + escapeHtml(place.title) + '.</p>' +
        '<div class="sheet-actions"><a class="btn btn-primary" href="/explorar/viagens/nova/">' + I.mais + 'Criar viagem</a></div>';
      body.innerHTML = html; return;
    }
    var withCity = trips.map(function (item) { var loaded = loadTrip(item); return { trip: item, passes: suggest(loaded, place).inCity.length > 0 }; });
    withCity.sort(function (a, b) { return (b.passes ? 1 : 0) - (a.passes ? 1 : 0); });
    html += '<h3 class="av-h3">Em qual viagem?</h3><div class="av-trips">' + withCity.map(function (entry) {
      var item = entry.trip;
      return '<button type="button" class="av-trip" data-av-trip="' + escapeHtml(item.id) + '">' +
        (item.cover ? '<img src="' + escapeHtml(item.cover) + '" alt="" loading="lazy">' : '<span class="av-trip-ph">' + I.pin + '</span>') +
        '<span class="av-trip-txt"><b>' + escapeHtml(item.title) + '</b><small>' + range(item) + '</small>' +
        (entry.passes ? '<span class="av-passa">' + I.pin + 'Passa por ' + escapeHtml(place.city) + '</span>' : '') + '</span>' + I.seta + '</button>';
    }).join('') + '</div>';
    body.innerHTML = html;
  }
  function dayRow(index, chosen) {
    var day = trip.days[index], inCity = plan.inCity.indexOf(index) >= 0;
    var count = day.items.length;
    return '<label class="av-day' + (inCity ? ' na-cidade' : '') + '"><input type="radio" name="av-dia" value="' + index + '"' + (index === chosen ? ' checked' : '') + '>' +
      '<span class="av-day-n">Dia ' + (index + 1) + '</span>' +
      '<span class="av-day-txt"><b>' + dayShort(day.date) + (day.title ? ' · ' + escapeHtml(day.title) : '') + '</b>' +
      '<small>' + (count ? count + (count === 1 ? ' programa' : ' programas') : 'Dia livre') + (inCity ? ' · em ' + escapeHtml(place.city) : '') + '</small></span>' +
      (inCity ? '<span class="av-day-pin" aria-hidden="true">' + I.pin + '</span>' : '') + '</label>';
  }
  function showPlan(id) {
    var base = (window.OND_ROTEIROS || []).find(function (item) { return item.id === id; });
    if (!base) return showTrips();
    trip = loadTrip(base);
    plan = suggest(trip, place);
    var found = whereIs(trip, place);
    var html = '<button type="button" class="av-back" data-av-voltar>' + I.voltar + 'Minhas viagens</button>' +
      '<h2 id="av-sheet-titulo">' + escapeHtml(trip.title) + '</h2>' + placeLine();
    if (found) html += '<p class="av-note">' + (found.saved ? 'Já está nos lugares salvos desta viagem.' : 'Já está no roteiro, no dia ' + (found.day + 1) + '.') + '</p>';
    if (place.type === 'hotel') html += hotelPlan();
    else html += dayPlan();
    html += '<button type="button" class="av-save" data-av-salvar>' + I.salvar + '<span><b>Guardar para encaixar depois</b><small>Vai para os lugares salvos do roteiro</small></span></button>';
    body.innerHTML = html;
  }
  function dayPlan() {
    var html = '';
    if (plan.day >= 0) {
      var day = trip.days[plan.day];
      var why = plan.inCity.length > 1 ? 'O dia com menos programa em ' + place.city : 'O seu dia em ' + place.city;
      html += '<div class="av-suggest">' + '<span class="av-suggest-ico">' + I.sugestao + '</span><div class="av-suggest-txt">' +
        '<b>Dia ' + (plan.day + 1) + ', ' + dayShort(day.date) + ', às ' + plan.slot.time + '</b>' +
        '<small>' + escapeHtml(why + ', ' + plan.slot.why) + '.</small></div>' +
        '<button type="button" class="btn btn-primary" data-av-sugerido>Adicionar no dia ' + (plan.day + 1) + '</button></div>';
    } else {
      html += '<p class="av-note">Essa viagem não passa por ' + escapeHtml(place.city) + '. Escolha um dia ou guarde para encaixar depois.</p>';
    }
    var chosen = plan.day >= 0 ? plan.day : 0;
    var slot = slotFor(trip.days[chosen], place);
    html += '<details class="av-other"' + (plan.day >= 0 ? '' : ' open') + '><summary>Escolher outro dia' + I.seta + '</summary>' +
      '<div class="av-days" role="radiogroup" aria-label="Dia da viagem">' + trip.days.map(function (item, index) { return dayRow(index, chosen); }).join('') + '</div>' +
      '<div class="av-pick"><label for="av-hora">Horário</label><input class="input" type="time" id="av-hora" value="' + slot.time + '" step="900">' +
      '<button type="button" class="btn btn-line" data-av-escolhido>Adicionar no dia ' + (chosen + 1) + '</button></div></details>';
    return html;
  }
  function hotelPlan() {
    var stays = staysIn(trip, place);
    if (stays.length) {
      var stay = stays[0];
      var isSame = same(stay.name, place.title);
      return '<div class="av-suggest av-hotel"><span class="av-suggest-ico">' + I.hotel + '</span><div class="av-suggest-txt">' +
        '<b>Hospedagem em ' + escapeHtml(place.city) + '</b><small>' + (isSame ? 'Já é a sua hospedagem, ' : 'Hoje: ' + escapeHtml(stay.name || 'a definir') + ', ') + ddmm(stay.checkIn) + ' a ' + ddmm(stay.checkOut) + '.</small></div>' +
        (isSame ? '' : '<button type="button" class="btn btn-primary" data-av-hospedagem="' + (trip.stays || []).indexOf(stay) + '">Usar como hospedagem</button>') + '</div>';
    }
    if (plan.inCity.length) {
      var first = trip.days[plan.inCity[0]].date, last = trip.days[plan.inCity[plan.inCity.length - 1]].date;
      return '<div class="av-suggest av-hotel"><span class="av-suggest-ico">' + I.hotel + '</span><div class="av-suggest-txt">' +
        '<b>Hospedagem em ' + escapeHtml(place.city) + '</b><small>A viagem ainda não tem onde ficar em ' + escapeHtml(place.city) + ' (' + ddmm(first) + ' a ' + ddmm(last) + ').</small></div>' +
        '<button type="button" class="btn btn-primary" data-av-nova-hospedagem>Usar como hospedagem</button></div>';
    }
    return '<p class="av-note">Essa viagem não passa por ' + escapeHtml(place.city) + '. Dá para guardar e decidir depois.</p>';
  }
  function done(message, href) {
    closeSheets();
    toast(message, { href: href, label: 'Ver no roteiro' });
  }
  function onChange(event) {
    if (event.target.name !== 'av-dia') return;
    var index = +event.target.value;
    var time = sheet.querySelector('#av-hora');
    if (time) time.value = slotFor(trip.days[index], place).time;
    var button = sheet.querySelector('[data-av-escolhido]');
    if (button) button.textContent = 'Adicionar no dia ' + (index + 1);
  }
  function onClick(event) {
    var target = event.target.closest('[data-av-trip],[data-av-voltar],[data-av-sugerido],[data-av-escolhido],[data-av-salvar],[data-av-hospedagem],[data-av-nova-hospedagem]');
    if (!target) return;
    if (target.dataset.avTrip) return showPlan(target.dataset.avTrip);
    if (target.hasAttribute('data-av-voltar')) return showTrips();
    if (target.hasAttribute('data-av-sugerido')) {
      var at = addToDay(trip, plan.day, place, plan.slot.time, plan.slot.minutes);
      return done(place.title + ' entrou no dia ' + (plan.day + 1) + ', às ' + plan.slot.time, tripUrl(trip, '&dia=' + (plan.day + 1) + '&item=' + (at + 1)));
    }
    if (target.hasAttribute('data-av-escolhido')) {
      var checked = sheet.querySelector('input[name="av-dia"]:checked');
      var index = checked ? +checked.value : 0;
      var time = (sheet.querySelector('#av-hora') || {}).value || slotFor(trip.days[index], place).time;
      var minutes = slotFor(trip.days[index], place).minutes;
      var position = addToDay(trip, index, place, time, minutes);
      return done(place.title + ' entrou no dia ' + (index + 1) + ', às ' + time, tripUrl(trip, '&dia=' + (index + 1) + '&item=' + (position + 1)));
    }
    if (target.hasAttribute('data-av-salvar')) {
      var added = addToSaved(trip, place);
      return done(added ? place.title + ' foi para os lugares salvos' : place.title + ' já estava nos lugares salvos', tripUrl(trip, '&salvos=1'));
    }
    if (target.dataset.avHospedagem != null) {
      setStay(trip, place, trip.stays[+target.dataset.avHospedagem]);
      return done(place.title + ' é a hospedagem em ' + place.city, tripUrl(trip, '&hospedagem=1'));
    }
    if (target.hasAttribute('data-av-nova-hospedagem')) {
      newStay(trip, place, plan.inCity);
      return done(place.title + ' é a hospedagem em ' + place.city, tripUrl(trip, '&hospedagem=1'));
    }
  }

  /* resenha do destino: acha o lugar nas avaliações (tipo e coordenada); senão, deduz pelo nome */
  function guessType(name) {
    var text = normalizeText(name);
    if (/hotel|pousada|hostel|resort|chale/.test(text)) return 'hotel';
    if (/restaurante|bistro|bar |cafe|cervejaria|market|mercado|pizzaria|tasca|padaria|pasteis/.test(text + ' ')) return 'comida';
    if (/miradouro|mirante|vista|cerro|morro/.test(text)) return 'mirante';
    if (/praia|baia/.test(text)) return 'praia';
    if (/trilha/.test(text)) return 'trilha';
    return 'passeio';
  }
  function fromReview(review, city) {
    if (!review || !review.place) return null;
    var match = (window.OND_AVALIACOES || []).find(function (item) { return same(item.title, review.place) && (!city || same(item.city, city.name)); });
    if (match) return fromAvaliacao(match);
    if (!city || city.latitude == null) return null;
    var type = guessType(review.place);
    return { title: review.place, type: type, cat: type === 'hotel' ? 'hotel' : type === 'comida' ? 'restaurante' : 'lugar', city: city.name, lat: city.latitude, lng: city.longitude };
  }
  function fromAvaliacao(item) {
    return { title: item.title, type: item.type || CAT_TYPE[item.cat] || 'passeio', cat: item.cat, city: item.city, lat: item.lat, lng: item.lng, minutes: item.minutes, meal: item.meal };
  }

  window.OndAddViagem = {
    open: function (item) {
      if (!item) return;
      place = Object.assign({}, item, { type: item.type || CAT_TYPE[item.cat] || 'passeio' });
      ensureSheet();
      showTrips();
      openSheet('adicionar-viagem');
      var first = sheet.querySelector('.av-trip, .btn');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
    },
    fromReview: fromReview,
    fromAvaliacao: fromAvaliacao
  };
})();
