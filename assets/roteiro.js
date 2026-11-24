/* Página /explorar/roteiro/?id=: o roteiro inteiro, na estrutura do app (Viagem, Orçamento,
   Visão geral, Dia a dia detalhado) com o mapa ao lado e o que vale do Wanderlog: como chegar
   entre paradas, otimizar a ordem do dia, lugares salvos, levar o dia para o Google Maps e
   dividir os gastos. Dados: OND_ROTEIROS (conta de teste) + ajustes guardados neste navegador. */
(function () {
  var root = document.getElementById('roteiro');
  var id = new URLSearchParams(location.search).get('id') || 'noronha-2027';
  var base = (window.OND_ROTEIROS || []).find(function (trip) { return trip.id === id; });
  if (base && (!base.days || !base.days.length)) {
    base.days = [];
    for (var cursor = new Date(base.start + 'T12:00:00'), stop = new Date(base.end + 'T12:00:00'); cursor <= stop; cursor.setDate(cursor.getDate() + 1)) {
      base.days.push({ date: cursor.toISOString().slice(0, 10), title: '', items: [] });
    }
  }
  if (!base || !base.days.length) {
    root.innerHTML = '<p style="padding:80px 0;text-align:center;color:var(--muted)">Esse roteiro não foi encontrado. <a href="/explorar/viagens/" style="color:var(--purple);font-weight:700">Voltar para Minhas viagens</a></p>';
    return;
  }
  var logged = window.ondTemConta && window.ondTemConta();
  var STORE = 'roteiro_' + id;
  var trip = JSON.parse(JSON.stringify(base));
  var saved = OndStore.read(STORE, null);
  if (saved) ['days', 'saved', 'checklist', 'notes', 'title', 'cover', 'stays', 'transports'].forEach(function (key) { if (saved[key] !== undefined) trip[key] = saved[key]; });
  function persist() { OndStore.write(STORE, { days: trip.days, saved: trip.saved, checklist: trip.checklist, notes: trip.notes, title: trip.title, cover: trip.cover, stays: trip.stays, transports: trip.transports }); }

  var DAY_COLORS = ['#7f11f4', '#f59811', '#085e20', '#290756', '#c67810', '#560fb2'];
  var WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var WEEK_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  var MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    semRede: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
    voo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M10.5 13.5 3 11l1-2 8 1 4-5.5a1.8 1.8 0 0 1 2.8 2.2L15 12l1 8-2 1-2.5-7.5"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/></svg>',
    passeio: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    praia: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 12a8 8 0 0 1 16 0zM12 12v8"/><path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/></svg>',
    mirante: '<svg viewBox="0 0 24 24" ' + st + '><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trilha: '<svg viewBox="0 0 24 24" ' + st + '><path d="m3 20 6-11 4 6 2-3 6 8z"/><circle cx="16" cy="6" r="2"/></svg>',
    comida: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/></svg>',
    viagem: '<svg viewBox="0 0 24 24" ' + st + '><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    dinheiro: '<svg viewBox="0 0 24 24" ' + st + '><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    lista: '<svg viewBox="0 0 24 24" ' + st + '><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    calendario: '<svg viewBox="0 0 24 24" ' + st + '><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
    mapa: '<svg viewBox="0 0 24 24" ' + st + '><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    otimizar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 17c4 0 4-10 8-10s4 10 8 10"/><circle cx="4" cy="17" r="1.5"/><circle cx="20" cy="17" r="1.5"/></svg>',
    coracao: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    pessoas: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" ' + st + '><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" ' + st + '><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M12 13v5M9.5 15.5h5"/></svg>',
    sol: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    nuvens: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 18z"/></svg>',
    chuva: '<svg viewBox="0 0 24 24" ' + st + '><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
    sacola: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    carteira: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7zM4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.3"/></svg>',
    carro: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2M7.5 13.5h.01M16.5 13.5h.01"/></svg>',
    porquinho: '<svg viewBox="0 0 24 24" ' + st + '><path d="M18 10V7l-2.5 1.5A7 7 0 0 0 12 7.5c-4 0-7 2.5-7 5.5 0 1.8 1 3.4 2.5 4.4V20h3v-1.6h3V20h3v-2.5c.9-.6 1.6-1.4 2-2.3H21v-3h-1.5c-.3-.8-.8-1.5-1.5-2.2z"/><path d="M15.5 12h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    expandir: '<svg viewBox="0 0 24 24" ' + st + '><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
    recolher: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 10h6V4M20 14h-6v6M10 10 3 3M14 14l7 7"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" ' + st + '><path d="m15 18-6-6 6-6"/></svg>',
    sair: '<svg viewBox="0 0 24 24" ' + st + '><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>',
    convidar: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M6 6l12 12M18 6 6 18"/></svg>',
    seta: '<svg viewBox="0 0 24 24" ' + st + '><path d="m9 6 6 6-6 6"/></svg>',
    sino: '<svg viewBox="0 0 24 24" ' + st + '><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/></svg>',
    musica: '<svg viewBox="0 0 24 24" ' + st + '><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    pasta: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    estimativa: '<svg viewBox="0 0 24 24" ' + st + '><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>',
    lapis: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    lixo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    foto: '<svg viewBox="0 0 24 24" ' + st + '><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    trem: '<svg viewBox="0 0 24 24" ' + st + '><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M9 21l-2-4M15 21l2-4"/></svg>',
    carro: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 16V12l2-5h10l2 5v4M3 16h18v3H3zM5 12h14"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/></svg>',
    mover: '<svg viewBox="0 0 24 24" ' + st + '><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/></svg>',
    cima: '<svg viewBox="0 0 24 24" ' + st + '><path d="m6 15 6-6 6 6"/></svg>',
    baixo: '<svg viewBox="0 0 24 24" ' + st + '><path d="m6 9 6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + st + '><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    telefone: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    whats: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.6-2-1-1 .8c-1-.5-1.9-1.4-2.4-2.4l.8-1-1-2z"/></svg>'
  };
  var TILE = { voo: '#290756', hotel: '#560fb2', passeio: '#7f11f4', praia: '#0b7a8a', mirante: '#c67810', trilha: '#085e20', comida: '#f59811' };

  function parseDate(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function ddmm(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
  function dayLabel(iso) { return WEEK[parseDate(iso).getDay()] + ' | ' + ddmm(iso); }
  function shortDate(iso) { var p = iso.split('-'); return +p[2] + ' ' + MES[+p[1] - 1]; }
  function money(value) { return 'R$ ' + Math.round(value).toLocaleString('pt-BR'); }
  function addMinutes(time, minutes) { var p = time.split(':'); var total = +p[0] * 60 + +p[1] + minutes; return String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0'); }
  function km(a, b) {
    var rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  /* estimativa do trecho: a pé até 1,5 km; acima disso, de carro (como o Wanderlog mostra entre as paradas) */
  function hop(a, b) {
    var distance = km(a, b) * 1.25;
    if (distance < 0.05) return null;
    var walk = distance <= 1.5;
    var minutes = Math.max(2, Math.round(walk ? distance / 4.5 * 60 : distance / 30 * 60 + 3));
    var text = (distance < 1 ? Math.round(distance * 1000 / 10) * 10 + ' m' : distance.toFixed(1).replace('.', ',') + ' km') + ' · ' + minutes + ' min ' + (walk ? 'a pé' : 'de carro');
    return { text: text, mode: walk ? 'walking' : 'driving' };
  }
  function directions(a, b, mode) { return 'https://www.google.com/maps/dir/?api=1&origin=' + a.lat + ',' + a.lng + '&destination=' + b.lat + ',' + b.lng + '&travelmode=' + mode; }
  function dayRoute(day) { return 'https://www.google.com/maps/dir/' + day.items.filter(function (item) { return item.lat; }).map(function (item) { return item.lat + ',' + item.lng; }).join('/'); }
  function avatar(person, size) { return '<span class="avatar" style="--av:' + (size || 32) + 'px;background:' + person.color + '">' + escapeHtml(person.initials) + '</span>'; }
  function weatherOf(iso) { return (trip.weather || []).find(function (item) { return item.day === iso; }); }

  /* ── capa: as informações da viagem em blocos ── */
  function heroFacts() {
    var today = new Date(); today.setHours(12, 0, 0, 0);
    var wait = Math.round((parseDate(trip.start) - today) / 86400000);
    var facts = [[I.calendario, shortDate(trip.start) + ' a ' + shortDate(trip.end), trip.days.length + ' dias']];
    if (wait > 0) facts.push([I.voo, 'Faltam ' + wait + ' dias', 'para embarcar']);
    else if (trip.end >= today.toISOString().slice(0, 10)) facts.push([I.voo, 'Acontecendo agora', 'boa viagem']);
    if (trip.weather && trip.weather.length) {
      var min = Math.min.apply(null, trip.weather.map(function (day) { return day.min; })), max = Math.max.apply(null, trip.weather.map(function (day) { return day.max; }));
      facts.push([I.sol, min + '° a ' + max + '°', 'previsão']);
    }
    facts.push([I.pessoas, (trip.people || []).length + ((trip.people || []).length === 1 ? ' viajante' : ' viajantes'), 'no grupo']);
    return facts.map(function (fact) { return '<span class="rt-fact"><i>' + fact[0] + '</i><span><b>' + fact[1] + '</b><small>' + fact[2] + '</small></span></span>'; }).join('');
  }

  /* ── barra de compra ── */
  function buyBar() {
    var booked = 0;
    trip.days.forEach(function (day) { day.items.forEach(function (item) { if (item.booked) booked++; }); });
    var parts = [];
    var legs = trip.transports || [], stays = trip.stays || [];
    if (legs.length) parts.push(legs.length > 2 ? (legs.length - 2) + (legs.length === 3 ? ' trecho' : ' trechos') + ' entre destinos + ida e volta' : 'Voo ida e volta');
    if (stays.length === 1) parts.push(stays[0].nights + ' noites de hospedagem');
    else if (stays.length) parts.push(stays.reduce(function (sum, stay) { return sum + stay.nights; }, 0) + ' noites de hospedagem em ' + stays.length + ' lugares');
    if (booked) parts.push(booked + (booked === 1 ? ' passeio' : ' passeios'));
    var text = 'Oi! Quero comprar a viagem ' + trip.title + ' (' + shortDate(trip.start) + ' a ' + shortDate(trip.end) + ').';
    return '<section class="rt-buy"><span class="rt-buy-orb" aria-hidden="true"></span><button type="button" class="rt-buy-x" data-acao="fechar-compra" aria-label="Fechar">' + I.fechar + '</button><div class="rt-buy-txt"><b>Quero comprar tudo</b>' +
      '<span>Uma pessoa do OND fecha este roteiro com você, numa compra só.</span>' +
      (parts.length ? '<ul>' + parts.map(function (part) { return '<li>' + I.check + escapeHtml(part) + '</li>'; }).join('') + '</ul>' : '') + '</div>' +
      '<button type="button" class="rt-buy-cta" data-acao="comprar-roteiro">' + I.sacola + '<span>Comprar pelo OND vAI</span>' + I.seta + '</button></section>';
  }
  /* ── Mais: os mesmos itens do app ── */
  function moreMenu() {
    var city = escapeHtml(trip.city || trip.title);
    var rows = [
      ['concierge', VAI_ORB, 'Concierge IA'],
      ['pessoas', I.pessoas, 'Quem vai na viagem'],
      ['personalizar', I.lapis, 'Nome e capa da viagem'],
      ['destino', I.info, 'Informações do destino'],
      ['trilha', I.musica, 'Trilha sonora'],
      ['calendario', I.cal, 'Adicionar ao calendário'],
      ['offline', I.semRede, 'Usar sem internet'],
      ['modelo', I.lista, 'Salvar como modelo'],
      ['pdf', I.pdf, 'Exportar PDF'],
      ['pdf-estimativa', I.estimativa, 'PDF da estimativa de custos'],
      ['notificacoes', I.sino, 'Preferências de notificação'],
      ['documentos', I.pasta, 'Meus documentos']
    ];
    return rows.map(function (row) { return '<button data-acao="' + row[0] + '"><span class="tile">' + row[1] + '</span><span class="rt-menu-t">' + row[2] + '</span>' + I.seta + '</button>'; }).join('');
  }

  /* ── estrutura ── */
  var tab = logged ? 'lista' : 'lista';
  var openDay = 0;
  var people = trip.people || [];
  document.body.classList.add('modo-viagem');
  root.innerHTML =
    '<section class="rt-hero"><img src="' + escapeHtml(trip.cover) + '" alt="">' +
    '<header class="rt-mode"><details class="rt-mode-pop"><summary><span class="rt-dot"></span><b>Modo viagem</b>' + I.baixo + '</summary><div class="rt-mode-menu">' +
      '<a href="/explorar/viagens/">' + I.voltar + 'Voltar para Minhas viagens</a>' +
      '<a href="/explorar/">' + I.passeio + 'Explorar outros destinos</a>' +
      '<button type="button" data-acao="pessoas">' + I.convidar + 'Convidar para a viagem</button>' +
      '<button type="button" class="rt-buy-reabrir" data-acao="abrir-compra">' + I.sacola + 'Comprar tudo</button>' +
      '<a href="/explorar/viagens/" class="rt-mode-sair">' + I.sair + 'Sair do modo viagem</a></div></details></header>' + '<div class="rt-hero-in"><div class="rt-text">' +
    '<div class="rt-meta">' + flagHtml(trip.iso, 22, 15) + escapeHtml(trip.country) + '</div><h1>' + escapeHtml(trip.title) + '</h1>' +
    '<div class="rt-facts">' + heroFacts() + '</div></div></div>' +
    '<button type="button" class="rt-people" data-acao="pessoas"><span class="stack">' + people.map(function (person) { return avatar(person, 30); }).join('') + '</span><span class="rt-people-t">Quem vai na viagem</span></button></section>' +
    buyBar() +
    '<nav class="rt-bar" aria-label="Partes do roteiro">' +
    '<button class="rt-pill" data-tab="viagem">' + I.viagem + 'Viagem</button>' +
    '<button class="rt-pill" data-tab="orcamento">' + I.dinheiro + 'Financeiro</button>' +
    '<button class="rt-pill" data-tab="lista">' + I.lista + 'Visão geral (Todos os dias)</button>' +
    '<button class="rt-pill" data-tab="dias">' + I.calendario + 'Dia a dia detalhado</button>' +
    '<span class="rt-gap"></span>' +
    '<button class="rt-maptoggle" data-acao="modo-lista" aria-pressed="true" aria-label="Esconder o mapa" title="Esconder o mapa">' + I.mapa + '<i class="rt-map-off" aria-hidden="true"></i></button>' +
    '<details class="rt-more"><summary aria-label="Mais ações">' + I.mais + '</summary><div class="rt-menu">' + moreMenu() + '</div></details></nav>' +
    '<div class="rt-body"><div class="rt-main" id="rt-main"></div><div class="rt-map-col"><div class="rt-map-card"><div class="rt-map-head"><div class="rt-legend" id="rt-legend" aria-label="Dias no mapa"></div><button type="button" class="rt-expand" data-acao="expandir-mapa" aria-label="Expandir mapa" title="Expandir mapa">' + I.expandir + '</button></div><div class="rt-map" id="rt-map" aria-label="Mapa do roteiro"></div></div></div></div>' +
    '';
  root.insertAdjacentHTML('beforeend', '<nav class="rt-tabbar" aria-label="Roteiro">' +
    '<button data-tab="lista">' + I.lista + '<span>Lista</span></button>' +
    '<button data-tab="dias">' + I.calendario + '<span>Calendário</span></button>' +
    '<button data-tab="viagem">' + I.voo + '<span>Viagem</span></button>' +
    '<button data-tab="orcamento">' + I.carteira + '<span>Financeiro</span></button>' +
    '<button data-acao="mais">' + I.mais.replace('fill="currentColor"', 'fill="currentColor" style="transform:rotate(90deg)"') + '<span>Mais</span></button></nav>' +
    '<div class="rt-sheet-scrim" data-acao="fechar-mais"></div><div class="rt-sheet" role="dialog" aria-label="Ações rápidas"><h3>Ações rápidas</h3>' + moreMenu() + '</div>' +
    '<div class="rt-modal-scrim" data-acao="fechar-modal"></div><div class="rt-modal" role="dialog" aria-modal="true" aria-labelledby="rt-modal-t"><button class="rt-modal-x" data-acao="fechar-modal" aria-label="Fechar">' + I.fechar + '</button><div class="rt-modal-in"></div></div>');
  root.insertAdjacentHTML('beforeend', '<button type="button" class="rt-map-btn" data-acao="mapa">' + I.mapa + '<span>Ver no mapa</span></button>');
  /* no celular o botão do mapa só aparece depois do topo, para não cobrir os botões do roteiro */
  (function () { var tick = function () { document.body.classList.toggle('rt-rolou', window.scrollY > 380); }; window.addEventListener('scroll', tick, { passive: true }); tick(); })();
  var main = document.getElementById('rt-main');
  var body = root.querySelector('.rt-body');

  /* ── mapa (Leaflet + CARTO) ── */
  var map = null, markers = [], lines = [], lastBounds = null, userMoved = false, mapDay = null;
  function initMap() {
    if (map || !window.L) return;
    map = L.map('rt-map', { zoomControl: true, scrollWheelZoom: true }).setView(trip.center, trip.zoom || 12);
    /* base cinza clara (Esri), para os pinos do roteiro serem o destaque */
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: 'Tiles &copy; Esri' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
    if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); if (lastBounds && !userMoved) map.fitBounds(lastBounds, { padding: [48, 48], maxZoom: 15, animate: false }); }).observe(document.getElementById('rt-map'));
    map.on('dragstart', function () { userMoved = true; });
  }
  function drawMap(onlyDay) {
    initMap();
    if (!map) return;
    markers.forEach(function (marker) { marker.remove(); }); lines.forEach(function (line) { line.remove(); });
    markers = []; lines = [];
    var bounds = [];
    trip.days.forEach(function (day, dayIndex) {
      if (onlyDay != null && dayIndex !== onlyDay) return;
      var color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      var points = [];
      day.items.forEach(function (item, itemIndex) {
        if (!item.lat) return;
        var icon = L.divIcon({ className: '', html: '<div class="pin" data-pin="' + dayIndex + '-' + itemIndex + '" style="background:' + color + '"><span>' + (itemIndex + 1) + '</span></div>', iconSize: [30, 30], iconAnchor: [15, 30] });
        var marker = L.marker([item.lat, item.lng], { icon: icon, title: item.title }).addTo(map).bindPopup('<b>' + escapeHtml(item.title) + '</b><br>' + dayLabel(day.date) + ' · ' + item.time);
        markers.push(marker);
        points.push([item.lat, item.lng]); bounds.push([item.lat, item.lng]);
      });
      if (points.length > 1) lines.push(L.polyline(points, { color: color, weight: 3, opacity: .7, dashArray: '6 8' }).addTo(map));
    });
    if (onlyDay == null) (trip.saved || []).forEach(function (place) {
      var icon = L.divIcon({ className: '', html: '<div class="pin salvo"><span>+</span></div>', iconSize: [30, 30], iconAnchor: [15, 30] });
      markers.push(L.marker([place.lat, place.lng], { icon: icon, title: place.title }).addTo(map).bindPopup('<b>' + escapeHtml(place.title) + '</b><br>Lugar salvo'));
    });
    mapDay = onlyDay; renderLegend();
    lastBounds = bounds.length ? bounds : null; userMoved = false;
    map.invalidateSize();
    if (lastBounds) map.fitBounds(lastBounds, { padding: [48, 48], maxZoom: 15, animate: false });
  }
  function renderLegend() {
    var legend = document.getElementById('rt-legend');
    if (!legend) return;
    legend.innerHTML = '<button data-legenda="" aria-pressed="' + (mapDay == null) + '">Todos os dias</button>' + trip.days.map(function (day, index) {
      if (!logged && index > 0) return '';
      return '<button data-legenda="' + index + '" aria-pressed="' + (mapDay === index) + '"><i style="background:' + DAY_COLORS[index % DAY_COLORS.length] + '"></i>Dia ' + (index + 1) + '</button>';
    }).join('');
  }
  function highlight(key, on) {
    var pin = document.querySelector('[data-pin="' + key + '"]');
    if (pin) pin.classList.toggle('on', on);
  }

  /* ── Visão geral (lista de dias) ── */
  var editMode = false, allOpen = false;
  var listMode = OndStore.read('mapa_escondido', false);
  function activityRow(day, dayIndex, item, itemIndex) {
    var end = item.minutes ? ' - ' + addMinutes(item.time, item.minutes) : '';
    return '<div class="act' + (editMode ? ' editando' : '') + '" data-key="' + dayIndex + '-' + itemIndex + '"' + (editMode ? ' draggable="true"' : '') + '>' + (editMode ? '<span class="drag" aria-hidden="true">' + I.mover + '</span>' : '') + '<span class="act-time"><b>' + item.time + '</b>' + (item.minutes ? '<small>' + (item.minutes >= 60 ? Math.floor(item.minutes / 60) + 'h' + (item.minutes % 60 ? item.minutes % 60 : '') : item.minutes + ' min') + '</small>' : '') + '</span>' + '<span class="tile" style="background:' + (TILE[item.type] || '#7f11f4') + '">' + (I[item.type] || I.passeio) +
      '<span class="num" style="color:' + DAY_COLORS[dayIndex % DAY_COLORS.length] + '">' + (itemIndex + 1) + '</span></span>' +
      '<span class="txt"><b>' + escapeHtml(item.title) + (item.booked ? '<span class="booked">Reservado</span>' : '') + '</b><span class="when">' + item.time + end + '</span>' +
      (item.note ? '<span class="note">' + escapeHtml(item.note) + '</span>' : '') + '</span>' +
      (editMode ? '<span class="move"><button class="act-edit" data-editar-ativ="' + dayIndex + '-' + itemIndex + '" aria-label="Editar ' + escapeHtml(item.title) + '">' + I.lapis + '</button><button data-mover="' + dayIndex + '-' + itemIndex + '--1" aria-label="Mover acima">' + I.cima + '</button><button data-mover="' + dayIndex + '-' + itemIndex + '-1" aria-label="Mover abaixo">' + I.baixo + '</button></span>' : '') + '</div>';
  }
  function renderList() {
    var html = logged ? '<div class="rt-listbar"><button class="tool' + (editMode ? ' on' : '') + '" data-acao="reorganizar">' + (editMode ? I.check + 'Concluir edição' : I.lapis + 'Editar roteiro') + '</button>' + (editMode ? '<button class="tool" data-acao="personalizar">' + I.foto + 'Nome e capa</button>' : '') + '<button class="tool' + (allOpen ? ' on' : '') + '" data-acao="abrir-todos">' + I.lista + (allOpen ? 'Recolher os dias' : 'Abrir todos os dias') + '</button>' + (editMode ? '<span class="rt-edit-hint">Toque no lápis para mudar uma atividade. Arraste ou use as setas para trocar a ordem.</span>' : '') + '</div>' : '';
    if (!logged) html += '<div class="sample"><b>Amostra de 1 dia</b><p>Você está vendo só o primeiro dia. Crie sua conta e veja o roteiro dia a dia, pela viagem toda.</p><button class="btn" data-pede-conta="viagens">Criar conta grátis</button></div>';
    if (trip.saved && trip.saved.length && logged) {
      html += '<div class="saved"><h4>' + I.coracao + 'Lugares salvos para encaixar</h4><div class="saved-grid">' + trip.saved.map(function (place, index) {
        return '<div class="saved-item"><span class="tile" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;background:' + (TILE[place.type] || '#7f11f4') + '">' + (I[place.type] || I.passeio).replace('<svg', '<svg width="18" height="18"') + '</span><b>' + escapeHtml(place.title) + '</b>' +
          '<select data-encaixar="' + index + '" aria-label="Encaixar ' + escapeHtml(place.title) + ' num dia"><option value="">Encaixar no dia...</option>' + trip.days.map(function (day, dayIndex) { return '<option value="' + dayIndex + '">Dia ' + (dayIndex + 1) + ' · ' + ddmm(day.date) + '</option>'; }).join('') + '</select></div>';
      }).join('') + '</div></div>';
    }
    html += '<div class="days-grid">';
    trip.days.forEach(function (day, dayIndex) {
      if (!logged && dayIndex > 0) return;
      var weather = weatherOf(day.date);
      var color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      html += '<article class="day' + (allOpen || dayIndex === openDay ? '' : ' fechado') + '" data-day="' + dayIndex + '">' +
        '<div class="day-head" data-abrir="' + dayIndex + '"><span class="day-dot" style="background:' + color + '"></span><b><span>' + dayLabel(day.date) + '</span> <span class="dt">' + escapeHtml(day.title || 'Dia ' + (dayIndex + 1)) + '</span></b>' +
        (weather ? '<span class="wx">' + weather.min + '° / ' + weather.max + '°</span>' : '') + '<span class="toggle">' + (allOpen || dayIndex === openDay ? '−' : '+') + '</span></div>' +
        '<div class="day-tools">' + (editMode ? '<button class="tool" data-renomear-dia="' + dayIndex + '">' + I.lapis + 'Renomear o dia</button>' : '') + '<button class="tool" data-otimizar="' + dayIndex + '">' + I.otimizar + 'Otimizar a ordem</button>' +
        '<a class="tool" href="' + dayRoute(day) + '" target="_blank" rel="noopener">' + I.mapa + 'Abrir o dia no Google Maps</a>' +
        '<button class="tool" data-so-dia="' + dayIndex + '">' + I.mapa + 'Ver só este dia no mapa</button></div><div class="day-body">';
      if (!day.items.length) html += '<p class="vazio-dia">Esse dia ainda está em branco. Que tal adicionar uma aventura?</p>';
      day.items.forEach(function (item, itemIndex) {
        if (itemIndex > 0) {
          var previous = day.items[itemIndex - 1];
          var leg = previous.lat && item.lat ? hop(previous, item) : null;
          if (leg) html += '<div class="hop">' + leg.text + ' · <a href="' + directions(previous, item, leg.mode) + '" target="_blank" rel="noopener">Como chegar</a></div>';
        }
        html += activityRow(day, dayIndex, item, itemIndex);
      });
      html += '<button class="add-act" data-adicionar-ativ="' + dayIndex + '"><span>+</span>ADICIONAR ATIVIDADE</button></div></article>';
    });
    html += '</div>';
    main.innerHTML = html;
  }

  /* ── Dia a dia detalhado ── */
  var detailDay = 0;
  function renderDays() {
    var day = trip.days[detailDay];
    var html = '<div class="chips">' + trip.days.map(function (item, index) {
      var locked = !logged && index > 0;
      return '<button aria-pressed="' + (index === detailDay) + '" data-dia="' + index + '"' + (locked ? ' data-pede-conta="viagens"' : '') + '>' + WEEK[parseDate(item.date).getDay()].toLowerCase() + ' | ' + ddmm(item.date) + '</button>';
    }).join('') + '</div><div class="chain">';
    day.items.forEach(function (item, index) {
      if (index > 0) html += '<span class="arrow-sep" aria-hidden="true">→</span>';
      var previous = index > 0 ? day.items[index - 1] : null;
      var leg = previous && previous.lat && item.lat ? hop(previous, item) : null;
      html += '<div class="cc"><div class="cc-top"><span class="tile" style="background:' + (TILE[item.type] || '#7f11f4') + '">' + (I[item.type] || I.passeio) + '</span>' +
        '<b>' + escapeHtml(item.title) + '</b><span class="when">' + item.time + (item.minutes ? ' - ' + addMinutes(item.time, item.minutes) : '') + '</span></div>' +
        (leg ? '<div class="cc-how"><h5>COMO CHEGAR</h5><p>' + leg.text + ' desde a parada anterior</p><div>' +
          '<a href="' + directions(previous, item, 'transit') + '" target="_blank" rel="noopener">Transporte público</a>' +
          '<a href="' + directions(previous, item, 'driving') + '" target="_blank" rel="noopener">De carro</a>' +
          '<a href="' + directions(previous, item, 'walking') + '" target="_blank" rel="noopener">A pé</a></div></div>' : '') + '</div>';
    });
    if (!day.items.length) html += '<p class="vazio-dia">Esse dia ainda está em branco. Que tal adicionar uma aventura?</p>';
    main.innerHTML = html + '</div>';
    drawMap(detailDay);
  }

  /* ── Viagem: tudo do app, organizado em Deslocamento, Hospedagem, Documentos, No destino,
     Preparação e Percurso do dia ── */
  var routeDay = null;
  function tripToday() {
    var today = new Date().toISOString().slice(0, 10);
    var index = trip.days.findIndex(function (day) { return day.date === today; });
    return index >= 0 ? index : 0;
  }
  function brochure() {
    var info = trip.destino;
    if (!info) return '';
    return '<div class="panfleto">' +
      '<div class="pf-painel pf-capa"><img src="' + escapeHtml(trip.cover) + '" alt=""><div class="pf-capa-t"><small>Bem-vindo a</small><b>' + escapeHtml(trip.title) + '</b><span>' + escapeHtml(info.tagline) + '</span></div></div>' +
      '<div class="pf-painel"><h4>Bom saber</h4><dl>' + info.fatos.map(function (fact) { return '<div><dt>' + escapeHtml(fact[0]) + '</dt><dd>' + escapeHtml(fact[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
      '<div class="pf-painel"><h4>Não deixe de ver</h4><ol class="pf-lista">' + info.destaques.map(function (place) { return '<li>' + escapeHtml(place) + '</li>'; }).join('') + '</ol>' +
      '<h4>Dicas</h4><ul class="pf-dicas">' + info.dicas.map(function (tip) { return '<li>' + escapeHtml(tip) + '</li>'; }).join('') + '</ul>' +
      '<h4>Telefones úteis</h4><div class="pf-tel">' + info.telefones.map(function (tel) { return '<a href="tel:' + tel[1] + '">' + I.telefone + escapeHtml(tel[0]) + ' <b>' + tel[1] + '</b></a>'; }).join('') + '</div></div></div>';
  }
  var tripSection = 'deslocamento';
  function section(id, icon, title, html) { return '<section class="rt-sec' + (id === tripSection ? ' on' : '') + '" id="sec-' + id + '"><h2 class="rt-sec-t"><span>' + icon + '</span>' + title + '</h2><div class="rt-sec-body">' + html + '</div></section>'; }
  function renderTrip() {
    var first = trip.transports && trip.transports[0], last = trip.transports && trip.transports[trip.transports.length - 1];
    var headline = first && first.time && last.arrive ? shortDate(first.date) + ' | ' + first.time.replace(':', 'h') + ' - ' + shortDate(last.date) + ' | ' + last.arrive.replace(':', 'h') : shortDate(trip.start) + ' - ' + shortDate(trip.end);
    var done = (trip.checklist || []).filter(function (item) { return item.done; }).length;
    var wait = Math.max(0, Math.round((parseDate(trip.start) - new Date()) / 86400000));
    if (routeDay == null) routeDay = tripToday();
    var day = trip.days[routeDay];
    var nav = [['deslocamento', 'Deslocamento'], ['hospedagem', 'Hospedagem'], ['documentos', 'Documentos'], ['destino', 'No destino'], ['preparacao', 'Preparação'], ['percurso', 'Percurso do dia']];
    main.innerHTML =
      '<nav class="rt-secnav" role="tablist" aria-label="Partes da viagem">' + nav.map(function (item) { return '<button type="button" role="tab" data-secao="' + item[0] + '" aria-selected="' + (item[0] === tripSection) + '">' + item[1] + '</button>'; }).join('') + '</nav>' +
      '<div class="trip-row">' + section('deslocamento', I.voo, 'Deslocamento',
        '<div class="rt-card rt-summary"><h3>' + headline + '</h3>' + (trip.transports || []).map(function (leg, index) {
          var legs = trip.transports;
          return '<div class="leg"><span class="tag">' + (index === 0 ? 'IDA' : index === legs.length - 1 ? 'VOLTA' : 'TRECHO') + '</span>' + (I[leg.kind] || I.voo) + '<div><b>' + escapeHtml(leg.from) + ' → ' + escapeHtml(leg.to) + '</b><small>' + ddmm(leg.date) + (leg.time ? ' | ' + leg.time : '') + (leg.detail ? ' · ' + escapeHtml(leg.detail) : '') + '</small></div><span class="code">' + escapeHtml(leg.code) + '</span>' + (logged ? '<button class="leg-edit" data-editar-voo="' + index + '" aria-label="Editar voo">' + I.lapis + '</button>' : '') + '</div>';
        }).join('') + (logged ? '<button class="add-act add-act-escuro" data-editar-voo="novo"><span>+</span>ADICIONAR VOO</button>' : '') + '</div>' +
        '<div class="rt-card"><h3>Ponto de partida &amp; Transporte</h3><div class="minis">' + (trip.transports || []).map(function (leg, index) { return '<div class="mini">' + (I[leg.kind] || I.voo) + (index === 0 ? 'IDA' : index === trip.transports.length - 1 ? 'VOLTA' : escapeHtml(leg.to).toUpperCase()) + '</div>'; }).join('') + '</div>' +
        (trip.transfers || []).map(function (transfer) { return '<div class="row-white" style="margin-top:10px">' + I.carro + '<div><b>' + escapeHtml(transfer.label) + '</b><small>' + escapeHtml(transfer.detail) + '</small></div></div>'; }).join('') + '</div>') +
      '<div class="trip-stack">' + section('hospedagem', I.hotel, 'Hospedagem',
        '<div class="rt-card"><h3>Onde você vai ficar</h3>' + (trip.stays || []).map(function (stay, stayIndex) {
          return '<div class="row-white">' + I.hotel + '<div><b>' + escapeHtml(stay.name) + '</b><small>' + escapeHtml(stay.city || trip.city || '') + '  ' + ddmm(stay.checkIn) + ' - ' + ddmm(stay.checkOut) + ' · ' + stay.nights + ' noites · ' + escapeHtml(stay.detail || '') + '</small></div>' +
            (stay.lat ? '<a class="tool" style="margin-left:auto" href="https://www.google.com/maps/search/?api=1&query=' + stay.lat + ',' + stay.lng + '" target="_blank" rel="noopener">Como chegar</a>' : '') + (logged ? '<button class="stay-edit" data-editar-hosp="' + stayIndex + '" aria-label="Editar hospedagem">' + I.lapis + '</button>' : '') + '</div>';
        }).join('') + '<button class="add-act" data-acao="adicionar-hospedagem"><span>+</span>ADICIONAR HOSPEDAGEM</button></div>') +
      section('documentos', I.pasta, 'Documentos',
        '<div class="rt-card"><h3>Meus documentos</h3>' + docsHtml() + '<label class="add-act" style="cursor:pointer"><span>+</span>ADICIONAR DOCUMENTO<input type="file" hidden data-doc></label></div>') +
      '</div></div>' + section('destino', I.info, 'No destino', brochure() +
        (trip.weather ? '<div class="rt-card"><h3>Previsão do Tempo</h3><div class="weather">' + trip.weather.map(function (item) {
          return '<div>' + WEEK_SHORT[parseDate(item.day).getDay()] + (I[item.sky] || I.sol) + '<b>' + ddmm(item.day) + '</b>' + item.min + '° / ' + item.max + '°</div>';
        }).join('') + '</div></div>' : '') +
        trackCard()) +
      '<div class="trip-row">' + section('preparacao', I.check, 'Preparação',
        '<div class="rt-countdown"><b>' + wait + '</b><span>' + (wait === 1 ? 'dia para a viagem' : 'dias para a viagem') + '</span><small>' + done + ' de ' + (trip.checklist || []).length + ' itens do checklist prontos</small></div>' +
        '<div class="rt-card"><h3>Checklist <span class="count">' + done + '/' + (trip.checklist || []).length + '</span></h3><div id="checklist">' + (trip.checklist || []).map(function (item, index) {
          return '<div class="check' + (item.done ? ' done' : '') + '"><button class="box" data-check="' + index + '" aria-label="Marcar ' + escapeHtml(item.text) + '"></button><span>' + escapeHtml(item.text) + '</span><button class="rm" data-rm="' + index + '" aria-label="Remover">(X)</button></div>';
        }).join('') + '</div><form class="add-row" id="add-check"><input placeholder="Adicionar item" aria-label="Adicionar item ao checklist"><button class="btn btn-primary btn-sm">Adicionar item</button></form></div>' +
        '<div class="rt-card"><h3>Anotações</h3><textarea class="notes" placeholder="Escreva suas anotações aqui..." aria-label="Anotações">' + escapeHtml(trip.notes || '') + '</textarea></div>') +
      section('percurso', I.mapa, 'Percurso do dia',
        '<div class="chips">' + trip.days.map(function (item, index) { return '<button aria-pressed="' + (index === routeDay) + '" data-percurso="' + index + '">Dia ' + (index + 1) + ' · ' + ddmm(item.date) + '</button>'; }).join('') + '</div>' +
        '<div class="rt-card rt-route"><h3>' + dayLabel(day.date) + ' ' + escapeHtml(day.title || '') + '</h3>' + day.items.map(function (item, index) {
          var previous = index > 0 ? day.items[index - 1] : null, leg = previous && previous.lat && item.lat ? hop(previous, item) : null;
          return (leg ? '<div class="hop">' + leg.text + ' · <a href="' + directions(previous, item, leg.mode) + '" target="_blank" rel="noopener">Como chegar</a></div>' : '') +
            '<div class="route-item"><span class="route-time">' + item.time + '</span><span class="route-dot" style="background:' + DAY_COLORS[routeDay % DAY_COLORS.length] + '"></span><b>' + escapeHtml(item.title) + '</b></div>';
        }).join('') + '<a class="tool" style="margin-top:12px" href="' + dayRoute(day) + '" target="_blank" rel="noopener">' + I.mapa + 'Abrir o percurso no Google Maps</a></div>') + '</div>';
    var notes = main.querySelector('.notes');
    notes.addEventListener('input', function () { trip.notes = notes.value; persist(); });
    main.querySelector('#add-check').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = event.target.querySelector('input');
      if (!input.value.trim()) return;
      trip.checklist.push({ text: input.value.trim(), done: false }); persist(); renderTrip(); goSection('preparacao');
    });
    main.querySelector('[data-doc]').addEventListener('change', function (event) {
      var file = event.target.files[0]; if (!file) return;
      trip.documents = trip.documents || []; trip.documents.push({ name: file.name, kind: 'doc' }); persist(); renderTrip(); goSection('documentos');
      toast(file.name + ' guardado nos documentos da viagem');
    });
    drawMap(routeDay);
  }
  function trackCard() {
    var city = escapeHtml(trip.city || trip.title);
    var info = (trip.destino && trip.destino.trilha) || { clima: '', estilos: [] };
    var query = encodeURIComponent((trip.city || trip.title) + ' playlist');
    return '<div class="trilha"><div class="trilha-capa"><img src="' + escapeHtml(trip.cover) + '" alt=""><span class="trilha-disco" aria-hidden="true"></span></div>' +
      '<div class="trilha-info"><small>Trilha sonora</small><b>' + city + '</b>' + (info.clima ? '<span>' + escapeHtml(info.clima) + '</span>' : '') +
      '<div class="trilha-estilos">' + info.estilos.map(function (style) { return '<i>' + escapeHtml(style) + '</i>'; }).join('') + '</div>' +
      '<div class="trilha-eq" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div>' +
      '<div class="trilha-acoes"><a class="trilha-play" href="https://open.spotify.com/search/' + encodeURIComponent(trip.city || trip.title) + '/playlists" target="_blank" rel="noopener">' + I.play + 'Ouvir no Spotify</a>' +
      '<a class="trilha-alt" href="https://music.youtube.com/search?q=' + query + '" target="_blank" rel="noopener">YouTube Music</a></div></div></div>';
  }
  function docsHtml() {
    var docs = trip.documents || [];
    if (!docs.length) return '<p class="vazio-dia">Ainda não guardei nenhum documento seu. Me manda as passagens e reservas no OND vAI.</p>';
    return docs.map(function (doc) { return '<div class="row-white doc-row">' + (I[doc.kind] || I.doc) + '<div><b>' + escapeHtml(doc.name) + '</b><small>' + ({ voo: 'Passagem', hotel: 'Hospedagem', passeio: 'Passeio' }[doc.kind] || 'Documento') + '</small></div></div>'; }).join('');
  }
  function goSection(id) {
    tripSection = id;
    root.querySelectorAll('.rt-sec').forEach(function (element) { element.classList.toggle('on', element.id === 'sec-' + id); });
    root.querySelectorAll('[data-secao]').forEach(function (button) { button.setAttribute('aria-selected', String(button.dataset.secao === id)); });
    var nav = root.querySelector('.rt-secnav');
    if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Orçamento ── */
  var budgetMode = 'estimado', splitBy = Math.max(1, people.length);
  function donut(parts) {
    var total = parts.reduce(function (sum, part) { return sum + part.value; }, 0) || 1, start = 0, r = 70, c = 2 * Math.PI * r;
    var colors = ['#290756', '#f59811', '#11f558', '#085e20', '#c67810', '#7f11f4'];
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Gastos por categoria"><circle cx="100" cy="100" r="' + r + '" fill="none" stroke="#f3ecff" stroke-width="34"/>' + parts.map(function (part, index) {
      var length = part.value / total * c;
      var svg = '<circle cx="100" cy="100" r="' + r + '" fill="none" stroke="' + colors[index % colors.length] + '" stroke-width="34" stroke-dasharray="' + length + ' ' + (c - length) + '" stroke-dashoffset="' + (-start) + '" transform="rotate(-90 100 100)"/>';
      start += length; return svg;
    }).join('') + '</svg>';
  }
  function renderBudget() {
    var expenses = trip.expenses || [];
    if (!expenses.length) { main.innerHTML = '<div class="sample" style="background:#fff;border-color:var(--border)"><p>Quer saber quanto essa viagem vai custar? Solicite uma estimativa ou comece a registrar seus gastos reais.</p><button class="btn btn-primary" data-acao="concierge">Solicitar estimativa</button></div>'; return; }
    var colors = ['#290756', '#f59811', '#11f558', '#085e20', '#c67810', '#7f11f4'];
    var key = budgetMode === 'estimado' ? 'planned' : 'paid';
    var total = expenses.reduce(function (sum, item) { return sum + item[key]; }, 0);
    var parts = expenses.map(function (item) { return { label: item.cat, value: item[key] }; }).filter(function (part) { return part.value > 0; });
    var nights = (trip.stays && trip.stays[0] && trip.stays[0].nights) || trip.days.length;
    var html = '<div class="fin-tabs"><button data-modo="estimado" aria-pressed="' + (budgetMode === 'estimado') + '">ESTIMADO</button><button data-modo="real" aria-pressed="' + (budgetMode === 'real') + '">REAL</button></div><div class="fin-grid"><div class="fin-col">';
    if (budgetMode === 'estimado') {
      html += '<section class="total"><small>Total estimado</small><div class="big">' + money(total) + '</div>' +
        '<div class="split"><span class="split-t"><small>Dividindo entre ' + splitBy + '</small><b>' + money(total / splitBy) + ' por pessoa</b></span>' +
        '<span class="step"><button data-split="-1" aria-label="Menos uma pessoa">−</button><b>' + splitBy + '</b><button data-split="1" aria-label="Mais uma pessoa">+</button></span></div></section>';
      if (trip.onTrip && trip.onTrip.length) {
        html += '<section class="ontrip"><div class="ontrip-h"><span class="ontrip-ic">' + I.porquinho + '</span><span><b>Gastos na viagem</b><small>O que você vai gastar lá durante</small></span></div>' +
          '<p class="ontrip-note">' + I.info + 'Isto não entra na compra. É só uma previsão.</p>' +
          trip.onTrip.map(function (item) { return '<div class="ontrip-row"><span class="ontrip-row-ic">' + (I[item.icon] || I.mais) + '</span><span>' + escapeHtml(item.cat) + '</span><b>~' + money(item.value) + '</b></div>'; }).join('') +
          '<p class="daily">Sugestão de gasto diário: ' + money(trip.onTrip.reduce(function (sum, item) { return sum + item.value; }, 0) / trip.days.length) + ' por dia</p></section>';
      }
    } else {
      html += '<section class="total real"><small>Total gasto</small><div class="big">' + money(total) + '</div><div class="split"><span>de ' + money(expenses.reduce(function (sum, item) { return sum + item.planned; }, 0)) + ' estimados</span></div></section>';
    }
    html += '</div><div class="fin-col"><section class="cats"><h4 class="cats-t">' + (budgetMode === 'estimado' ? 'Para onde vai o dinheiro' : 'Por categoria') + '</h4><div class="cats-in">' + donut(parts) + '<div>' + parts.map(function (part, index) {
      return '<div class="cat"><i style="background:' + colors[index % colors.length] + '"></i>' + escapeHtml(part.label) + '<small>' + Math.round(part.value / (total || 1) * 100) + '%</small><b>' + money(part.value) + '</b></div>';
    }).join('') + '</div></div></section>';
    if (budgetMode === 'real' && people.length > 1) {
      var paidBy = {};
      people.forEach(function (person) { paidBy[person.name] = 0; });
      expenses.forEach(function (item) { if (item.by && item.paid) paidBy[item.by] = (paidBy[item.by] || 0) + item.paid; });
      var share = total / people.length;
      html += '<section class="balance"><h4>Quem pagou o quê</h4>' + people.map(function (person) {
        var diff = paidBy[person.name] - share;
        return '<div class="bal">' + avatar(person, 32) + escapeHtml(person.name) + ' pagou ' + money(paidBy[person.name]) + '<b class="' + (diff >= 0 ? 'pos' : 'neg') + '">' + (diff >= 0 ? 'recebe ' : 'deve ') + money(Math.abs(diff)) + '</b></div>';
      }).join('') + '</section>';
    }
    main.innerHTML = html + '</div></div>';
    drawMap(null);
  }

  /* ── abas e ações ── */
  function setTab(next) {
    if (!logged && (next === 'viagem' || next === 'orcamento')) { window.ondLogin && window.ondLogin('viagens'); return; }
    tab = next;
    root.querySelectorAll('.rt-pill, .rt-tabbar [data-tab]').forEach(function (pill) { pill.setAttribute('aria-pressed', String(pill.dataset.tab === tab)); });
    root.classList.remove('mais-aberto');
    var bar = root.querySelector('.rt-bar'); if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
    body.classList.toggle('sem-mapa', tab === 'orcamento' || listMode);
    body.classList.toggle('mapa-ao-lado', !(tab === 'orcamento' || listMode));
    if (tab === 'lista') { renderList(); drawMap(openDay >= 0 ? openDay : null); }
    if (tab === 'dias') renderDays();
    if (tab === 'viagem') renderTrip();
    if (tab === 'orcamento') renderBudget();
  }
  function optimize(dayIndex) {
    var day = trip.days[dayIndex];
    var fixedFirst = day.items[0], fixedLast = day.items[day.items.length - 1].type === 'voo' ? day.items[day.items.length - 1] : null;
    var rest = day.items.slice(1, fixedLast ? -1 : undefined);
    var before = rest.map(function (item) { return item.title; }).join('|');
    var ordered = [fixedFirst], current = fixedFirst;
    while (rest.length) {
      rest.sort(function (a, b) { return km(current, a) - km(current, b); });
      current = rest.shift(); ordered.push(current);
    }
    if (fixedLast) ordered.push(fixedLast);
    var times = day.items.map(function (item) { return item.time; });
    ordered.forEach(function (item, index) { item.time = times[index]; });
    day.items = ordered;
    persist();
    renderList(); drawMap(null);
    toast(before === ordered.slice(1, fixedLast ? -1 : undefined).map(function (item) { return item.title; }).join('|') ? 'Esse dia já está na melhor ordem' : 'Ordem do dia ' + (dayIndex + 1) + ' ajustada pela distância');
  }
  root.addEventListener('click', function (event) {
    var secButton = event.target.closest('[data-secao]');
    if (secButton) return smooth(function () { goSection(secButton.dataset.secao); });
    var legendButton = event.target.closest('[data-legenda]');
    if (legendButton) return drawMap(legendButton.dataset.legenda === '' ? null : +legendButton.dataset.legenda);
    var target = event.target.closest('[data-tab],[data-abrir],[data-otimizar],[data-so-dia],[data-dia],[data-modo],[data-split],[data-check],[data-rm],[data-acao],[data-percurso],[data-mover],[data-pref],[data-remover-pessoa],[data-adicionar-ativ],[data-editar-ativ],[data-renomear-dia],[data-editar-voo],[data-editar-hosp]');
    if (!target) return;
    if (target.dataset.tab) return smooth(function () { setTab(target.dataset.tab); });
    if (target.dataset.abrir != null) { openDay = openDay === +target.dataset.abrir ? -1 : +target.dataset.abrir; renderList(); return drawMap(openDay >= 0 ? openDay : null); }
    if (target.dataset.otimizar != null) return optimize(+target.dataset.otimizar);
    if (target.dataset.soDia != null) return drawMap(+target.dataset.soDia);
    if (target.dataset.dia != null) { detailDay = +target.dataset.dia; return renderDays(); }
    if (target.dataset.modo) { budgetMode = target.dataset.modo; return renderBudget(); }
    if (target.dataset.split) { splitBy = Math.min(30, Math.max(1, splitBy + +target.dataset.split)); return renderBudget(); }
    if (target.dataset.check != null) { var item = trip.checklist[+target.dataset.check]; item.done = !item.done; persist(); renderTrip(); return goSection('preparacao'); }
    if (target.dataset.rm != null) { trip.checklist.splice(+target.dataset.rm, 1); persist(); renderTrip(); return goSection('preparacao'); }
    if (target.dataset.percurso != null) { routeDay = +target.dataset.percurso; renderTrip(); return goSection('percurso'); }
    if (target.dataset.mover) { var mv = target.dataset.mover.split('-'); return moveItem(+mv[0], +mv[1], +mv[0], +mv[1] + (mv[2] === '' ? -1 : +mv[2])); }
    if (target.dataset.pref) { var prefs = trip.notas_prefs = trip.notas_prefs || {}; prefs[target.dataset.pref] = !prefs[target.dataset.pref]; persist(); return openModal('notificacoes'); }
    if (target.dataset.removerPessoa != null) { people.splice(+target.dataset.removerPessoa, 1); persistPeople(); return openModal('pessoas'); }
    var action = target.dataset.acao;
    if (action === 'mais') { root.classList.add('mais-aberto'); return; }
    if (action === 'mapa') return toggleMap();
    if (action === 'fechar-mais') { root.classList.remove('mais-aberto'); return; }
    root.classList.remove('mais-aberto');
    var menu = target.closest('details'); if (menu) menu.open = false;
    if (action === 'fechar-modal') return closeModal();
    if (action === 'fechar-compra' || action === 'abrir-compra') { var fechada = action === 'fechar-compra'; root.classList.toggle('compra-fechada', fechada); OndStore.write('compra_fechada_' + id, fechada); return; }
    if (action === 'expandir-mapa') return toggleMap();
    if (action === 'reorganizar') { editMode = !editMode; renderList(); return; }
    if (action === 'abrir-todos') { allOpen = !allOpen; renderList(); return drawMap(allOpen ? null : (openDay >= 0 ? openDay : null)); }
    if (action === 'modo-lista') return smooth(function () { toggleListMode(); });
    if (action === 'destino') { setTab('viagem'); return setTimeout(function () { goSection('destino'); }, 80); }
    if (action === 'trilha') { setTab('viagem'); return setTimeout(function () { goSection('destino'); var card = root.querySelector('.trilha'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80); }
    if (action === 'calendario') return downloadIcs();
    if (action === 'pdf') { location.href = '/explorar/roteiro/pdf/?id=' + encodeURIComponent(id); return; }
    if (action === 'pdf-estimativa') { setTab('orcamento'); return setTimeout(function () { window.print(); }, 300); }
    if (action === 'notificacoes' || action === 'pessoas') return openModal(action);
    if (action === 'modelo') return logged ? openModal('modelo') : askAccount();
    if (action === 'offline') { if (!logged) return askAccount(); if (window.OndPlano && !OndPlano.premium()) return OndPlano.pedir('offline'); return carregarOffline(function () { openModal('offline'); }); }
    if (action === 'adicionar-hospedagem') return logged ? editStay(null) : askAccount();
    if (action === 'personalizar') return logged ? editLook() : askAccount();
    if (action === 'compartilhar') { shareLink('Roteiro: ' + trip.title, 'Olha o roteiro de ' + trip.title + ' (' + shortDate(trip.start) + ' a ' + shortDate(trip.end) + ') que montei no OND.', location.origin + '/explorar/roteiro/?id=' + encodeURIComponent(trip.id)); return; }
    if (action === 'comprar-roteiro') {
      var cidades = []; (trip.stays || []).forEach(function (stay) { var c = stay.city || trip.city; if (c && cidades.indexOf(c) < 0) cidades.push(c); });
      var pessoas = (trip.people || []).length;
      var frase = 'Quero comprar a viagem ' + trip.title + ', de ' + shortDate(trip.start).toLowerCase() + ' a ' + shortDate(trip.end).toLowerCase() + (cidades.length ? ', passando por ' + cidades.join(', ') : '') + (pessoas ? ', para ' + pessoas + (pessoas > 1 ? ' pessoas' : ' pessoa') : '') + '. Saindo de ' + ((trip.transports && trip.transports[0] && trip.transports[0].from) || 'São Paulo') + '.';
      if (window.ondOpenVai) window.ondOpenVai(null, frase);
      return;
    }
    if (action === 'concierge') { if (window.ondOpenVai) window.ondOpenVai(); return; }
    if (action === 'documentos') { setTab('viagem'); return setTimeout(function () { goSection('documentos'); }, 80); }
    if (target.dataset.adicionarAtiv != null) return logged ? editActivity(+target.dataset.adicionarAtiv, null) : askAccount();
    if (target.dataset.editarAtiv) { var ea = target.dataset.editarAtiv.split('-'); return editActivity(+ea[0], +ea[1]); }
    if (target.dataset.renomearDia != null) return renameDay(+target.dataset.renomearDia);
    if (target.dataset.editarVoo != null) return editLeg(target.dataset.editarVoo === 'novo' ? null : +target.dataset.editarVoo);
    if (target.dataset.editarHosp != null) return editStay(+target.dataset.editarHosp);
  });
  root.addEventListener('change', function (event) {
    var select = event.target.closest('[data-encaixar]');
    if (!select || select.value === '') return;
    var place = trip.saved.splice(+select.dataset.encaixar, 1)[0];
    var day = trip.days[+select.value];
    var lastTime = day.items.length ? addMinutes(day.items[day.items.length - 1].time, (day.items[day.items.length - 1].minutes || 60) + 30) : '10:00';
    day.items.push({ time: lastTime, type: place.type, title: place.title, lat: place.lat, lng: place.lng, minutes: 90 });
    persist(); openDay = +select.value; renderList(); drawMap(null);
    toast(place.title + ' entrou no dia ' + (+select.value + 1));
  });
  main.addEventListener('mouseover', function (event) { var act = event.target.closest('.act'); if (act) highlight(act.dataset.key, true); });
  main.addEventListener('mouseout', function (event) { var act = event.target.closest('.act'); if (act) highlight(act.dataset.key, false); });
  main.addEventListener('click', function (event) {
    var act = event.target.closest('.act');
    if (!act || !map || event.target.closest('.move')) return;
    var parts = act.dataset.key.split('-'), item = trip.days[+parts[0]].items[+parts[1]];
    if (item.lat) map.flyTo([item.lat, item.lng], 15, { duration: .6 });
  });
  /* ── janela (quem vai na viagem, notificações) ── */
  var modal = root.querySelector('.rt-modal'), modalIn = root.querySelector('.rt-modal-in');
  function persistPeople() { OndStore.write('roteiro_pessoas_' + id, people); }
  var storedPeople = OndStore.read('roteiro_pessoas_' + id, null); if (storedPeople) { people.length = 0; storedPeople.forEach(function (person) { people.push(person); }); }
  function openModal(kind) {
    if (kind === 'pessoas') {
      modalIn.innerHTML = '<h3 id="rt-modal-t">Membros do grupo</h3>' + (people.length ? people.map(function (person, index) {
        var organizer = index === 0;
        return '<div class="member">' + avatar(person, 40) + '<span class="member-t"><b>' + escapeHtml(person.name) + '</b><small>' + escapeHtml(person.email || (person.pendente ? 'Convite enviado' : 'Faz parte do grupo')) + '</small></span>' +
          '<span class="role' + (organizer ? ' org' : '') + '">' + (organizer ? 'Organizador' : 'Convidado') + '</span>' + (organizer ? '' : '<button class="member-x" data-remover-pessoa="' + index + '" aria-label="Tirar do grupo">' + I.fechar + '</button>') + '</div>';
      }).join('') : '<p class="vazio-dia">Por enquanto, só você. Adicione quem vai com você.</p>') +
        (window.OndPlano ? '<p class="invite-cota">' + Math.max(0, people.length - 1) + ' de ' + OndPlano.limite('pessoas') + (OndPlano.limite('pessoas') === 1 ? ' pessoa convidada' : ' pessoas convidadas') + ' no ' + ({ free: 'Free', premium: 'Premium', plus: 'Plus' })[OndPlano.plano()] + '</p>' : '') + '<form class="invite" id="rt-invite"><h4>Convidar para a viagem</h4><input class="input" name="nome" placeholder="Nome" required><input class="input" name="email" type="email" placeholder="E-mail" required>' +
        '<div class="invite-actions"><button class="btn btn-primary" type="submit">' + I.convidar + 'Convidar</button><button class="btn btn-line" type="button" data-acao="link-convite">Copiar link do convite</button></div></form>';
      modalIn.querySelector('#rt-invite').addEventListener('submit', function (event) {
        event.preventDefault();
        if (window.OndPlano && people.length - 1 >= OndPlano.limite('pessoas')) { if (OndPlano.plus()) toast('A viagem já tem o máximo de 10 pessoas convidadas'); else { closeModal(); OndPlano.pedir('pessoas'); } return; }
        var form = event.target, name = form.nome.value.trim();
        var initials = name.split(/\s+/).map(function (part) { return part[0]; }).slice(0, 2).join('').toUpperCase();
        people.push({ name: name, initials: initials, color: ['#a0600c', '#560fb2', '#085e20'][people.length % 3], email: form.email.value.trim(), pendente: true });
        persistPeople(); openModal('pessoas'); refreshPeople();
        toast('Convite enviado para ' + name);
      });
    }
    if (kind === 'offline') {
      var baixada = window.OndOffline && OndOffline.info(trip.id);
      var cidades = window.OndOffline ? OndOffline.cidades(trip) : [];
      modalIn.innerHTML = '<h3 id="rt-modal-t">Usar sem internet</h3>' +
        '<p class="modal-explica">' + (baixada ? 'Esta viagem está guardada neste aparelho e abre mesmo sem sinal.' : 'Guarde a viagem neste aparelho para abrir tudo sem sinal: no avião, no metrô ou com o chip desligado.') + '</p>' +
        '<ul class="offline-lista">' +
          '<li>' + I.check + '<span><b>Roteiro dia a dia</b><small>Atividades, horários, voos, hospedagens e o que você mudar.</small></span></li>' +
          '<li>' + I.check + '<span><b>PDF da viagem</b><small>Pronto para abrir ou imprimir.</small></span></li>' +
          '<li>' + I.check + '<span><b>' + (cidades.length > 1 ? 'Destinos da viagem' : 'Destino da viagem') + '</b><small>' + escapeHtml(cidades.join(', ') || trip.title) + ', com as dicas e avaliações.</small></span></li>' +
        '</ul>' +
        '<div class="offline-barra" hidden><i></i></div><p class="offline-status" aria-live="polite"></p>' +
        '<div class="invite-actions">' + (baixada
          ? '<button class="btn btn-primary" type="button" data-offline-baixar>' + I.semRede + 'Atualizar</button><button class="btn btn-line" type="button" data-offline-remover>Remover do aparelho</button>'
          : '<button class="btn btn-primary" type="button" data-offline-baixar>' + I.semRede + 'Baixar viagem</button>') + '</div>' +
        (baixada ? '<small class="offline-nota">Guardada em ' + new Date(baixada.quando).toLocaleDateString('pt-BR') + '.</small>' : '');
      var barra = modalIn.querySelector('.offline-barra'), status = modalIn.querySelector('.offline-status');
      modalIn.querySelector('[data-offline-baixar]').addEventListener('click', function (event) {
        var botao = event.currentTarget; botao.disabled = true; barra.hidden = false;
        OndOffline.baixar(trip, function (texto, fracao) { status.textContent = texto; barra.firstChild.style.width = Math.round(fracao * 100) + '%'; })
          .then(function () { toast('Viagem pronta para usar sem internet'); openModal('offline'); })
          .catch(function () { botao.disabled = false; barra.hidden = true; status.textContent = 'Não deu para guardar agora. Confira a conexão e tente de novo.'; });
      });
      var remover = modalIn.querySelector('[data-offline-remover]');
      if (remover) remover.addEventListener('click', function () { OndOffline.remover(trip.id).then(function () { toast('Viagem removida do aparelho'); openModal('offline'); }); });
    }
    if (kind === 'modelo') {
      var jaSalvo = window.OndModelos && OndModelos.listar().find(function (item) { return item.origem === trip.id; });
      modalIn.innerHTML = '<h3 id="rt-modal-t">Salvar como modelo</h3>' +
        '<p class="modal-explica">O modelo guarda as cidades, as noites e o que fazer em cada dia, sem datas, voos nem reservas. Ele aparece em Nova viagem para você começar a próxima por ele.</p>' +
        '<form class="invite modelo-form" id="rt-modelo"><input class="input" name="titulo" maxlength="60" required value="' + escapeHtml(jaSalvo ? jaSalvo.title : trip.title) + '" aria-label="Nome do modelo">' +
        '<button class="pref" type="button" data-publicar aria-pressed="' + !!(jaSalvo && jaSalvo.publicado) + '"><span><b>Publicar na comunidade</b><small>Outros viajantes podem começar pelo seu roteiro. Seu nome aparece como autor.</small></span><i class="tog"></i></button>' +
        (window.OndPlano && OndPlano.plus()
          ? '<button class="pref" type="button" data-vender aria-pressed="' + !!(jaSalvo && jaSalvo.preco) + '"><span><b>Vender este roteiro</b><small>Quem quiser começar pelo seu roteiro paga o preço que você definir.</small></span><i class="tog"></i></button>' +
            '<label class="modelo-preco"' + (jaSalvo && jaSalvo.preco ? '' : ' hidden') + '><span>Preço</span><span class="modelo-preco-campo">R$ <input class="input" name="preco" inputmode="decimal" value="' + escapeHtml(jaSalvo && jaSalvo.preco || '29,90') + '" aria-label="Preço do roteiro em reais"></span><small data-repasse></small></label>'
          : '<button class="pref" type="button" data-vender-plus><span><b>Vender este roteiro</b><small>Disponível no Plus. Publique com preço e receba a cada venda.</small></span>' + I.seta + '</button>') +
        '<div class="invite-actions"><button class="btn btn-primary" type="submit">' + I.check + (jaSalvo ? 'Atualizar modelo' : 'Salvar modelo') + '</button></div></form>';
      var publicar = modalIn.querySelector('[data-publicar]');
      var vender = modalIn.querySelector('[data-vender]'), precoBox = modalIn.querySelector('.modelo-preco');
      function valorPreco() { var n = parseFloat(String(modalIn.querySelector('[name=preco]').value).replace(/\./g, '').replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; }
      function repasse() { if (!precoBox) return; var n = valorPreco(); precoBox.querySelector('[data-repasse]').textContent = n ? 'Você recebe R$ ' + (n * (1 - OndModelos.COMISSAO)).toFixed(2).replace('.', ',') + ' por venda. O OND fica com ' + Math.round(OndModelos.COMISSAO * 100) + '%.' : 'Digite o preço.'; }
      publicar.addEventListener('click', function () {
        var on = publicar.getAttribute('aria-pressed') !== 'true'; publicar.setAttribute('aria-pressed', String(on));
        if (!on && vender) { vender.setAttribute('aria-pressed', 'false'); precoBox.hidden = true; }
      });
      if (vender) {
        repasse(); modalIn.querySelector('[name=preco]').addEventListener('input', repasse);
        vender.addEventListener('click', function () {
          var on = vender.getAttribute('aria-pressed') !== 'true'; vender.setAttribute('aria-pressed', String(on)); precoBox.hidden = !on;
          if (on) publicar.setAttribute('aria-pressed', 'true');
        });
      }
      var venderPlus = modalIn.querySelector('[data-vender-plus]');
      if (venderPlus) venderPlus.addEventListener('click', function () { closeModal(); OndPlano.pedir('vender'); });
      modalIn.querySelector('#rt-modelo').addEventListener('submit', function (event) {
        event.preventDefault();
        var modelo = tripParaModelo(event.target.titulo.value.trim() || trip.title, publicar.getAttribute('aria-pressed') === 'true');
        if (jaSalvo) modelo.id = jaSalvo.id;
        if (vender && vender.getAttribute('aria-pressed') === 'true') { if (!valorPreco()) { toast('Digite o preço do roteiro'); return; } modelo.preco = valorPreco().toFixed(2).replace('.', ','); modelo.publicado = true; }
        OndModelos.salvar(modelo); closeModal();
        toast(modelo.preco ? 'Roteiro à venda por R$ ' + modelo.preco : modelo.publicado ? 'Modelo publicado na comunidade' : 'Modelo salvo. Ele aparece em Nova viagem');
      });
    }
    if (kind === 'notificacoes') {
      var prefs = trip.notas_prefs || {};
      var rows = [['checklist', 'Lembretes do checklist', 'Avisos do que falta antes de viajar'], ['voos', 'Mudanças nos voos', 'Atraso, portão e horário'], ['clima', 'Previsão do tempo', 'Chuva e calor nos dias da viagem'], ['resumo', 'Resumo do dia', 'O percurso do dia, toda manhã']];
      modalIn.innerHTML = '<h3 id="rt-modal-t">Preferências de notificação</h3>' + rows.map(function (row) {
        return '<button class="pref" data-pref="' + row[0] + '" aria-pressed="' + !!prefs[row[0]] + '"><span><b>' + row[1] + '</b><small>' + row[2] + '</small></span><i class="tog"></i></button>';
      }).join('');
    }
    modal.classList.add('on'); root.querySelector('.rt-modal-scrim').classList.add('on');
  }
  /* viagem vira modelo: cada hospedagem é uma parada, e os dias dela levam as atividades sem o que é automático */
  function tripParaModelo(titulo, publicado) {
    var auto = /^(Chegada em |Voo de volta|Check-in|Check-out)|^(Voo|Trem|Estrada) de .+ para /;
    var stays = (trip.stays || []).filter(function (stay) { return stay.checkIn && stay.nights; });
    if (!stays.length) stays = [{ city: trip.city || trip.title, checkIn: trip.days[0].date, nights: Math.max(1, trip.days.length - 1), lat: (trip.center || [])[0], lng: (trip.center || [])[1] }];
    var conhecidas = {}; (window.OND_PRONTOS || []).forEach(function (tpl) { tpl.stops.forEach(function (stop) { conhecidas[stop.city] = stop; }); });
    var stops = stays.map(function (stay, index) {
      var city = stay.city || trip.city || '', ref = conhecidas[city] || {};
      var dias = [], titulos = [];
      for (var n = 0; n < stay.nights; n++) {
        var data = new Date(stay.checkIn + 'T12:00:00'); data.setDate(data.getDate() + n);
        var day = trip.days.find(function (item) { return item.date === data.toISOString().slice(0, 10); }) || { title: '', items: [] };
        dias.push(day.items.filter(function (item) { return item.type !== 'hotel' && !auto.test(item.title || ''); }).map(function (item) { return { time: item.time, type: item.type, title: item.title, lat: item.lat, lng: item.lng, minutes: item.minutes, note: item.note }; }));
        titulos.push(day.title && day.title !== city && day.title.indexOf('→') < 0 && !/dia livre$/.test(day.title) ? day.title : '');
      }
      return { city: city, country: ref.country || (index ? '' : trip.country || ''), iso: ref.iso || (index ? '' : trip.iso || ''), lat: stay.lat || ref.lat, lng: stay.lng || ref.lng, nights: stay.nights, dias: dias, titulos: titulos };
    });
    var autor = (trip.people && trip.people[0] && trip.people[0].name) || 'Você';
    return { id: 'modelo-' + Date.now().toString(36), origem: trip.id, title: titulo, cover: trip.cover || '', stops: stops, estilos: '', continente: '', autor: autor, publicado: publicado, criado: new Date().toISOString().slice(0, 10) };
  }
  function carregarOffline(done) {
    if (window.OndOffline) return done();
    var script = document.createElement('script'); script.src = '/assets/offline.js'; script.onload = done;
    script.onerror = function () { toast('Não deu para abrir o modo sem internet'); };
    document.head.appendChild(script);
  }
  function closeModal() { modal.classList.remove('on'); root.querySelector('.rt-modal-scrim').classList.remove('on'); }
  function refreshPeople() { root.querySelector('.rt-people .stack').innerHTML = people.map(function (person) { return avatar(person, 30); }).join(''); }
  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-acao="link-convite"]')) shareLink('Convite: ' + trip.title, 'Vem comigo para ' + trip.title + '? O roteiro está no OND.', location.origin + '/explorar/roteiro/?id=' + encodeURIComponent(trip.id));
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeModal(); if (root.classList.contains('mapa-aberto')) toggleMap(); } });
  function toggleMap() {
    var aberto = root.classList.toggle('mapa-aberto');
    var mobileButton = root.querySelector('.rt-map-btn span'); if (mobileButton) mobileButton.textContent = aberto ? 'Fechar mapa' : 'Ver no mapa';
    var expand = root.querySelector('.rt-expand'); expand.innerHTML = aberto ? I.recolher : I.expandir; expand.setAttribute('aria-label', aberto ? 'Recolher mapa' : 'Expandir mapa'); expand.title = aberto ? 'Recolher mapa' : 'Expandir mapa';
    if (map) setTimeout(function () { map.invalidateSize(); if (lastBounds) map.fitBounds(lastBounds, { padding: [48, 48], maxZoom: 15, animate: false }); }, 60);
  }
  refreshPeople();

  /* ── reorganizar: setas e arrastar ── */
  function retime(day) {
    var times = day.items.map(function (item) { return item.time; }).sort();
    day.items.forEach(function (item, index) { item.time = times[index]; });
  }
  function moveItem(fromDay, fromIndex, toDay, toIndex) {
    var source = trip.days[fromDay].items, target = trip.days[toDay].items;
    if (toIndex < 0 || (fromDay === toDay && toIndex >= source.length)) return;
    var item = source.splice(fromIndex, 1)[0];
    target.splice(Math.min(toIndex, target.length), 0, item);
    retime(trip.days[fromDay]); if (toDay !== fromDay) retime(trip.days[toDay]);
    persist(); renderList(); drawMap(openDay >= 0 ? openDay : null);
  }
  var dragKey = null;
  main.addEventListener('dragstart', function (event) { var act = event.target.closest('.act.editando'); if (!act) return; dragKey = act.dataset.key; act.classList.add('arrastando'); event.dataTransfer.effectAllowed = 'move'; });
  main.addEventListener('dragend', function (event) { var act = event.target.closest('.act'); if (act) act.classList.remove('arrastando'); });
  main.addEventListener('dragover', function (event) { if (dragKey && event.target.closest('.act.editando, .day')) event.preventDefault(); });
  main.addEventListener('drop', function (event) {
    if (!dragKey) return;
    event.preventDefault();
    var from = dragKey.split('-').map(Number); dragKey = null;
    var act = event.target.closest('.act.editando');
    if (act) { var to = act.dataset.key.split('-').map(Number); return moveItem(from[0], from[1], to[0], to[1]); }
    var day = event.target.closest('.day');
    if (day) moveItem(from[0], from[1], +day.dataset.day, trip.days[+day.dataset.day].items.length);
  });

  /* ── modo edição: atividades, dias, voos, hospedagem, nome e capa ──
     O lugar é escrito em texto. O mapa só aparece quando há um ponto, e o ponto
     sai da busca (Photon, perto do destino); se a pessoa não escolher, procuramos sozinhos. */
  var TYPES = [['passeio', 'Passeio'], ['praia', 'Praia'], ['mirante', 'Mirante'], ['trilha', 'Trilha'], ['comida', 'Comida'], ['hotel', 'Hospedagem'], ['voo', 'Voo']];
  var DURATIONS = [[30, '30 min'], [60, '1h'], [90, '1h30'], [120, '2h'], [180, '3h'], [240, '4h'], [360, '6h'], [480, 'Dia inteiro']];
  function askAccount() {
    var trigger = document.createElement('button'); trigger.hidden = true; trigger.setAttribute('data-pede-conta', 'viagens');
    document.body.appendChild(trigger); trigger.click(); trigger.remove();
  }
  function showModal(html) {
    modalIn.innerHTML = html;
    modal.classList.add('on'); root.querySelector('.rt-modal-scrim').classList.add('on');
    var first = modalIn.querySelector('input:not([type=radio]):not([type=checkbox]),textarea'); if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function field(label, control, hint) { return '<label class="ed-campo"><span>' + label + '</span>' + control + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }
  function attr(value) { return escapeHtml(value == null ? '' : String(value)); }
  function tripCenter() {
    if (trip.center) return { lat: trip.center[0], lng: trip.center[1] };
    var withPin; trip.days.some(function (day) { return day.items.some(function (item) { if (item.lat) { withPin = item; return true; } }); });
    return withPin || null;
  }
  var placeCache = {};
  function searchPlaces(query) {
    query = (query || '').trim();
    if (query.length < 3) return Promise.resolve([]);
    if (placeCache[query]) return Promise.resolve(placeCache[query]);
    var center = tripCenter();
    var url = 'https://photon.komoot.io/api/?limit=6&q=' + encodeURIComponent(query) + (center ? '&lat=' + center.lat + '&lon=' + center.lng : '');
    return fetch(url).then(function (response) { return response.json(); }).then(function (data) {
      var list = (data.features || []).map(function (feature) {
        var p = feature.properties || {}, parts = [];
        [p.street && (p.street + (p.housenumber ? ', ' + p.housenumber : '')), p.district, p.city || p.county, p.state, p.country].forEach(function (part) { if (part && parts.indexOf(part) < 0 && part !== p.name) parts.push(part); });
        return { name: p.name || p.street || query, sub: parts.join(', '), lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] };
      });
      /* mantém a ordem de relevância da busca, mas descarta o que fica longe do destino quando há opção perto */
      if (center) {
        list.forEach(function (place) { place.km = km(center, place); });
        var near = list.filter(function (place) { return place.km < 300; });
        if (near.length) list = near;
      }
      placeCache[query] = list;
      return list;
    }).catch(function () { return []; });
  }
  function placeField(name, value, label, hint, placeholder) {
    return '<div class="ed-campo"><label for="ed-' + name + '"><span>' + label + '</span></label><div class="ed-lugar"><input class="input" id="ed-' + name + '" name="' + name + '" value="' + attr(value) + '" autocomplete="off" placeholder="' + attr(placeholder) + '" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ed-sug"><div class="ed-sug" id="ed-sug" role="listbox" hidden></div></div>' +
      '<small>' + hint + '</small></div><div class="ed-mapa" hidden></div><p class="ed-mapa-dica" hidden>Arraste o ponto se precisar ajustar.</p>';
  }
  function miniMap(form, state) {
    var box = form.querySelector('.ed-mapa');
    if (!box || state.lat == null || !window.L) return;
    box.hidden = false; form.querySelector('.ed-mapa-dica').hidden = false;
    if (!box._map) {
      box._map = L.map(box, { zoomControl: false, attributionControl: false });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(box._map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(box._map);
      box._pin = L.marker([state.lat, state.lng], { draggable: true, icon: L.divIcon({ className: '', html: '<div class="ed-pin"></div>', iconSize: [24, 24], iconAnchor: [12, 24] }) }).addTo(box._map);
      box._pin.on('dragend', function () { var point = box._pin.getLatLng(); state.lat = point.lat; state.lng = point.lng; state.picked = true; });
    }
    box._pin.setLatLng([state.lat, state.lng]);
    box._map.setView([state.lat, state.lng], 14);
    setTimeout(function () { box._map.invalidateSize(); }, 80);
  }
  function wirePlace(form, name, state) {
    var input = form.elements[name], list = form.querySelector('.ed-sug'), timer, results = [];
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    input.addEventListener('input', function () {
      state.picked = false; clearTimeout(timer);
      var query = input.value;
      timer = setTimeout(function () {
        searchPlaces(query).then(function (found) {
          if (input.value !== query) return;
          results = found.slice(0, 5);
          if (!results.length) return close();
          list.innerHTML = results.map(function (place, index) { return '<button type="button" role="option" data-sug="' + index + '"><b>' + escapeHtml(place.name) + '</b><small>' + escapeHtml(place.sub) + '</small></button>'; }).join('');
          list.hidden = false; input.setAttribute('aria-expanded', 'true');
        });
      }, 350);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !list.hidden) { event.stopPropagation(); close(); }
      if (event.key === 'ArrowDown' && !list.hidden) { event.preventDefault(); list.querySelector('button').focus(); }
    });
    list.addEventListener('keydown', function (event) {
      var button = event.target.closest('button'); if (!button) return;
      if (event.key === 'ArrowDown' && button.nextElementSibling) { event.preventDefault(); button.nextElementSibling.focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); (button.previousElementSibling || input).focus(); }
    });
    list.addEventListener('click', function (event) {
      var button = event.target.closest('[data-sug]'); if (!button) return;
      var place = results[+button.dataset.sug];
      input.value = place.name; state.lat = place.lat; state.lng = place.lng; state.picked = true; state.text = place.name;
      close(); miniMap(form, state); input.focus();
    });
    input.addEventListener('blur', function () { setTimeout(function () { if (!list.contains(document.activeElement)) close(); }, 150); });
    if (state.lat != null) miniMap(form, state);
  }
  /* sem ponto escolhido: procura pelo texto do lugar e, se ele estiver vazio, pelo nome da atividade */
  function resolvePlace(state, placeText, fallback) {
    if (state.picked || (state.lat != null && placeText === state.text)) return Promise.resolve(true);
    var query = placeText || fallback;
    if (!query) { state.lat = state.lng = null; return Promise.resolve(false); }
    return searchPlaces(query).then(function (found) {
      if (found.length) { state.lat = found[0].lat; state.lng = found[0].lng; return true; }
      if (placeText) { state.lat = state.lng = null; }
      return false;
    });
  }
  function busyButton(form, on) { var button = form.querySelector('[type=submit]'); button.disabled = on; button.textContent = on ? 'Salvando...' : 'Salvar'; }
  function confirmDelete(form, onConfirm) {
    var button = form.querySelector('[data-ed-excluir]'); if (!button) return;
    button.addEventListener('click', function () {
      if (button.dataset.certeza) return onConfirm();
      button.dataset.certeza = '1'; button.innerHTML = I.lixo + 'Toque de novo para excluir';
    });
  }
  function deleteButton() { return '<button class="btn btn-line ed-excluir" type="button" data-ed-excluir>' + I.lixo + 'Excluir</button>'; }

  function editActivity(dayIndex, itemIndex) {
    var isNew = itemIndex == null, day = trip.days[dayIndex], last = day.items[day.items.length - 1];
    var suggested = last ? addMinutes(last.time, (last.minutes || 60) + 30) : '10:00';
    if (last && (suggested < last.time || suggested > '22:00')) suggested = last.time > '22:00' ? last.time : '22:00';
    var item = isNew ? { time: suggested, type: 'passeio', title: '', minutes: 90 } : day.items[itemIndex];
    var state = { lat: item.lat, lng: item.lng, text: item.place || '', picked: false };
    var durations = DURATIONS.slice();
    if (item.minutes && !durations.some(function (d) { return d[0] === item.minutes; })) durations.push([item.minutes, item.minutes + ' min']);
    showModal('<h3 id="rt-modal-t">' + (isNew ? 'Nova atividade' : 'Editar atividade') + '</h3><form class="ed" novalidate>' +
      field('O que vai fazer', '<input class="input" name="title" required maxlength="80" value="' + attr(item.title) + '" placeholder="Ex.: Mergulho na Baía do Sancho">') +
      placeField('place', item.place || '', 'Onde', 'Nome do lugar ou endereço. Em branco, procuramos pelo nome da atividade.', 'Ex.: Baía do Sancho') +
      '<fieldset class="ed-tipos"><legend>Tipo</legend>' + TYPES.map(function (type) { return '<label><input type="radio" name="type" value="' + type[0] + '"' + (item.type === type[0] ? ' checked' : '') + '><span>' + (I[type[0]] || '') + type[1] + '</span></label>'; }).join('') + '</fieldset>' +
      '<div class="ed-linha">' +
        field('Dia', '<select class="input" name="day">' + trip.days.map(function (d, index) { return '<option value="' + index + '"' + (index === dayIndex ? ' selected' : '') + '>Dia ' + (index + 1) + ' · ' + ddmm(d.date) + '</option>'; }).join('') + '</select>') +
        field('Horário', '<input class="input" type="time" name="time" required value="' + attr(item.time) + '">') +
        field('Duração', '<select class="input" name="minutes">' + durations.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === (item.minutes || 90) ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select>') +
      '</div>' +
      field('Observação', '<textarea class="input" name="note" rows="2" maxlength="200" placeholder="Ex.: levar protetor e água">' + attr(item.note) + '</textarea>') +
      '<label class="ed-check"><input type="checkbox" name="booked"' + (item.booked ? ' checked' : '') + '>Já está reservado</label>' +
      '<div class="ed-acoes"><button class="btn btn-primary" type="submit">Salvar</button>' + (isNew ? '' : deleteButton()) + '</div></form>');
    var form = modalIn.querySelector('form');
    wirePlace(form, 'place', state);
    confirmDelete(form, function () {
      day.items.splice(itemIndex, 1); persist(); closeModal(); renderList(); drawMap(openDay >= 0 ? openDay : null);
      toast('Atividade excluída');
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var title = form.title.value.trim();
      if (!title) { form.title.focus(); return toast('Escreva o que vai fazer'); }
      if (!form.time.value) { form.time.focus(); return toast('Escolha o horário'); }
      var placeText = form.place.value.trim();
      busyButton(form, true);
      resolvePlace(state, placeText, title).then(function (found) {
        var next = Object.assign({}, item, {
          title: title, place: placeText || undefined, type: (form.querySelector('[name=type]:checked') || {}).value || 'passeio',
          time: form.time.value, minutes: +form.minutes.value, note: form.note.value.trim() || undefined, booked: form.booked.checked || undefined,
          lat: state.lat == null ? undefined : state.lat, lng: state.lng == null ? undefined : state.lng
        });
        var targetDay = +form.day.value;
        if (!isNew) day.items.splice(itemIndex, 1);
        trip.days[targetDay].items.push(next);
        trip.days[targetDay].items.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
        persist(); closeModal();
        openDay = targetDay; renderList(); drawMap(allOpen ? null : targetDay);
        if (next.lat != null && map && map.getSize().x > 0) setTimeout(function () { map.flyTo([next.lat, next.lng], 15, { duration: .6 }); }, 120);
        toast(found || next.lat != null ? (isNew ? title + ' entrou no dia ' + (targetDay + 1) : 'Atividade atualizada') : 'Salvo. Não achei esse lugar no mapa, dá para escrever o endereço.');
      });
    });
  }

  function renameDay(dayIndex) {
    var day = trip.days[dayIndex];
    showModal('<h3 id="rt-modal-t">Dia ' + (dayIndex + 1) + ' · ' + ddmm(day.date) + '</h3><form class="ed">' +
      field('Nome do dia', '<input class="input" name="title" maxlength="50" value="' + attr(day.title) + '" placeholder="Ex.: Praias do mar de dentro">', 'Em branco, fica só "Dia ' + (dayIndex + 1) + '".') +
      '<div class="ed-acoes"><button class="btn btn-primary" type="submit">Salvar</button></div></form>');
    modalIn.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault(); day.title = event.target.title.value.trim(); persist(); closeModal(); renderList();
    });
  }

  function editStay(index) {
    var isNew = index == null;
    var stay = isNew ? { name: '', checkIn: trip.start, checkOut: trip.end, detail: '' } : trip.stays[index];
    var state = { lat: stay.lat, lng: stay.lng, text: stay.address || '', picked: false };
    showModal('<h3 id="rt-modal-t">' + (isNew ? 'Nova hospedagem' : 'Editar hospedagem') + '</h3><form class="ed" novalidate>' +
      field('Nome', '<input class="input" name="name" required maxlength="80" value="' + attr(stay.name) + '" placeholder="Ex.: Pousada Maravilha">') +
      placeField('address', stay.address || '', 'Endereço', 'Em branco, procuramos pelo nome da hospedagem.', 'Ex.: Sueste, Fernando de Noronha') +
      '<div class="ed-linha ed-linha-2">' +
        field('Entrada', '<input class="input" type="date" name="checkIn" required value="' + attr(stay.checkIn) + '">') +
        field('Saída', '<input class="input" type="date" name="checkOut" required value="' + attr(stay.checkOut) + '">') +
      '</div>' +
      field('Detalhe', '<input class="input" name="detail" maxlength="80" value="' + attr(stay.detail) + '" placeholder="Ex.: café da manhã incluso">') +
      '<div class="ed-acoes"><button class="btn btn-primary" type="submit">Salvar</button>' + (isNew ? '' : deleteButton()) + '</div></form>');
    var form = modalIn.querySelector('form');
    wirePlace(form, 'address', state);
    function done(message) { persist(); closeModal(); renderTrip(); goSection('hospedagem'); drawMap(null); toast(message); }
    confirmDelete(form, function () { trip.stays.splice(index, 1); done('Hospedagem excluída'); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = form.name.value.trim();
      if (!name) { form.name.focus(); return toast('Escreva o nome da hospedagem'); }
      if (!form.checkIn.value || !form.checkOut.value || form.checkOut.value <= form.checkIn.value) { form.checkOut.focus(); return toast('A saída precisa ser depois da entrada'); }
      busyButton(form, true);
      var address = form.address.value.trim();
      resolvePlace(state, address, name + ' ' + (trip.city || '')).then(function () {
        var next = Object.assign({}, stay, {
          name: name, address: address || undefined, checkIn: form.checkIn.value, checkOut: form.checkOut.value, detail: form.detail.value.trim(),
          nights: Math.round((parseDate(form.checkOut.value) - parseDate(form.checkIn.value)) / 86400000),
          lat: state.lat == null ? undefined : state.lat, lng: state.lng == null ? undefined : state.lng
        });
        trip.stays = trip.stays || [];
        if (isNew) trip.stays.push(next); else trip.stays[index] = next;
        trip.stays.sort(function (a, b) { return a.checkIn < b.checkIn ? -1 : 1; });
        done(isNew ? name + ' entrou na viagem' : 'Hospedagem atualizada');
      });
    });
  }

  function editLeg(index) {
    var isNew = index == null, legs = trip.transports = trip.transports || [];
    var leg = isNew ? { from: legs.length ? legs[legs.length - 1].to : '', to: legs.length ? legs[legs.length - 1].from : '', date: legs.length ? trip.end : trip.start, time: '', code: '', detail: '' } : legs[index];
    showModal('<h3 id="rt-modal-t">' + (isNew ? 'Novo voo' : 'Editar voo') + '</h3><form class="ed" novalidate>' +
      '<div class="ed-linha ed-linha-2">' +
        field('Saindo de', '<input class="input" name="from" required maxlength="40" value="' + attr(leg.from) + '" placeholder="Ex.: Recife (REC)">') +
        field('Chegando em', '<input class="input" name="to" required maxlength="40" value="' + attr(leg.to) + '" placeholder="Ex.: Noronha (FEN)">') +
        field('Data', '<input class="input" type="date" name="date" required value="' + attr(leg.date) + '">') +
        field('Horário', '<input class="input" type="time" name="time" value="' + attr(leg.time) + '">') +
      '</div>' +
      field('Localizador', '<input class="input" name="code" maxlength="30" value="' + attr(leg.code) + '" placeholder="Ex.: XK7Q2P">') +
      field('Detalhe', '<input class="input" name="detail" maxlength="60" value="' + attr(leg.detail) + '" placeholder="Ex.: Gol, 1h10 de voo">') +
      '<div class="ed-acoes"><button class="btn btn-primary" type="submit">Salvar</button>' + (isNew ? '' : deleteButton()) + '</div></form>');
    var form = modalIn.querySelector('form');
    function done(message) { persist(); closeModal(); renderTrip(); goSection('deslocamento'); toast(message); }
    confirmDelete(form, function () { legs.splice(index, 1); done('Voo excluído'); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.from.value.trim()) { form.from.focus(); return toast('Escreva de onde sai'); }
      if (!form.to.value.trim()) { form.to.focus(); return toast('Escreva onde chega'); }
      if (!form.date.value) { form.date.focus(); return toast('Escolha a data'); }
      var next = Object.assign({}, leg, { from: form.from.value.trim(), to: form.to.value.trim(), date: form.date.value, time: form.time.value, code: form.code.value.trim(), detail: form.detail.value.trim() });
      if (isNew) legs.push(next); else legs[index] = next;
      legs.sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
      done(isNew ? 'Voo adicionado' : 'Voo atualizado');
    });
  }

  /* nome e capa: a foto nova é reduzida para caber no aparelho */
  function shrinkPhoto(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var image = new Image();
        image.onerror = reject;
        image.onload = function () {
          var scale = Math.min(1, 1600 / image.width), canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function editLook() {
    var cover = trip.cover;
    showModal('<h3 id="rt-modal-t">Nome e capa da viagem</h3><form class="ed">' +
      field('Nome da viagem', '<input class="input" name="title" required maxlength="40" value="' + attr(trip.title) + '">') +
      '<div class="ed-campo"><span>Capa</span><div class="ed-capa"><img alt="" src="' + attr(cover) + '"></div><div class="ed-capa-acoes"><label class="btn btn-line">' + I.foto + 'Trocar foto<input type="file" accept="image/*" hidden name="foto"></label>' +
      (base.cover !== trip.cover ? '<button class="btn btn-line" type="button" data-capa-original>Voltar para a original</button>' : '') + '</div></div>' +
      '<div class="ed-acoes"><button class="btn btn-primary" type="submit">Salvar</button></div></form>');
    var form = modalIn.querySelector('form'), preview = form.querySelector('.ed-capa img');
    form.foto.addEventListener('change', function () {
      var file = form.foto.files[0]; if (!file) return;
      shrinkPhoto(file).then(function (data) { cover = data; preview.src = data; }).catch(function () { toast('Não consegui abrir essa foto'); });
    });
    var original = form.querySelector('[data-capa-original]');
    if (original) original.addEventListener('click', function () { cover = base.cover; preview.src = cover; original.remove(); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var title = form.title.value.trim();
      if (!title) { form.title.focus(); return toast('Dê um nome para a viagem'); }
      var before = { title: trip.title, cover: trip.cover };
      trip.title = title; trip.cover = cover;
      try { persist(); } catch (error) { trip.title = before.title; trip.cover = before.cover; return toast('Essa foto é grande demais para guardar aqui. Tente outra.'); }
      root.querySelector('.rt-hero > img').src = cover;
      root.querySelector('.rt-hero h1').textContent = title;
      closeModal(); toast('Viagem atualizada');
    });
  }

  /* ── adicionar ao calendário (.ics) ── */
  function downloadIcs() {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OND//Roteiro//PT'];
    trip.days.forEach(function (day) {
      day.items.forEach(function (item, index) {
        var start = day.date.replace(/-/g, '') + 'T' + item.time.replace(':', '') + '00';
        var end = day.date.replace(/-/g, '') + 'T' + addMinutes(item.time, item.minutes || 60).replace(':', '') + '00';
        lines.push('BEGIN:VEVENT', 'UID:' + trip.id + '-' + day.date + '-' + index + '@ondviajar.com.br', 'DTSTAMP:' + stamp, 'DTSTART:' + start, 'DTEND:' + end, 'SUMMARY:' + item.title.replace(/[,;]/g, ' '), 'LOCATION:' + (trip.city || '') , 'END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    link.download = 'roteiro-' + trip.id + '.ics';
    document.body.appendChild(link); link.click(); link.remove();
    toast('Calendário baixado. Abra o arquivo para adicionar à sua agenda.');
  }

  if (OndStore.read('compra_fechada_' + id, false)) root.classList.add('compra-fechada');
  function toggleListMode() {
    listMode = !listMode; OndStore.write('mapa_escondido', listMode); syncMapToggle();
    body.classList.toggle('sem-mapa', listMode || tab === 'orcamento'); body.classList.toggle('mapa-ao-lado', !(listMode || tab === 'orcamento'));
    if (map) setTimeout(function () { map.invalidateSize(); if (lastBounds) map.fitBounds(lastBounds, { padding: [48, 48], maxZoom: 15, animate: false }); }, 60);
  }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function smooth(update) {
    if (!document.startViewTransition || reduceMotion) { update(); return; }
    document.documentElement.classList.add('rt-vt');
    var transition = document.startViewTransition(update);
    transition.finished.finally(function () { document.documentElement.classList.remove('rt-vt'); });
    ['ready', 'updateCallbackDone'].forEach(function (key) { if (transition[key]) transition[key].catch(function () {}); });
  }
  function syncMapToggle() {
    var button = root.querySelector('.rt-maptoggle');
    button.setAttribute('aria-pressed', String(!listMode));
    button.setAttribute('aria-label', listMode ? 'Mostrar o mapa' : 'Esconder o mapa');
    button.title = listMode ? 'Mostrar o mapa' : 'Esconder o mapa';
  }
  syncMapToggle();
  document.title = trip.title + ' | Roteiro | OND';
  setTab('lista');
})();
