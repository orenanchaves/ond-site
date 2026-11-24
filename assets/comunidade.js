/* Comunidade do OND: nota em OND, resenhas com curtir e não curtir, seguir, catálogo de cidades.
   Protótipo: enquanto o servidor não tem resenha, perfil e passaporte, o que a pessoa publica fica
   neste navegador (localStorage), e os exemplos só carregam no localhost (assets/comunidade-demo.js). */
var OND_API = 'https://ond.agamatec.com/api/countries?locale=pt_BR';
var OND_WEB = 'https://web.ondviajar.com.br/ond-vai';
var IS_DEMO = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
var ONLY = '<svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path fill="#7F11F4" d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>';
var RATE_LABELS = ['', 'Não recomendo', 'Fraco', 'Bom', 'Muito bom', 'Imperdível'];
var MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
var MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

var VAI_ORB = '<span class="vai-orb"><svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg></span>';
var ICON = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v10H4V10zM7 10l4-7a2.5 2.5 0 0 1 3 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V4h3v10zM17 14l-4 7a2.5 2.5 0 0 1-3-2.5V15H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
};

function escapeHtml(text) {
  return String(text == null ? '' : text).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}
function normalizeText(text) {
  return (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function cityCode(city) { return (city.unlocode || '').replace(/\s+/g, '') || normalizeText(city.name); }
function cityPageUrl(city) { return '/explorar/destino/?cidade=' + encodeURIComponent(cityCode(city)); }
function planUrl(city) { var code = (city.unlocode || '').replace(/\s+/g, ''); return code ? OND_WEB + '?city=' + encodeURIComponent(code) : OND_WEB; }
function profileUrl(handle) { return '/explorar/viajante/' + (handle ? '?u=' + encodeURIComponent(handle) : ''); }
function flagHtml(iso, width, height) {
  return iso ? '<img class="flag" src="/assets/flags/' + iso + '.svg" alt="" width="' + (width || 20) + '" height="' + (height || 14) + '" loading="lazy">' : '';
}
function monthLabel(month) { var parts = month.split('-'); return MONTHS[+parts[1] - 1] + ' ' + parts[0]; }
function monthLong(month) { var parts = month.split('-'); return MONTHS_LONG[+parts[1] - 1] + ' de ' + parts[0]; }
function currentMonth() { var now = new Date(); return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); }

function ondSymbol(fill) {
  return '<span class="ond" style="--fill:' + fill + '%">' + ONLY.replace('<svg', '<svg class="off"') + ONLY.replace('<svg', '<svg class="on"') + '</span>';
}
function ondsHtml(value, size) {
  var html = '<span class="onds" style="--size:' + (size || 18) + 'px" role="img" aria-label="Nota ' + String(value).replace('.', ',') + ' de 5">';
  for (var index = 1; index <= 5; index++) html += ondSymbol(Math.round(Math.max(0, Math.min(1, value - index + 1)) * 100));
  return html + '</span>';
}
function avatarHtml(person, size) {
  var inner = person.photo ? '<img src="' + escapeHtml(person.photo) + '" alt="">' : escapeHtml(person.initials || '');
  return '<span class="avatar" style="--av:' + (size || 44) + 'px;background:' + (person.color || '#7f11f4') + '">' + inner + '</span>';
}

/* ── armazenamento do protótipo (troca pela API do servidor) ── */
var OndStore = {
  read: function (key, fallback) {
    try { var value = JSON.parse(localStorage.getItem('ond_comunidade_' + key)); return value == null ? fallback : value; } catch (storageError) { return fallback; }
  },
  write: function (key, value) {
    try { localStorage.setItem('ond_comunidade_' + key, JSON.stringify(value)); } catch (storageError) {}
  }
};
var ME = { name: 'Você', handle: 'voce', color: '#290756', initials: 'VC', mine: true };
if (window.ondConta && window.ondConta()) ME = Object.assign({}, window.ondConta(), { mine: true });

/* ── catálogo de cidades (mesma API do globo) ── */
function loadCatalog() {
  var cacheKey = 'ond_explorar_catalogo';
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(cacheKey)); } catch (storageError) {}
  var request = cached && cached.length ? Promise.resolve(cached) : fetch(OND_API).then(function (response) {
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }).then(function (raw) {
    try { sessionStorage.setItem(cacheKey, JSON.stringify(raw)); } catch (storageError) {}
    return raw;
  });
  return request.then(function (raw) {
    var cities = [];
    raw.forEach(function (country) {
      (country.cities || []).forEach(function (city) {
        cities.push({
          name: city.name, image: city.image || '', unlocode: city.unlocode || '', latitude: city.latitude, longitude: city.longitude,
          iso: country.countryCodeIso, countryName: country.name
        });
      });
    });
    return cities;
  });
}
var CIDADE_DA_PAGINA = null;
function findCity(cities, code) {
  var wanted = normalizeText(code).replace(/\s+/g, '');
  var found = cities.find(function (city) { return normalizeText(cityCode(city)).replace(/\s+/g, '') === wanted; }) ||
    cities.find(function (city) { return normalizeText(city.name) === normalizeText(code); });
  if (found) CIDADE_DA_PAGINA = found;
  return found;
}

