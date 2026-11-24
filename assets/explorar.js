/* Página /explorar: a mesma estrutura do app (Explorar com fotos, Mundo de destinos
   com globo e painel, Minhas viagens), aberta sem login. O globo é o mesmo do app
   (continentes do Natural Earth 110m em assets/globe-land.js) desenhado em canvas 2D. */
(function () {
  var API = 'https://ond.agamatec.com/api/countries?locale=pt_BR';
  var CACHE_KEY = 'ond_explorar_catalogo';
  var WEB_APP = 'https://web.ondviajar.com.br/ond-vai';
  var FEATURED = ['Rio de Janeiro', 'Orlando', 'Lisboa', 'Paris', 'Gramado', 'Buenos Aires',
    'Nova Iorque', 'Roma', 'Fernando de Noronha', 'Santiago', 'Cancún', 'Miami',
    'Foz do Iguaçu', 'Bariloche', 'Madri', 'Londres'];
  var RAD = Math.PI / 180;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var countries = [];
  var cities = [];
  var catalogLoaded = false;
  var tripGroups = { pais: [], mundo: [], explorar: [] };
  var currentTrips = 'pais';

  function normalize(text) {
    return (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function flagHtml(iso) {
    return iso ? '<img class="flag" src="/assets/flags/' + iso + '.svg" alt="" loading="lazy">' : '';
  }
  function cityPage(city) {
    var code = (city.unlocode || '').replace(/\s+/g, '');
    return '/explorar/destino/?cidade=' + encodeURIComponent(code || city.name);
  }
  function planLink(city) {
    var code = (city.unlocode || '').replace(/\s+/g, '');
    return code ? WEB_APP + '?city=' + encodeURIComponent(code) : WEB_APP;
  }

  /* ── catálogo ── */
  function applyCatalog(raw) {
    countries = raw.map(function (country) {
      var countryCities = (country.cities || []).map(function (city) {
        return {
          name: city.name, image: city.image || '', unlocode: city.unlocode || '',
          latitude: city.latitude, longitude: city.longitude,
          iso: country.countryCodeIso, countryName: country.name, query: normalize(city.name)
        };
      });
      var mapped = countryCities.filter(function (city) { return city.latitude != null && city.longitude != null; });
      var item = { name: country.name, iso: country.countryCodeIso, cities: countryCities, mapped: mapped, query: normalize(country.name) };
      if (mapped.length) {
        item.latitude = mapped.reduce(function (sum, city) { return sum + city.latitude; }, 0) / mapped.length;
        item.longitude = mapped.reduce(function (sum, city) { return sum + city.longitude; }, 0) / mapped.length;
      }
      return item;
    }).filter(function (country) { return country.cities.length; })
      .sort(function (first, second) { return first.name.localeCompare(second.name, 'pt'); });
    catalogLoaded = true;
    cities = [];
    countries.forEach(function (country) { cities.push.apply(cities, country.cities); });
    renderCards();
    tripGroups.explorar = featuredCities().map(function (city) {
      return { t: city.name, r: city.countryName, i: city.image, a: '', href: cityPage(city) };
    });
    renderTrips(currentTrips);
    renderPanel();
    globe.setPins(worldPins());
  }

  function loadCatalog() {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY)); } catch (storageError) {}
    if (cached && cached.length) { applyCatalog(cached); return; }
    fetch(API).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (raw) {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(raw)); } catch (storageError) {}
      applyCatalog(raw);
    }).catch(function () {
      if (document.getElementById('cards')) document.getElementById('cards').innerHTML = '';
      document.getElementById('painel').innerHTML = '<div class="panel-view"><p class="empty">Os destinos não carregaram. Tente de novo em instantes.</p></div>';
    });
  }

  /* ── Explorar ── */
  var cardsPage = 0;
  var CARDS_PER_PAGE = 4;
  function featuredCities() {
    var withImage = cities.filter(function (city) { return city.image; });
    var picked = [];
    FEATURED.forEach(function (name) {
      var city = withImage.find(function (candidate) { return candidate.name === name; });
      if (city) picked.push(city);
    });
    withImage.forEach(function (city) { if (picked.length < 16 && picked.indexOf(city) < 0) picked.push(city); });
    return picked.slice(0, 16);
  }
  function cardHtml(city) {
    return '<a class="card" href="' + cityPage(city) + '">' +
      '<img src="' + escapeHtml(city.image) + '" alt="" loading="lazy">' +
      '<span class="card-label"><strong>' + escapeHtml(city.name) + '</strong>' +
      '<span class="flag-row">' + flagHtml(city.iso) + escapeHtml(city.countryName) + '</span></span></a>';
  }
  function isPhone() { return window.matchMedia('(max-width: 1023px)').matches; }
  function renderCards() {
    if (!catalogLoaded || !document.getElementById('cards')) return;
    var list = featuredCities();
    var container = document.getElementById('cards');
    var pageCount = Math.ceil(list.length / CARDS_PER_PAGE);
    var visible = isPhone() ? list : list.slice(cardsPage * CARDS_PER_PAGE, cardsPage * CARDS_PER_PAGE + CARDS_PER_PAGE);
    container.innerHTML = visible.map(cardHtml).join('');
    document.getElementById('anterior').disabled = cardsPage === 0;
    document.getElementById('proximo').disabled = cardsPage >= pageCount - 1;
  }
  function turnCards(step) {
    var container = document.getElementById('cards');
    container.classList.add('swap');
    setTimeout(function () {
      cardsPage += step;
      renderCards();
      container.classList.remove('swap');
    }, reduceMotion ? 0 : 220);
  }
  if (document.getElementById('anterior')) {
    document.getElementById('anterior').addEventListener('click', function () { turnCards(-1); });
    document.getElementById('proximo').addEventListener('click', function () { turnCards(1); });
  }

  /* ── painel do Mundo de destinos ── */
  var selectedCountry = null;
  var panelQuery = '';
  var chevron = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg>';
  function cityTile(city) {
    var image = city.image ? '<img src="' + escapeHtml(city.image) + '" alt="" loading="lazy">' : '';
    return '<a class="city" href="' + cityPage(city) + '">' + image +
      '<span><small>' + flagHtml(city.iso) + escapeHtml(city.countryName) + '</small>' + escapeHtml(city.name) + '</span></a>';
  }
  function renderPanel(keepFocus) {
    var panel = document.getElementById('painel');
    if (selectedCountry) {
      panel.innerHTML = '<div class="panel-view">' +
        '<div class="back"><button type="button" id="voltar" aria-label="Voltar"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>' +
        flagHtml(selectedCountry.iso) + '<h3>' + escapeHtml(selectedCountry.name) + '</h3></div>' +
        '<div class="city-grid">' + selectedCountry.cities.map(cityTile).join('') + '</div></div>';
      panel.scrollTop = 0;
      document.getElementById('voltar').addEventListener('click', showWorld);
      return;
    }
    var query = normalize(panelQuery);
    var matchingCountries = query ? countries.filter(function (country) { return country.query.indexOf(query) >= 0; }) : countries;
    var matchingCities = query ? cities.filter(function (city) { return city.query.indexOf(query) >= 0; }).slice(0, 24) : [];
    var html = '<div class="panel-view">' +
      '<p class="sub" style="margin-top:0">Gire o globo, escolha um país e veja os destinos.</p>' +
      '<label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="busca-painel" type="search" placeholder="Buscar destino" aria-label="Buscar destino" autocomplete="off" value="' + escapeHtml(panelQuery) + '"></label>';
    if (!catalogLoaded) {
      html += '<p class="empty">Carregando os destinos do OND.</p>';
    } else if (!matchingCountries.length && !matchingCities.length) {
      html += '<p class="empty">Nenhum destino encontrado.</p>';
    }
    if (matchingCities.length) {
      html += '<p class="panel-title">Destinos</p><div class="city-grid">' + matchingCities.map(cityTile).join('') + '</div>';
    }
    if (matchingCountries.length) {
      if (query) html += '<p class="panel-title">Países</p>';
      html += '<div class="list">' + matchingCountries.map(function (country) {
        return '<button type="button" class="country" data-country="' + escapeHtml(country.name) + '">' +
          flagHtml(country.iso) + '<b>' + escapeHtml(country.name) + '</b><span class="count">' + country.cities.length + '</span>' + chevron + '</button>';
      }).join('') + '</div>';
    }
    html += '</div>';
    panel.innerHTML = html;
    var input = document.getElementById('busca-painel');
    input.addEventListener('input', function () { panelQuery = input.value; renderPanel(true); });
    if (keepFocus) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    panel.querySelectorAll('.country').forEach(function (button) {
      button.addEventListener('click', function () {
        openCountry(countries.find(function (country) { return country.name === button.dataset.country; }));
      });
    });
  }
  function countryZoom(country) {
    var spread = 1;
    country.mapped.forEach(function (city) {
      spread = Math.max(spread, Math.abs(city.latitude - country.latitude), Math.abs(city.longitude - country.longitude));
    });
    return Math.min(2, Math.max(1.2, 18 / spread));
  }
  function worldPins() {
    return countries.filter(function (country) { return country.mapped.length; }).map(function (country) {
      return { label: country.name, latitude: country.latitude, longitude: country.longitude, country: country };
    });
  }
  function openCountry(country) {
    if (!country) return;
    selectedCountry = country;
    renderPanel();
    globe.setPins(country.mapped.map(function (city) {
      return { label: city.name, latitude: city.latitude, longitude: city.longitude, city: city };
    }));
    if (country.mapped.length) globe.flyTo(country.latitude, country.longitude, countryZoom(country));
  }
  function showWorld() {
    var previous = selectedCountry;
    selectedCountry = null;
    renderPanel();
    globe.setPins(worldPins());
    if (previous && previous.mapped.length) globe.flyTo(previous.latitude, previous.longitude, 1);
  }

  document.getElementById('busca-topo').addEventListener('input', function (event) {
    panelQuery = event.target.value;
    if (currentView !== 'globo') setView('globo');
    selectedCountry = null;
    globe.setPins(worldPins());
    renderPanel();
  });
  document.getElementById('busca-topo').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') setView('globo', true);
  });

  /* ── globo (assets/globo-ond.js) ── */
  var globe = window.createOndGlobe(document.getElementById('globo'), {
    onPin: function (pin) {
      if (pin.country) openCountry(pin.country);
      else if (pin.city) {
        var url = cityPage(pin.city);
        if (window.ondGuardarDestino) window.ondGuardarDestino(url, pin.city.image, pin.city.name);
        window.location.href = url;
      }
    }
  });

  /* ── navegação: aba e barra lateral acompanham a rolagem ── */
  var spyTargets = ['topo', 'mundo', 'viagens'];
  /* duas formas de ver as viagens: lista ou globo (o antigo Mundo de destinos) */
  var currentView = 'grade';
  var tripsSection = document.getElementById('destaques');
  function setView(view, scroll) {
    currentView = view;
    tripsSection.setAttribute('data-ver', view);
    tripsSection.querySelectorAll('[data-ver]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.getAttribute('data-ver') === view)); });
    if (scroll) tripsSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    onScroll();
  }
  tripsSection.querySelectorAll('.view-switch [data-ver]').forEach(function (button) {
    button.addEventListener('click', function () { setView(button.getAttribute('data-ver')); });
  });
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href$="#mundo"]');
    if (!link) return;
    event.preventDefault();
    setView('globo', true);
  });
  window.ondSetView = setView;
  var indicator = document.querySelector('.rail-indicator');
  function markSection(id) {
    document.querySelectorAll('[data-spy]').forEach(function (link) { link.classList.toggle('on', link.dataset.spy === id); });
    var active = document.querySelector('.rail-item[data-spy="' + id + '"]');
    if (active && indicator) indicator.style.transform = 'translateY(' + (active.offsetTop + 8) + 'px)';
  }
  function onScroll() {
    var current = 'topo';
    spyTargets.forEach(function (id) {
      if (id === 'mundo' && currentView !== 'globo') return;
      var section = document.getElementById(id === 'mundo' ? 'destaques' : id);
      if (section && section.getBoundingClientRect().top < window.innerHeight * 0.45) current = id;
    });
    markSection(current);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (location.hash === '#mundo') setTimeout(function () { setView('globo', true); }, 300);
  window.addEventListener('resize', function () { renderCards(); onScroll(); });
  onScroll();

  /* ── Viagens em destaque (os mesmos dados da home: assets/viagens/destaques/pt.json) ── */
  /* carrossel das viagens: setas, rolagem lateral e arrastar com o mouse */
  var tripGrid = document.getElementById('destaques-grade');
  var tripPrev = document.getElementById('viagens-ant'), tripNext = document.getElementById('viagens-prox');
  function updateTripArrows() {
    if (!tripGrid || !tripPrev) return;
    tripPrev.disabled = tripGrid.scrollLeft < 8;
    tripNext.disabled = tripGrid.scrollLeft + tripGrid.clientWidth >= tripGrid.scrollWidth - 8;
  }
  if (tripGrid && tripPrev) {
    tripPrev.addEventListener('click', function () { tripGrid.scrollBy({ left: -tripGrid.clientWidth * 0.9, behavior: 'smooth' }); });
    tripNext.addEventListener('click', function () { tripGrid.scrollBy({ left: tripGrid.clientWidth * 0.9, behavior: 'smooth' }); });
    tripGrid.addEventListener('scroll', updateTripArrows, { passive: true });
    window.addEventListener('resize', updateTripArrows);
    var gridDrag = null, movedGrid = false;
    tripGrid.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' || event.button) return;
      gridDrag = { x: event.clientX, left: tripGrid.scrollLeft, id: event.pointerId };
      movedGrid = false;
    });
    tripGrid.addEventListener('pointermove', function (event) {
      if (!gridDrag) return;
      var dx = event.clientX - gridDrag.x;
      if (!movedGrid && Math.abs(dx) < 6) return;
      if (!movedGrid) { movedGrid = true; tripGrid.classList.add('arrastando'); try { tripGrid.setPointerCapture(gridDrag.id); } catch (error) {} }
      tripGrid.scrollLeft = gridDrag.left - dx;
    });
    function endGridDrag() {
      if (!gridDrag) return;
      gridDrag = null;
      if (movedGrid) {
        var left = tripGrid.scrollLeft;
        tripGrid.classList.remove('arrastando');
        tripGrid.scrollLeft = left;
        setTimeout(function () { movedGrid = false; }, 0);
      }
    }
    tripGrid.addEventListener('pointerup', endGridDrag);
    tripGrid.addEventListener('pointercancel', endGridDrag);
    tripGrid.addEventListener('click', function (event) { if (movedGrid) { event.preventDefault(); event.stopPropagation(); } }, true);
    tripGrid.addEventListener('dragstart', function (event) { event.preventDefault(); });
  }
  function tripHref(trip) {
    if (trip.href) return trip.href;
    var city = cities.find(function (item) { return normalize(item.name) === normalize(trip.t) && item.iso === trip.c; }) ||
      cities.find(function (item) { return normalize(item.name) === normalize(trip.t); });
    if (city) return cityPage(city);
    if (!catalogLoaded) return '/explorar/destino/?cidade=' + encodeURIComponent(trip.t);
    return '/viagens/' + trip.s + '/';
  }
  function renderTrips(group) {
    currentTrips = group;
    var grid = document.getElementById('destaques-grade');
    if (!grid || !tripGroups[group].length) return;
    grid.innerHTML = tripGroups[group].map(function (trip) {
      return '<a class="trip" href="' + tripHref(trip) + '"><picture>' + (trip.w ? '<source srcset="' + trip.w + '" type="image/webp">' : '') +
        '<img src="' + trip.i + '" alt="' + escapeHtml(trip.a || '') + '" loading="lazy"></picture><span class="trip-t"><b>' + escapeHtml(trip.t) + '</b><span>' + escapeHtml(trip.r || '') + '</span></span></a>';
    }).join('');
    grid.scrollLeft = 0;
    grid.classList.remove('entra'); void grid.offsetWidth; grid.classList.add('entra');
    updateTripArrows();
    onScroll();
  }
  document.querySelectorAll('.seg-tabs [role="tab"]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.seg-tabs [role="tab"]').forEach(function (other) { other.setAttribute('aria-selected', String(other === tab)); });
      renderTrips(tab.dataset.grupo);
    });
  });
  fetch('/assets/viagens/destaques/pt.json').then(function (response) { return response.json(); }).then(function (list) {
    tripGroups.pais = list.filter(function (trip) { return trip.c === 'BR'; });
    tripGroups.mundo = list.filter(function (trip) { return trip.c !== 'BR'; });
    renderTrips('pais');
  }).catch(function () { var section = document.getElementById('destaques'); if (section) section.hidden = true; });

  renderPanel();
  loadCatalog();
})();
