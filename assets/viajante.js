/* Página /explorar/viajante/: perfil público com passaporte, territórios e globo.
   Sem ?u= é o perfil de quem está vendo (dono): carimbos e perfil ficam neste navegador até o servidor existir.
   Com ?u=handle mostra outro viajante (no protótipo, só os exemplos do localhost). */
(function () {
  var handle = new URLSearchParams(location.search).get('u');
  /* meu: o perfil é meu (sem ?u=). previa: meu perfil como os outros veem (?previa), sem nada de dono. */
  var meu = !handle;
  var previa = meu && new URLSearchParams(location.search).has('previa');
  var owner = meu && !previa;
  var TODAY = currentMonth();
  var INKS = ['#7f11f4', '#085e20', '#c67810', '#560fb2', '#290756'];
  var SHAPES = ['round', 'rect', 'ticket'];
  var PER_PAGE = 9;
  var SYMBOL = ONLY.replace('<svg', '<svg class="sym"');
  /* cores do perfil: paleta do design system (tokens e cores que o app já usa) */
  var COLORS = [['#7f11f4', 'Roxo OND'], ['#560fb2', 'Roxo escuro'], ['#290756', 'Roxo noite'], ['#f59811', 'Laranja'],
    ['#c67810', 'Dourado'], ['#085e20', 'Verde'], ['#0b7a8a', 'Petróleo'], ['#0055dd', 'Azul']];
  var ICON_OLHO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  function urlPrevia(ligar) {
    var busca = new URLSearchParams(location.search);
    if (ligar) busca.set('previa', ''); else busca.delete('previa');
    var texto = busca.toString().replace(/=(&|$)/g, '$1');
    return location.pathname + (texto ? '?' + texto : '');
  }
  function hexRgb(hex) { var h = String(hex || '#7f11f4').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16) || 0; }); }
  function luz(rgb) { return rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (soma, v, i) { return soma + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrasteCor(a, b) { var x = luz(a), y = luz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /* aproxima a cor do fundo (claro) ou do branco (escuro) até ler bem como texto, 4.5:1 */
  function corLegivel(hex, fundo) {
    var cor = hexRgb(hex), alvo = luz(fundo) > 0.5 ? [0, 0, 0] : [255, 255, 255];
    for (var passo = 0; passo <= 20 && contrasteCor(cor, fundo) < 4.5; passo++) {
      cor = cor.map(function (v, i) { return Math.round(v + (alvo[i] - v) * 0.08); });
    }
    return 'rgb(' + cor.join(',') + ')';
  }
  var COUNTRIES = {};
  window.WAR_MAP.countries.forEach(function (country) { if (country.iso) COUNTRIES[country.iso] = country.name; });

  var person, stamps, cities = [];
  var contaTeste = meu && window.ondConta && window.ondConta() && OND_EXEMPLO && OND_EXEMPLO.people[window.ondConta().handle];
  if (contaTeste) {
    person = Object.assign({}, contaTeste, OndStore.read('perfil', {}));
    stamps = OndStore.read('carimbos_conta_teste', null) || OND_EXEMPLO.stamps[window.ondConta().handle].slice();
  } else if (meu) {
    person = Object.assign({ name: 'Você', handle: 'voce', color: '#7f11f4', initials: 'VC', base: '', since: TODAY, bio: '', instagram: '', style: '', followers: 0, following: 0, cover: '' }, OndStore.read('perfil', {}));
    stamps = OndStore.read('carimbos', []);
  } else {
    person = OND_EXEMPLO && OND_EXEMPLO.people[handle];
    stamps = OND_EXEMPLO && OND_EXEMPLO.stamps[handle] ? OND_EXEMPLO.stamps[handle].slice() : [];
  }
  if (!person) {
    document.getElementById('perfil').innerHTML = '<p style="padding:80px 0;text-align:center;color:var(--muted)">Esse viajante não foi encontrado. <a href="/explorar/" style="color:var(--purple);font-weight:700">Voltar a explorar</a></p>';
    return;
  }
  window.ondPerfilAtual = { meu: meu, previa: previa, handle: person.handle, nome: person.name };

  /* prévia: faixa no topo e nada que só o dono vê */
  if (previa) {
    document.documentElement.classList.add('perfil-previa');
    var faixa = document.createElement('div');
    faixa.className = 'previa-faixa';
    faixa.setAttribute('role', 'status');
    faixa.innerHTML = ICON_OLHO + '<span>Você está vendo seu perfil como os outros veem</span><a href="' + urlPrevia(false) + '">Voltar a editar</a>';
    document.body.insertBefore(faixa, document.body.firstChild);
  }

  document.querySelectorAll('.sheet .x').forEach(function (button) { button.innerHTML = ICON.close; });
  if (document.getElementById('icone-camera')) document.getElementById('icone-camera').outerHTML = ICON.camera;
  document.getElementById('pag-ant').innerHTML = ICON.prev;
  document.getElementById('pag-prox').innerHTML = ICON.next;
  document.getElementById('tag-passaporte').insertAdjacentHTML('afterbegin', ONLY.replace('<svg', '<svg width="16" height="16"'));
  document.getElementById('legenda-roteiro').insertAdjacentHTML('afterbegin', ICON.sparkle);
  document.getElementById('marcar').innerHTML = ICON.pin + 'Marcar lugar';

  function cityByName(name) { return cities.find(function (city) { return city.name === name; }); }
  function stampInfo(stamp) {
    var city = stamp.city ? cityByName(stamp.city) : null;
    var iso = city ? city.iso : stamp.iso;
    return { city: city, iso: iso, title: stamp.city || COUNTRIES[iso] || '', country: city ? city.countryName : COUNTRIES[iso] || '' };
  }
  function isFuture(stamp) { return stamp.month > TODAY; }

  /* ── cabeçalho ── */
  function applyProfile() {
    document.documentElement.style.setProperty('--accent', person.color);
    var firstCity = stamps.map(stampInfo).find(function (info) { return info.city && info.city.image; });
    var cover = person.cover || (firstCity ? firstCity.city.image : '');
    var coverImage = document.getElementById('capa');
    if (cover) { coverImage.src = cover; coverImage.hidden = false; } else coverImage.hidden = true;
    var avatar = document.getElementById('avatar');
    avatar.style.background = person.color;
    avatar.innerHTML = person.photo ? '<img src="' + person.photo + '" alt="">' : escapeHtml(person.initials);
    document.getElementById('foto-id').style.background = person.color;
    document.getElementById('foto-id').innerHTML = person.photo ? '<img src="' + person.photo + '" alt="">' : escapeHtml(person.initials);
    document.getElementById('nome').textContent = person.name;
    document.getElementById('handle').textContent = '@' + person.handle + (person.base ? ' · ' + person.base : '');
    document.getElementById('bio').textContent = person.bio || (owner ? 'Conte em uma frase como você viaja. Toque em Personalizar perfil.' : '');
    document.getElementById('links').innerHTML = person.instagram ? '<a class="ig" href="https://instagram.com/' + encodeURIComponent(person.instagram) + '" rel="noopener" target="_blank">' + ICON.instagram + '<span>@' + escapeHtml(person.instagram) + '</span></a>' : '';
    document.getElementById('id-nome').textContent = person.name;
    document.getElementById('id-desde').textContent = person.since ? monthLabel(person.since).toLowerCase() : '';
    document.getElementById('id-base').textContent = person.base || '';
    document.getElementById('id-estilo').textContent = person.style || '';
    var surname = person.name.split(' ').slice(-1)[0], given = person.name.split(' ')[0];
    var line = function (text) { return (text.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9.]/g, '<') + '<'.repeat(30)).slice(0, 36); };
    document.getElementById('mrz').innerHTML = escapeHtml(line('P<OND<' + surname + '<<' + given)) + '<br>' + escapeHtml(line(person.handle + '<<BR<' + (person.since || '').slice(0, 4)));
    document.getElementById('acoes').innerHTML = owner
      ? '<button class="btn-perfil" id="abrir-editar"><span class="bp-ic">' + ICON.pen + '</span><span class="bp-t">Personalizar perfil</span></button><button class="btn-share" id="compartilhar" aria-label="Compartilhar passaporte" title="Compartilhar passaporte">' + ICON_SHARE + '</button>' +
        '<a class="btn-previa" id="ver-previa" href="' + urlPrevia(true) + '">' + ICON_OLHO + '<span>Ver como os outros veem</span></a>'
      : previa
      ? '<button class="btn btn-primary" id="seguir" aria-disabled="true" title="Quem visita seu perfil vê este botão">Seguir</button><button class="btn-share" aria-disabled="true" tabindex="-1" aria-label="Compartilhar passaporte" title="Compartilhar passaporte">' + ICON_SHARE + '</button>'
      : '<button class="btn ' + (isFollowing(person.handle) ? 'btn-line' : 'btn-primary') + '" id="seguir">' + (isFollowing(person.handle) ? 'Seguindo' : 'Seguir') + '</button><button class="btn-share" id="compartilhar" aria-label="Compartilhar passaporte" title="Compartilhar passaporte">' + ICON_SHARE + '</button>';
    document.getElementById('marcar').hidden = !owner;
    pintarAcento();
  }
  /* cor do perfil: --accent é a escolhida; --accent-texto é a versão legível como texto no tema atual
     (escurece no claro, clareia no escuro) e --accent-tinta é a cor do texto em cima dela */
  function pintarAcento() {
    var raiz = document.documentElement;
    var escuro = raiz.getAttribute('data-theme') === 'dark';
    raiz.style.setProperty('--accent', person.color);
    raiz.style.setProperty('--accent-texto', corLegivel(person.color, escuro ? [22, 22, 31] : [255, 255, 255]));
    /* capa: com a cor padrão fica o véu de sempre; com outra cor, o véu puxa para ela */
    raiz.style.setProperty('--accent-capa', person.color === '#7f11f4' ? 'rgba(41,7,86,.55)' : 'color-mix(in srgb,' + person.color + ' 62%,transparent)');
    raiz.style.setProperty('--accent-icone', person.color === '#7f11f4' ? 'linear-gradient(135deg,#7f11f4,#9d6fff)' : person.color);
    raiz.style.setProperty('--accent-tinta', contrasteCor(hexRgb(person.color), [255, 255, 255]) >= 4.5 ? '#fff' : '#290756');
  }
  window.addEventListener('ond-tema', function () { pintarAcento(); });
  /* avaliações do Guia assinadas por este perfil (as de Lisboa que vêm das resenhas já entram pela conta de cima) */
  function avaliacoesDoGuia() {
    return (window.OND_AVALIACOES || []).filter(function (item) { return item.by === person.handle && item.id.indexOf('av-lis-ex') !== 0; });
  }
  function renderStats() {
    var past = stamps.filter(function (stamp) { return !isFuture(stamp); });
    var countries = {};
    past.forEach(function (stamp) { var info = stampInfo(stamp); if (info.iso) countries[info.iso] = true; });
    var reviewsCount = meu ? Object.keys(localStorage).filter(function (key) { return key.indexOf('ond_comunidade_resenhas_') === 0; })
      .reduce(function (sum, key) { return sum + (OndStore.read(key.replace('ond_comunidade_', ''), []).length); }, 0)
      : (OND_EXEMPLO ? Object.keys(OND_EXEMPLO.reviews).reduce(function (sum, code) { return sum + OND_EXEMPLO.reviews[code].filter(function (review) { return review.by === person.handle; }).length; }, 0) : 0) + avaliacoesDoGuia().length;
    var followers = (person.followers || 0) + (!meu && isFollowing(person.handle) ? 1 : 0);
    var cityCount = past.filter(function (stamp) { return stamp.city; }).length, countryCount = Object.keys(countries).length;
    var values = [[countryCount, countryCount === 1 ? 'país' : 'países'], [cityCount, cityCount === 1 ? 'cidade' : 'cidades'], [reviewsCount, reviewsCount === 1 ? 'resenha' : 'resenhas'], [followers, followers === 1 ? 'seguidor' : 'seguidores'], [person.following || 0, 'seguindo']];
    document.getElementById('stats').innerHTML = values.map(function (value) { return '<div class="stat"><b data-count="' + value[0] + '">0</b><span>' + value[1] + '</span></div>'; }).join('');
    document.querySelectorAll('[data-count]').forEach(function (element) {
      var target = +element.dataset.count, start = performance.now();
      (function step(now) {
        var progress = Math.min(1, (now - start) / 1100);
        element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(step);
      })(start);
    });
    document.getElementById('n-paises').textContent = Object.keys(countries).length;
    document.getElementById('n-cidades').textContent = past.filter(function (stamp) { return stamp.city; }).length;
    document.getElementById('n-futuro').textContent = stamps.length - past.length;
  }
  document.getElementById('acoes').addEventListener('click', function (event) {
    if (event.target.closest('#abrir-editar')) { openEditor(); return; }
    if (event.target.closest('#seguir')) {
      if (previa) { toast('Na prévia o Seguir é só ilustrativo'); return; }
      var following = !isFollowing(person.handle);
      setFollowing(person.handle, following);
      toast(following ? 'Agora você segue ' + person.name : 'Você deixou de seguir ' + person.name);
      applyProfile(); renderStats();
    }
  });

  /* ── passaporte ── */
  var page = 0, turning = false, TURN_MS = 900;
  function sortedStamps() { return stamps.slice().sort(function (first, second) { return second.month.localeCompare(first.month); }); }
  /* páginas de carimbo (9 por página, mais uma em branco no fim); a abertura (0) tem os dados à
     esquerda; da abertura 1 em diante, as duas páginas são de carimbos */
  function chunkCount() { return stamps.length ? Math.ceil(stamps.length / PER_PAGE) + 1 : 1; }
  function pageCount() { return 1 + Math.ceil((chunkCount() - 1) / 2); }
  function rightChunk(spread) { return spread === 0 ? 0 : spread * 2; }
  function leftChunk(spread) { return spread * 2 - 1; }
  function stampsHtml(chunk) {
    if (chunk == null) chunk = rightChunk(page);
    var list = sortedStamps().slice(chunk * PER_PAGE, chunk * PER_PAGE + PER_PAGE);
    if (!list.length && !stamps.length) {
      return '<div class="empty-passport"><b>' + (owner ? 'Seu passaporte está em branco' : 'Nenhum carimbo ainda') + '</b>' +
        (owner ? 'Os carimbos entram sozinhos quando você cria um roteiro no OND vAI. Também dá para marcar à mão.<br><button class="btn btn-primary btn-sm" data-marcar>' + ICON.pin + 'Marcar lugar</button>' : '') + '</div>';
    }
    return list.map(function (stamp, index) {
      var info = stampInfo(stamp), seed = info.title.length + stamp.month.charCodeAt(6);
      var future = isFuture(stamp);
      return '<button class="stamp ' + SHAPES[seed % 3] + (future ? ' future' : '') + '" style="--ink:' + INKS[seed % INKS.length] + ';--tilt:' + ((seed % 7) - 3) * 2.5 + 'deg;animation-delay:' + index * 70 + 'ms" data-key="' + escapeHtml(stamp.city || stamp.iso) + '|' + stamp.month + '" title="' + (future ? 'Viagem marcada' : 'Já fui') + '">' +
        (stamp.from === 'roteiro' ? '<span class="origin" aria-label="Veio do roteiro">' + ICON.sparkle + '</span>' : '') +
        SYMBOL + '<b>' + escapeHtml(info.title) + '</b><span>' + escapeHtml((stamp.city ? info.country : 'PAÍS').toUpperCase()) + '</span><small>' + (future ? 'EM ' : 'ENTRADA ') + monthLabel(stamp.month) + '</small></button>';
    }).join('');
  }
  function renderStamps() {
    page = Math.min(page, pageCount() - 1);
    document.getElementById('carimbos').innerHTML = stampsHtml(rightChunk(page));
    renderLeft(page);
    document.getElementById('pag-num').textContent = (page + 1) + ' de ' + pageCount();
    document.getElementById('pag-ant').disabled = page === 0;
    document.getElementById('pag-prox').disabled = page >= pageCount() - 1;
    renderStats();
    if (globe) globe.setPins(stamps.filter(function (stamp) { return !isFuture(stamp); }).map(stampInfo).filter(function (info) { return info.city && info.city.latitude != null; })
      .map(function (info) { return { label: info.city.name, latitude: info.city.latitude, longitude: info.city.longitude }; }));
    if (!document.getElementById('vista-territorios').hidden) renderWar();
  }
  /* Interesses: os salvos e sugestões de destinos (salvar pede conta) */
  var SUGESTOES = ['Paris', 'Roma', 'Gramado', 'Bariloche', 'Cancún', 'Salvador', 'Buenos Aires', 'Orlando', 'Rio de Janeiro', 'Lisboa', 'Santiago', 'Fernando de Noronha', 'Florianópolis', 'Foz do Iguaçu', 'Porto de Galinhas', 'Jericoacoara', 'Bonito', 'Maceió', 'Natal', 'Nova York', 'Madri', 'Barcelona', 'Londres', 'Amsterdã', 'Punta Cana', 'Cartagena', 'Montevidéu', 'Cusco', 'Lima', 'Tóquio'];
  function renderWishes() {
    var box = document.getElementById('wishes');
    if (!box || !owner) return;
    var saved = OndStore.read('interesse', {});
    var visited = {};
    stamps.forEach(function (stamp) { if (stamp.city && !isFuture(stamp)) visited[normalizeText(stamp.city)] = true; });
    var withImage = cities.filter(function (city) { return city.image; });
    var savedList = withImage.filter(function (city) { return saved[cityCode(city)]; });
    var suggestions = [];
    SUGESTOES.forEach(function (name) {
      var city = withImage.find(function (item) { return item.name === name; });
      if (city && !visited[normalizeText(city.name)] && !saved[cityCode(city)] && suggestions.length < 8) suggestions.push(city);
    });
    function card(city, on) {
      return '<article class="wcard"><a href="' + cityPageUrl(city) + '"><img src="' + escapeHtml(city.image) + '" alt="" loading="lazy"><span class="wcard-t"><b>' + escapeHtml(city.name) + '</b><small>' + flagHtml(city.iso, 16, 11) + escapeHtml(city.countryName) + '</small></span></a>' +
        '<button class="wheart' + (on ? ' on' : '') + '" data-wish="' + escapeHtml(cityCode(city)) + '" data-nome="' + escapeHtml(city.name) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Tirar dos interesses' : 'Salvar nos interesses') + '">' + ICON.heart + '</button></article>';
    }
    box.innerHTML = (savedList.length ? '<h3 class="wish-sub">Salvos</h3><div class="wish-grid">' + savedList.map(function (city) { return card(city, true); }).join('') + '</div>' : '') +
      '<h3 class="wish-sub">Sugestões para você</h3><div class="wish-grid">' + suggestions.map(function (city) { return card(city, false); }).join('') + '</div>';
  }
  document.getElementById('wishes').addEventListener('click', function (event) {
    var heart = event.target.closest('[data-wish]');
    if (!heart) return;
    event.preventDefault();
    var all = OndStore.read('interesse', {});
    all[heart.dataset.wish] = !all[heart.dataset.wish];
    OndStore.write('interesse', all);
    toast(all[heart.dataset.wish] ? heart.dataset.nome + ' entrou nos seus interesses' : heart.dataset.nome + ' saiu dos seus interesses');
    renderWishes();
  });
  window.ondPassaporteInicio = function () { if (turning) return; page = 0; renderStamps(); };
  function renderLeft(spread) {
    var book = document.getElementById('vista-passaporte');
    book.setAttribute('data-spread', String(spread));
    document.getElementById('carimbos-esq').innerHTML = spread > 0 ? stampsHtml(leftChunk(spread)) : '';
  }
  function leftFace(spread) {
    return '<div class="page-head"><div class="page-tag">CARIMBOS</div></div><div class="stamps">' + stampsHtml(leftChunk(spread)) + '</div>';
  }
  function turnPage(direction, manual) {
    var target = page + direction;
    if (turning || target < 0 || target >= pageCount()) return null;
    turning = true;
    var right = document.getElementById('pagina'), spread = right.parentElement, box = document.getElementById('carimbos');
    var oldStamps = box.innerHTML, newStamps;
    var leaf = document.createElement('div');
    leaf.className = 'leaf ' + (direction > 0 ? 'next' : 'prev');
    leaf.style.setProperty('--turn', TURN_MS + 'ms');
    leaf.style.left = right.offsetLeft + 'px';
    leaf.style.width = right.offsetWidth + 'px';
    var front, backHtml, from = page;
    page = target;
    if (direction > 0) {
      /* a folha da direita vira e, no verso, já traz a página da esquerda da próxima abertura */
      front = right.innerHTML;
      backHtml = leftFace(target);
      document.getElementById('carimbos').innerHTML = stampsHtml(rightChunk(target));
      document.getElementById('pag-num').textContent = (target + 1) + ' de ' + pageCount();
      document.getElementById('pag-ant').disabled = target === 0;
      document.getElementById('pag-prox').disabled = target >= pageCount() - 1;
    } else {
      /* voltando: a folha sai da esquerda com o verso antigo e cai na direita com a página nova */
      backHtml = from > 0 ? leftFace(from) : ONLY;
      renderStamps(); front = right.innerHTML; newStamps = box.innerHTML; box.innerHTML = oldStamps;
    }
    leaf.innerHTML = '<div class="face front">' + front.replace(/ id="[^"]*"/g, '') + '</div><div class="face back' + (backHtml === ONLY ? '' : ' cheia') + '">' + backHtml + '</div>';
    spread.appendChild(leaf);
    right.style.setProperty('--turn', TURN_MS + 'ms');
    if (direction > 0) right.classList.add('under');
    var cancelled = false;
    function setVar(name, value) { leaf.style.setProperty(name, value); right.style.setProperty(name, value); }
    if (manual) { setVar('--play', 'paused'); setVar('--ease', 'linear'); setVar('--delay', '0s'); }
    leaf.addEventListener('animationend', function (event) {
      if (event.target !== leaf) return;
      if (cancelled) {
        page -= direction;
        renderStamps();
      } else if (direction < 0) box.innerHTML = newStamps;
      else renderLeft(page);
      ['--play', '--ease', '--delay'].forEach(function (name) { right.style.removeProperty(name); });
      leaf.remove(); right.classList.remove('under'); turning = false;
    });
    return {
      set: function (progress) { setVar('--delay', -Math.max(0, Math.min(0.999, progress)) * TURN_MS + 'ms'); },
      release: function (progress, keep) {
        progress = Math.max(0, Math.min(0.999, progress));
        if (!keep) {
          cancelled = true;
          leaf.className = 'leaf ' + (direction > 0 ? 'prev' : 'next');
          setVar('--delay', -(1 - progress) * TURN_MS + 'ms');
          if (direction > 0) right.classList.remove('under');
        }
        setVar('--play', 'running');
      }
    };
  }
  document.getElementById('pag-ant').addEventListener('click', function () { turnPage(-1); });
  document.getElementById('pag-prox').addEventListener('click', function () { turnPage(1); });
  /* virar com a mão: a folha acompanha o dedo e, ao soltar, termina ou volta */
  var rightPage = document.getElementById('pagina');
  var dragArea = document.getElementById('vista-passaporte');
  var drag = null, justDragged = false;
  dragArea.addEventListener('pointerdown', function (event) {
    if (event.button || turning || dragArea.classList.contains('closed') || !dragArea.classList.contains('aberto') && window.matchMedia('(min-width: 901px)').matches) return;
    if (event.target.closest('.pp-close, .pager, .pp-front')) return;
    drag = { x: event.clientX, y: event.clientY, t: performance.now(), id: event.pointerId, control: null, direction: 0, progress: 0 };
  });
  dragArea.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.control) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      drag.direction = dx < 0 ? 1 : -1;
      drag.control = turnPage(drag.direction, true);
      if (!drag.control) { drag = null; return; }
      try { dragArea.setPointerCapture(event.pointerId); } catch (error) {}
      dragArea.classList.add('dragging');
    }
    var width = rightPage.offsetWidth || 1;
    drag.progress = drag.direction > 0 ? -dx / width : dx / width;
    drag.control.set(drag.progress);
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.control) {
      var speed = Math.abs(event.clientX - drag.x) / Math.max(1, performance.now() - drag.t);
      drag.control.release(drag.progress, event.type !== 'pointercancel' && (drag.progress > 0.35 || speed > 0.6));
      dragArea.classList.remove('dragging');
      justDragged = true; setTimeout(function () { justDragged = false; }, 0);
    }
    drag = null;
  }
  dragArea.addEventListener('pointerup', endDrag);
  dragArea.addEventListener('pointercancel', endDrag);
  dragArea.addEventListener('click', function (event) { if (justDragged) { event.stopPropagation(); event.preventDefault(); } }, true);

  /* ── detalhe do carimbo, com gatilho ── */
  document.getElementById('carimbos').addEventListener('click', function (event) {
    if (event.target.closest('[data-marcar]')) { openSheet('marcar-lugar'); return; }
    var button = event.target.closest('.stamp'); if (!button) return;
    var parts = button.dataset.key.split('|');
    var stamp = stamps.find(function (item) { return (item.city || item.iso) === parts[0] && item.month === parts[1]; });
    openDetail(stamp);
  });
  function openDetail(stamp) {
    var info = stampInfo(stamp), future = isFuture(stamp);
    var code = info.city ? cityCode(info.city) : '';
    var interested = false;
    var who = owner ? 'Você' : person.name.split(' ')[0];
    var origin = stamp.from === 'roteiro' ? 'Roteiro de ' + (stamp.days || '') + (stamp.days ? ' dias' : '') + ' no OND vAI' : 'Marcado à mão';
    document.getElementById('detalhe-corpo').innerHTML =
      (info.city && info.city.image ? '<div class="detail-photo"><img src="' + escapeHtml(info.city.image) + '" alt=""></div>' : '') +
      '<h2 id="detalhe-titulo">' + escapeHtml(info.title) + '</h2>' +
      '<div class="detail-meta"><span>' + flagHtml(info.iso, 18, 12) + escapeHtml(info.country) + '</span><span>' + (future ? 'Vai em ' : 'Esteve em ') + monthLong(stamp.month) + '</span><span>' + ICON.sparkle + origin + '</span></div>' +
      '<p class="detail-note">' + (future ? who + ' tem essa viagem marcada.' : who + (owner ? ' esteve aqui.' : ' esteve aqui.')) + (info.city ? ' Veja as resenhas e o que fazer em ' + escapeHtml(info.title) + '.' : '') + '</p>' +
      (info.city ? '<div class="detail-actions">' +
        '<button class="btn btn-line interest heart-only' + (interested ? ' on' : '') + '" id="detalhe-interesse" aria-pressed="' + !!interested + '" aria-label="Salvar nos interesses" title="Salvar nos interesses">' + ICON.heart + '</button>' +
        planMenuHtml(info.city) + '</div>' +
        '<p class="detail-hint"><a href="' + cityPageUrl(info.city) + '" style="color:var(--purple);font-weight:700">Ver resenhas de ' + escapeHtml(info.title) + '</a></p>' : '') +
      (owner ? '<p class="detail-hint"><button class="btn btn-line btn-sm" id="detalhe-remover">Remover carimbo</button></p>' : '');
    openSheet('detalhe');
    bindPlanMenus(document.getElementById('detalhe-corpo'));
    var interestButton = document.getElementById('detalhe-interesse');
    if (interestButton) interestButton.addEventListener('click', function () {
      if (window.ondLogin) window.ondLogin('interesses');
    });
    var removeButton = document.getElementById('detalhe-remover');
    if (removeButton) removeButton.addEventListener('click', function () {
      stamps = stamps.filter(function (item) { return item !== stamp; });
      OndStore.write(contaTeste ? 'carimbos_conta_teste' : 'carimbos', stamps); closeSheets(); renderStamps(); toast('Carimbo removido');
    });
  }

  /* ── marcar lugar ── */
  var markWhen = 'fui';
  function defaultMonth(when) {
    var now = new Date(); now.setMonth(now.getMonth() + (when === 'vou' ? 4 : -2));
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }
  document.getElementById('m-mes').value = defaultMonth('fui');
  document.getElementById('marcar').addEventListener('click', function () { openSheet('marcar-lugar'); });
  document.getElementById('quando').addEventListener('click', function (event) {
    var button = event.target.closest('button'); if (!button) return;
    markWhen = button.dataset.when;
    document.querySelectorAll('#quando button').forEach(function (other) { other.classList.toggle('on', other === button); });
    document.getElementById('m-mes').value = defaultMonth(markWhen);
  });
  var countrySelect = document.getElementById('m-pais');
  Object.keys(COUNTRIES).sort(function (first, second) { return COUNTRIES[first].localeCompare(COUNTRIES[second], 'pt'); }).forEach(function (iso) {
    countrySelect.insertAdjacentHTML('beforeend', '<option value="' + iso + '">' + escapeHtml(COUNTRIES[iso]) + '</option>');
  });
  document.getElementById('carimbar').addEventListener('click', function () {
    var name = document.getElementById('m-cidade').value.trim();
    var iso = countrySelect.value;
    var month = document.getElementById('m-mes').value;
    var city = name ? cityByName(name) : null;
    if ((!city && !iso) || !month) { toast('Escolha uma cidade da lista ou um país, e o mês'); return; }
    stamps.push(city ? { city: city.name, month: month, from: 'marcado' } : { iso: iso, month: month, from: 'marcado' });
    OndStore.write(contaTeste ? 'carimbos_conta_teste' : 'carimbos', stamps);
    page = 0; closeSheets(); renderStamps();
    var title = city ? city.name : COUNTRIES[iso];
    toast(month > TODAY ? title + ' entrou como viagem marcada' : title + ' carimbado no passaporte');
  });

  document.getElementById('acoes').addEventListener('click', function (event) {
    if (!event.target.closest('#compartilhar')) return;
    var url = location.origin + '/explorar/viajante/?u=' + encodeURIComponent(person.handle);
    shareLink('Passaporte de ' + person.name, 'Olha os lugares por onde ' + person.name.split(' ')[0] + ' já passou no OND.', url);
  });

  /* fotos de perfil prontas: o Ondino e ícones de viagem */
  var AVATARES = ['ondino-caminhando', 'ondino-confuso', 'ondino-espera', 'ondino-duvida', 'icone-aviao', 'icone-mala', 'icone-palmeira', 'icone-montanha', 'icone-camera', 'icone-bussola', 'icone-globo', 'icone-onda']
    .map(function (name) { return '/assets/perfil/' + name + '.svg'; });
  function renderAvatarOptions() {
    var box = document.getElementById('avatares');
    if (!box) return;
    box.innerHTML = '<label class="av-opt av-upload" title="Enviar foto">' + ICON.camera + '<input type="file" accept="image/*" hidden id="foto-perfil"></label>' +
      '<button type="button" class="av-opt av-iniciais' + (!person.photo ? ' on' : '') + '" data-avatar="" style="background:' + person.color + '" title="Iniciais">' + escapeHtml(person.initials) + '</button>' +
      AVATARES.map(function (src) { return '<button type="button" class="av-opt' + (person.photo === src ? ' on' : '') + '" data-avatar="' + src + '"><img src="' + src + '" alt=""></button>'; }).join('');
    document.getElementById('foto-perfil').addEventListener('change', function (event) {
      var file = event.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { person.photo = reader.result; applyProfile(); renderAvatarOptions(); refreshPreview(); };
      reader.readAsDataURL(file);
    });
  }
  function refreshPreview() {
    var preview = document.getElementById('ed-preview');
    if (!preview) return;
    preview.querySelector('.ed-cover').style.backgroundImage = person.cover ? 'url("' + person.cover + '")' : '';
    preview.querySelector('.ed-avatar').outerHTML = '<span class="ed-avatar avatar" style="--av:84px;background:' + person.color + '">' + (person.photo ? '<img src="' + escapeHtml(person.photo) + '" alt="">' : escapeHtml(person.initials)) + '</span>';
    preview.querySelector('.ed-name').textContent = document.getElementById('in-nome').value || person.name;
    preview.querySelector('.ed-handle').textContent = '@' + person.handle;
  }
  document.getElementById('editar').addEventListener('click', function (event) {
    var option = event.target.closest('[data-avatar]');
    if (!option) return;
    person.photo = option.dataset.avatar || null;
    applyProfile(); renderAvatarOptions(); refreshPreview();
  });
  document.getElementById('in-nome').addEventListener('input', refreshPreview);

  /* ── personalizar ── */
  function openEditor() {
    setTimeout(function () { renderAvatarOptions(); refreshPreview(); }, 0);
    document.getElementById('in-nome').value = person.name;
    document.getElementById('in-bio').value = person.bio || '';
    document.getElementById('in-ig').value = person.instagram || '';
    var options = stamps.map(stampInfo).filter(function (info) { return info.city && info.city.image; }).slice(0, 4);
    if (options.length < 4) options = options.concat(cities.filter(function (city) { return city.image; }).slice(0, 4 - options.length).map(function (city) { return { city: city }; }));
    document.getElementById('capas').innerHTML = options.map(function (info) {
      return '<button class="' + (person.cover === info.city.image ? 'on' : '') + '" data-cover="' + escapeHtml(info.city.image) + '" aria-label="Capa ' + escapeHtml(info.city.name) + '"><img src="' + escapeHtml(info.city.image) + '" alt=""></button>';
    }).join('');
    document.getElementById('cores').innerHTML = COLORS.map(function (cor) {
      var on = person.color === cor[0];
      return '<button type="button" class="' + (on ? 'on' : '') + '" style="background:' + cor[0] + '" data-color="' + cor[0] + '" aria-label="' + cor[1] + '" aria-pressed="' + on + '" title="' + cor[1] + '"></button>';
    }).join('');
    openSheet('editar');
  }
  document.getElementById('capas').addEventListener('click', function (event) {
    var button = event.target.closest('button'); if (!button) return;
    document.querySelectorAll('#capas button').forEach(function (other) { other.classList.toggle('on', other === button); });
    person.cover = button.dataset.cover; applyProfile(); refreshPreview();
  });
  document.getElementById('cores').addEventListener('click', function (event) {
    var button = event.target.closest('button'); if (!button) return;
    document.querySelectorAll('#cores button').forEach(function (other) { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); });
    person.color = button.dataset.color; applyProfile(); renderAvatarOptions(); refreshPreview();
  });
  if (document.getElementById('foto-perfil')) document.getElementById('foto-perfil').addEventListener('change', function (event) {
    var file = event.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { person.photo = reader.result; applyProfile(); };
    reader.readAsDataURL(file);
  });
  document.getElementById('salvar').addEventListener('click', function () {
    person.name = document.getElementById('in-nome').value.trim() || person.name;
    person.initials = person.name.split(' ').map(function (part) { return part[0]; }).slice(0, 2).join('').toUpperCase();
    person.bio = document.getElementById('in-bio').value.trim();
    person.instagram = document.getElementById('in-ig').value.trim().replace(/^@/, '');
    OndStore.write('perfil', { name: person.name, initials: person.initials, bio: person.bio, instagram: person.instagram, color: person.color, cover: person.cover, photo: person.photo });
    closeSheets(); applyProfile(); toast('Perfil atualizado');
  });

  /* ── vistas: passaporte, territórios, globo ── */
  var globe = null;
  document.querySelectorAll('.seg button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.seg button').forEach(function (other) { other.classList.toggle('on', other === button); });
      ['passaporte', 'territorios', 'mapa'].forEach(function (view) { document.getElementById('vista-' + view).hidden = button.dataset.view !== view; });
      if (button.dataset.view === 'territorios') renderWar();
      window.dispatchEvent(new Event('resize'));
    });
  });

  var warView = null;
  var CONTINENT_ORDER = ['América do Sul', 'Europa', 'América do Norte', 'África', 'Ásia', 'Oceania'];
  function renderWar() {
    var svg = document.getElementById('war-svg'), map = window.WAR_MAP;
    svg.setAttribute('viewBox', '0 0 ' + map.width + ' ' + map.height);
    var visited = {}, planned = {};
    stamps.forEach(function (stamp) {
      var iso = stampInfo(stamp).iso; if (!iso) return;
      if (isFuture(stamp)) planned[iso] = true; else visited[iso] = (visited[iso] || 0) + (stamp.city ? 1 : 0);
    });
    var conquered = map.countries.filter(function (country) { return country.iso && country.iso in visited; });
    var html = '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fbf9ff"/><rect width="2.2" height="6" fill="' + person.color + '"/></pattern></defs>';
    map.countries.forEach(function (country) {
      var isOn = country.iso && country.iso in visited, isPlan = !isOn && country.iso && planned[country.iso];
      var order = conquered.indexOf(country);
      html += '<path d="' + country.d + '" class="' + (isOn ? 'on conquer' : isPlan ? 'plan' : '') + '" data-name="' + escapeHtml(country.name) + '"' + (order >= 0 ? ' style="animation-delay:' + (300 + order * 200) + 'ms"' : '') + '/>';
    });
    conquered.forEach(function (country, order) {
      html += '<g class="army" style="animation-delay:' + (460 + order * 200) + 'ms"><circle cx="' + country.cx + '" cy="' + country.cy + '" r="12"/><text x="' + country.cx + '" y="' + (country.cy + 0.5) + '">' + (visited[country.iso] || '') + '</text></g>';
    });
    svg.innerHTML = html;
    warView = [0, 0, map.width, map.height];
    var total = map.countries.length;
    document.getElementById('war-pct').textContent = (Math.round(conquered.length / total * 1000) / 10).toString().replace('.', ',') + '%';
    document.getElementById('war-count').textContent = conquered.length + ' de ' + total + ' territórios';
    var continents = {};
    map.countries.forEach(function (country) {
      var item = continents[country.continent] || (continents[country.continent] = { total: 0, done: 0 });
      item.total++; if (country.iso && country.iso in visited) item.done++;
    });
    document.getElementById('war-continents').innerHTML = CONTINENT_ORDER.map(function (name) {
      var item = continents[name];
      return '<div class="cont" data-continent="' + name + '"><div class="cont-row"><span>' + name + '</span><span>' + item.done + ' de ' + item.total + '</span></div><span class="bar"><i data-w="' + Math.round(item.done / item.total * 100) + '"></i></span></div>';
    }).join('');
    setTimeout(function () { document.querySelectorAll('#war-continents .bar i').forEach(function (bar) { bar.style.width = Math.max(+bar.dataset.w, 2) + '%'; }); }, 200);
  }
  function scaleArmies() {
    var factor = warView[2] / window.WAR_MAP.width;
    document.querySelectorAll('#war-svg .army circle').forEach(function (circle) { circle.setAttribute('r', 12 * factor); circle.style.strokeWidth = 2 * factor; });
    document.querySelectorAll('#war-svg .army text').forEach(function (text) { text.style.fontSize = 12 * factor + 'px'; });
    document.querySelectorAll('#war-svg path').forEach(function (path) { path.style.strokeWidth = (path.classList.contains('plan') ? 1 : 0.7) * factor; });
  }
  function animateViewBox(target) {
    var svg = document.getElementById('war-svg'), start = warView.slice(), began = performance.now();
    (function step(now) {
      var progress = Math.min(1, (now - began) / 700), eased = 1 - Math.pow(1 - progress, 3);
      warView = start.map(function (value, index) { return value + (target[index] - value) * eased; });
      svg.setAttribute('viewBox', warView.join(' ')); scaleArmies();
      if (progress < 1) requestAnimationFrame(step);
    })(began);
  }
  function zoomContinent(name) {
    var map = window.WAR_MAP;
    document.querySelectorAll('.cont').forEach(function (row) { row.classList.toggle('on', row.dataset.continent === name); });
    document.getElementById('war-reset').classList.toggle('on', !!name);
    if (!name) { animateViewBox([0, 0, map.width, map.height]); return; }
    var points = map.countries.filter(function (country) { return country.continent === name; });
    var xs = points.map(function (country) { return country.cx; }), ys = points.map(function (country) { return country.cy; });
    var left = Math.min.apply(null, xs), right = Math.max.apply(null, xs), top = Math.min.apply(null, ys), bottom = Math.max.apply(null, ys);
    var width = Math.max(right - left, 60) * 1.3, height = Math.max(bottom - top, 40) * 1.3, ratio = map.width / map.height;
    if (width / height > ratio) height = width / ratio; else width = height * ratio;
    animateViewBox([(left + right) / 2 - width / 2, (top + bottom) / 2 - height / 2, width, height]);
  }
  document.getElementById('war-continents').addEventListener('click', function (event) {
    var row = event.target.closest('.cont'); if (!row) return;
    zoomContinent(row.classList.contains('on') ? null : row.dataset.continent);
  });
  document.getElementById('war-reset').addEventListener('click', function () { zoomContinent(null); });
  var warTip = document.getElementById('war-tip');
  document.getElementById('war-svg').addEventListener('mousemove', function (event) {
    var path = event.target.closest('path');
    if (!path) { warTip.style.opacity = 0; return; }
    var box = this.parentElement.getBoundingClientRect();
    warTip.textContent = path.dataset.name;
    warTip.style.left = (event.clientX - box.left) + 'px'; warTip.style.top = (event.clientY - box.top) + 'px'; warTip.style.opacity = 1;
  });
  document.getElementById('war-svg').addEventListener('mouseleave', function () { warTip.style.opacity = 0; });

  /* ── fotos e resenhas ── */
  function renderPhotosAndReviews() {
    var infos = stamps.filter(function (stamp) { return !isFuture(stamp); }).map(stampInfo).filter(function (info) { return info.city && info.city.image; }).slice(0, 8);
    document.getElementById('bloco-fotos').hidden = !infos.length;
    document.getElementById('fotos').innerHTML = infos.map(function (info, index) {
      return '<a class="photo' + (index % 3 === 0 && person.instagram ? ' ig-post' : '') + '" href="' + cityPageUrl(info.city) + '"><img src="' + escapeHtml(info.city.image) + '" alt="" loading="lazy"><span>' + escapeHtml(info.city.name) + '</span></a>';
    }).join('');
    var reviews = [];
    if (!meu && OND_EXEMPLO) {
      Object.keys(OND_EXEMPLO.reviews).forEach(function (code) {
        OND_EXEMPLO.reviews[code].forEach(function (review) {
          if (review.by !== person.handle) return;
          var city = cities.find(function (item) { return cityCode(item) === code; });
          reviews.push({ id: review.id, author: Object.assign({ mine: false }, person), when: (city ? city.name + ' · ' : '') + monthLong(review.month), place: review.place, rate: review.rate, likes: review.likes, text: review.text, photos: city && review.photos ? [city.image] : [] });
        });
      });
    }
    if (!meu) avaliacoesDoGuia().forEach(function (item) {
      reviews.push({ id: item.id, author: Object.assign({ mine: false }, person), when: item.city + ' · ' + monthLong(item.month), place: item.title, rate: item.rate, likes: item.likes, text: item.text, photos: item.photo ? [item.photo] : [] });
    });
    if (meu) {
      Object.keys(localStorage).filter(function (key) { return key.indexOf('ond_comunidade_resenhas_') === 0; }).forEach(function (key) {
        OndStore.read(key.replace('ond_comunidade_', ''), []).forEach(function (review) { review.author = Object.assign({}, person, { mine: true }); reviews.push(review); });
      });
    }
    document.getElementById('bloco-resenhas').hidden = !reviews.length;
    var list = document.getElementById('resenhas');
    list.innerHTML = reviews.map(function (review) { var copy = Object.assign({}, review); copy.author = Object.assign({}, review.author, { mine: true }); return reviewHtml(copy); }).join('');
    bindReviews(list, reviews);
  }

  applyProfile();
  renderStamps();
  loadCatalog().then(function (catalog) {
    cities = catalog;
    document.getElementById('m-cidades').innerHTML = cities.map(function (city) { return '<option value="' + escapeHtml(city.name) + '">' + escapeHtml(city.countryName) + '</option>'; }).join('');
    globe = window.createOndGlobe(document.getElementById('globo'), { onPin: function (pin) { globe.flyTo(pin.latitude, pin.longitude, 2); } });
    applyProfile(); renderStamps(); renderPhotosAndReviews(); renderWishes();
  }).catch(function () { toast('O catálogo de destinos não carregou'); });
})();

