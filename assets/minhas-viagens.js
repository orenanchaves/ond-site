/* Página /explorar/viagens/: com conta (de teste), a próxima viagem em destaque, números e os
   roteiros em cartões com foto; sem conta, fica o convite apagado que pede para entrar. */
(function () {
  var section = document.getElementById('viagens');
  if (!section || !(window.ondTemConta && window.ondTemConta()) || !(window.OND_ROTEIROS || []).length) return;
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var DAY = 86400000;
  var now = new Date(); now.setHours(12, 0, 0, 0);
  var todayIso = now.toISOString().slice(0, 10);
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var ICO = {
    voo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M10.5 13.5 3 11l1-2 8 1 4-5.5a1.8 1.8 0 0 1 2.8 2.2L15 12l1 8-2 1-2.5-7.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" ' + st + '><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + st + '><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" ' + st + '><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/></svg>',
    seta: '<svg viewBox="0 0 24 24" ' + st + '><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    mais: '<svg viewBox="0 0 24 24" ' + st + '><path d="M12 5v14M5 12h14"/></svg>'
  };
  function parse(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function range(trip) {
    var a = parse(trip.start), b = parse(trip.end);
    var same = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    return a.getDate() + (same ? '' : ' de ' + MES[a.getMonth()]) + ' a ' + b.getDate() + ' de ' + MES[b.getMonth()] + ' de ' + b.getFullYear();
  }
  function days(trip) { return Math.round((parse(trip.end) - parse(trip.start)) / DAY) + 1; }
  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function avatars(trip, size) { return '<span class="mv-people">' + (trip.people || []).map(function (person) { return '<span class="mv-av" style="--s:' + size + 'px;background:' + person.color + '" title="' + esc(person.name) + '">' + esc(person.initials) + '</span>'; }).join('') + '</span>'; }
  function state(trip) {
    if (trip.end < todayIso) return { key: 'passada', label: 'Já foi' };
    if (trip.start <= todayIso) return { key: 'agora', label: 'Acontecendo agora' };
    return trip.status === 'marcada' ? { key: 'marcada', label: 'Viagem marcada' } : { key: 'planejando', label: 'Planejando' };
  }
  function checklist(trip) { var list = trip.checklist || []; return { done: list.filter(function (item) { return item.done; }).length, total: list.length }; }
  function link(trip) { return '/explorar/roteiro/?id=' + encodeURIComponent(trip.id); }

  var trips = window.OND_ROTEIROS.slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
  var upcoming = trips.filter(function (trip) { return trip.end >= todayIso; });
  var next = upcoming[0];
  var countries = {}; trips.forEach(function (trip) { countries[trip.country] = true; });
  var traveledDays = trips.filter(function (trip) { return trip.end < todayIso; }).reduce(function (sum, trip) { return sum + days(trip); }, 0);

  function hero(trip) {
    if (!trip) return '';
    var wait = Math.max(0, Math.round((parse(trip.start) - now) / DAY));
    var list = checklist(trip);
    var booked = 0, items = 0;
    (trip.days || []).forEach(function (day) { day.items.forEach(function (item) { items++; if (item.booked) booked++; }); });
    var reservas = (trip.transports || []).length + (trip.stays || []).length + booked;
    return '<a class="mv-hero" href="' + link(trip) + '"><img src="' + esc(trip.cover) + '" alt=""><span class="mv-hero-in">' +
      '<span class="mv-hero-top"><span class="mv-chip">' + ICO.cal + 'Faltam ' + wait + ' dias</span>' + avatars(trip, 34) + '</span>' +
      '<span class="mv-hero-main"><small><img class="mv-flag-s" src="/assets/flags/' + trip.iso + '.svg" alt="">' + esc(trip.country) + '</small>' +
      '<b>' + esc(trip.title) + '</b><span class="mv-hero-date">' + range(trip) + ' · ' + days(trip) + ' dias</span></span>' +
      '<span class="mv-hero-facts">' +
      '<span><i>' + ICO.voo + '</i><b>' + (trip.transports || []).length + '</b> voos</span>' +
      '<span><i>' + ICO.hotel + '</i><b>' + reservas + '</b> reservas</span>' +
      '<span><i>' + ICO.check + '</i><b>' + list.done + '/' + list.total + '</b> no checklist</span>' +
      '<span class="mv-open">Abrir modo viagem' + ICO.seta + '</span></span></span></a>';
  }
  function card(trip) {
    var s = state(trip), list = checklist(trip);
    var progress = list.total ? Math.round(list.done / list.total * 100) : 0;
    return '<a class="mv-card mv-' + s.key + '" href="' + link(trip) + '">' +
      '<span class="mv-cover">' + (trip.cover ? '<img src="' + esc(trip.cover) + '" alt="" loading="lazy">' : '') + '<span class="mv-state">' + s.label + '</span></span>' +
      '<span class="mv-body"><span class="mv-title"><img class="mv-flag" src="/assets/flags/' + trip.iso + '.svg" alt=""><span><b>' + esc(trip.title) + '</b><small>' + esc(trip.country) + '</small></span></span>' +
      '<span class="mv-meta">' + ICO.cal + range(trip) + ' · ' + days(trip) + ' dias</span>' +
      '<span class="mv-foot">' + avatars(trip, 28) + (list.total && s.key !== 'passada' ? '<span class="mv-prog" title="Checklist"><span style="width:' + progress + '%"></span></span><small>' + list.done + '/' + list.total + '</small>' : '') + '</span></span></a>';
  }

  var group = 'todas';
  function render() {
    var list = trips.filter(function (trip) {
      if (group === 'proximas') return trip.end >= todayIso;
      if (group === 'passadas') return trip.end < todayIso;
      return true;
    });
    section.querySelector('.mv-grid').innerHTML = list.map(card).join('') +
      '<a class="mv-card mv-new-card" href="/explorar/viagens/nova/"><span class="mv-new-ic">' + ICO.mais + '</span><b>Nova viagem</b><small>Comece de um roteiro pronto ou em branco.</small></a>';
  }

  section.innerHTML =
    '<div class="mv-head"><div><h1 id="viagens-titulo">Minhas viagens</h1><p class="mv-sub">Seus roteiros mais recentes</p></div>' +
    '<a class="btn btn-primary mv-new" href="/explorar/viagens/nova/">' + ICO.mais + 'Nova viagem</a></div>' +
    (next ? '<h2 class="mv-label">Próxima viagem</h2>' + hero(next) : '') +
    '<div class="mv-stats"><span><b>' + trips.length + '</b>viagens</span><span><b>' + Object.keys(countries).length + '</b>' + (Object.keys(countries).length === 1 ? 'país' : 'países') + '</span><span><b>' + upcoming.length + '</b>' + (upcoming.length === 1 ? 'por vir' : 'por vir') + '</span><span><b>' + traveledDays + '</b>dias viajados</span></div>' +
    '<div class="mv-bar"><h2 class="mv-label">Todas as viagens</h2><div class="mv-seg" role="tablist"><button aria-pressed="true" data-g="todas">Todas</button><button aria-pressed="false" data-g="proximas">Próximas</button><button aria-pressed="false" data-g="passadas">Passadas</button></div></div>' +
    '<div class="mv-grid"></div>';
  section.querySelectorAll('.mv-seg button').forEach(function (button) {
    button.addEventListener('click', function () {
      group = button.dataset.g;
      section.querySelectorAll('.mv-seg button').forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
      render();
    });
  });
  render();

  var style = document.createElement('style');
  style.textContent = [
    '.mv-head{display:flex;align-items:flex-end;gap:16px;margin-bottom:22px}.mv-head>div{margin-right:auto}',
    '.mv-head h1{font-size:34px;font-weight:800;color:#290756;line-height:1.1}.mv-sub{color:#6b6a6a;font-size:16px;margin-top:4px}',
    '.mv-new{display:inline-flex;align-items:center;gap:8px;height:46px}.mv-new svg{width:18px;height:18px}',
    '.mv-label{font-size:13px;font-weight:800;color:#6b6a6a;margin:0 0 10px}',
    '.mv-hero{position:relative;display:block;height:340px;border-radius:28px;overflow:hidden;background:#290756;color:#fff;margin-bottom:18px;box-shadow:0 24px 50px rgba(41,7,86,.22)}',
    '.mv-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.22,1,.36,1)}',
    '.mv-hero:hover>img{transform:scale(1.04)}',
    '.mv-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,10,46,.25) 0%,rgba(21,10,46,0) 35%,rgba(21,10,46,.88) 100%)}',
    '.mv-hero-in{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;padding:24px 28px}',
    '.mv-hero-top{display:flex;align-items:center;justify-content:space-between}',
    '.mv-chip{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);font-weight:800;font-size:14px}.mv-chip svg{width:17px;height:17px}',
    '.mv-hero-main{margin-top:auto;display:flex;flex-direction:column}',
    '.mv-hero-main small{display:flex;align-items:center;gap:8px;font-weight:700;opacity:.9}.mv-flag-s{width:22px;height:15px;border-radius:3px;object-fit:cover}',
    '.mv-hero-main b{font-size:44px;font-weight:800;line-height:1.05;margin:4px 0}',
    '.mv-hero-date{font-weight:600;opacity:.9}',
    '.mv-hero-facts{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.2);font-size:14px}',
    '.mv-hero-facts>span{display:flex;align-items:center;gap:7px}.mv-hero-facts i{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.15);display:grid;place-items:center}.mv-hero-facts i svg{width:16px;height:16px}',
    '.mv-hero-facts b{font-size:16px}',
    '.mv-open{margin-left:auto;height:44px;padding:0 18px;border-radius:999px;background:#fff;color:#290756;font-weight:800;gap:8px!important}.mv-open svg{width:18px;height:18px;transition:transform .3s}.mv-hero:hover .mv-open svg{transform:translateX(4px)}',
    '.mv-people{display:flex}.mv-av{width:var(--s);height:var(--s);border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:calc(var(--s)*.36);border:2px solid #fff;margin-left:-8px}.mv-av:first-child{margin-left:0}',
    '.mv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}',
    '.mv-stats span{display:flex;flex-direction:column;padding:16px 18px;border-radius:18px;background:#fff;border:1px solid #e8e0f0;color:#6b6a6a;font-size:14px;font-weight:600}',
    '.mv-stats b{font-size:28px;font-weight:800;color:#7f11f4;line-height:1.1}',
    '.mv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.mv-bar .mv-label{margin:0}',
    '.mv-seg{display:inline-flex;padding:4px;border-radius:12px;background:#fff;border:1px solid #e8e0f0}',
    '.mv-seg button{height:34px;padding:0 14px;border-radius:9px;border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:#6b6a6a;cursor:pointer}',
    '.mv-seg button[aria-pressed="true"]{background:rgba(127,17,244,.1);color:#7f11f4}',
    '.mv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}',
    '.mv-card{display:flex;flex-direction:column;border-radius:20px;background:#fff;border:1px solid #e8e0f0;overflow:hidden;transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;animation:mv-in .5s cubic-bezier(.22,1,.36,1) both}',
    '.mv-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(41,7,86,.14)}',
    '@keyframes mv-in{from{opacity:0;transform:translateY(14px)}}',
    '.mv-cover{position:relative;height:150px;background:linear-gradient(135deg,#3a1078,#7f11f4)}.mv-cover img{width:100%;height:100%;object-fit:cover}',
    '.mv-state{position:absolute;left:12px;top:12px;height:28px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;font-size:12px;font-weight:800;background:#fff;color:#290756}',
    '.mv-marcada .mv-state{background:#11f558;color:#085e20}.mv-planejando .mv-state{background:#f59811;color:#290756}.mv-passada .mv-state{background:rgba(255,255,255,.9);color:#6b6a6a}',
    '.mv-passada .mv-cover img{filter:saturate(.6)}',
    '.mv-body{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}',
    '.mv-title{display:flex;align-items:center;gap:10px}.mv-flag{width:30px;height:21px;border-radius:4px;object-fit:cover;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.06)}',
    '.mv-title b{display:block;font-size:17px;font-weight:800;color:#290756}.mv-title small{font-size:13px;color:#6b6a6a;font-weight:600}',
    '.mv-meta{display:flex;align-items:center;gap:7px;font-size:13px;color:#6b6a6a;font-weight:600}.mv-meta svg{width:15px;height:15px}',
    '.mv-foot{display:flex;align-items:center;gap:10px}.mv-prog{flex:1;height:6px;border-radius:3px;background:#efe7fb;overflow:hidden}.mv-prog span{display:block;height:100%;background:#7f11f4;border-radius:3px}',
    '.mv-foot small{font-size:12px;font-weight:700;color:#6b6a6a}',
    '.mv-new-card{align-items:center;justify-content:center;text-align:center;gap:8px;padding:24px;min-height:260px;border:1.5px dashed #d9cdef;background:#fbf9ff;color:#290756}',
    '.mv-new-card b{font-size:17px}.mv-new-card small{color:#6b6a6a;max-width:220px}',
    '.mv-new-ic{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#7f11f4,#9d6fff);color:#fff;box-shadow:0 10px 24px rgba(127,17,244,.3)}.mv-new-ic svg{width:24px;height:24px}',
    '@media (max-width:1023px){.mv-head h1{font-size:26px}.mv-new{display:none}.mv-hero{height:auto;border-radius:22px}.mv-hero-in{position:relative;min-height:400px;padding:16px}.mv-hero-main b{font-size:32px}.mv-hero-facts{gap:12px;font-size:13px}.mv-open{margin-left:0;width:100%;justify-content:center}.mv-stats{grid-template-columns:repeat(2,1fr);gap:10px}.mv-stats b{font-size:24px}.mv-bar{flex-direction:column;align-items:flex-start}}',
    '@media (prefers-reduced-motion:reduce){.mv-card{animation:none}}'
  ].join('\n');
  document.head.appendChild(style);
})();