/* ── resenhas ── */
function reviewHtml(review) {
  var person = review.author;
  var shots = (review.photos || []).map(function (src) { return '<img src="' + escapeHtml(src) + '" alt="" loading="lazy">'; }).join('');
  var link = person.mine ? profileUrl() : profileUrl(person.handle);
  return '<article class="review" data-id="' + review.id + '">' +
    '<div class="review-head"><a href="' + link + '">' + avatarHtml(person) + '</a>' +
    '<div class="who"><a href="' + link + '"><b>' + escapeHtml(person.name) + '</b></a><span>@' + escapeHtml(person.handle) + ' · ' + escapeHtml(review.when) + '</span></div>' +
    (person.mine ? '' : '<button class="follow' + (isFollowing(person.handle) ? ' on' : '') + '" data-handle="' + escapeHtml(person.handle) + '" data-name="' + escapeHtml(person.name) + '">' + (isFollowing(person.handle) ? 'Seguindo' : 'Seguir') + '</button>') +
    '</div>' +
    '<span class="place">' + ICON.pin + escapeHtml(review.place) + '</span>' +
    '<div class="review-rate">' + ondsHtml(review.rate, 18) + '<span>' + RATE_LABELS[Math.round(review.rate)] + '</span></div>' +
    '<p>' + escapeHtml(review.text) + '</p>' +
    (shots ? '<div class="shots">' + shots + '</div>' : '') +
    '<div class="react">' +
    '<button class="up' + (voteOf(review.id) === 1 ? ' on' : '') + '" data-vote="1">' + ICON.up + '<span>Curtir · ' + (review.likes + (voteOf(review.id) === 1 ? 1 : 0)) + '</span></button>' +
    '<button class="down' + (voteOf(review.id) === -1 ? ' on' : '') + '" data-vote="-1">' + ICON.down + '<span>Não curti</span></button>' +
    (reviewTripItem(review) ? '<button class="add-trip" data-add-viagem data-pede-conta="viagens">' + ICON.plus + '<span>Adicionar na minha viagem</span></button>' : '') +
    '</div></article>';
}
/* "Adicionar na minha viagem" (assets/adicionar-viagem.js): só aparece quando a página carrega a folha */
function reviewTripItem(review) {
  if (!window.OndAddViagem) return null;
  if (review.tripItem === undefined) review.tripItem = window.OndAddViagem.fromReview(review, CIDADE_DA_PAGINA);
  return review.tripItem;
}
function isFollowing(handle) { return OndStore.read('seguindo', {})[handle] === true; }
function setFollowing(handle, value) { var all = OndStore.read('seguindo', {}); all[handle] = value; OndStore.write('seguindo', all); }
function voteOf(reviewId) { return OndStore.read('votos', {})[reviewId] || 0; }
function setVote(reviewId, value) { var all = OndStore.read('votos', {}); all[reviewId] = value; OndStore.write('votos', all); }