/* capa do passaporte: fechado ao abrir a página; clique abre, o botão da página de dados fecha */
(function () {
  var book = document.getElementById('vista-passaporte');
  if (!book) return;
  var spread = book.querySelector('.spread');
  var leftPage = spread.querySelector('.page.left');
  var slot = document.createElement('div');
  slot.className = 'page left-slot';
  slot.setAttribute('aria-hidden', 'true');
  var cover = document.createElement('div');
  cover.className = 'pp-cover';
  cover.setAttribute('role', 'button');
  cover.setAttribute('tabindex', '0');
  cover.setAttribute('aria-label', 'Abrir passaporte');
  cover.innerHTML = '<div class="pp-front">' +
    '<span class="pp-title pp-foil">PASSAPORTE</span>' +
    '<span class="pp-emblem"><svg viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<circle cx="100" cy="100" r="96" stroke-width="1.5" opacity=".9"/><circle cx="100" cy="100" r="88" stroke-width=".8" opacity=".5"/>' +
      '<ellipse cx="100" cy="100" rx="40" ry="88" stroke-width=".8" opacity=".45"/><ellipse cx="100" cy="100" rx="70" ry="88" stroke-width=".8" opacity=".35"/>' +
      '<path d="M12 100h176M24 56h152M24 144h152" stroke-width=".8" opacity=".4"/></svg>' +
      '<span class="pp-seal"><svg viewBox="0 0 497.26 497.26" aria-hidden="true"><use href="#ond-icon"/></svg></span></span>' +
    '<span class="pp-name pp-foil" id="pp-nome"></span>' +
    '<svg class="pp-chip" viewBox="0 0 44 28" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="1" y="1" width="42" height="26" rx="3"/><path d="M1 9.5h42M1 18.5h42"/><circle cx="22" cy="14" r="4.5"/></svg>' +
    '</div><div class="pp-back"></div>';
  book.appendChild(cover);
  var back = cover.querySelector('.pp-back');
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'pp-close';
  close.setAttribute('aria-label', 'Fechar passaporte');
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  leftPage.appendChild(close);

  var name = document.getElementById('id-nome');
  var coverName = cover.querySelector('#pp-nome');
  function syncName() { coverName.textContent = name.textContent; }
  new MutationObserver(syncName).observe(name, { childList: true, characterData: true, subtree: true });
  syncName();

  var desktop = window.matchMedia('(min-width: 901px)');
  function place() {
    if (desktop.matches) {
      if (leftPage.parentNode !== back) { back.appendChild(leftPage); spread.insertBefore(slot, spread.firstChild); }
    } else if (leftPage.parentNode !== spread) {
      if (slot.parentNode) slot.remove();
      spread.insertBefore(leftPage, spread.firstChild);
    }
  }
  if (desktop.addEventListener) desktop.addEventListener('change', place); else desktop.addListener(place);
  place();

  var timer = null;
  function setOpen(open) {
    clearTimeout(timer);
    book.classList.remove('aberto', 'abrindo');
    cover.setAttribute('aria-label', open ? 'Passaporte aberto' : 'Abrir passaporte');
    cover.setAttribute('tabindex', open ? '-1' : '0');
    if (open) {
      if (desktop.matches) {
        book.classList.remove('closed');
        timer = setTimeout(function () { book.classList.add('aberto'); }, 1000);
      } else {
        book.classList.add('abrindo');
        timer = setTimeout(function () { book.classList.remove('closed', 'abrindo'); }, 520);
      }
    } else {
      book.classList.add('closed');
      if (!desktop.matches) book.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  book.classList.add('closed');
  var ownPassport = !new URLSearchParams(location.search).get('u') && !new URLSearchParams(location.search).has('previa');
  if (ownPassport) {
    book.setAttribute('data-pede-conta', 'passaporte');
    var wishes = document.getElementById('interesses'); if (wishes) wishes.hidden = false;
  }
  function tryOpen() {
    if (ownPassport && typeof ondTemConta === 'function' && !ondTemConta()) { if (window.ondLogin) window.ondLogin('passaporte'); return; }
    setOpen(true);
  }
  cover.addEventListener('click', function () { if (book.classList.contains('closed')) tryOpen(); });
  cover.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && book.classList.contains('closed')) { event.preventDefault(); tryOpen(); }
  });
  close.addEventListener('click', function (event) { event.stopPropagation(); if (window.ondPassaporteInicio) window.ondPassaporteInicio(); setOpen(false); cover.focus({ preventScroll: true }); });
})();

