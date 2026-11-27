/* OND vAI dentro do site, com as mesmas funções da tela do app (lib/screens/ond_vai/ond_vai_screen.dart):
   conversa por texto, áudio e anexo; escolha guiada de destino, datas e interesses; código de voo,
   nome, e-mail com código de confirmação e WhatsApp; ofertas de voo e parceiros; "Sua viagem até agora";
   consentimento da agência; geração do roteiro ou da estimativa. Mesma API do app, mesmo deviceId por navegador.
   Uso: OndVaiChat.mount(elemento), OndVaiChat.prefill('texto'), OndVaiChat.focus(). */
(function () {
  var BASE = 'https://ond.agamatec.com/api/';
  var API = BASE + 'ond-vai/';
  var FIRESTORE = 'https://firestore.googleapis.com/v1/projects/agama-tec/databases/aga-mercado-production-firestore/documents/ond_vai_document_batches/';
  var WEB_APP = 'https://web.ondviajar.com.br/';
  var SUPPORT_WHATSAPP = 'https://wa.me/5511910214133';
  var SUPPORT_EMAIL = 'mailto:renan@ondviajar.com.br';
  var MAX_DOCS = 3, MAX_DOC_BYTES = 10 * 1024 * 1024, MAX_ANON_DEMOS = 3, MAX_TRIP_DAYS = 30;
  var DOC_TYPES = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown', html: 'text/html', htm: 'text/html' };
  var EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];

  /* textos: os mesmos do app (l10n/app_pt.arb) */
  var T = {
    welcomeTitle: 'Oi, como posso te ajudar hoje?',
    welcomeDisclaimer: 'Converse com o OND vAI por áudio, texto ou anexo. Manda a passagem, a confirmação do hotel ou o ingresso que eu leio e monto sua viagem a partir dali.',
    startersTitle: 'Sugestões pra começar',
    starters: ['Fim de semana na serra (Gramado)', 'Praia no Nordeste em janeiro (Porto de Galinhas)', 'Neve e vinho nos Andes (Santiago)', 'Férias em família nos parques (Orlando)', 'Lua de mel no Caribe (Punta Cana)'],
    inputHint: 'Escreva ou toque no microfone',
    attach: 'Anexar documentos da viagem',
    chooseDestination: 'Escolher destino', chooseDates: 'Escolher datas', chooseInterests: 'Escolher interesses',
    destinationTitle: 'Para onde você quer ir?', destinationSubtitle: 'Escolha a cidade do seu destino que eu monto o roteiro com você.',
    addStopSubtitle: 'Escolha uma parada próxima pra somar à viagem', searchHint: 'Buscar destino',
    destinationEmpty: 'Não encontramos essa cidade na lista. Tente outro nome.',
    datesTitle: 'Quando vai ser a viagem?', interestsTitle: 'Áreas de interesse', confirm: 'Confirmar', cancel: 'Cancelar', back: 'Voltar',
    tripTooLong: function (days) { return 'A viagem total não pode exceder 30 dias. Atualmente com ' + days + ' dias.'; },
    suggestion: { NEXT_WEEKEND: 'Já no próximo fim de semana', NEXT_MONTH: 'No mês que vem', UNDECIDED: 'Me ajuda a escolher' },
    holiday: function (name) { return 'Aproveitar ' + name; }, inMonth: function (month) { return 'Em ' + month; }, afterCity: function (city) { return 'Logo depois de ' + city; },
    period: function (start, end) { return start + ' a ' + end; },
    emailHint: 'seu@email.com', emailInvalid: 'Hmm, isso não parece um email. Pode conferir?',
    skipToPreview: 'Quero só uma prévia',
    previewOnly: 'Sem problema! Vou te dar um gostinho com 1 dia da viagem. Quando quiser o roteiro inteiro, me diz teu nome e email que eu mando tudo.',
    phoneHint: 'Seu número de WhatsApp', phoneInvalid: 'Hmm, esse número não parece certo. Pode conferir?', phoneSkip: 'Agora não', phoneSkipMessage: 'Prefiro não informar meu telefone por enquanto',
    flightHint: 'Código do voo (ex.: LA8084)', flightSkip: 'Não tenho voo', flightSkipMessage: 'Não tenho voo reservado',
    nameAsk: 'Insira seu nome',
    otpPrompt: function (email) { return 'Você já tem conta com ' + email + '. Te enviei um código por email. Digite ele aqui pra eu continuar montando seu roteiro.'; },
    otpInvalid: 'Código inválido ou expirado. Confere no seu email e digita de novo.',
    anonymousQuota: 'Você já gerou suas amostras gratuitas. Me passa seu email que eu monto o roteiro completo.',
    error: 'Algo deu errado. Tente de novo.', limit: 'Você atingiu o limite de roteiros gratuitos.',
    docsUnsupported: 'Tipo de arquivo não suportado. Escolha PDF, PNG, JPG, TXT, Markdown ou HTML.',
    docsTooLarge: 'Esse arquivo é muito grande. Cada documento pode ter até 10 MB.',
    docsLimit: 'Você só pode adicionar até 3 anexos.',
    docsConversationLimit: 'Você já anexou o máximo de documentos nesta conversa.',
    docsFailed: 'Não consegui ler seus documentos agora. Tente de novo ou me conte por aqui mesmo.',
    docsReading: ['Abrindo seus documentos...', 'Lendo sua passagem...', 'Conferindo suas reservas...', 'Montando a viagem a partir do que você mandou...'],
    docsProgress: function (read, total) { return read + ' de ' + total + ' lidos'; },
    building: ['Dando vida à sua viagem...', 'Garimpando experiências que combinam com você...', 'Desenhando seus dias...', 'Preparando tudo pra você só aproveitar...'],
    estimating: ['Calculando os custos da sua viagem...', 'Estimando voo, hospedagem e passeios...', 'Quase lá, fechando os números...'],
    draftTitle: 'Sua viagem até agora', draftEmpty: 'Conforme a gente conversa, sua viagem vai aparecendo aqui.',
    draftDestination: 'Destino', draftAlso: 'Também', draftDates: 'Datas', draftPeople: 'Quem vai na viagem', draftOrigin: 'Ponto de partida',
    draftCompleteMissing: 'Completar o que falta',
    people: function (count) { return count === 1 ? '1 pessoa' : count + ' pessoas'; }, days: function (count) { return count + ' dias'; },
    restart: 'Recomeçar', restartTitle: 'Recomeçar a conversa?', restartMessage: 'Isso apaga o que vocês conversaram até aqui e começa do zero.',
    explore: 'Explorar', exploreIn: function (country) { return 'Destinos em ' + country; },
    webPromoTitle: 'O OND é ainda melhor no app', webPromoBody: 'Baixe e avalie se curtir.', webPromoButton: 'Baixar',
    generate: { dream: 'Bora montar essa viagem', plan: 'Montar meu roteiro', execute: 'Finalizar meu roteiro', estimate: 'Ver minha estimativa', fallback: 'Gerar meu roteiro' },
    consentTitle: 'Antes de continuar',
    consentBody: function (what) { return 'Pra gerar ' + what + ', vou usar o que você me contou aqui (destino, datas, como você imagina a viagem) pra te conectar com uma agência parceira que pode fechar isso com você. Seu contato vai junto.'; },
    consentAccept: 'Aceitar e continuar', consentDecline: 'Não aceitar', consentRetry: 'Tentar novamente',
    consentLocked: function (what) { return 'Pra receber ' + what + ', você precisa aceitar compartilhar o que conversamos aqui e seu contato com uma agência parceira.'; },
    itinerary: 'seu roteiro', estimate: 'sua estimativa',
    exploreAttractions: 'Explorar atrações', callWhatsapp: 'Chamar no WhatsApp', sendEmail: 'Mandar e-mail',
    flightDirect: 'direto', flightStops: function (count) { return count === 1 ? '1 conexão' : count + ' conexões'; }, flightFrom: 'a partir de',
    partner: { stay: 'Reservar hospedagem', flight: 'Buscar passagens', car: 'Alugar um carro', experience: 'Reservar experiências', insurance: 'Proteja sua viagem', esim: 'Ter internet lá fora', transfer: 'Sair do aeroporto sem estresse', compensation: 'Voo atrasou? Peça indenização' },
    agencyPartner: 'Fale com uma agência parceira',
    processingTitle: 'Seu roteiro está sendo criado',
    processingBody: 'Seu roteiro está sendo gerado com atrações reais, horários, rotas e estimativas de custo. O processo é automático e leva alguns minutos. Você pode acompanhar o progresso aqui ou sair e voltar depois.',
    wantFullItinerary: 'Quero o roteiro completo',
    recording: 'Gravando', paused: 'Pausado'
  };
  var ACTION_VERTICAL = { BUY_FLIGHT: 'flight', BOOK_STAY: 'stay', BOOK_EXPERIENCE: 'experience', BOOK_CAR: 'car', BOOK_INSURANCE: 'insurance', BUY_ESIM: 'esim', BOOK_TRANSFER: 'transfer', CLAIM_COMPENSATION: 'compensation' };

  function svg(path, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + path + '</svg>'; }
  var I = {
    star: '<svg viewBox="0 0 497.26 497.26" aria-hidden="true"><path d="M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z"/></svg>',
    send: svg('<path d="M12 19V5M5 12l7-7 7 7"/>', ' stroke-width="2"'),
    reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    clip: svg('<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>'),
    keyboard: svg('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
    pause: svg('<path d="M9 5v14M15 5v14"/>', ' stroke-width="2.4"'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    map: svg('<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    pin: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    pinPlus: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><path d="M12 6.5v5M9.5 9h5"/>'),
    cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
    people: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>'),
    takeoff: svg('<path d="M3 20h18M4.5 14.5 3 10l2-.6 2.4 2.2 4-1.3L7.6 4.2l2.4-.7 6 5.6 4-1.3a1.6 1.6 0 0 1 1 3l-15 4.7z"/>'),
    chevron: svg('<path d="m9 6 6 6-6 6"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>', ' stroke-width="2"'),
    whats: svg('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.6-2-1-1 .8c-1-.5-1.9-1.4-2.4-2.4l.8-1-1-2z"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
    doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
    plane: svg('<path d="M10.5 13.5 3 11l1.5-1.5 7 1 4-4.5c.8-.9 2.3-1 3 0 .7.8.5 2-.3 2.8L14 13l1 7-1.5 1.5-2.5-7.5-3.5 3.5.5 2L6.5 21 5 17.5 1.5 16 3 14.5l2 .5z"/>'),
    ticket: svg('<path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
    sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>')
  };

  /* ── estado ── */
  var root, scroller, list, dock, sidePanel, sheetHost, mounted = false;
  var catalog = { countries: [], cities: [], byId: {}, areas: [], ready: null };
  var state = freshState();
  var busy = { sending: false, submitting: false, reading: false };
  var recorder = null, recordChunks = [], recordTimer = null, recordSeconds = 0, recordPaused = false, recordStream = null;
  var panelLayer = 'menu', panelCountry = null, phraseTimer = null;

  function freshState() {
    return { turn: null, mode: 'itinerary', cityId: null, checkIn: null, checkOut: null, extras: [], interestIds: [], name: null, email: null, phone: null,
      travelers: 1, companions: [], observations: null, purpose: null, origin: null, flightCode: null, returnFlightCode: null, segments: [], destExtras: {},
      awaitingOtp: false, otpThenSubmit: false, emailUpsell: false, freeText: false, user: null, leadId: null, anonCount: 0, consentDeclined: false, messages: 0 };
  }

  function deviceId() {
    var id = null;
    try { id = localStorage.getItem('ond-vai-device'); } catch (error) {}
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'web-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      try { localStorage.setItem('ond-vai-device', id); } catch (error) {}
    }
    return id;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDay(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
  function parseDay(text) { if (!text) return null; var parts = String(text).slice(0, 10).split('-'); return new Date(+parts[0], +parts[1] - 1, +parts[2], 12); }
  function daysBetween(start, end) { return Math.round((parseDay(end) - parseDay(start)) / 86400000) + 1; }
  function shortDate(text) { return parseDay(text).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''); }
  function brDate(text) { var d = parseDay(text); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function escapeHtml(text) { return String(text == null ? '' : text).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim()); }
  function money(amount, currency) { try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL', maximumFractionDigits: 0 }).format(amount); } catch (error) { return (currency || '') + ' ' + Math.round(amount); } }

  function collected() {
    var map = { mode: state.mode, extraDestinations: state.extras.map(function (extra) {
      var item = { cityId: extra.cityId }; if (extra.checkIn) { item.checkIn = extra.checkIn + 'T00:00:00.000'; item.checkOut = extra.checkOut + 'T00:00:00.000'; } return item;
    }), interestAreaIds: state.interestIds.slice(), numberOfTravelers: state.travelers, currency: 'brl' };
    if (state.cityId) map.cityId = state.cityId;
    if (state.checkIn) { map.checkIn = state.checkIn + 'T00:00:00.000'; map.checkOut = state.checkOut + 'T00:00:00.000'; }
    if (state.name) map.travelerName = state.name;
    if (state.email) map.travelerEmail = state.email;
    if (state.phone) map.travelerPhone = state.phone;
    if (state.companions.length) map.travelers = state.companions;
    if (state.observations) map.observations = state.observations;
    if (state.purpose) map.tripPurpose = state.purpose;
    if (state.origin) map.originCity = state.origin;
    if (state.flightCode) map.flightCode = state.flightCode;
    if (state.returnFlightCode) map.returnFlightCode = state.returnFlightCode;
    if (Object.keys(state.destExtras).length) map.destinationExtras = state.destExtras;
    return map;
  }
  function query(extra) {
    var params = { deviceId: deviceId(), locale: (window.OndIdioma ? window.OndIdioma.atual : 'pt'), originCountry: 'BR', mode: state.mode, collected: JSON.stringify(collected()), clientDate: isoDay(new Date()) };
    if (state.name) params.knownName = state.name;
    if (state.purpose) params.travelMoment = state.purpose;
    for (var key in extra || {}) params[key] = extra[key];
    return Object.keys(params).map(function (key) { return key + '=' + encodeURIComponent(params[key]); }).join('&');
  }
  function api(path, options) {
    return fetch(BASE + path, options).then(function (response) {
      if (!response.ok && response.status !== 202) { var error = new Error('HTTP ' + response.status); error.status = response.status; throw error; }
      return response.status === 204 ? null : response.text().then(function (text) { try { return text ? JSON.parse(text) : null; } catch (error) { return text; } });
    });
  }
  function postJson(path, body) { return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  function recordAppMessage(sender, content, input) {
    var body = { sender: sender, content: content }; if (input) body.input = input;
    postJson('ond-vai/message?deviceId=' + encodeURIComponent(deviceId()), body).catch(function () {});
  }

  /* ── catálogo de cidades e interesses, o mesmo do app ── */
  function loadCatalog() {
    if (catalog.ready) return catalog.ready;
    catalog.ready = Promise.all([
      api('countries?locale=pt_BR').catch(function () { return []; }),
      api('interest-areas?onlyEnabled=true&locale=' + (window.OndIdioma ? ({ pt: 'pt_BR', en: 'en_US', es: 'es_ES', fr: 'fr_FR', it: 'it_IT', de: 'de_DE', nl: 'nl_NL', ar: 'ar', hi: 'hi_IN', zh: 'zh_CN' })[window.OndIdioma.atual] : 'pt_BR')).catch(function () { return []; })
    ]).then(function (results) {
      catalog.countries = (results[0] || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'pt'); });
      catalog.cities = [];
      catalog.countries.forEach(function (country) {
        (country.cities || []).forEach(function (city) { city.country = country; catalog.cities.push(city); catalog.byId[city.id] = city; });
      });
      catalog.cities.sort(function (a, b) { return a.name.localeCompare(b.name, 'pt'); });
      catalog.areas = (results[1] || []).slice().sort(function (a, b) { return (a.priority || 0) - (b.priority || 0); });
    });
    return catalog.ready;
  }
  function areaLabel(area) {
    var readable = (area.translations || []).filter(function (t) { return t.isHumanReadable; });
    var pt = readable.find(function (t) { return /^pt/i.test(t.language); }) || readable[0] || (area.translations || [])[0];
    return pt ? pt.description : (area.displayName || area.category);
  }
  function cityLabel(city) { return city.name + (city.country && city.country.name ? ', ' + city.country.name : ''); }
  function cityPage(city) { var code = (city.unlocode || '').replace(/\s+/g, ''); return '/explorar/destino/?cidade=' + encodeURIComponent(code || city.name); }
  function flag(country, size) { return country && country.image ? '<img class="vc-flag" src="' + escapeHtml(country.image) + '" alt="" width="' + size + '" height="' + Math.round(size * 0.7) + '" loading="lazy">' : ''; }

  /* ── markdown mínimo das respostas ── */
  function format(text) {
    var html = escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    var lines = html.split('\n'), out = [], inList = false;
    lines.forEach(function (line) {
      var item = /^\s*(?:[-•]|\d+\.)\s+(.*)$/.exec(line);
      if (item) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + item[1] + '</li>'); return; }
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line.trim() ? '<p>' + line + '</p>' : '');
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  /* ── mensagens ── */
  function audioPlayer(url, mine) {
    return '<div class="vc-audio' + (mine ? ' vc-audio-eu' : '') + '"><button type="button" class="vc-audio-play" data-audio="' + escapeHtml(url) + '" aria-label="Ouvir">' + I.play + '</button><span class="vc-audio-bar"><i></i></span><span class="vc-audio-t">0:00</span></div>';
  }
  function addMessage(isUser, text, extra) {
    extra = extra || {};
    var row = document.createElement('div');
    row.className = 'vc-row ' + (isUser ? 'vc-eu' : 'vc-vai');
    var body = '';
    if (extra.docs && extra.docs.length) body += '<div class="vc-docs">' + extra.docs.map(function (name) { return '<span class="vc-doc">' + I.doc + escapeHtml(name) + '</span>'; }).join('') + '</div>';
    if (extra.audioUrl) body += audioPlayer(extra.audioUrl, isUser);
    if (text) body += isUser ? '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>' : format(text);
    if (!body) return null;
    row.innerHTML = (isUser ? '' : '<span class="vc-avatar">' + I.star + '</span>') + '<div class="vc-col"><div class="vc-bubble">' + body + '</div></div>';
    list.appendChild(row);
    state.messages++;
    setEmpty(false);
    if (!isUser && extra.action) renderAction(row.querySelector('.vc-col'), extra.action, extra.offers || []);
    return row;
  }
  function addNotice(text) { var row = addMessage(false, text); if (row) row.classList.add('vc-erro'); scrollDown(); }
  function scrollDown() { requestAnimationFrame(function () { scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }); }); }
  function setEmpty(empty) { root.classList.toggle('vc-vazio', empty); }
  function typing(phrases) {
    var row = document.createElement('div');
    row.className = 'vc-row vc-vai vc-digitando';
    row.innerHTML = '<span class="vc-avatar vc-pulsa">' + I.star + '</span><div class="vc-bubble">' + (phrases ? '<span class="vc-frase">' + escapeHtml(phrases[0]) + '</span><small class="vc-progresso"></small>' : '<i></i><i></i><i></i>') + '</div>';
    list.appendChild(row);
    clearInterval(phraseTimer);
    if (phrases) {
      var index = 0;
      phraseTimer = setInterval(function () { index = (index + 1) % phrases.length; var el = row.querySelector('.vc-frase'); if (el) { el.classList.remove('vc-troca'); void el.offsetWidth; el.classList.add('vc-troca'); el.textContent = phrases[index]; } }, 2600);
    }
    scrollDown();
    return { el: row, progress: function (text) { var el = row.querySelector('.vc-progresso'); if (el) el.textContent = text; }, done: function () { clearInterval(phraseTimer); row.remove(); } };
  }

  /* ── ações que vêm junto da resposta (voos, parceiros, atrações, suporte) ── */
  function renderAction(column, action, offers) {
    var box = document.createElement('div');
    box.className = 'vc-acao';
    var city = catalog.byId[state.cityId];
    if (action === 'BUY_FLIGHT' && offers.length) {
      box.innerHTML = offers.map(function (offer) {
        var stops = offer.transfers > 0 ? T.flightStops(offer.transfers) : T.flightDirect;
        var meta = [offer.airline, stops].filter(Boolean).join(' · ');
        var when = [offer.departAt, offer.returnAt].filter(Boolean).map(function (value) { return shortDate(value); }).join(' a ');
        return '<a class="vc-voo" href="' + escapeHtml(offer.url) + '" target="_blank" rel="noopener"><span class="vc-voo-ic">' + I.plane + '</span><span class="vc-voo-tx"><b>' + escapeHtml(offer.origin) + ' → ' + escapeHtml(offer.destination) + '</b><small>' + escapeHtml(meta) + (when ? ' · ' + escapeHtml(when) : '') + '</small></span><span class="vc-voo-preco"><small>' + T.flightFrom + '</small><b>' + money(offer.price, offer.currency) + '</b></span></a>';
      }).join('');
    } else if (action === 'ATTRACTIONS' && city) {
      box.innerHTML = '<a class="vc-acao-chip" href="' + cityPage(city) + '">' + I.compass + T.exploreAttractions + I.chevron + '</a>';
    } else if (action === 'SUPPORT') {
      box.innerHTML = '<a class="vc-acao-link vc-whats" href="' + SUPPORT_WHATSAPP + '" target="_blank" rel="noopener">' + I.whats + T.callWhatsapp + '</a><a class="vc-acao-link vc-mail" href="' + SUPPORT_EMAIL + '">' + I.mail + T.sendEmail + '</a>';
    } else if (ACTION_VERTICAL[action] && city) {
      partnerRecommendations().then(function (recs) {
        var match = recs.find(function (rec) { return rec.vertical === ACTION_VERTICAL[action]; });
        if (!match) return;
        var agency = match.agencyPartner;
        var href = agency && agency.whatsappUrl ? agency.whatsappUrl : match.url;
        box.innerHTML = '<a class="vc-parceiro" href="' + escapeHtml(href) + '" target="_blank" rel="noopener"><span class="vc-voo-ic">' + (ACTION_VERTICAL[action] === 'flight' ? I.plane : ACTION_VERTICAL[action] === 'stay' ? I.pin : I.ticket) + '</span><b>' + escapeHtml(agency ? (agency.name || T.agencyPartner) : T.partner[match.vertical]) + '</b>' + I.chevron + '</a>';
        scrollDown();
      });
    } else return;
    column.appendChild(box);
  }
  var recsCache = {};
  function partnerRecommendations() {
    var city = catalog.byId[state.cityId];
    if (!city) return Promise.resolve([]);
    var params = { cityId: city.id, city: city.name, source: 'ond_app_ond_vai' };
    if (city.country) { params.country = city.country.name; params.countryIso = city.country.countryCodeIso; }
    if (city.cityIataCode) params.cityIata = city.cityIataCode;
    if (state.checkIn) { params.checkIn = state.checkIn; var out = parseDay(state.checkOut); out.setDate(out.getDate() + 1); params.checkOut = isoDay(out); }
    var key = JSON.stringify(params);
    if (!recsCache[key]) recsCache[key] = api('travel-partnerships/recommendations?' + Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&')).then(function (data) { return data || []; }).catch(function () { return []; });
    return recsCache[key];
  }

  /* ── a conversa ── */
  function sendToBackend(message, opts) {
    opts = opts || {};
    if (busy.sending || busy.submitting) return Promise.resolve();
    if (opts.showUser !== false) addMessage(true, opts.display || message);
    busy.sending = true; state.turn = null; renderDock();
    var dots = typing();
    return fetch(API + 'send?' + query(), { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: message })
      .then(function (response) { if (!response.ok) throw new Error(response.status); return response.json(); })
      .then(function (turn) { dots.done(); busy.sending = false; handleTurn(turn); })
      .catch(function () { dots.done(); busy.sending = false; addNotice(T.error); renderDock(); });
  }

  function handleTurn(turn) {
    if (turn.appAction === 'RESTART') { resetConversation(); return; }
    if (turn.resolved) applyResolved(turn.resolved);
    if (turn.mode && turn.mode !== state.mode) state.mode = turn.mode;
    var hasName = !!(state.name || '').trim();
    if (turn.complete && !hasName) {
      addMessage(false, T.nameAsk);
      state.turn = { reply: T.nameAsk, input: { type: 'TEXT', field: 'travelerName' } };
      state.freeText = false; renderDock(); renderDraft(); scrollDown(); return;
    }
    if (turn.complete && state.mode !== 'execution' && state.cityId && state.checkIn) { renderDraft(); finalize(); return; }
    addMessage(false, turn.reply, { audioUrl: turn.audioUrl, action: turn.appAction, offers: turn.flightOffers || [] });
    state.turn = turn; state.freeText = false;
    renderDock(); renderDraft(); scrollDown();
    if (turn.audioUrl && opts_autoplay) playAudio(list.querySelector('.vc-row:last-child .vc-audio-play'));
  }
  var opts_autoplay = false;

  function key(cityId, start) { return start ? cityId + '|' + String(start).slice(0, 10) : String(cityId); }
  function applyResolved(resolved) {
    if (resolved.destinations && resolved.destinations.length) {
      var stops = [];
      var seen = {};
      function push(cityId, checkIn, checkOut) {
        if (!cityId || !catalog.byId[cityId]) return;
        var stopKey = key(cityId, checkIn);
        if (seen[stopKey]) return; seen[stopKey] = true;
        stops.push({ cityId: cityId, checkIn: checkIn ? String(checkIn).slice(0, 10) : null, checkOut: checkOut ? String(checkOut).slice(0, 10) : null });
      }
      resolved.destinations.forEach(function (destination) {
        push(destination.cityId, destination.checkIn, destination.checkOut);
        if (destination.cityId && (destination.stays && destination.stays.length || destination.budget || destination.preferences)) {
          state.destExtras[key(destination.cityId, destination.checkIn)] = { stays: destination.stays || [], budget: destination.budget || undefined, preferences: destination.preferences || undefined };
        }
      });
      if (state.cityId) push(state.cityId, state.checkIn, state.checkOut);
      state.extras.forEach(function (extra) { push(extra.cityId, extra.checkIn, extra.checkOut); });
      var main = stops[0];
      var rest = stops.slice(1).sort(function (a, b) { return (a.checkIn || '9999').localeCompare(b.checkIn || '9999'); });
      if (main) {
        state.cityId = main.cityId;
        if (main.checkIn) { state.checkIn = main.checkIn; state.checkOut = main.checkOut; }
        state.extras = rest.filter(function (stop) { return stop.cityId !== main.cityId || stop.checkIn !== state.checkIn; });
      }
    }
    if ((resolved.travelerName || '').trim()) state.name = resolved.travelerName.trim();
    if (isEmail(resolved.travelerEmail)) state.email = resolved.travelerEmail.trim();
    if ((resolved.travelerPhone || '').trim()) state.phone = resolved.travelerPhone.trim();
    if (resolved.numberOfTravelers > 0) state.travelers = resolved.numberOfTravelers;
    if (resolved.travelers && resolved.travelers.length) {
      state.companions = resolved.travelers;
      var detailed = resolved.travelers.reduce(function (total, companion) { return total + ((companion.name || '').trim() ? 1 : (companion.count > 0 ? companion.count : 1)); }, 0) + 1;
      if (detailed > state.travelers) state.travelers = detailed;
    }
    if (resolved.interestAreaIds && resolved.interestAreaIds.length) state.interestIds = resolved.interestAreaIds.slice();
    if (resolved.tripPurpose) state.purpose = resolved.tripPurpose;
    if (resolved.observations) state.observations = resolved.observations;
    if (resolved.transportSegments && resolved.transportSegments.length) state.segments = resolved.transportSegments;
    if ((resolved.originCity || '').trim()) state.origin = resolved.originCity.trim();
  }
  function applyField(field, value) {
    value = String(value || '').trim();
    if (field === 'travelerName') state.name = value;
    else if (field === 'travelerEmail' && isEmail(value)) { state.email = value; if (state.user && state.user.email && state.user.email.toLowerCase() !== value.toLowerCase()) state.user = null; }
    else if (field === 'companionEmail' && isEmail(value)) { var companion = state.companions.find(function (item) { return (item.name || '').trim() && !item.email; }); if (companion) companion.email = value; }
    else if (field === 'travelerPhone') state.phone = value;
    else if (field === 'flightCode') state.flightCode = value;
    else if (field === 'returnFlightCode') state.returnFlightCode = value;
    else if (field === 'numberOfTravelers') state.travelers = parseInt(value.replace(/\D/g, ''), 10) || state.travelers;
    else if (field === 'tripPurpose') state.purpose = value;
    else if (field === 'observations') state.observations = value;
    else if (field === 'originCity') state.origin = value;
  }
  function applyCollected(data) {
    if (!data) return;
    state.mode = data.mode || state.mode;
    state.destExtras = data.destinationExtras || {};
    state.cityId = data.cityId && catalog.byId[data.cityId] ? data.cityId : null;
    state.checkIn = data.checkIn ? String(data.checkIn).slice(0, 10) : null;
    state.checkOut = data.checkOut ? String(data.checkOut).slice(0, 10) : null;
    state.extras = (data.extraDestinations || []).filter(function (extra) { return catalog.byId[extra.cityId]; }).map(function (extra) {
      return { cityId: extra.cityId, checkIn: extra.checkIn ? String(extra.checkIn).slice(0, 10) : null, checkOut: extra.checkOut ? String(extra.checkOut).slice(0, 10) : null };
    });
    state.interestIds = (data.interestAreaIds || []).slice();
    state.name = data.travelerName || null; state.email = data.travelerEmail || null; state.phone = data.travelerPhone || null;
    state.travelers = data.numberOfTravelers || 1; state.companions = data.travelers || [];
    state.observations = data.observations || null; state.purpose = data.tripPurpose || state.purpose; state.origin = data.originCity || null;
    state.flightCode = data.flightCode || null; state.returnFlightCode = data.returnFlightCode || null;
  }

  function handleTextSend(text) {
    text = String(text || '').trim();
    if (!text || busy.sending || busy.submitting) return;
    if (state.awaitingOtp) {
      addMessage(true, text); recordAppMessage('USER', text);
      var thenSubmit = state.otpThenSubmit;
      state.awaitingOtp = false;
      verifyOtp(text, thenSubmit);
      return;
    }
    if (state.emailUpsell) {
      if (!isEmail(text)) { toast(T.emailInvalid); return; }
      applyField('travelerEmail', text); state.emailUpsell = false;
      addMessage(true, text); finalize(); return;
    }
    var field = state.turn && state.turn.input && state.turn.input.field;
    if (field === 'travelerEmail') {
      if (isEmail(text)) { handleEmailEntry(text); return; }
      if (text.indexOf('@') >= 0) { toast(T.emailInvalid); return; }
    }
    applyField(field, text);
    sendToBackend(text);
  }
  function handleEmailEntry(email) {
    applyField('travelerEmail', email);
    addMessage(true, email);
    busy.sending = true; renderDock();
    postJson('ond-vai/otp/send', { email: email }).then(function () { return true; }).catch(function () { return false; }).then(function (exists) {
      busy.sending = false;
      if (exists) beginOtp(email, false); else sendToBackend(email, { showUser: false });
    });
  }
  function beginOtp(email, thenSubmit) {
    busy.submitting = false;
    state.otpThenSubmit = thenSubmit; state.awaitingOtp = true;
    addMessage(false, T.otpPrompt(email));
    state.turn = { reply: '', input: { type: 'TEXT', field: 'otpCode' } };
    recordAppMessage('ASSISTANT', T.otpPrompt(email), state.turn.input);
    renderDock(); scrollDown();
  }
  function verifyOtp(code, thenSubmit) {
    if (thenSubmit) busy.submitting = true; else busy.sending = true;
    renderDock();
    postJson('ond-vai/otp/verify', { email: state.email, code: code }).then(function (user) {
      busy.sending = false; busy.submitting = false;
      state.user = user || { email: state.email };
      if (user && user.name) state.name = user.name;
      if (user && user.email) state.email = user.email;
      if (thenSubmit) submitForTraveler(); else sendToBackend(state.email, { showUser: false });
    }).catch(function (error) {
      busy.sending = false; busy.submitting = false;
      if (error.status === 401) {
        state.awaitingOtp = true; state.otpThenSubmit = thenSubmit;
        addMessage(false, T.otpInvalid);
        state.turn = { reply: '', input: { type: 'TEXT', field: 'otpCode' } };
        recordAppMessage('ASSISTANT', T.otpInvalid, state.turn.input);
        renderDock(); scrollDown();
      } else { addNotice(T.error); renderDock(); }
    });
  }
  function skipIdentification() {
    addMessage(true, T.skipToPreview); addMessage(false, T.previewOnly);
    recordAppMessage('USER', T.skipToPreview); recordAppMessage('ASSISTANT', T.previewOnly);
    state.turn = null; scrollDown(); finalize();
  }

  /* ── fechar a viagem: consentimento, conta e geração ── */
  function promptMissing(type, reply) {
    busy.submitting = false; state.emailUpsell = false; state.awaitingOtp = false;
    if (reply) { addMessage(false, reply); recordAppMessage('ASSISTANT', reply, { type: type }); }
    state.turn = { reply: reply || '', input: { type: type } };
    renderDock(); scrollDown();
  }
  function finalize() {
    if (busy.submitting) return;
    if (!state.cityId) { promptMissing('DESTINATION', T.destinationSubtitle); return; }
    if (!state.checkIn) { promptMissing('DATE_RANGE', null); return; }
    if (state.mode !== 'execution' && state.mode !== 'pre_budget' && prontoVistoPara !== state.cityId && window.OndModelos) {
      prontoVistoPara = state.cityId;
      return carregarProntos(function () { var tpl = acharPronto(); if (tpl) oferecerPronto(tpl); else finalize(); });
    }
    if (window.OndPlano && !window.OndPlano.pode('vai')) { if (window.OndPlano.plus()) toast('Os ' + window.OndPlano.limite('vai') + ' roteiros do mês já foram usados. A cota volta no dia 1.'); else window.OndPlano.pedir('vai'); return; }
    confirmConsent().then(function (accepted) {
      if (!accepted) { renderDock(); return; }
      if (window.OndPlano && state.mode !== 'execution') window.OndPlano.usar('vai');
      if (state.mode === 'pre_budget') finalizePreBudget();
      else if (state.mode === 'execution') renderDock();
      else if (state.user) submitForTraveler();
      else if (isEmail(state.email)) finalizeWithUser();
      else finalizeAnonymous();
    });
  }
  /* roteiro pronto antes de gerar: não gasta IA nem a cota do mês */
  var prontoVistoPara = null;
  function carregarProntos(done) {
    if (window.OND_PRONTOS) return done();
    var script = document.createElement('script'); script.src = '/assets/roteiros-prontos.js';
    script.onload = script.onerror = function () { done(); };
    document.head.appendChild(script);
  }
  function acharPronto() {
    var nomes = [state.cityId].concat(state.extras.map(function (extra) { return extra.cityId; })).map(function (cid) { var city = catalog.byId[cid]; return city ? city.name : ''; });
    return window.OndModelos.acharPara(nomes);
  }
  function oferecerPronto(tpl) {
    var city = catalog.byId[state.cityId], total = tpl.stops.reduce(function (sum, stop) { return sum + stop.nights; }, 0) + 1;
    var modal = openModal('<h3>Já tem roteiro pronto para ' + escapeHtml(city ? city.name : tpl.title) + '</h3>' +
      '<p class="vc-modal-p">Começar por ele não gasta seus roteiros do mês. Depois você muda o que quiser.</p>' +
      '<div class="vc-pronto">' + (tpl.cover ? '<img src="' + escapeHtml(tpl.cover) + '" alt="">' : '') + '<span><b>' + escapeHtml(tpl.title) + '</b><small>' + (tpl.autor ? 'Por ' + escapeHtml(tpl.autor) + ' · ' : '') + total + ' dias · ' + tpl.stops.map(function (stop) { return escapeHtml(stop.city); }).join(' · ') + '</small></span></div>' +
      '<div class="vc-modal-acoes"><button type="button" class="vc-btn vc-btn-sec" data-r="vai">Gerar outro</button><button type="button" class="vc-btn" data-r="pronto">Usar o pronto</button></div>', function () { renderDock(); });
    modal.el.addEventListener('click', function (event) {
      var choice = event.target.closest('[data-r]'); if (!choice) return;
      modal.close();
      if (choice.dataset.r === 'pronto') { location.href = '/explorar/viagens/nova/?pronto=' + encodeURIComponent(tpl.id) + (state.checkIn ? '&ida=' + state.checkIn : ''); return; }
      finalize();
    });
  }
  function hasConsent() { try { return localStorage.getItem('ond-vai-consentimento-agencia') === 'sim'; } catch (error) { return false; } }
  function confirmConsent() {
    if (hasConsent()) return Promise.resolve(true);
    var what = state.mode === 'pre_budget' ? T.estimate : T.itinerary;
    var needContact = !isEmail(state.email) && !(state.phone || '').trim();
    recordAppMessage('ASSISTANT', T.consentBody(what));
    return new Promise(function (resolve) {
      var modal = openModal('<h3>' + T.consentTitle + '</h3><p class="vc-modal-p">' + escapeHtml(T.consentBody(what)) + '</p>' +
        (needContact ? '<label class="vc-campo"><span>E-mail</span><input type="email" class="vc-consent-email" placeholder="' + T.emailHint + '" autocomplete="email"></label><label class="vc-campo"><span>WhatsApp</span><input type="tel" class="vc-consent-phone" placeholder="' + T.phoneHint + '" autocomplete="tel"></label>' : '') +
        '<div class="vc-modal-acoes"><button type="button" class="vc-btn vc-btn-sec" data-r="nao">' + T.consentDecline + '</button><button type="button" class="vc-btn" data-r="sim">' + T.consentAccept + '</button></div>', function () { done(false); });
      function done(accepted) {
        if (modal.closed) return; modal.close();
        if (accepted && needContact) {
          var email = modal.el.querySelector('.vc-consent-email').value.trim(), phone = normalizePhone(modal.el.querySelector('.vc-consent-phone').value);
          if (isEmail(email)) state.email = email;
          if (phone) state.phone = phone;
        }
        postJson('ond-vai/experiment-consent?deviceId=' + encodeURIComponent(deviceId()) + '&variant=AGENCY&accepted=' + accepted, null).catch(function () {});
        if (accepted) {
          recordAppMessage('USER', T.consentAccept);
          try { localStorage.setItem('ond-vai-consentimento-agencia', 'sim'); } catch (error) {}
          state.consentDeclined = false;
        } else {
          recordAppMessage('USER', T.consentDecline); recordAppMessage('ASSISTANT', T.consentLocked(what));
          state.consentDeclined = true;
        }
        resolve(accepted);
      }
      modal.el.querySelector('[data-r="sim"]').addEventListener('click', function () { done(true); });
      modal.el.querySelector('[data-r="nao"]').addEventListener('click', function () { done(false); });
    });
  }
  function sendLead() {
    return postJson('leads', { deviceId: deviceId(), fcmToken: null, language: (window.OndIdioma ? window.OndIdioma.atual : 'pt'), country: 'BR', platform: 'web' }).then(function (lead) {
      if (lead && lead.id) { state.leadId = lead.id; state.anonCount = lead.anonymousTravelRequestCount || 0; }
    }).catch(function () {});
  }
  function buildDestinations() {
    var stops = [{ cityId: state.cityId, checkIn: state.checkIn, checkOut: state.checkOut }].concat(state.extras.filter(function (extra) { return extra.checkIn; }));
    return stops.map(function (stop) {
      var city = catalog.byId[stop.cityId] || {}, country = city.country || {};
      var extras = state.destExtras[key(stop.cityId, stop.checkIn)] || state.destExtras[String(stop.cityId)] || {};
      return { address: { country: country.name, city: city.name, countryFlagUrl: country.image, countryCodeIso: country.countryCodeIso || country.name, cityId: city.id },
        departureDate: stop.checkIn, returnDate: stop.checkOut, stays: extras.stays || [] };
    }).sort(function (a, b) { return a.departureDate.localeCompare(b.departureDate); });
  }
  function buildSegments(destinations) {
    var segments = (state.segments || []).slice();
    if (state.flightCode) segments.push({ type: 'flight', flightCode: state.flightCode, departureDateTime: state.checkIn + 'T00:00:00.000', originCountryCode: 'BR' });
    if (state.returnFlightCode && destinations.length) segments.push({ type: 'flight', flightCode: state.returnFlightCode, departureDateTime: destinations[destinations.length - 1].returnDate + 'T00:00:00.000', originCountryCode: 'BR' });
    return segments;
  }
  function buildPayload(travelers, extra) {
    var destinations = buildDestinations();
    var payload = {
      tripPurpose: state.purpose, observations: state.observations, countryOfOrigin: 'BR', originCurrency: 'BRL',
      destinations: destinations, travelers: travelers, travelPlans: [], currentTripItinerary: null, fcmToken: null,
      interestAreas: state.interestIds.map(function (id) {
        var area = catalog.areas.find(function (item) { return item.id === id; }) || { id: id };
        return { interestAreaId: id, interestArea: { id: id, category: area.category, priority: area.priority, enabled: true, displayName: area.translations ? areaLabel(area) : null }, priority: area.priority };
      }),
      language: (window.OndIdioma ? window.OndIdioma.atual : 'pt'), submittedVia: 'FLUTTER_WEB', deviceId: deviceId(),
      departureDate: destinations[0].departureDate, returnDate: destinations[destinations.length - 1].returnDate,
      numberOfTravelers: state.travelers
    };
    if (state.origin) payload.originCity = state.origin;
    var segments = buildSegments(destinations);
    if (segments.length) payload.transportSegments = segments;
    for (var name in extra || {}) payload[name] = extra[name];
    return payload;
  }
  function buildTravelers(main) {
    var travelers = [main];
    state.companions.forEach(function (companion) {
      var named = (companion.name || '').trim();
      var slots = named ? 1 : (companion.count > 0 ? companion.count : 1);
      for (var slot = 0; slot < slots; slot++) travelers.push(named ? { name: companion.name, email: companion.email || undefined, type: 'GUEST' } : { name: companion.category || 'Convidado', type: 'GUEST' });
    });
    while (travelers.length < state.travelers) travelers.push({ name: 'Convidado', type: 'GUEST' });
    return travelers;
  }
  var submitting = null;
  function startSubmitting(phrases) { busy.submitting = true; renderDock(); submitting = typing(phrases); }
  function stopSubmitting() { busy.submitting = false; if (submitting) submitting.done(); submitting = null; renderDock(); }
  function submitError(error) {
    stopSubmitting();
    addNotice(error && error.status === 429 ? T.limit : T.error);
  }
  function finalizeWithUser() {
    startSubmitting(T.building);
    postJson('ond-vai/otp/send', { email: state.email }).then(function () { return true; }).catch(function () { return false; }).then(function (exists) {
      if (exists) { stopSubmitting(); beginOtp(state.email, true); return; }
      return postJson('users?lang=' + (window.OndIdioma ? window.OndIdioma.atual : 'pt') + '&platform=web' + (state.purpose ? '&travelMoment=' + encodeURIComponent(state.purpose) : ''), {
        user: { name: state.name, email: state.email, avatarUrl: null, authProvider: 'INTERNAL' },
        name: state.name, email: state.email, phoneNumber: state.phone, deviceId: deviceId(), type: 'MAIN'
      }).then(function (synced) {
        if (synced && synced.userAlreadyExists) { stopSubmitting(); return postJson('ond-vai/otp/send', { email: state.email }).then(function () { beginOtp(state.email, true); }); }
        state.user = synced || { email: state.email };
        stopSubmitting(); submitForTraveler();
      });
    }).catch(submitError);
  }
  function submitForTraveler() {
    startSubmitting(T.building);
    var main = { name: state.user && state.user.name || state.name, email: state.user && state.user.email || state.email, type: 'MAIN' };
    var payload = buildPayload(buildTravelers(main), { submitterType: 'TRAVELER', submitterEmail: main.email });
    postJson('travel/submit', payload).then(function (tripId) { stopSubmitting(); showProcessing(tripId); }).catch(submitError);
  }
  function finalizeAnonymous() {
    startSubmitting(T.building);
    (state.leadId ? Promise.resolve() : sendLead()).then(function () {
      if (!state.leadId) throw new Error('sem lead');
      if (state.anonCount >= MAX_ANON_DEMOS) {
        stopSubmitting();
        state.emailUpsell = true;
        addMessage(false, T.anonymousQuota);
        state.turn = { reply: '', input: { type: 'TEXT', field: 'travelerEmail' } };
        recordAppMessage('ASSISTANT', T.anonymousQuota, state.turn.input);
        renderDock(); scrollDown(); return;
      }
      return postJson('travel/submit', buildPayload([], { leadId: state.leadId })).then(function (tripId) { state.anonCount++; stopSubmitting(); showProcessing(tripId); });
    }).catch(submitError);
  }
  function finalizePreBudget() {
    startSubmitting(T.estimating);
    var main = { name: state.name, email: state.email, type: 'MAIN' };
    var payload = buildPayload(buildTravelers(main), { submitterType: 'TRAVELER', submitterEmail: state.email });
    api('travel/pre-budget?deviceId=' + encodeURIComponent(deviceId()), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (result) {
      stopSubmitting();
      if (!result) { addNotice(T.error); return; }
      showEstimate(result);
    }).catch(submitError);
  }
  function showEstimate(result) {
    var city = catalog.byId[state.cityId];
    var row = document.createElement('div');
    row.className = 'vc-row vc-vai';
    var items = (result.items || []).map(function (item) { return '<li><span>' + escapeHtml(item.title || item.category || '') + (item.description ? '<small>' + escapeHtml(item.description) + '</small>' : '') + '</span><b>' + (item.amount != null ? money(item.amount, item.currency || result.currency) : '') + '</b></li>'; }).join('');
    row.innerHTML = '<span class="vc-avatar">' + I.star + '</span><div class="vc-col"><div class="vc-card vc-estimativa"><small>' + escapeHtml(city ? cityLabel(city) : '') + '</small><b class="vc-total">' + (result.total != null ? money(result.total, result.currency) : '') + '</b>' +
      (items ? '<ul>' + items + '</ul>' : '') +
      '<div class="vc-card-acoes">' + (result.reportUrl ? '<a class="vc-btn vc-btn-sec" href="' + escapeHtml(result.reportUrl) + '" target="_blank" rel="noopener">' + I.doc + 'PDF</a>' : '') + '<button type="button" class="vc-btn vc-roteiro-completo">' + T.wantFullItinerary + '</button></div></div></div>';
    list.appendChild(row);
    row.querySelector('.vc-roteiro-completo').addEventListener('click', function () { state.mode = 'itinerary'; sendToBackend(T.wantFullItinerary); });
    scrollDown();
  }
  function showProcessing(tripId) {
    var city = catalog.byId[state.cityId];
    var row = document.createElement('div');
    row.className = 'vc-row vc-vai';
    row.innerHTML = '<span class="vc-avatar">' + I.star + '</span><div class="vc-col"><div class="vc-card vc-criando">' +
      (city && city.image ? '<img src="' + escapeHtml(city.image) + '" alt="">' : '') +
      '<div class="vc-criando-tx"><span class="vc-criando-anel" aria-hidden="true"></span><b>' + T.processingTitle + '</b><p>' + T.processingBody + '</p>' +
      '<p class="vc-criando-meta">' + escapeHtml(city ? cityLabel(city) : '') + (state.checkIn ? ' · ' + shortDate(state.checkIn) + ' a ' + shortDate(state.checkOut) : '') + '</p>' +
      '<a class="vc-btn" href="' + WEB_APP + '" target="_blank" rel="noopener">Acompanhar no app</a></div></div></div>';
    list.appendChild(row);
    state.turn = null; renderDock(); scrollDown();
    void tripId;
  }

  /* ── anexos: lote lido pelo backend, andamento no Firestore (o mesmo que o app observa) ── */
  function firestoreValue(value) {
    if (!value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('nullValue' in value) return null;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(firestoreValue);
    if ('mapValue' in value) return firestoreMap(value.mapValue.fields || {});
    return null;
  }
  function firestoreMap(fields) { var out = {}; for (var name in fields) out[name] = firestoreValue(fields[name]); return out; }
  function settledCount(batch) { return (batch.documents || []).filter(function (doc) { return doc.status === 'READ' || doc.status === 'FAILED'; }).length; }
  function pickDocuments() {
    if (busy.sending || busy.reading) return;
    var input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = Object.keys(DOC_TYPES).map(function (ext) { return '.' + ext; }).join(',');
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      if (files.length > MAX_DOCS) { toast(T.docsLimit); return; }
      for (var index = 0; index < files.length; index++) {
        var ext = files[index].name.split('.').pop().toLowerCase();
        if (!DOC_TYPES[ext]) { toast(T.docsUnsupported); return; }
        if (files[index].size > MAX_DOC_BYTES) { toast(T.docsTooLarge); return; }
      }
      sendDocuments(files);
    });
    input.click();
  }
  function sendDocuments(files) {
    busy.reading = true; renderDock();
    addMessage(true, '', { docs: files.map(function (file) { return file.name; }) });
    var reading = typing(T.docsReading);
    reading.progress(T.docsProgress(0, files.length));
    var form = new FormData();
    files.forEach(function (file) { var ext = file.name.split('.').pop().toLowerCase(); form.append('files', new Blob([file], { type: DOC_TYPES[ext] }), file.name); });
    fetch(API + 'documents?' + query(), { method: 'POST', body: form }).then(function (response) {
      if (response.status !== 200 && response.status !== 202) { var error = new Error(response.status); error.status = response.status; throw error; }
      return response.json();
    }).then(function (batch) {
      if (batch.settledAll || batch.settled) return batch;
      var started = Date.now();
      return new Promise(function (resolve) {
        (function poll() {
          if (Date.now() - started > 4 * 60000) { resolve(null); return; }
          fetch(FIRESTORE + encodeURIComponent(batch.batchId)).then(function (response) { return response.ok ? response.json() : null; }).then(function (doc) {
            var data = doc && doc.fields ? firestoreMap(doc.fields) : null;
            if (data) reading.progress(T.docsProgress(settledCount(data), (data.documents || []).length || files.length));
            if (data && (data.settledAll || data.settled)) resolve(data); else setTimeout(poll, 2500);
          }).catch(function () { setTimeout(poll, 4000); });
        })();
      });
    }).then(function (batch) {
      reading.done(); busy.reading = false;
      if (!batch || !batch.turn) { addNotice(T.docsFailed); renderDock(); return; }
      handleTurn(batch.turn);
    }).catch(function (error) {
      reading.done(); busy.reading = false;
      addNotice(error.status === 413 ? T.docsTooLarge : error.status === 409 || error.status === 429 ? T.docsConversationLimit : T.docsFailed);
      renderDock();
    });
  }

  /* ── áudio: grava no navegador e manda pro mesmo endpoint do app ── */
  function audioMime() {
    var options = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
    for (var index = 0; index < options.length; index++) if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(options[index])) return options[index];
    return '';
  }
  function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Seu navegador não grava áudio. Escreva sua mensagem.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recordStream = stream; recordChunks = [];
      var mime = audioMime();
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : undefined);
      recorder.addEventListener('dataavailable', function (event) { if (event.data && event.data.size) recordChunks.push(event.data); });
      recorder.start(250);
      recordSeconds = 0; recordPaused = false;
      recordTimer = setInterval(function () { if (!recordPaused) { recordSeconds++; var el = dock.querySelector('.vc-rec-t'); if (el) el.textContent = Math.floor(recordSeconds / 60) + ':' + pad(recordSeconds % 60); } }, 1000);
      renderDock();
    }).catch(function () { toast('Não consegui acessar o microfone. Confira a permissão do navegador.'); });
  }
  function stopRecording(send) {
    clearInterval(recordTimer);
    if (!recorder) return;
    var current = recorder; recorder = null;
    current.addEventListener('stop', function () {
      if (recordStream) recordStream.getTracks().forEach(function (track) { track.stop(); });
      if (send && recordChunks.length) sendAudio(new Blob(recordChunks, { type: current.mimeType || 'audio/webm' }));
      else renderDock();
    });
    current.stop();
    renderDock();
  }
  function sendAudio(blob) {
    busy.sending = true; renderDock();
    var dots = typing();
    var mp4 = /mp4/.test(blob.type);
    var form = new FormData();
    form.append('file', blob, 'ond_vai_' + Date.now() + (mp4 ? '.m4a' : '.webm'));
    fetch(API + 'send/audio?' + query(), { method: 'POST', body: form }).then(function (response) { if (!response.ok) throw new Error(response.status); return response.json(); }).then(function (turn) {
      dots.done(); busy.sending = false;
      if (turn.transcript || turn.userAudioUrl) addMessage(true, turn.transcript || '', { audioUrl: turn.userAudioUrl });
      handleTurn(turn);
    }).catch(function () { dots.done(); busy.sending = false; addNotice(T.error); renderDock(); });
  }
  var currentAudio = null;
  function playAudio(button) {
    if (!button) return;
    var player = button.closest('.vc-audio');
    if (currentAudio && currentAudio.button === button) { if (currentAudio.audio.paused) currentAudio.audio.play(); else currentAudio.audio.pause(); return; }
    if (currentAudio) { currentAudio.audio.pause(); currentAudio.button.innerHTML = I.play; }
    var audio = new Audio(button.dataset.audio);
    currentAudio = { audio: audio, button: button };
    audio.addEventListener('play', function () { button.innerHTML = I.pause; player.classList.add('tocando'); });
    audio.addEventListener('pause', function () { button.innerHTML = I.play; player.classList.remove('tocando'); });
    audio.addEventListener('timeupdate', function () {
      var bar = player.querySelector('.vc-audio-bar i'); if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
      var time = player.querySelector('.vc-audio-t'); if (time) time.textContent = Math.floor(audio.currentTime / 60) + ':' + pad(Math.floor(audio.currentTime % 60));
    });
    audio.play().catch(function () {});
  }

  /* ── área de resposta (o que o vAI espera agora) ── */
  function isGuided(turn) { var type = turn && turn.input && turn.input.type; return type === 'DESTINATION' || type === 'DATE_RANGE' || type === 'INTEREST_AREAS' || type === 'OPTIONS'; }
  function textForm(opts) {
    opts = opts || {};
    var voice = opts.voice !== false;
    return '<form class="vc-form"><button type="button" class="vc-icone vc-anexo" aria-label="' + T.attach + '" title="' + T.attach + '">' + I.clip + '</button>' +
      '<textarea rows="1" placeholder="' + escapeHtml(opts.hint || T.inputHint) + '" aria-label="Mensagem para o OND vAI"' + (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') + (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') + '></textarea>' +
      (voice ? '<button type="button" class="vc-icone vc-mic" aria-label="Gravar áudio">' + I.mic + '</button>' : '') +
      '<button type="submit" class="vc-send" aria-label="Enviar"' + (voice ? ' hidden' : ' disabled') + '>' + I.send + '</button></form>';
  }
  /* quantos roteiros o vAI ainda pode gerar no mês: 1 no Free, 10 no Premium, 30 no Plus */
  function cotaVai() {
    var P = window.OndPlano; if (!P || !(window.ondTemConta && window.ondTemConta())) return '';
    if (P.premium()) { var restaP = Math.max(0, P.limite('vai') - P.usado('vai')); return '<p class="vc-cota premium' + (restaP ? '' : ' fim') + '">' + I.star + '<span>' + (restaP ? restaP + ' de ' + P.limite('vai') + ' roteiros disponíveis este mês' : 'Os ' + P.limite('vai') + ' roteiros do mês já foram usados') + '</span>' + (restaP || P.plus() ? '' : '<button type="button" data-do="ver-premium">Ver o Plus</button>') + '</p>'; }
    var resta = Math.max(0, P.limite('vai') - P.usado('vai'));
    return '<p class="vc-cota' + (resta ? '' : ' fim') + '">' + I.star + '<span>' + (resta ? resta + ' de ' + P.limite('vai') + (P.limite('vai') === 1 ? ' roteiro grátis' : ' roteiros grátis') + ' disponível este mês' : 'Roteiro do mês já usado') + '</span>' + (resta ? '' : '<button type="button" data-do="ver-premium">Ver Premium</button>') + '</p>';
  }
  function bigButton(label, action, icon) { return '<button type="button" class="vc-grande" data-do="' + action + '">' + (icon || '') + label + '</button>'; }
  function keyboardToggle() { return '<button type="button" class="vc-teclado" data-do="teclado" aria-label="Escrever em vez de escolher" title="Escrever">' + I.keyboard + '</button>'; }
  function skipLink(label, action) { return '<button type="button" class="vc-pular" data-do="' + action + '">' + label + '</button>'; }
  function generateLabel() {
    if (state.mode === 'pre_budget') return T.generate.estimate;
    var moment = String(state.purpose || '').trim().toLowerCase();
    if (moment === 'sonho' || moment === 'dream') return T.generate.dream;
    if (moment === 'planejamento' || moment === 'plan') return T.generate.plan;
    if (moment === 'execução' || moment === 'execucao' || moment === 'execute') return T.generate.execute;
    return T.generate.fallback;
  }
  function dateSuggestionTitle(suggestion) {
    if (suggestion.kind === 'LONG_HOLIDAY') return suggestion.holidayName ? T.holiday(suggestion.holidayName) : null;
    if (suggestion.kind === 'HINTED_MONTH') return suggestion.startDate ? T.inMonth(parseDay(suggestion.startDate).toLocaleDateString('pt-BR', { month: 'long' })) : null;
    if (suggestion.kind === 'AFTER_PREVIOUS_STOP') return suggestion.afterCityName ? T.afterCity(suggestion.afterCityName) : null;
    return T.suggestion[suggestion.kind] || null;
  }
  function renderDock() {
    try { document.dispatchEvent(new CustomEvent('ond-vai-estado', { detail: { conversa: !!state.messages } })); } catch (error) {}
    renderDraftBar();
    if (!dock) return;
    var turn = state.turn, html = '', type = turn && turn.input && turn.input.type, field = turn && turn.input && turn.input.field;
    var isBusy = busy.sending || busy.submitting || busy.reading;
    if (recorder) {
      html = '<div class="vc-rec"><button type="button" class="vc-icone" data-do="rec-descartar" aria-label="Descartar áudio">' + I.trash + '</button><span class="vc-rec-dot' + (recordPaused ? ' pausado' : '') + '"></span><span class="vc-rec-label">' + (recordPaused ? T.paused : T.recording) + '</span><span class="vc-rec-t">' + Math.floor(recordSeconds / 60) + ':' + pad(recordSeconds % 60) + '</span><span class="vc-rec-onda" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
        '<button type="button" class="vc-icone" data-do="rec-pausa" aria-label="' + (recordPaused ? 'Continuar gravando' : 'Pausar') + '">' + (recordPaused ? I.mic : I.pause) + '</button><button type="button" class="vc-send" data-do="rec-enviar" aria-label="Enviar áudio">' + I.send + '</button></div>';
    } else if (isBusy) {
      html = '<div class="vc-form vc-form-off">' + escapeHtml(T.inputHint) + '</div>';
    } else if (state.consentDeclined) {
      var what = state.mode === 'pre_budget' ? T.estimate : T.itinerary;
      html = '<p class="vc-aviso">' + escapeHtml(T.consentLocked(what)) + '</p>' + bigButton(T.consentRetry, 'finalizar');
    } else if (!turn) {
      html = state.messages && state.mode !== 'execution' ? bigButton(generateLabel(), 'finalizar', I.sparkle) + cotaVai() + textForm() : textForm();
    } else if (state.freeText && isGuided(turn)) {
      html = textForm();
    } else if (type === 'DESTINATION') {
      html = '<div class="vc-linha">' + bigButton(T.chooseDestination, 'destino', I.pin) + keyboardToggle() + '</div>';
    } else if (type === 'DATE_RANGE') {
      var suggestions = (turn.input.dateSuggestions || []).map(function (suggestion, index) {
        var title = dateSuggestionTitle(suggestion); if (!title) return '';
        var period = suggestion.startDate && suggestion.endDate ? T.period(shortDate(suggestion.startDate), shortDate(suggestion.endDate)) : '';
        return '<button type="button" class="vc-sugdata" data-sug="' + index + '"><b>' + escapeHtml(title) + '</b>' + (period ? '<small>' + escapeHtml(period) + '</small>' : '') + '</button>';
      }).join('');
      html = suggestions ? '<div class="vc-choices vc-datas">' + suggestions + '<button type="button" class="vc-sugdata vc-sugdata-cal" data-do="datas">' + I.cal + '<b>' + T.chooseDates + '</b></button></div>' + textForm()
        : '<div class="vc-linha">' + bigButton(T.chooseDates, 'datas', I.cal) + keyboardToggle() + '</div>';
    } else if (type === 'INTEREST_AREAS') {
      html = '<div class="vc-linha">' + bigButton(T.chooseInterests, 'interesses', I.sparkle) + keyboardToggle() + '</div>';
    } else if (type === 'OPTIONS') {
      html = '<div class="vc-choices">' + (turn.input.choices || []).map(function (choice, index) { return '<button type="button" class="vc-chip" data-opcao="' + index + '">' + escapeHtml(choice.label) + '</button>'; }).join('') + keyboardToggle() + '</div>';
    } else if (field === 'travelerEmail' || state.emailUpsell) {
      html = '<div class="vc-choices vc-dominios">' + EMAIL_DOMAINS.map(function (domain) { return '<button type="button" class="vc-chip vc-chip-sm" data-dominio="' + domain + '">@' + domain + '</button>'; }).join('') + '</div>' +
        textForm({ hint: T.emailHint, voice: false, inputmode: 'email', autocomplete: 'email' }) + (state.emailUpsell ? '' : skipLink(T.skipToPreview, 'previa'));
    } else if (field === 'travelerName') {
      html = textForm({ voice: false, autocomplete: 'name' });
    } else if (field === 'travelerPhone') {
      html = '<form class="vc-form vc-form-tel"><span class="vc-ddi">+55</span><input type="tel" inputmode="tel" autocomplete="tel-national" placeholder="' + T.phoneHint + '" aria-label="' + T.phoneHint + '"><button type="submit" class="vc-send" aria-label="Enviar">' + I.send + '</button></form>' + skipLink(T.phoneSkip, 'pular-tel');
    } else if (field === 'flightCode' || field === 'returnFlightCode') {
      html = textForm({ hint: T.flightHint, voice: false }) + skipLink(T.flightSkip, 'pular-voo');
    } else if (field === 'otpCode') {
      html = '<div class="vc-otp" role="group" aria-label="Código de 6 números">' + [0, 1, 2, 3, 4, 5].map(function (index) { return '<input inputmode="numeric" maxlength="1" autocomplete="' + (index ? 'off' : 'one-time-code') + '" aria-label="Número ' + (index + 1) + '">'; }).join('') + '</div>' + skipLink(T.back, 'otp-voltar');
    } else {
      html = textForm();
    }
    dock.innerHTML = html;
    wireDock();
    renderDraftBar();
  }
  function wireDock() {
    var form = dock.querySelector('form.vc-form');
    if (form && !form.classList.contains('vc-form-tel')) {
      var area = form.querySelector('textarea'), sendBtn = form.querySelector('.vc-send'), mic = form.querySelector('.vc-mic');
      var update = function () {
        area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 160) + 'px'; area.style.overflowY = area.scrollHeight > 160 ? 'auto' : 'hidden';
        var has = !!area.value.trim();
        if (mic) { mic.hidden = has; sendBtn.hidden = !has; } else sendBtn.disabled = !has;
      };
      area.addEventListener('input', update);
      /* a caixa cresce em vez de rolar: mede ao abrir e quando a largura muda */
      requestAnimationFrame(update); window.addEventListener('resize', function () { if (area.isConnected) update(); });
      area.addEventListener('keydown', function (event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
      form.addEventListener('submit', function (event) { event.preventDefault(); var text = area.value; if (!text.trim()) return; area.value = ''; handleTextSend(text); });
      form.querySelector('.vc-anexo').addEventListener('click', pickDocuments);
      if (mic) mic.addEventListener('click', startRecording);
      if (pendingPrefill) { area.value = pendingPrefill; pendingPrefill = ''; }
      update();
      if (root.classList.contains('vc-ativo')) area.focus({ preventScroll: true });
    }
    var tel = dock.querySelector('.vc-form-tel');
    if (tel) tel.addEventListener('submit', function (event) {
      event.preventDefault();
      var phone = normalizePhone(tel.querySelector('input').value);
      if (!phone) { toast(T.phoneInvalid); return; }
      state.phone = phone; sendToBackend(phone);
    });
    var otp = dock.querySelector('.vc-otp');
    if (otp) {
      var boxes = Array.prototype.slice.call(otp.querySelectorAll('input'));
      var collect = function () { var code = boxes.map(function (box) { return box.value; }).join(''); if (code.length === 6) handleTextSend(code); };
      boxes.forEach(function (box, index) {
        box.addEventListener('input', function () {
          var digits = box.value.replace(/\D/g, '');
          if (digits.length > 1) { digits.split('').slice(0, 6 - index).forEach(function (digit, offset) { boxes[index + offset].value = digit; }); boxes[Math.min(5, index + digits.length - 1)].focus(); collect(); return; }
          box.value = digits;
          if (digits && boxes[index + 1]) boxes[index + 1].focus();
          collect();
        });
        box.addEventListener('keydown', function (event) { if (event.key === 'Backspace' && !box.value && boxes[index - 1]) boxes[index - 1].focus(); });
      });
      boxes[0].focus({ preventScroll: true });
    }
  }
  function normalizePhone(raw) {
    var digits = String(raw || '').replace(/\D/g, '');
    if (digits.indexOf('55') === 0 && digits.length >= 12) digits = digits.slice(2);
    if (digits.length === 10 && /[6-9]/.test(digits.charAt(2))) digits = digits.slice(0, 2) + '9' + digits.slice(2);
    if (digits.length !== 11 || digits.charAt(2) !== '9') return digits.length === 10 ? '+55' + digits : null;
    return '+55' + digits;
  }
  function onDockClick(event) {
    var target = event.target.closest('button');
    if (!target || !dock.contains(target)) return;
    var turn = state.turn;
    if (target.dataset.opcao != null) { var option = turn.input.choices[+target.dataset.opcao]; applyField(turn.input.field, option.value); sendToBackend(option.label); return; }
    if (target.dataset.dominio) { var area = dock.querySelector('textarea'); var local = area.value.split('@')[0].trim(); area.value = (local || '') + '@' + target.dataset.dominio; area.dispatchEvent(new Event('input')); if (!local) { area.focus(); area.setSelectionRange(0, 0); } else area.focus(); return; }
    if (target.dataset.sug != null) {
      var suggestion = turn.input.dateSuggestions[+target.dataset.sug];
      var title = dateSuggestionTitle(suggestion);
      if (!suggestion.startDate || !suggestion.endDate) { sendToBackend(title); return; }
      submitDates(String(suggestion.startDate).slice(0, 10), String(suggestion.endDate).slice(0, 10), title + ' (' + T.period(shortDate(suggestion.startDate), shortDate(suggestion.endDate)) + ')');
      return;
    }
    var action = target.dataset.do;
    if (action === 'teclado') { state.freeText = true; renderDock(); var field = dock.querySelector('textarea'); if (field) field.focus(); }
    else if (action === 'destino') pickDestination();
    else if (action === 'datas') pickDates();
    else if (action === 'interesses') pickInterests();
    else if (action === 'finalizar') finalize();
    else if (action === 'ver-premium') { if (window.OndPlano) window.OndPlano.pedir('vai'); }
    else if (action === 'recomecar') confirmRestart();
    else if (action === 'previa') skipIdentification();
    else if (action === 'pular-tel') sendToBackend(T.phoneSkipMessage);
    else if (action === 'pular-voo') sendToBackend(T.flightSkipMessage);
    else if (action === 'otp-voltar') { state.awaitingOtp = false; state.otpThenSubmit = false; state.turn = { reply: '', input: { type: 'TEXT' } }; renderDock(); }
    else if (action === 'rec-descartar') stopRecording(false);
    else if (action === 'rec-enviar') stopRecording(true);
    else if (action === 'rec-pausa' && recorder) { if (recordPaused) recorder.resume(); else recorder.pause(); recordPaused = !recordPaused; renderDock(); }
  }

  /* ── janelas: destino, datas, interesses, recomeçar ── */
  function openModal(html, onDismiss, extraClass) {
    var overlay = document.createElement('div');
    overlay.className = 'vc-modal-fundo';
    overlay.innerHTML = '<div class="vc-modal ' + (extraClass || '') + '" role="dialog" aria-modal="true"><button type="button" class="vc-modal-x" aria-label="Fechar">' + I.close + '</button>' + html + '</div>';
    root.appendChild(overlay);
    var api = { el: overlay, closed: false, close: function () { if (api.closed) return; api.closed = true; overlay.classList.add('saindo'); setTimeout(function () { overlay.remove(); }, 220); document.removeEventListener('keydown', onKey); } };
    function onKey(event) { if (event.key === 'Escape') { api.close(); if (onDismiss) onDismiss(); } }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (event) { if (event.target === overlay || event.target.closest('.vc-modal-x')) { api.close(); if (onDismiss) onDismiss(); } });
    return api;
  }
  function pickDestination() {
    loadCatalog().then(function () {
      var additional = !!state.cityId;
      var chosen = [state.cityId].concat(state.extras.map(function (extra) { return extra.cityId; }));
      var base = additional ? catalog.cities.filter(function (city) { return chosen.indexOf(city.id) < 0; }) : catalog.cities;
      var countryCode = String(state.turn && state.turn.input && state.turn.input.countryCode || '').trim().toUpperCase();
      if (countryCode) { var filtered = base.filter(function (city) { return city.country && String(city.country.countryCodeIso || '').toUpperCase() === countryCode; }); if (filtered.length) base = filtered; }
      var modal = openModal('<h3>' + T.destinationTitle + '</h3><p class="vc-modal-p">' + (additional ? T.addStopSubtitle : T.destinationSubtitle) + '</p>' +
        '<label class="vc-busca">' + I.search + '<input type="search" placeholder="' + T.searchHint + '" aria-label="' + T.searchHint + '" autocomplete="off"></label><div class="vc-cidades" role="listbox"></div>', null, 'vc-modal-alto');
      var field = modal.el.querySelector('input'), box = modal.el.querySelector('.vc-cidades');
      var norm = function (text) { return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
      var draw = function () {
        var term = norm(field.value.trim());
        var found = base.filter(function (city) { return !term || norm(city.name).indexOf(term) >= 0 || norm(city.country && city.country.name).indexOf(term) >= 0; }).slice(0, 80);
        box.innerHTML = found.length ? found.map(function (city) {
          return '<button type="button" class="vc-cidade" role="option" data-id="' + city.id + '">' + (city.image ? '<img src="' + escapeHtml(city.image) + '" alt="" loading="lazy">' : '<span class="vc-cidade-ph">' + I.pin + '</span>') + '<span><b>' + escapeHtml(city.name) + '</b><small>' + flag(city.country, 16) + escapeHtml(city.country ? city.country.name : '') + '</small></span>' + I.chevron + '</button>';
        }).join('') : '<p class="vc-vazio-lista">' + T.destinationEmpty + '</p>';
      };
      field.addEventListener('input', draw);
      box.addEventListener('click', function (event) {
        var button = event.target.closest('.vc-cidade'); if (!button) return;
        var city = catalog.byId[+button.dataset.id];
        modal.close();
        if (additional) state.extras.push({ cityId: city.id, checkIn: null, checkOut: null }); else state.cityId = city.id;
        renderDraft();
        sendToBackend(cityLabel(city));
      });
      draw();
      setTimeout(function () { field.focus(); }, 60);
    });
  }
  function submitDates(start, end, display) {
    if (!state.checkIn) { state.checkIn = start; state.checkOut = end; }
    else { var pending = state.extras.find(function (extra) { return !extra.checkIn; }); if (pending) { pending.checkIn = start; pending.checkOut = end; } }
    renderDraft();
    sendToBackend(brDate(start) + ' - ' + brDate(end), { display: display });
  }
  function pickDates() {
    var hint = String(state.turn && state.turn.input && state.turn.input.dateHint || '');
    var today = new Date(); today.setHours(12, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    var match = /^(\d{4})-(\d{2})/.exec(hint);
    if (match) { var hinted = new Date(+match[1], +match[2] - 1, 1, 12); if (hinted > view) view = hinted; }
    var start = null, end = null;
    var modal = openModal('<h3>' + T.datesTitle + '</h3><div class="vc-cal-nav"><button type="button" class="vc-icone" data-nav="-1" aria-label="Mês anterior"><span style="transform:scaleX(-1);display:grid">' + I.chevron + '</span></button><span class="vc-gap"></span><button type="button" class="vc-icone" data-nav="1" aria-label="Próximo mês">' + I.chevron + '</button></div><div class="vc-cal"></div><p class="vc-cal-resumo"></p><div class="vc-modal-acoes"><button type="button" class="vc-btn vc-btn-sec" data-r="cancelar">' + T.cancel + '</button><button type="button" class="vc-btn" data-r="ok" disabled>' + T.confirm + '</button></div>', null, 'vc-modal-cal');
    var cal = modal.el.querySelector('.vc-cal'), summary = modal.el.querySelector('.vc-cal-resumo'), ok = modal.el.querySelector('[data-r="ok"]');
    var months = function () { return root.clientWidth >= 720 ? 2 : 1; };
    function monthHtml(first) {
      var label = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); label = label.charAt(0).toUpperCase() + label.slice(1);
      var cells = '';
      for (var blank = 0; blank < first.getDay(); blank++) cells += '<span></span>';
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var day = 1; day <= days; day++) {
        var date = new Date(first.getFullYear(), first.getMonth(), day, 12), iso = isoDay(date);
        var cls = (start && iso === start ? ' ini' : '') + (end && iso === end ? ' fim' : '') + (start && end && iso > start && iso < end ? ' entre' : '') + (iso === isoDay(today) ? ' hoje' : '');
        cells += '<button type="button" data-dia="' + iso + '" class="' + cls.trim() + '"' + (date < today ? ' disabled' : '') + '>' + day + '</button>';
      }
      return '<div class="vc-mes"><b>' + label + '</b><div class="vc-sem"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="vc-dias">' + cells + '</div></div>';
    }
    function draw() {
      var html = '';
      for (var offset = 0; offset < months(); offset++) html += monthHtml(new Date(view.getFullYear(), view.getMonth() + offset, 1, 12));
      cal.innerHTML = html;
      var total = start && end ? daysBetween(start, end) : 0;
      summary.textContent = start && end ? shortDate(start) + ' a ' + shortDate(end) + ' · ' + T.days(total) : start ? shortDate(start) + ' a ...' : '';
      summary.classList.toggle('erro', total > MAX_TRIP_DAYS);
      if (total > MAX_TRIP_DAYS) summary.textContent = T.tripTooLong(total);
      ok.disabled = !(start && end) || total > MAX_TRIP_DAYS;
    }
    cal.addEventListener('click', function (event) {
      var button = event.target.closest('[data-dia]'); if (!button) return;
      var iso = button.dataset.dia;
      if (!start || end) { start = iso; end = null; } else if (iso < start) start = iso; else end = iso;
      draw();
    });
    modal.el.querySelectorAll('[data-nav]').forEach(function (button) { button.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + +button.dataset.nav, 1, 12); var min = new Date(today.getFullYear(), today.getMonth(), 1, 12); if (view < min) view = min; draw(); }); });
    modal.el.querySelector('[data-r="cancelar"]').addEventListener('click', function () { modal.close(); });
    ok.addEventListener('click', function () { modal.close(); submitDates(start, end, brDate(start) + ' - ' + brDate(end)); });
    draw();
  }
  function pickInterests() {
    loadCatalog().then(function () {
      var selected = state.interestIds.slice();
      var modal = openModal('<h3>' + T.interestsTitle + '</h3><div class="vc-interesses">' + catalog.areas.map(function (area) {
        return '<button type="button" class="vc-chip' + (selected.indexOf(area.id) >= 0 ? ' on' : '') + '" data-area="' + area.id + '" aria-pressed="' + (selected.indexOf(area.id) >= 0) + '">' + escapeHtml(areaLabel(area)) + '</button>';
      }).join('') + '</div><div class="vc-modal-acoes"><button type="button" class="vc-btn" data-r="ok">' + T.confirm + '</button></div>', null);
      modal.el.querySelector('.vc-interesses').addEventListener('click', function (event) {
        var chip = event.target.closest('[data-area]'); if (!chip) return;
        var id = +chip.dataset.area, at = selected.indexOf(id);
        if (at >= 0) selected.splice(at, 1); else selected.push(id);
        chip.classList.toggle('on', at < 0); chip.setAttribute('aria-pressed', String(at < 0));
      });
      modal.el.querySelector('[data-r="ok"]').addEventListener('click', function () {
        modal.close();
        if (!selected.length) return;
        state.interestIds = selected;
        renderDraft();
        sendToBackend(catalog.areas.filter(function (area) { return selected.indexOf(area.id) >= 0; }).map(areaLabel).join(', '));
      });
    });
  }
  function confirmRestart() {
    var modal = openModal('<h3>' + T.restartTitle + '</h3><p class="vc-modal-p">' + T.restartMessage + '</p><div class="vc-modal-acoes"><button type="button" class="vc-btn vc-btn-sec" data-r="cancelar">' + T.cancel + '</button><button type="button" class="vc-btn vc-btn-perigo" data-r="ok">' + T.restart + '</button></div>', null);
    modal.el.querySelector('[data-r="cancelar"]').addEventListener('click', function () { modal.close(); });
    modal.el.querySelector('[data-r="ok"]').addEventListener('click', function () { modal.close(); resetConversation(); });
  }
  function resetConversation() {
    if (recorder) stopRecording(false);
    var keepLead = { leadId: state.leadId, anonCount: state.anonCount };
    state = freshState(); state.leadId = keepLead.leadId; state.anonCount = keepLead.anonCount;
    busy.sending = busy.submitting = busy.reading = false;
    list.innerHTML = ''; setEmpty(true);
    fetch(API + 'reset?deviceId=' + encodeURIComponent(deviceId()), { method: 'POST' }).catch(function () {});
    renderDock(); renderDraft();
  }

  /* ── Sua viagem até agora + atalhos (painel ao lado no desktop, folha no celular) ── */
  function hasDraft() { return !!(state.cityId || state.checkIn || state.interestIds.length || state.travelers > 1 || state.origin); }
  function draftDetails() {
    if (!hasDraft()) return '<p class="vc-rascunho-vazio">' + T.draftEmpty + '</p>';
    var html = '';
    var tile = function (icon, label, value, country) { return '<div class="vc-tile"><span class="vc-tile-ic">' + (country && country.image ? '<img src="' + escapeHtml(country.image) + '" alt="">' : icon) + '</span><span><small>' + label + '</small><b>' + escapeHtml(value) + '</b></span></div>'; };
    var city = catalog.byId[state.cityId];
    if (city) html += tile(I.pin, T.draftDestination, cityLabel(city), city.country);
    state.extras.forEach(function (extra) { var other = catalog.byId[extra.cityId]; if (other) html += tile(I.pinPlus, T.draftAlso, cityLabel(other) + (extra.checkIn ? ' · ' + shortDate(extra.checkIn) + ' a ' + shortDate(extra.checkOut) : ''), other.country); });
    if (state.checkIn) html += tile(I.cal, T.draftDates, shortDate(state.checkIn) + ' - ' + shortDate(state.checkOut) + ' · ' + T.days(daysBetween(state.checkIn, state.checkOut)));
    if (state.travelers > 1) html += tile(I.people, T.draftPeople, T.people(state.travelers));
    if (state.origin) html += tile(I.takeoff, T.draftOrigin, state.origin);
    if (state.interestIds.length) html += '<small class="vc-rotulo">' + T.interestsTitle + '</small><div class="vc-tags">' + state.interestIds.map(function (id) { var area = catalog.areas.find(function (item) { return item.id === id; }); return area ? '<span>' + escapeHtml(areaLabel(area)) + '</span>' : ''; }).join('') + '</div>';
    return html;
  }
  function appPromo() {
    var ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua), android = /Android/.test(ua);
    var apple = '<a class="vc-btn vc-btn-sm" href="https://apps.apple.com/br/app/ond-planejador-de-viagem/id6758392427" target="_blank" rel="noopener">App Store</a>';
    var google = '<a class="vc-btn vc-btn-sm" href="https://play.google.com/store/apps/details?id=com.agamatec.ond" target="_blank" rel="noopener">Google Play</a>';
    return '<div class="vc-promo"><b>' + T.webPromoTitle + '</b><p>' + T.webPromoBody + '</p><div class="vc-promo-lojas">' + (ios ? apple : android ? google : apple + google) + '</div></div>';
  }
  function draftHeader() { return '<div class="vc-rascunho-topo"><b>' + T.draftTitle + '</b>' + (state.messages ? '<button type="button" class="vc-icone" data-painel="recomecar" aria-label="' + T.restart + '" title="' + T.restart + '">' + I.reset + '</button>' : '') + '</div>'; }
  function renderDraft() {
    if (!sidePanel) return;
    if (panelLayer === 'paises') {
      sidePanel.innerHTML = '<div class="vc-painel-topo"><button type="button" class="vc-voltar" data-painel="menu" aria-label="' + T.back + '"><span style="transform:scaleX(-1);display:grid">' + I.chevron + '</span></button><b>' + T.explore + '</b></div><div class="vc-painel-lista">' +
        catalog.countries.map(function (country, index) { return '<button type="button" class="vc-linha-item" data-pais="' + index + '">' + flag(country, 20) + '<span>' + escapeHtml(country.name) + '</span>' + I.chevron + '</button>'; }).join('') + '</div>';
    } else if (panelLayer === 'cidades' && panelCountry) {
      sidePanel.innerHTML = '<div class="vc-painel-topo"><button type="button" class="vc-voltar" data-painel="paises" aria-label="' + T.back + '"><span style="transform:scaleX(-1);display:grid">' + I.chevron + '</span></button><b>' + escapeHtml(T.exploreIn(panelCountry.name)) + '</b></div><div class="vc-painel-lista">' +
        (panelCountry.cities || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'pt'); }).map(function (city) { return '<a class="vc-linha-item" href="' + cityPage(city) + '"><span>' + escapeHtml(city.name) + '</span>' + I.chevron + '</a>'; }).join('') + '</div>';
    } else {
      sidePanel.innerHTML = '<div class="vc-rascunho">' + draftHeader() + '<div class="vc-rascunho-corpo">' + draftDetails() + '</div></div>' +
        '<button type="button" class="vc-linha-item vc-atalho" data-painel="paises">' + I.compass + '<span>' + T.explore + '</span>' + I.chevron + '</button>' +
        appPromo();
    }
    renderDraftBar();
  }
  function renderDraftBar() {
    var bar = root && root.querySelector('.vc-barra-rascunho');
    if (!bar) return;
    bar.hidden = !(hasDraft() || state.messages);
    var city = catalog.byId[state.cityId];
    var mesmoMes = state.checkIn && state.checkOut && String(state.checkIn).slice(0, 7) === String(state.checkOut).slice(0, 7);
    var periodo = state.checkIn ? (mesmoMes ? parseDay(state.checkIn).getDate() : shortDate(state.checkIn)) + ' a ' + shortDate(state.checkOut) : '';
    var resumo = city ? city.name + (periodo ? ' · ' + periodo : '') : T.draftTitle;
    bar.innerHTML = I.map + '<span>' + escapeHtml(resumo) + '</span>' + I.chevron;
  }
  function openDraftSheet() {
    var modal = openModal(draftHeader() + '<div class="vc-rascunho-corpo">' + draftDetails() + '</div><div class="vc-modal-acoes"><button type="button" class="vc-btn vc-btn-sec vc-btn-larga" data-r="ok">' + T.draftCompleteMissing + '</button></div>' + appPromo(), null, 'vc-folha');
    modal.el.querySelector('[data-r="ok"]').addEventListener('click', function () { modal.close(); });
    var restart = modal.el.querySelector('[data-painel="recomecar"]');
    if (restart) restart.addEventListener('click', function () { modal.close(); confirmRestart(); });
  }
  function onPanelClick(event) {
    var target = event.target.closest('[data-painel],[data-pais]');
    if (!target) return;
    if (target.dataset.pais != null) { panelCountry = catalog.countries[+target.dataset.pais]; panelLayer = 'cidades'; renderDraft(); sidePanel.scrollTop = 0; return; }
    var go = target.dataset.painel;
    if (go === 'recomecar') { confirmRestart(); return; }
    panelLayer = go; renderDraft(); sidePanel.scrollTop = 0;
  }

  var toastTimer = null;
  function toast(text) {
    var el = root.querySelector('.vc-toast');
    el.textContent = text; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 3200);
  }

  /* ── histórico: volta a conversa deste navegador ── */
  function loadHistory() {
    return Promise.all([api('ond-vai/history?deviceId=' + encodeURIComponent(deviceId())).catch(function () { return null; }), loadCatalog()]).then(function (results) {
      var doc = results[0];
      var messages = doc && doc.messages || [];
      messages.forEach(function (message) {
        if (message.content || message.audioUrl) addMessage(message.sender === 'USER', message.content, { audioUrl: message.audioUrl, action: message.sender === 'USER' ? null : message.appAction });
      });
      setEmpty(!messages.length);
      if (doc && doc.collected) applyCollected(doc.collected);
      if (doc && doc.lastTurn) {
        var last = doc.lastTurn;
        state.turn = { reply: last.reply || '', input: last.input && typeof last.input === 'object' ? last.input : last, complete: last.complete === true, appAction: last.appAction };
      }
      renderDock(); renderDraft();
      scroller.scrollTop = scroller.scrollHeight;
    });
  }

  var pendingPrefill = '';
  function mount(container) {
    if (mounted) return;
    mounted = true;
    root = document.createElement('div');
    root.className = 'vc vc-vazio';
    root.innerHTML =
      '<div class="vc-principal"><button type="button" class="vc-barra-rascunho" hidden>' + I.map + T.draftTitle + '</button>' +
      '<div class="vc-scroll"><div class="vc-intro"><span class="vc-orb">' + I.star + '</span>' +
      '<h2>' + T.welcomeTitle + '</h2><p class="vc-disclaimer">' + T.welcomeDisclaimer + '</p>' + cotaVai() +
      '<p class="vc-sug-t">' + T.startersTitle + '</p><div class="vc-sugs">' +
      T.starters.map(function (item) { var m = item.match(/^(.*) \(([^)]*)\)$/) || [item, item, '']; return '<button type="button" class="vc-sug" data-texto="' + escapeHtml(item) + '" data-cidade="' + escapeHtml(m[2]) + '"><span class="vc-sug-foto">' + I.pin + '</span><b>' + escapeHtml(m[1]) + '</b>' + (m[2] ? '<small>' + escapeHtml(m[2]) + '</small>' : '') + '</button>'; }).join('') + '</div></div>' +
      '<div class="vc-list" aria-live="polite"></div></div>' +
      '<div class="vc-dock"></div></div><aside class="vc-painel" aria-label="' + T.draftTitle + '"></aside><div class="vc-toast" role="status"></div>';
    container.appendChild(root);
    list = root.querySelector('.vc-list');
    dock = root.querySelector('.vc-dock');
    scroller = root.querySelector('.vc-scroll');
    sidePanel = root.querySelector('.vc-painel');
    root.querySelectorAll('.vc-sugs .vc-sug').forEach(function (card) { card.addEventListener('click', function () { sendToBackend(card.dataset.texto); }); });
    /* foto do destino em cada sugestão, quando o catálogo chega */
    loadCatalog().then(function () {
      root.querySelectorAll('.vc-sug[data-cidade]').forEach(function (card) {
        var nome = (card.dataset.cidade || '').toLowerCase();
        var city = catalog.cities.find(function (item) { return (item.name || '').toLowerCase() === nome && item.image; });
        if (city) { var foto = card.querySelector('.vc-sug-foto'); foto.innerHTML = ''; foto.style.backgroundImage = 'url("' + city.image + '")'; foto.classList.add('tem'); }
      });
    });
    dock.addEventListener('click', onDockClick);
    sidePanel.addEventListener('click', onPanelClick);
    root.querySelector('.vc-barra-rascunho').addEventListener('click', openDraftSheet);
    list.addEventListener('click', function (event) { var play = event.target.closest('.vc-audio-play'); if (play) playAudio(play); });
    root.classList.add('vc-ativo');
    renderDock(); renderDraft();
    loadHistory();
    sendLead();
  }

  window.OndVaiChat = {
    mount: mount,
    prefill: function (text) {
      if (!text) return;
      var area = dock && dock.querySelector('textarea');
      if (!area) { pendingPrefill = text; return; }
      area.value = text; area.dispatchEvent(new Event('input')); area.focus();
    },
    focus: function () { var area = dock && dock.querySelector('textarea'); if (area) area.focus({ preventScroll: true }); },
    restart: function () { confirmRestart(); }
  };
})();