function bindReviews(container, reviews) {
  container.addEventListener('click', function (event) {
    var follow = event.target.closest('.follow');
    if (follow) {
      var following = !isFollowing(follow.dataset.handle);
      setFollowing(follow.dataset.handle, following);
      document.querySelectorAll('.follow[data-handle="' + follow.dataset.handle + '"]').forEach(function (button) {
        button.classList.toggle('on', following);
        button.textContent = following ? 'Seguindo' : 'Seguir';
      });
      toast(following ? 'Agora você segue ' + follow.dataset.name : 'Você deixou de seguir ' + follow.dataset.name);
      return;
    }
    var addTrip = event.target.closest('[data-add-viagem]');
    if (addTrip) {
      var reviewed = reviews.find(function (item) { return String(item.id) === addTrip.closest('.review').dataset.id; });
      if (reviewed && reviewTripItem(reviewed)) window.OndAddViagem.open(reviewTripItem(reviewed));
      return;
    }
    var vote = event.target.closest('[data-vote]');
    if (!vote) return;
    var card = vote.closest('.review');
    var review = reviews.find(function (item) { return String(item.id) === card.dataset.id; });
    var value = +vote.dataset.vote;
    var next = voteOf(review.id) === value ? 0 : value;
    setVote(review.id, next);
    card.querySelector('.up').classList.toggle('on', next === 1);
    card.querySelector('.down').classList.toggle('on', next === -1);
    card.querySelector('.up span').textContent = 'Curtir · ' + (review.likes + (next === 1 ? 1 : 0));
  });
}

/* toast(mensagem) ou toast(mensagem, { href, label }) para levar a um link (fica mais tempo na tela) */
function toast(message, link) {
  var element = document.querySelector('.toast');
  if (!element) { element = document.createElement('div'); element.className = 'toast'; element.setAttribute('role', 'status'); document.body.appendChild(element); }
  element.textContent = message;
  element.classList.toggle('com-link', !!(link && link.href));
  if (link && link.href) {
    var anchor = document.createElement('a');
    anchor.href = link.href; anchor.textContent = link.label || 'Abrir';
    element.appendChild(anchor);
  }
  element.classList.add('on');
  clearTimeout(element.timer);
  element.timer = setTimeout(function () { element.classList.remove('on'); }, link && link.href ? 6000 : 2400);
}
function openSheet(id) {
  document.querySelector('.scrim').classList.add('on');
  document.getElementById(id).classList.add('on');
}
function closeSheets() {
  document.querySelectorAll('.scrim, .sheet').forEach(function (element) { element.classList.remove('on'); });
}
document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeSheets(); });
document.addEventListener('click', function (event) {
  if (event.target.closest('[data-close]') || event.target.classList.contains('scrim')) closeSheets();
});

