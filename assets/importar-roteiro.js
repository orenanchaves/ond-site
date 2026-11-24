/* Importar roteiro em /explorar/viagens/nova/: lê um PDF, um texto colado ou um arquivo (JSON,
   texto, CSV) e transforma em paradas, noites e passeios do OND. Tudo roda no navegador, sem
   servidor e sem IA: acha as cidades pelo catálogo do OND, os dias por "Dia 1", "Day 2" etc.,
   as noites por "3 noites em Lisboa" e a data de ida pela primeira data do texto. */
(function () {
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var DAY = 86400000;
  var st = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    arquivo: '<svg viewBox="0 0 24 24" ' + st + '><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" ' + st + '><path d="M6 6l12 12M18 6 6 18"/></svg>',
    aviso: '<svg viewBox="0 0 24 24" ' + st + '><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>'
  };
  var MESES = { jan: 1, janeiro: 1, january: 1, fev: 2, fevereiro: 2, feb: 2, february: 2, mar: 3, marco: 3, março: 3, march: 3, abr: 4, abril: 4, apr: 4, april: 4, mai: 5, maio: 5, may: 5, jun: 6, junho: 6, june: 6, jul: 7, julho: 7, july: 7, ago: 8, agosto: 8, aug: 8, august: 8, set: 9, setembro: 9, sep: 9, sept: 9, september: 9, out: 10, outubro: 10, oct: 10, october: 10, nov: 11, novembro: 11, november: 11, dez: 12, dezembro: 12, dec: 12, december: 12 };
  /* nomes de cidade que também são palavras comuns: só valem num título de dia ou com "N noites" */
  var AMBIGUAS = { natal: 1, bonito: 1, santos: 1, 'vitória': 1, franca: 1, 'são': 1, santa: 1, central: 1, mar: 1, praia: 1, sol: 1, paz: 1, porto: 0 };
  var APELIDOS = { 'florença': 'firenze', florence: 'firenze', 'nápoles': 'napoli', naples: 'napoli', 'gênova': 'génova', turim: 'torino', bolonha: 'bologna', 'amsterdã': 'amesterdã', amsterdam: 'amesterdã', 'roterdã': 'roterdão', rotterdam: 'roterdão', milan: 'milão', venice: 'veneza', venezia: 'veneza', rome: 'roma', lisbon: 'lisboa', seville: 'sevilha', sevilla: 'sevilha', marseille: 'marselha', 'siracusa': 'siracusa' };
  var SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:30', '21:00', '22:00'];

  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function low(text) { return String(text || '').toLowerCase(); }
  function bare(text) { return low(text).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function flag(code) { return code ? '<img class="nv-flag" src="/assets/flags/' + code + '.svg" alt="">' : ''; }
  function note(message) { if (typeof toast === 'function') toast(message); }

  /* ── leitura do arquivo ── */
  var pdfLib = null;
  function loadPdfJs() {
    if (pdfLib) return pdfLib;
    pdfLib = new Promise(function (resolve, reject) {
      var tag = document.createElement('script');
      tag.src = PDFJS + 'pdf.min.js';
      tag.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; resolve(window.pdfjsLib); };
      tag.onerror = function () { pdfLib = null; reject(new Error('pdf.js')); };
      document.head.appendChild(tag);
    });
    return pdfLib;
  }
  function pdfText(buffer) {
    return loadPdfJs().then(function (lib) { return lib.getDocument({ data: buffer }).promise; }).then(function (doc) {
      var pages = [];
      for (var p = 1; p <= Math.min(doc.numPages, 40); p++) pages.push(doc.getPage(p).then(function (page) { return page.getTextContent(); }));
      return Promise.all(pages);
    }).then(function (contents) {
      /* junta os pedaços em linhas pela altura na página */
      return contents.map(function (content) {
        var rows = [];
        content.items.forEach(function (piece) {
          if (!piece.str) return;
          var y = piece.transform[5], x = piece.transform[4];
          var row = rows.find(function (r) { return Math.abs(r.y - y) < 3; });
          if (!row) rows.push(row = { y: y, parts: [] });
          row.parts.push({ x: x, w: piece.width || 0, h: Math.abs(piece.transform[0]) || piece.height || 10, s: piece.str });
        });
        rows.sort(function (a, b) { return b.y - a.y; });
        return rows.map(function (r) {
          var parts = r.parts.sort(function (a, b) { return a.x - b.x; }), out = '';
          parts.forEach(function (part, i) {
            var prev = parts[i - 1];
            out += prev && part.x - (prev.x + prev.w) > prev.h * 0.18 && !/\s$/.test(out) && !/^\s/.test(part.s) ? ' ' + part.s : part.s;
          });
          return out.replace(/\s+/g, ' ').trim();
        }).join('\n');
      }).join('\n');
    });
  }
  /* outros formatos: Word, planilha, página da web, agenda (.ics) e markdown */
  var libs = {};
  function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (libs[src]) return libs[src];
    libs[src] = new Promise(function (resolve, reject) {
      var tag = document.createElement('script'); tag.src = src;
      tag.onload = function () { resolve(window[globalName]); };
      tag.onerror = function () { delete libs[src]; reject(new Error(globalName)); };
      document.head.appendChild(tag);
    });
    return libs[src];
  }
  function docxText(buffer) {
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth').then(function (lib) { return lib.extractRawText({ arrayBuffer: buffer }); }).then(function (out) { return out.value; });
  }
  function rowsText(rows) {
    return rows.map(function (row) { return row.map(function (cell) { return String(cell == null ? '' : cell).trim(); }).filter(Boolean).join(' · '); }).filter(Boolean).join('\n');
  }
  function sheetText(buffer) {
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX').then(function (lib) {
      var book = lib.read(buffer, { type: 'array', cellDates: true });
      return book.SheetNames.map(function (sheetName) { return rowsText(lib.utils.sheet_to_json(book.Sheets[sheetName], { header: 1, raw: false, dateNF: 'dd/mm/yyyy' })); }).join('\n');
    });
  }
  function csvText(text) {
    var sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    return rowsText(text.split(/\r?\n/).map(function (line) { return line.split(sep).map(function (cell) { return cell.replace(/^"|"$/g, ''); }); }));
  }
  function htmlText(html) {
    html = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section|article|header|td|th)>/gi, '\n');
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  }
  function icsText(text) {
    text = text.replace(/\r?\n[ \t]/g, '');
    var events = text.split('BEGIN:VEVENT').slice(1).map(function (block) {
      function field(key) { var m = block.match(new RegExp('^' + key + '[^:\\n]*:(.*)$', 'm')); return m ? m[1].replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').trim() : ''; }
      var when = field('DTSTART').match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
      return when ? { day: when[1] + '-' + when[2] + '-' + when[3], time: when[4] ? when[4] + ':' + when[5] : '', title: field('SUMMARY'), place: field('LOCATION') } : null;
    }).filter(Boolean).sort(function (a, b) { return (a.day + a.time).localeCompare(b.day + b.time); });
    var days = [], out = [];
    events.forEach(function (ev) { if (days.indexOf(ev.day) < 0) days.push(ev.day); });
    days.forEach(function (day, n) {
      var d = day.split('-'); out.push('Dia ' + (n + 1) + ' ' + d[2] + '/' + d[1] + '/' + d[0]);
      events.filter(function (ev) { return ev.day === day; }).forEach(function (ev) { out.push((ev.time ? ev.time + ' ' : '') + ev.title + (ev.place ? ' (' + ev.place + ')' : '')); });
    });
    return out.join('\n');
  }
  function plain(text) {
    return String(text || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s*#{1,6}\s*/gm, '')
      .replace(/^\s*\|?\s*:?-{3,}.*$/gm, '')
      .replace(/^\s*\|(.*)\|\s*$/gm, function (all, inner) { return inner.split('|').map(function (c) { return c.trim(); }).filter(Boolean).join(' · '); })
      .replace(/(\*\*|__)(.+?)\1/g, '$2')
      .replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,;:])/g, '$1$2')
      .replace(/`+/g, '');
  }
  function readFile(file) {
    var name = low(file.name), ext = (name.match(/\.([a-z0-9]+)$/) || [])[1] || '';
    if (ext === 'pdf' || file.type === 'application/pdf') return file.arrayBuffer().then(pdfText);
    if (ext === 'docx') return file.arrayBuffer().then(docxText);
    if (/^(xlsx|xls|ods|numbers)$/.test(ext)) return file.arrayBuffer().then(sheetText);
    if (ext === 'doc' || ext === 'pages' || ext === 'odt') return Promise.reject(new Error('formato'));
    if (/^(png|jpe?g|webp|heic|gif)$/.test(ext) || /^image\//.test(file.type)) return Promise.reject(new Error('imagem'));
    return file.text().then(function (text) {
      if (ext === 'csv' || ext === 'tsv') return csvText(ext === 'tsv' ? text.replace(/\t/g, ';') : text);
      if (/^html?$/.test(ext) || /^\s*<(!doctype|html)/i.test(text)) return htmlText(text);
      if (ext === 'ics' || /BEGIN:VCALENDAR/.test(text)) return icsText(text);
      return text;
    });
  }

  /* ── catálogo: mapa de nome (minúsculo, com acento) → cidade ── */
  var index = null;
  function getCatalog() {
    var ready = window.ondNovaViagem && window.ondNovaViagem.catalogo();
    if (ready && ready.length) return Promise.resolve(ready);
    return typeof loadCatalog === 'function' ? loadCatalog().catch(function () { return []; }) : Promise.resolve([]);
  }
  function buildIndex(cities) {
    index = {};
    cities.forEach(function (city) {
      if (!city.name || city.latitude == null) return;
      var key = low(city.name);
      if (!index[key] || (city.image && !index[key].image)) index[key] = city;
    });
    Object.keys(APELIDOS).forEach(function (alias) { var real = index[APELIDOS[alias]]; if (real && !index[alias]) index[alias] = real; });
  }
  function asStop(city, nights) {
    return { city: city.name, country: city.countryName, iso: city.iso, lat: city.latitude, lng: city.longitude, image: city.image, nights: nights || 3 };
  }
  /* procura cidades numa linha: sequências de 1 a 4 palavras começando com maiúscula, a maior ganha */
  function citiesIn(line, strict) {
    var words = line.match(/[A-Za-zÀ-ÖØ-öø-ÿ'’]+/g) || [], found = [];
    for (var i = 0; i < words.length; i++) {
      if (!/^[A-ZÀ-ÖØ-Þ]/.test(words[i])) continue;
      for (var n = Math.min(4, words.length - i); n >= 1; n--) {
        var key = low(words.slice(i, i + n).join(' '));
        var hit = index[key];
        if (!hit) continue;
        if (n === 1 && AMBIGUAS[key] && !strict) break;
        found.push(Object.assign({ hit: words.slice(i, i + n).join(' ') }, hit)); i += n - 1; break;
      }
    }
    return found;
  }

  /* ── datas ── */
  function findStart(text) {
    var now = new Date(); now.setHours(12, 0, 0, 0);
    var m = text.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    var range = bare(text).match(/\b(\d{1,2})\s*(?:a|-|–|ate)\s*\d{1,2}\s+(?:de\s+)?(jan(?:eiro)?|fev(?:ereiro)?|mar(?:co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\b(?:\s+(?:de\s+)?(20\d\d))?/);
    if (range) return dateOf(+range[1], MESES[range[2]], range[3] ? +range[3] : 0, now);
    m = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    var day, month, year;
    if (m && +m[2] <= 12 && +m[1] <= 31) { day = +m[1]; month = +m[2]; year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : 0; }
    else {
      m = bare(text).match(/\b(\d{1,2})(?:º|o)?\s+(?:de\s+)?(jan(?:eiro)?|fev(?:ereiro)?|mar(?:co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\b\.?(?:\s+(?:de\s+)?(20\d\d))?/);
      if (!m) { var only = bare(text).match(/\b(?:em|in|no mes de)\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/); return only ? dateOf(1, MESES[only[1]], 0, now) : ''; }
      day = +m[1]; month = MESES[m[2]]; year = m[3] ? +m[3] : 0;
    }
    return dateOf(day, month, year, now);
  }
  function dateOf(day, month, year, now) {
    if (!year) { year = now.getFullYear(); if (new Date(year, month - 1, day, 12) < now) year++; }
    var date = new Date(year, month - 1, day, 12);
    if (isNaN(date) || date < now) return '';
    return iso(date);
  }

  /* ── passeios de um dia ── */
  function kindOf(text) {
    var t = bare(text);
    if (/\b(voo|aeroporto|embarque|flight|airport)\b/.test(t)) return 'voo';
    if (/\b(check-?in|check-?out|hotel|hospedagem|pousada|hostel)\b/.test(t)) return 'hotel';
    if (/\b(praia|beach|playa|plage|spiaggia)\b/.test(t)) return 'praia';
    if (/\b(mirante|miradouro|vista|por do sol|sunset|viewpoint)\b/.test(t)) return 'mirante';
    if (/\b(trilha|caminhada|hike|hiking|trekking|cachoeira)\b/.test(t)) return 'trilha';
    if (/\b(almoco|jantar|cafe|restaurante|comer|lunch|dinner|breakfast|bar|taberna|tasca|degustacao|vinho|mercado|food)\b/.test(t)) return 'comida';
    return 'passeio';
  }
  function cleanLine(line) {
    return line.replace(/^[\s\-–•·*>▪◦●○■□✓✔→]+/, '').replace(/^\d+[.)]\s+/, '').trim();
  }
  function short(text) {
    if (text.length <= 90) return text;
    var cut = text.slice(0, 90); return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '...';
  }
  function activities(lines, place, firstDay) {
    var out = [], slot = 0, skipped = false;
    lines.forEach(function (raw) {
      var line = cleanLine(raw); if (out.length >= 10) return;
      if (/·\s*OND\s+\d+\s*\/\s*\d+$|^(p[aá]gina|page)?\s*\d+\s*(\/|de|of)\s*\d+$/i.test(line)) return;
      var dur = line.match(/^(?:(\d{1,2})\s*h\s*(\d{2})?|(\d{1,3})\s*min)\b\.?\s*(.*)$/i);
      if (dur && (dur[3] || +dur[1] < 6)) {
        if (!out.length || skipped) return; /* duração de um item que ficou de fora */
        var prev = out[out.length - 1];
        prev.minutes = dur[3] ? +dur[3] : +dur[1] * 60 + (+dur[2] || 0);
        var rest = dur[4].replace(/\s*Reservado\.?\s*/i, function () { prev.booked = true; return ' '; }).trim();
        if (rest) prev.note = short(rest);
        return;
      }
      if (line.length < 3) return;
      if (!/[A-Za-zÀ-ÿ]{3}/.test(line)) return;
      var time = '', m = line.match(/^(\d{1,2})\s*(?:[:h])\s*(\d{2})?\s*(?:h|hs|min)?\s*[-–:|]?\s*/i);
      if (m && +m[1] < 24) { time = String(m[1]).padStart(2, '0') + ':' + (m[2] || '00'); line = line.slice(m[0].length); }
      else {
        var period = bare(line).match(/^(manha|morning|tarde|afternoon|noite|evening|night)\b\s*[:\-–]?\s*/);
        if (period) { time = /manha|morning/.test(period[1]) ? '09:00' : /tarde|afternoon/.test(period[1]) ? '14:00' : '19:30'; line = line.slice(period[0].length); }
      }
      if (line.length < 3) return;
      var kind = kindOf(line);
      skipped = false;
      if (firstDay && (kind === 'hotel' || kind === 'voo')) { skipped = true; return; } /* chegada e check-in o OND já põe */
      if (!time) { time = SLOTS[Math.min(slot, SLOTS.length - 1)]; }
      slot = Math.max(slot, SLOTS.indexOf(time) + 1 || slot + 1);
      var booked = /\s+Reservad[oa]$/i.test(line); line = line.replace(/\s+Reservad[oa]$/i, '');
      line = line.charAt(0).toUpperCase() + line.slice(1);
      out.push({ booked: booked || undefined, time: time, type: kind, title: short(line), lat: place.lat, lng: place.lng, minutes: kind === 'comida' ? 90 : kind === 'voo' ? 60 : 120 });
    });
    out.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
    return out;
  }

  /* "Lisboa 4 noites", "Lisboa (4 noites)" ou "4 noites em Lisboa" */
  function nightsNear(line, name) {
    var at = low(line).indexOf(low(name)); if (at < 0) return 0;
    var after = line.slice(at + name.length, at + name.length + 30).match(/^\s*[:\-–(,]?\s*(?:por|for|com)?\s*(\d{1,2})\s*(noites?|nights?|dias?|days?)\b/i);
    var before = line.slice(Math.max(0, at - 30), at).match(/(\d{1,2})\s*(noites?|nights?|dias?|days?)\s+(?:em|in|no|na|a|at)\s*$/i);
    var m = after || before;
    return m ? Math.max(1, Math.min(30, +m[1])) : 0;
  }
  /* pedido curto: nomes em lista ("Roma, Florença e Veneza") que o catálogo não tem vão para o mapa aberto */
  function listCandidates(text) {
    var out = [], re = /(?:^|,|;|\be\b|\band\b|\bpara\b|\bem\b|\bto\b)\s+([A-ZÀ-Þ][a-zà-ÿ'’]+(?:\s+(?:de|do|da|del|di)?\s*[A-ZÀ-Þ][a-zà-ÿ'’]+){0,2})/g, m;
    while ((m = re.exec(text))) out.push(m[1]);
    return out;
  }

  /* ── texto → viagem ── */
  var HEADER = /^\s*(?:(?:dia|day|d[íi]a|jour|giorno|tag)\s*(\d{1,2})|(\d{1,2})\s*(?:º|o|ª)?\s*dia)\b\s*[:.\-–—|)]*\s*(.*)$/i;
  function geocode(name) {
    return fetch('https://photon.komoot.io/api/?limit=4&osm_tag=place&q=' + encodeURIComponent(name)).then(function (r) { return r.json(); }).then(function (data) {
      var f = (data.features || []).filter(function (x) { return /city|town|village|island|municipality|hamlet/.test(x.properties.osm_value || x.properties.type || ''); })[0]; if (!f) return null;
      return { name: f.properties.name, countryName: f.properties.country || '', iso: '', latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0], image: '' };
    }).catch(function () { return null; });
  }
  function headCity(rest) {
    var parts = rest.split(/\s*(?:→|->|>|–|—| - |\||,|\(|:)\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    var last = parts.length > 1 && /→|->|>/.test(rest) ? parts[parts.length - 1] : parts[0];
    return last && /^[A-ZÀ-Þ]/.test(last) && last.split(' ').length <= 4 && last.length <= 30 ? last : '';
  }
  function fromText(text) {
    var lines = text.replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var result = { title: '', start: findStart(text), from: '', stops: [], avisos: [] };
    var first = lines.find(function (l) { return /[A-Za-zÀ-ÿ]{3}/.test(l); });
    if (first && first.length <= 60 && !HEADER.test(first) && first.indexOf(' · ') < 0 && !/^(page|p[aá]gina)\b/i.test(first)) result.title = first.replace(/[.:]$/, '');
    var origin = text.match(/\b(?:saindo|partindo|sa[ií]da|partida|from)\s+(?:de|do|da|from)?\s*([A-ZÀ-Þ][A-Za-zÀ-ÿ]+(?:\s+(?:de|do|da)?\s*[A-ZÀ-Þ][A-Za-zÀ-ÿ]+)*)/);
    if (origin) result.from = origin[1].trim();

    /* blocos de dia */
    var blocks = [], current = null, loose = [];
    lines.forEach(function (line) {
      var m = line.match(HEADER);
      if (m && /\b(dia|day)\s*\d/i.test(m[3] || '')) m = null;
      if (m && (m[3] || '').length < 120) {
        var head = (m[3] || '').replace(/^[\s·]+/, '').trim(), extra = [];
        if (head.indexOf(' · ') >= 0) {
          /* linha de planilha: "Dia 1 · Lisboa · 09:00 · Torre de Belém" */
          var cells = head.split(' · '), place = [], pending = '';
          cells.forEach(function (cell) {
            if (/^\d{1,2}[:h]\d{2}$|^\d{1,2}h$/i.test(cell)) { pending = cell; return; }
            if (!place.length && !pending && cell.length <= 40 && citiesIn(cell, false).length) { place.push(cell); return; }
            extra.push((pending ? pending + ' ' : '') + cell); pending = '';
          });
          head = place.join(' ');
        }
        var n = +(m[1] || m[2]), last = blocks[blocks.length - 1];
        if (last && last.n === n) { current = last; if (!current.head) current.head = head; }
        else { current = { n: n, head: head, body: [] }; blocks.push(current); }
        extra.forEach(function (item) { current.body.push(item); });
        return;
      }
      var weekday = /^(dia|day)\s+(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line);
      if (weekday) {
        var body = current ? current.body : loose, number = '', head = '';
        if (body.length && /^\d{1,2}\b/.test(body[body.length - 1])) number = body.pop();
        if (body.length && body[body.length - 1].length <= 60) head = body.pop();
        current = { n: parseInt(number, 10) || blocks.length + 1, head: head, body: [] }; blocks.push(current); return;
      }
      (current ? current.body : loose).push(line);
    });
    var pending = [];
    if (blocks.length >= 2) {
      var counts = {}, base = null;
      lines.forEach(function (line) { citiesIn(line, false).forEach(function (city) { counts[city.name] = (counts[city.name] || 0) + 1; if (!base || counts[city.name] > counts[base.name]) base = city; }); });
      var prevCity = null;
      blocks.forEach(function (block) {
        var inHead = citiesIn(block.head, true), city = inHead.length ? inHead[inHead.length - 1] : null;
        if (!city) {
          block.body.some(function (line) {
            var move = line.match(/\b(?:para|rumo a|at[eé]|to)\s+([A-ZÀ-Þ].*)$/);
            var hit = move && citiesIn(move[1], true)[0];
            if (hit && /\b(trem|voo|ônibus|onibus|carro|estrada|barco|balsa|train|flight|bus|drive|ferry|seguir|seguimos|partida)\b/i.test(line)) { city = hit; return true; }
            return false;
          });
        }
        if (!city && !prevCity && base) city = base;
        /* título sem cidade conhecida só vai para o mapa se o documento não tiver nenhuma cidade do catálogo, ou se indicar mudança ("Roma → Nápoles") */
        if (!city && block.head && headCity(block.head) && (!base || /→|->|\bpara\b|\bto\b/.test(block.head))) { block.ask = headCity(block.head); }
        block.city = city || prevCity; if (block.city) prevCity = block.city;
      });
      return Promise.all(blocks.map(function (block) {
        if (block.city && !block.ask) return null;
        if (!block.ask) return null;
        return geocode(block.ask).then(function (hit) { if (hit) block.city = hit; });
      })).then(function () {
        /* preenche o começo sem cidade com a primeira encontrada */
        var firstCity = (blocks.find(function (b) { return b.city; }) || {}).city;
        if (!firstCity) { result.avisos.push('Achei os dias, mas não achei as cidades. Confira os destinos.'); return result; }
        var prev = firstCity;
        blocks.forEach(function (b) { if (!b.city) b.city = prev; prev = b.city; });
        var last = blocks[blocks.length - 1];
        var goingHome = blocks.length > 2 && /\b(volta|retorno|regresso|partida|despedida|embarque|return|departure|home)\b/i.test(bare(last.head + ' ' + last.body.slice(0, 3).join(' ')));
        var used = goingHome ? blocks.slice(0, -1) : blocks;
        used.forEach(function (block) {
          var stop = result.stops[result.stops.length - 1];
          if (!stop || stop.city !== block.city.name) {
            stop = asStop(block.city); stop.nights = 0; stop.dias = []; stop.titulos = []; result.stops.push(stop);
          }
          var head = block.head && block.head.length <= 60 ? block.head.replace(/[.:]$/, '') : '';
          stop.titulos.push(head);
          stop.dias.push(activities(block.body.concat(block.head.length > 60 ? [block.head] : []), stop, stop.nights === 0));
          stop.nights++;
        });
        result.dias = blocks.length;
        return result;
      });
    }

    /* sem "Dia 1": cidades na ordem em que aparecem, noites pelo texto */
    var order = [], seen = {};
    lines.forEach(function (line) {
      var strictLine = /\d+\s*(noites?|nights?|dias?|days?)/i.test(line);
      citiesIn(line, strictLine).forEach(function (city) {
        if (result.from && low(city.name) === low(result.from)) return;
        if (seen[city.name]) return;
        seen[city.name] = true;
        var made = asStop(city, nightsNear(line, city.hit || city.name)); made.pos = text.indexOf(city.hit || city.name); order.push(made);
      });
    });
    var extra = text.length < 600 ? listCandidates(text).filter(function (name) {
      var key = low(name); return !index[key] && !MESES[bare(name)] && !seen[name] && !(result.from && key === low(result.from)) && !/^(quero|vou|com|sem|dias?|noites?|roteiro|viagem)$/.test(bare(name));
    }).slice(0, 6) : [];
    return Promise.all(extra.map(function (name) { return geocode(name).then(function (hit) { return hit ? { name: name, city: hit } : null; }); })).then(function (hits) {
      hits.filter(Boolean).forEach(function (h) {
        if (order.some(function (stop) { return low(stop.city) === low(h.city.name); })) return;
        var stop = asStop(h.city, nightsNear(text, h.name)); stop.city = h.name; stop.pos = text.indexOf(h.name); order.push(stop);
      });
      order.forEach(function (stop) { if (stop.pos == null) stop.pos = text.indexOf(stop.city); });
      order.sort(function (a, b) { return (a.pos < 0 ? 1e9 : a.pos) - (b.pos < 0 ? 1e9 : b.pos); });
      return finish();
    });
    function finish() {
    if (!order.length) { result.avisos.push('Não achei nenhuma cidade. Escreva os nomes das cidades, por exemplo: Lisboa 4 noites, Porto 3 noites.'); return result; }
    var total = bare(text).match(/\b(\d{1,2})\s*(dias|days|noites|nights)\b/);
    var free = order.filter(function (stop) { return !stop.nights; });
    if (free.length) {
      var fixed = order.reduce(function (sum, stop) { return sum + stop.nights; }, 0);
      var budget = total && free.length === order.length ? (+total[1] - (/dia|day/.test(total[2]) ? 1 : 0)) - fixed : 0;
      var each = budget > 0 ? Math.max(1, Math.floor(budget / free.length)) : (order.length > 4 ? 2 : 3);
      free.forEach(function (stop, i) { stop.nights = each + (budget > 0 && i < budget - each * free.length ? 1 : 0); });
    }
    result.stops = order.slice(0, 12);
    if (order.length > 12) result.avisos.push('Usei as 12 primeiras cidades.');
    return result;
    }
  }

  /* ── JSON: viagem do OND inteira, lista de destinos ou qualquer coisa (vira texto) ── */
  function fromJson(data) {
    if (Array.isArray(data) && data.length && data[0] && data[0].days) data = data[0];
    if (data && Array.isArray(data.days) && data.days.length) {
      var trip = JSON.parse(JSON.stringify(data));
      trip.id = 'v-' + Date.now().toString(36); trip.created = true;
      trip.title = trip.title || 'Viagem importada';
      trip.days.forEach(function (day) { day.items = day.items || []; });
      trip.start = trip.start || trip.days[0].date; trip.end = trip.end || trip.days[trip.days.length - 1].date;
      ['transports', 'stays', 'checklist', 'saved'].forEach(function (key) { if (!Array.isArray(trip[key])) trip[key] = []; });
      var me = window.ME || { name: 'Você', initials: 'VC', color: '#7f11f4' };
      if (!Array.isArray(trip.people) || !trip.people.length) trip.people = [{ name: me.name, initials: me.initials, color: me.color || '#7f11f4', role: 'Dono do roteiro' }];
      trip.status = trip.status || 'planejando';
      return Promise.resolve({ completa: trip, title: trip.title, start: trip.start, stops: [], avisos: [] });
    }
    var list = Array.isArray(data) ? data : data && (data.stops || data.destinos || data.cidades || data.destinations || data.cities || data.paradas);
    if (Array.isArray(list) && list.length) {
      var stops = [], ask = [];
      list.forEach(function (entry) {
        var name = typeof entry === 'string' ? entry : entry && (entry.city || entry.cidade || entry.name || entry.nome || entry.destino);
        if (!name) return;
        var nights = typeof entry === 'object' ? +(entry.nights || entry.noites || entry.dias || entry.days || 0) : 0;
        var hit = index[low(name)];
        var stop = hit ? asStop(hit, nights || 3) : { ask: name, nights: nights || 3 };
        if (!hit && entry.lat != null && (entry.lng != null || entry.lon != null)) stop = { city: name, country: entry.country || entry.pais || '', iso: entry.iso || '', lat: +entry.lat, lng: +(entry.lng != null ? entry.lng : entry.lon), nights: nights || 3 };
        stops.push(stop); if (stop.ask) ask.push(stop);
      });
      return Promise.all(ask.map(function (stop) { return geocode(stop.ask).then(function (hit) { if (hit) Object.assign(stop, asStop(hit, stop.nights), { city: stop.ask }); }); })).then(function () {
        var data2 = data || {};
        return { title: data2.title || data2.titulo || data2.nome || '', start: findStart(String(data2.start || data2.inicio || data2.ida || '')), from: data2.from || data2.origem || '', stops: stops.filter(function (s) { return s.city; }), avisos: stops.some(function (s) { return !s.city; }) ? ['Alguns destinos não foram encontrados no mapa.'] : [] };
      });
    }
    var parts = [];
    (function walk(value) {
      if (value == null) return;
      if (typeof value === 'string') parts.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (typeof value === 'object') Object.keys(value).forEach(function (key) { walk(value[key]); });
    })(data);
    return fromText(parts.join('\n'));
  }
  function interpret(text) {
    var trimmed = text.trim();
    if (/^[\[{]/.test(trimmed)) { try { return fromJson(JSON.parse(trimmed)); } catch (jsonError) {} }
    if (/^\s*<(!doctype|html|div|p|h\d)\b/i.test(trimmed)) text = htmlText(text);
    return fromText(plain(text));
  }

  /* ── tela ── */
  var dialog = null, found = null;
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'im';
    dialog.setAttribute('aria-labelledby', 'im-titulo');
    dialog.innerHTML =
      '<button type="button" class="im-x" data-im-fechar aria-label="Fechar">' + I.fechar + '</button>' +
      '<h2 class="im-h" id="im-titulo">Importar roteiro</h2>' +
      '<p class="im-sub">Traga o roteiro que você já tem. A gente separa os destinos, as noites e os passeios de cada dia.</p>' +
      '<label class="im-drop" id="im-drop"><input type="file" id="im-arquivo" accept=".pdf,.docx,.txt,.md,.json,.csv,.tsv,.xlsx,.xls,.ods,.html,.htm,.ics,application/pdf,text/plain,application/json,text/markdown,text/csv,text/html,text/calendar">' + I.arquivo +
      '<span><b>Escolher arquivo</b><small>PDF, Word, planilha, texto ou agenda</small></span></label>' +
      '<label class="im-campo"><span>Ou cole o roteiro</span><textarea class="input" id="im-texto" rows="6" placeholder="Ex.: 10 dias na Itália saindo em 12/05. Roma 4 noites, Florença 3 noites, Veneza 2 noites."></textarea></label>' +
      '<div class="im-res" id="im-res" aria-live="polite"></div>' +
      '<div class="im-acoes"><button type="button" class="btn btn-line" data-im-fechar>Cancelar</button><button type="button" class="btn btn-primary" id="im-ler">Ler roteiro</button></div>';
    document.body.appendChild(dialog);
    var drop = dialog.querySelector('#im-drop'), fileInput = dialog.querySelector('#im-arquivo');
    dialog.querySelector('#im-texto').addEventListener('input', function () { if (dialog.classList.contains('lido')) { dialog.classList.remove('lido'); found = null; dialog.querySelector('#im-res').innerHTML = ''; } });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) take(fileInput.files[0]); });
    ['dragenter', 'dragover'].forEach(function (type) { drop.addEventListener(type, function (event) { event.preventDefault(); drop.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (type) { drop.addEventListener(type, function () { drop.classList.remove('on'); }); });
    drop.addEventListener('drop', function (event) { event.preventDefault(); var file = event.dataTransfer.files[0]; if (file) take(file); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.closest('[data-im-fechar]')) return dialog.close();
      if (event.target.closest('#im-ler')) return run(dialog.querySelector('#im-texto').value);
      if (event.target.closest('#im-usar')) return use();
    });
  }
  function busy(message) { dialog.querySelector('#im-res').innerHTML = '<p class="im-lendo">' + esc(message) + '</p>'; }
  function take(file) {
    if (file.size > 15 * 1024 * 1024) { showError('Arquivo grande demais. O limite é 15 MB.'); return; }
    dialog.querySelector('.im-drop small').textContent = file.name;
    busy('Lendo ' + file.name + '...');
    readFile(file).then(function (text) {
      if (!text || !text.trim()) { showError('Não achei texto nesse arquivo. Se o PDF for uma foto escaneada, cole o texto aqui embaixo.'); return; }
      dialog.querySelector('#im-texto').value = text.slice(0, 20000);
      run(text);
    }).catch(function (error) {
      var why = error && error.message;
      showError(why === 'imagem' ? 'Foto ainda não dá para ler. Cole o texto do roteiro aqui embaixo.' : why === 'formato' ? 'Esse formato não abre aqui. Salve como PDF ou .docx e tente de novo.' : 'Não deu para abrir esse arquivo.');
    });
  }
  function showError(message) { found = null; dialog.classList.remove('lido'); dialog.querySelector('#im-res').innerHTML = '<p class="im-aviso">' + I.aviso + esc(message) + '</p>'; }
  function run(text) {
    if (!text || text.trim().length < 3) { showError('Escolha um arquivo ou cole o roteiro.'); return; }
    busy('Procurando destinos e dias...');
    getCatalog().then(function (cities) { if (!index || !Object.keys(index).length) buildIndex(cities); return interpret(text); }).then(show).catch(function () { showError('Não deu para ler esse roteiro.'); });
  }
  function show(result) {
    found = result;
    dialog.classList.add('lido');
    var box = dialog.querySelector('#im-res');
    if (result.completa) {
      var t = result.completa;
      box.innerHTML = '<div class="im-ok"><b>' + esc(t.title) + '</b><small>Roteiro do OND com ' + t.days.length + ' dias, ' + t.days.reduce(function (sum, day) { return sum + day.items.length; }, 0) + ' programas e ' + t.stays.length + ' hospedagens.</small></div>' +
        '<button type="button" class="btn btn-primary im-usar" id="im-usar">Criar esta viagem</button>';
      return;
    }
    if (!result.stops.length) { showError(result.avisos[0] || 'Não achei destinos nesse roteiro.'); return; }
    var nights = result.stops.reduce(function (sum, stop) { return sum + stop.nights; }, 0);
    var programs = result.stops.reduce(function (sum, stop) { return sum + (stop.dias || []).reduce(function (a, d) { return a + d.length; }, 0); }, 0);
    var facts = [(nights + 1) + ' dias', result.stops.length + (result.stops.length === 1 ? ' destino' : ' destinos')];
    if (programs) facts.push(programs + (programs === 1 ? ' programa' : ' programas'));
    if (result.start) { var p = result.start.split('-'); facts.push('ida em ' + p[2] + '/' + p[1] + '/' + p[0]); }
    box.innerHTML = '<div class="im-ok">' + (result.title ? '<b>' + esc(result.title) + '</b>' : '') + '<small>' + facts.join(' · ') + '</small></div>' +
      '<ol class="im-lista">' + result.stops.map(function (stop) {
        var count = (stop.dias || []).reduce(function (a, d) { return a + d.length; }, 0);
        return '<li>' + flag(stop.iso) + '<span><b>' + esc(stop.city) + '</b><small>' + esc(stop.country) + (count ? ' · ' + count + (count === 1 ? ' programa' : ' programas') : '') + '</small></span><em>' + stop.nights + (stop.nights === 1 ? ' noite' : ' noites') + '</em></li>';
      }).join('') + '</ol>' +
      result.avisos.map(function (text) { return '<p class="im-aviso">' + I.aviso + esc(text) + '</p>'; }).join('') +
      '<button type="button" class="btn btn-primary im-usar" id="im-usar">Usar este roteiro</button><p class="im-dica">Depois dá para mudar noites, ordem e data antes de criar.</p>';
  }
  function use() {
    if (!found) return;
    if (window.OndPlano) window.OndPlano.usar('importar');
    if (found.completa) { dialog.close(); window.ondNovaViagem.salvar(found.completa); return; }
    window.ondNovaViagem.carregar({ stops: found.stops, start: found.start, from: found.from, title: found.title });
    dialog.close();
    note('Roteiro importado. Confira e crie a viagem.');
  }
  window.ondImportar = {
    abrir: function () { if (!dialog) build(); found = null; dialog.classList.remove('lido'); dialog.querySelector('#im-res').innerHTML = ''; dialog.showModal(); },
    ler: function (text) { return getCatalog().then(function (cities) { if (!index) buildIndex(cities); return interpret(text); }); }
  };
  if (new URLSearchParams(location.search).has('importar')) setTimeout(function () { window.ondImportar.abrir(); }, 300);
})();