/* Preferências do meu perfil: tema do app (Claro, Escuro, Automático). A escolha é do aparelho e fica no
   assets/tema-app.js (localStorage 'ond-app-tema'); aqui só o seletor. Muda na hora, sem recarregar. */
(function () {
  var busca = new URLSearchParams(location.search);
  if (busca.get('u') || busca.has('previa')) return;
  var perfil = document.getElementById('perfil');
  if (!perfil || !window.OndTema) return;
  var ICONES = {
    claro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
    escuro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor" stroke="none"/></svg>'
  };
  var OPCOES = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']];
  var bloco = document.createElement('section');
  bloco.className = 'block';
  bloco.id = 'bloco-preferencias';
  bloco.innerHTML = '<div class="head-row"><h2 class="section-title">Preferências</h2></div>' +
    '<div class="pref-card"><div class="pref-row">' +
      '<div class="pref-txt"><b id="pref-tema-titulo">Tema do app</b><span>No Automático, segue o tema do seu aparelho.</span></div>' +
      '<div class="pref-seg" role="radiogroup" aria-labelledby="pref-tema-titulo">' +
        OPCOES.map(function (opcao) { return '<button type="button" role="radio" data-tema="' + opcao[0] + '">' + ICONES[opcao[0]] + '<span>' + opcao[1] + '</span></button>'; }).join('') +
      '</div>' +
    '</div></div>';
  perfil.appendChild(bloco);
  if (window.OndIdioma) {
    var linhaIdioma = document.createElement('div');
    linhaIdioma.className = 'pref-row';
    linhaIdioma.innerHTML = '<div class="pref-txt"><b id="pref-idioma-titulo">Idioma do app</b><span>Muda os textos do app, do PDF e a conversa com o OND vAI.</span></div>' +
      '<select class="pref-idioma" data-idioma aria-labelledby="pref-idioma-titulo" data-no-i18n>' + Object.keys(window.OndIdioma.lista).map(function (cod) { return '<option value="' + cod + '"' + (cod === window.OndIdioma.atual ? ' selected' : '') + '>' + window.OndIdioma.lista[cod] + '</option>'; }).join('') + '</select>';
    bloco.querySelector('.pref-card').appendChild(linhaIdioma);
  }
  var botoes = Array.prototype.slice.call(bloco.querySelectorAll('[data-tema]'));
  function marcar() {
    var atual = window.OndTema.escolha();
    botoes.forEach(function (botao) {
      var on = botao.dataset.tema === atual;
      botao.setAttribute('aria-checked', String(on));
      botao.tabIndex = on ? 0 : -1;
    });
  }
  function escolher(botao, foco) {
    window.OndTema.definir(botao.dataset.tema);
    marcar();
    if (foco) botao.focus();
  }
  bloco.querySelector('.pref-seg').addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-tema]');
    if (botao) escolher(botao, false);
  });
  bloco.querySelector('.pref-seg').addEventListener('keydown', function (evento) {
    var i = botoes.indexOf(document.activeElement);
    if (i < 0) return;
    var passo = evento.key === 'ArrowRight' || evento.key === 'ArrowDown' ? 1 : evento.key === 'ArrowLeft' || evento.key === 'ArrowUp' ? -1 : 0;
    if (evento.key === 'Home') { evento.preventDefault(); escolher(botoes[0], true); return; }
    if (evento.key === 'End') { evento.preventDefault(); escolher(botoes[botoes.length - 1], true); return; }
    if (!passo) return;
    evento.preventDefault();
    escolher(botoes[(i + passo + botoes.length) % botoes.length], true);
  });
  window.addEventListener('ond-tema', marcar);
  marcar();
})();