/* ── botão Planejar: abre "Planejar com o OND vAI" ou "Comprar viagem" ── */
var ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
var ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
function planMenuHtml(city, label) {
  return '<details class="plan-menu"><summary class="btn btn-primary">' + VAI_ORB + '<span>' + escapeHtml(label || 'Planejar') + '</span>' + ICON_CHEV + '</summary>' +
    '<div class="plan-pop">' +
    '<a href="' + planUrl(city) + '">' + VAI_ORB + 'Planejar com o OND vAI</a>' +
    '<a href="/viagens/" data-comprar="' + escapeHtml(city.name) + '"><span class="vai-orb buy-orb">' + ICON_BAG + '</span>Comprar viagem</a>' +
    '</div></details>';
}
var buscaIndex = null;
function bindPlanMenus(container) {
  var links = (container || document).querySelectorAll('[data-comprar]');
  if (!links.length) return;
  buscaIndex = buscaIndex || fetch('/assets/busca.json').then(function (response) { return response.json(); }).catch(function () { return []; });
  buscaIndex.then(function (index) {
    Array.prototype.forEach.call(links, function (link) {
      var wanted = normalizeText('Viaje para ' + link.getAttribute('data-comprar'));
      var entry = index.find(function (item) { return item.k === 'Destino' && normalizeText(item.t) === wanted; });
      if (entry) link.href = entry.u;
    });
  });
}
document.addEventListener('click', function (event) {
  var buy = event.target.closest && event.target.closest('[data-comprar]');
  if (buy && window.ondOpenVai && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    var menu = buy.closest('details'); if (menu) menu.open = false;
    window.ondOpenVai(null, 'Quero comprar uma viagem para ' + buy.getAttribute('data-comprar') + '.');
    return;
  }
  Array.prototype.forEach.call(document.querySelectorAll('details.plan-menu[open]'), function (menu) {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  Array.prototype.forEach.call(document.querySelectorAll('details.plan-menu[open]'), function (menu) { menu.open = false; });
});

/* ── ações que pedem conta ── o site ainda não tem sessão própria; para testar o fluxo de quem
   já tem conta, rodar no console: localStorage.setItem('ond-conta-demo', '1') */
function ondTemConta() { try { if (!/^(localhost|127.0.0.1)$/.test(location.hostname)) return false; var modo = sessionStorage.getItem('ond-conta-modo'); if (modo) return modo === 'teste'; return localStorage.getItem('ond-conta-demo') === '1'; } catch (error) { return false; } }
var GATILHOS_CONTA = [
  ['[data-open="resenha"]', 'resenha'],
  ['.follow', 'seguir'],
  ['[data-vote]', 'curtir'],
  ['#marcar, [data-marcar]', 'carimbo'],
  ['#abrir-editar', 'perfil']
];
document.addEventListener('click', function (event) {
  if (ondTemConta() || !event.target.closest) return;
  for (var index = 0; index < GATILHOS_CONTA.length; index++) {
    if (event.target.closest(GATILHOS_CONTA[index][0])) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (window.ondLogin) window.ondLogin(GATILHOS_CONTA[index][1]);
      return;
    }
  }
}, true);

/* compartilhar: menu do celular quando existe; senão, copia o link */
var ICON_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
function shareLink(title, text, url) {
  url = url || location.href;
  if (navigator.share) { navigator.share({ title: title, text: text, url: url }).catch(function () {}); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copiado. É só colar para quem você quiser.'); }, function () { toast(url); });
  else toast(url);
}

/* /explorar/roteiro/?id=...&dia=2&item=3 (link do "Ver no roteiro" das avaliações): abre esse dia,
   rola até ele e marca o item novo. &salvos=1 rola até os lugares salvos; &hospedagem=1, até
   "Onde você vai ficar". Fica aqui porque roteiro.js só abre o primeiro dia. */
(function () {
  if (!/^\/explorar\/roteiro\/?/.test(location.pathname)) return;
  var params = new URLSearchParams(location.search);
  var dia = +params.get('dia'), item = +params.get('item'), salvos = params.get('salvos'), hospedagem = params.get('hospedagem');
  if (!dia && !salvos && !hospedagem) return;
  function go() {
    var root = document.getElementById('roteiro');
    if (!root) return;
    var target = null;
    if (dia) {
      var day = root.querySelector('.day[data-day="' + (dia - 1) + '"]');
      if (day && day.classList.contains('fechado')) { var head = day.querySelector('[data-abrir]'); if (head) head.click(); day = root.querySelector('.day[data-day="' + (dia - 1) + '"]'); }
      target = day;
      var row = item && root.querySelector('.act[data-key="' + (dia - 1) + '-' + (item - 1) + '"]');
      if (row) { row.classList.add('av-novo'); target = row; setTimeout(function () { row.classList.remove('av-novo'); }, 4000); }
    } else if (salvos) {
      target = root.querySelector('.saved');
      if (target) { target.classList.add('av-novo'); setTimeout(function () { target.classList.remove('av-novo'); }, 4000); }
    } else if (hospedagem) {
      var openTrip = root.querySelector('[data-tab="viagem"]');
      if (openTrip) openTrip.click();
      setTimeout(function () {
        var section = root.querySelector('[data-secao="hospedagem"]');
        if (section) section.click();
        setTimeout(function () {
          var stays = root.querySelector('#sec-hospedagem');
          if (stays) { stays.scrollIntoView({ block: 'start' }); stays.classList.add('av-novo'); setTimeout(function () { stays.classList.remove('av-novo'); }, 4000); }
        }, 350);
      }, 350);
      return;
    }
    if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 120);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(go, 60); });
  else setTimeout(go, 60);
})();

/* ── foto em tela cheia, passando uma a uma (setas, teclado e arrastar no celular) ──
   ondVerFotos(['a.jpg', 'b.jpg'], 0). Usado no Guia e nas resenhas do destino. */
var ondVerFotos = (function () {
  var tela = null, serie = [], atual = 0, toqueX = null, voltar = null;
  var seta = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  function montar() {
    tela = document.createElement('div');
    tela.className = 'av-foto-full'; tela.hidden = true;
    tela.setAttribute('role', 'dialog'); tela.setAttribute('aria-modal', 'true'); tela.setAttribute('aria-label', 'Fotos');
    tela.innerHTML = '<button type="button" class="av-ff-x" data-ff="fechar" aria-label="Fechar">' + seta('M6 6l12 12M18 6 6 18') + '</button>' +
      '<button type="button" class="av-ff-seta av-ff-ant" data-ff="-1" aria-label="Foto anterior">' + seta('m15 5-7 7 7 7') + '</button>' +
      '<img alt="">' +
      '<button type="button" class="av-ff-seta av-ff-prox" data-ff="1" aria-label="Próxima foto">' + seta('m9 5 7 7-7 7') + '</button>' +
      '<span class="av-ff-conta"></span>';
    document.body.appendChild(tela);
    tela.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ff]');
      if (b) { if (b.dataset.ff === 'fechar') fechar(); else mostrar(atual + +b.dataset.ff); return; }
      if (e.target === tela) fechar();
    });
    window.addEventListener('keydown', function (e) {
      if (tela.hidden) return;
      if (e.key === 'Escape') { e.stopImmediatePropagation(); fechar(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { var passo = e.key === 'ArrowRight' ? 1 : -1; if (document.documentElement.dir === 'rtl') passo = -passo; mostrar(atual + passo); }
    }, true);
    tela.addEventListener('touchstart', function (e) { toqueX = e.touches[0].clientX; }, { passive: true });
    tela.addEventListener('touchend', function (e) {
      if (toqueX == null) return;
      var dx = e.changedTouches[0].clientX - toqueX; toqueX = null;
      if (Math.abs(dx) > 40 && serie.length > 1) mostrar(atual + (dx < 0 ? 1 : -1));
    });
  }
  function mostrar(i) {
    atual = (i + serie.length) % serie.length;
    tela.querySelector('img').src = serie[atual];
    tela.querySelector('.av-ff-conta').textContent = (atual + 1) + ' de ' + serie.length;
    var varias = serie.length > 1;
    tela.querySelectorAll('.av-ff-seta').forEach(function (b) { b.hidden = !varias; });
    tela.querySelector('.av-ff-conta').hidden = !varias;
  }
  function fechar() { tela.hidden = true; if (voltar && voltar.focus) voltar.focus(); }
  return function (fotos, i) {
    if (!fotos || !fotos.length) return;
    if (!tela) montar();
    voltar = document.activeElement;
    serie = fotos; tela.hidden = false; mostrar(i || 0);
    tela.querySelector('.av-ff-x').focus();
  };
})();