/* Loja no perfil: roteiros à venda. No meu perfil é opcional (interruptor nas Preferências, só no Plus);
   no perfil de outra pessoa e na prévia aparece quando há roteiro à venda. Comprar ou usar leva para
   /explorar/viagens/nova/?pronto=<id>, que já abre a compra ou aplica o roteiro. */
(function () {
  var perfil = document.getElementById('perfil');
  var atual = window.ondPerfilAtual;
  if (!perfil || !atual) return;
  var CHAVE = 'ond-perfil-loja';
  var dono = atual.meu && !atual.previa;
  function lojaLigada() { try { return localStorage.getItem(CHAVE) === '1'; } catch (erro) { return false; } }
  function gravarLoja(ligada) { try { localStorage.setItem(CHAVE, ligada ? '1' : '0'); } catch (erro) {} }
  function plus() { return !!(window.OndPlano && window.OndPlano.plus()); }
  function comprados() { return window.OndModelos ? window.OndModelos.comprados() : []; }
  function esc(texto) { return String(texto == null ? '' : texto).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dias(tpl) { return (tpl.stops || []).reduce(function (soma, parada) { return soma + (parada.nights || 0); }, 0) + 1; }
  function cidades(tpl) { var nomes = []; (tpl.stops || []).forEach(function (parada) { if (parada.city && nomes.indexOf(parada.city) < 0) nomes.push(parada.city); }); return nomes; }
  function modelos() {
    if (atual.meu) return plus() && lojaLigada() && window.OndModelos ? window.OndModelos.listar().filter(function (tpl) { return tpl.preco; }) : [];
    return (window.OND_MODELOS_COMUNIDADE || []).filter(function (tpl) { return tpl.handle === atual.handle && tpl.preco && tpl.publicado !== false; });
  }
  var SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function card(tpl) {
    var ja = !atual.meu && comprados().indexOf(tpl.id) >= 0;
    var lista = cidades(tpl);
    return '<a class="loja-card" href="/explorar/viagens/nova/?pronto=' + encodeURIComponent(tpl.id) + '">' +
      '<span class="loja-img">' + (tpl.cover ? '<img src="' + esc(tpl.cover) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="loja-txt"><b>' + esc(tpl.title) + '</b>' +
      '<small>' + dias(tpl) + ' dias · ' + lista.length + (lista.length === 1 ? ' cidade' : ' cidades') + ' · ' + lista.map(esc).join(' · ') + '</small>' +
      '<span class="loja-pe"><span class="loja-preco' + (ja ? ' comprado' : '') + '">' + (ja ? 'Comprado' : 'R$ ' + esc(tpl.preco)) + '</span>' +
      '<span class="loja-ver">Ver roteiro' + SETA + '</span></span></span></a>';
  }
  var secao = document.createElement('section');
  secao.className = 'block';
  secao.id = 'bloco-loja';
  secao.hidden = true;
  var antes = document.getElementById('bloco-preferencias');
  if (antes) perfil.insertBefore(secao, antes); else perfil.appendChild(secao);
  function render() {
    var lista = modelos();
    var mostrar = atual.meu ? plus() && lojaLigada() && (dono || lista.length > 0) : lista.length > 0;
    secao.hidden = !mostrar;
    if (!mostrar) { secao.innerHTML = ''; return; }
    secao.innerHTML = '<div class="head-row"><h2 class="section-title">Loja</h2></div>' + (lista.length
      ? '<div class="loja-grid">' + lista.map(card).join('') + '</div>'
      : '<div class="loja-vazia"><b>Nenhum roteiro à venda ainda</b><span>Para vender, abra um roteiro seu, toque em Mais e escolha Salvar como modelo. Lá você põe o preço.</span></div>');
  }

  /* interruptor nas Preferências (só no meu perfil) */
  var cartao = dono && document.querySelector('#bloco-preferencias .pref-card');
  if (cartao) {
    var linha = document.createElement('div');
    linha.className = 'pref-row';
    linha.id = 'pref-loja';
    if (plus()) {
      linha.innerHTML = '<div class="pref-txt"><b id="pref-loja-titulo">Mostrar loja no meu perfil</b><span>Seus roteiros à venda aparecem para quem visita seu perfil.</span></div>' +
        '<button type="button" class="pref-switch" role="switch" aria-checked="' + lojaLigada() + '" aria-labelledby="pref-loja-titulo"><i></i></button>';
      linha.querySelector('.pref-switch').addEventListener('click', function (evento) {
        var ligada = evento.currentTarget.getAttribute('aria-checked') !== 'true';
        evento.currentTarget.setAttribute('aria-checked', String(ligada));
        gravarLoja(ligada);
        render();
      });
    } else {
      linha.innerHTML = '<div class="pref-txt"><b id="pref-loja-titulo">Mostrar loja no meu perfil</b><span>A loja é do Plus.</span></div>' +
        '<div class="pref-plus"><button type="button" class="pref-mais" data-pede-plus>Conhecer o Plus</button>' +
        '<button type="button" class="pref-switch" role="switch" aria-checked="false" aria-disabled="true" disabled aria-labelledby="pref-loja-titulo"><i></i></button></div>';
      linha.querySelector('[data-pede-plus]').addEventListener('click', function () { if (window.OndPlano) window.OndPlano.pedir('vender'); });
    }
    cartao.appendChild(linha);
  }

  render();
  /* roteiros à venda de outros viajantes: no protótipo vêm do arquivo de exemplo, só no localhost */
  if (!atual.meu && window.IS_DEMO && !window.OND_MODELOS_COMUNIDADE) {
    var exemplo = document.createElement('script');
    exemplo.src = '/assets/modelos-exemplo.js';
    exemplo.onload = render;
    document.head.appendChild(exemplo);
  }
})();
