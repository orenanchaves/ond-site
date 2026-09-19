/* Demonstração interativa do OND vAI dentro do celular do "Como funciona".
   Pergunta destino, quando, quem vai e de onde sai; fecha no "Seu roteiro" e manda pro WhatsApp do OND. */
(function () {
  var box = document.querySelector('.vz');
  if (!box) return;
  var WA = '5511943615412';
  var log = box.querySelector('.vz-log');
  var ops = box.querySelector('.vz-ops');
  var form = box.querySelector('.vz-comp');
  var input = form.querySelector('input');
  var sheet = box.querySelector('.vz-sheet');
  var DEST = [
    ['Rio de Janeiro', /\brio de janeiro\b|\bno rio\b|\bpro rio\b|^rio$/], ['Maceió', /maceio/], ['Gramado', /gramado/],
    ['Porto de Galinhas', /porto de galinhas/], ['Foz do Iguaçu', /foz|iguacu|cataratas/], ['Fernando de Noronha', /noronha/],
    ['Salvador', /salvador/], ['Natal', /\bnatal\b(?! luz)/], ['Jericoacoara', /jeri/], ['Lençóis Maranhenses', /lencois/],
    ['Bonito', /bonito/], ['Florianópolis', /florianopolis|floripa/], ['Paris', /paris/], ['Buenos Aires', /buenos aires/],
    ['Lisboa', /lisboa|portugal/], ['Orlando', /orlando|disney/], ['Cancún', /cancun/], ['Roma', /\broma\b|italia/],
    ['Bariloche', /bariloche/], ['Santiago', /santiago|chile/], ['Patagônia', /patagonia/], ['Machu Picchu', /machu|cusco|peru/],
    ['Nova York', /nova york|new york|\bny\b/], ['Japão', /japao|toquio/], ['Maldivas', /maldivas/]
  ];
  var TX = {
    pt: { meses: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'], em: 'Em ',
      perg: { dest: ['Pra qual destino você quer ir?', ['Maceió', 'Gramado', 'Buenos Aires', 'Paris']], quando: ['Quando você quer ir?', ['Nas férias de julho', 'No fim do ano', 'Num feriado', 'Ainda não sei']], quem: ['Quantas pessoas vão?', ['Só eu', '2 pessoas', 'Família com crianças', 'Grupo de amigos']], origem: ['Saindo de qual cidade?', ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília']] },
      perfeito: 'Perfeito, ', fim: 'Anotei tudo! Com isso uma pessoa do OND já cota voo, hotel e passeios pra você.', ph1: 'Escreva ou toque no microfone…', ph2: 'Escreva ou toque numa opção…',
      wa: ['Olá, OND! Montei minha viagem no site:', 'Destino', 'Quando', 'Viajantes', 'Saindo de', 'Pode cotar pra mim?'], familia: 'Família com crianças', amigos: 'Grupo de amigos', dois: '2 pessoas', so: 'Só eu', pessoas: ' pessoas', rev: 'No Réveillon', carn: 'No Carnaval' },
    en: { meses: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], em: 'In ',
      perg: { dest: ['Where would you like to go?', ['Rio de Janeiro', 'Maceió', 'Buenos Aires', 'Paris']], quando: ['When would you like to go?', ['In July', 'At the end of the year', 'On a long weekend', 'Not sure yet']], quem: ['How many people are going?', ['Just me', '2 people', 'Family with kids', 'Group of friends']], origem: ['Which city are you leaving from?', ['São Paulo', 'Rio de Janeiro', 'Lisbon', 'New York']] },
      perfeito: 'Great, ', fim: 'Got it all! A person from OND will now quote flights, hotel and tours for you.', ph1: 'Type or tap the microphone…', ph2: 'Type or tap an option…',
      wa: ['Hi OND! I planned my trip on the website:', 'Destination', 'When', 'Travelers', 'Leaving from', 'Could you send me a quote?'], familia: 'Family with kids', amigos: 'Group of friends', dois: '2 people', so: 'Just me', pessoas: ' people', rev: "On New Year's Eve", carn: 'At Carnival' },
    es: { meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], em: 'En ',
      perg: { dest: ['¿A qué destino quieres ir?', ['Rio de Janeiro', 'Maceió', 'Buenos Aires', 'Paris']], quando: ['¿Cuándo quieres ir?', ['En julio', 'A fin de año', 'En un feriado', 'Todavía no sé']], quem: ['¿Cuántas personas van?', ['Solo yo', '2 personas', 'Familia con niños', 'Grupo de amigos']], origem: ['¿Desde qué ciudad sales?', ['São Paulo', 'Buenos Aires', 'Santiago', 'Madrid']] },
      perfeito: 'Perfecto, ', fim: '¡Anoté todo! Con esto una persona de OND ya cotiza vuelo, hotel y paseos para ti.', ph1: 'Escribe o toca el micrófono…', ph2: 'Escribe o toca una opción…',
      wa: ['¡Hola, OND! Armé mi viaje en el sitio:', 'Destino', 'Cuándo', 'Viajeros', 'Saliendo de', '¿Me pueden cotizar?'], familia: 'Familia con niños', amigos: 'Grupo de amigos', dois: '2 personas', so: 'Solo yo', pessoas: ' personas', rev: 'En Año Nuevo', carn: 'En Carnaval' },
    fr: { meses: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], em: 'En ',
      perg: { dest: ['Quelle destination vous tente ?', ['Rio de Janeiro', 'Maceió', 'Buenos Aires', 'Paris']], quando: ['Quand voulez-vous partir ?', ['En juillet', 'En fin d\u2019année', 'Pour un long week-end', 'Je ne sais pas encore']], quem: ['Combien de voyageurs ?', ['Moi seul', '2 personnes', 'Famille avec enfants', 'Groupe d\u2019amis']], origem: ['De quelle ville partez-vous ?', ['Paris', 'Lyon', 'Lisbonne', 'São Paulo']] },
      perfeito: 'Parfait, ', fim: 'C\u2019est noté ! Une personne d\u2019OND va chiffrer vol, hôtel et excursions pour vous.', ph1: 'Écrivez ou touchez le micro…', ph2: 'Écrivez ou touchez une option…',
      wa: ['Bonjour OND ! J\u2019ai préparé mon voyage sur le site :', 'Destination', 'Quand', 'Voyageurs', 'Départ de', 'Pouvez-vous me faire un devis ?'], familia: 'Famille avec enfants', amigos: 'Groupe d\u2019amis', dois: '2 personnes', so: 'Moi seul', pessoas: ' personnes', rev: 'Au Nouvel An', carn: 'Au Carnaval' },
    it: { meses: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'], em: 'A ',
      perg: { dest: ['In quale destinazione vuoi andare?', ['Rio de Janeiro', 'Maceió', 'Buenos Aires', 'Paris']], quando: ['Quando vuoi partire?', ['A luglio', 'A fine anno', 'In un ponte', 'Non lo so ancora']], quem: ['Quante persone partono?', ['Solo io', '2 persone', 'Famiglia con bambini', 'Gruppo di amici']], origem: ['Da quale città parti?', ['Roma', 'Milano', 'Lisbona', 'São Paulo']] },
      perfeito: 'Perfetto, ', fim: 'Ho segnato tutto! Ora una persona di OND prepara il preventivo di volo, hotel ed escursioni per te.', ph1: 'Scrivi o tocca il microfono…', ph2: 'Scrivi o tocca un\u2019opzione…',
      wa: ['Ciao OND! Ho preparato il mio viaggio sul sito:', 'Destinazione', 'Quando', 'Viaggiatori', 'Partenza da', 'Mi preparate un preventivo?'], familia: 'Famiglia con bambini', amigos: 'Gruppo di amici', dois: '2 persone', so: 'Solo io', pessoas: ' persone', rev: 'A Capodanno', carn: 'A Carnevale' }
  };
  var tx = TX[(document.documentElement.lang || 'pt').slice(0, 2)] || TX.pt;
  var ORDEM = ['dest', 'quando', 'quem', 'origem'];
  var d = {}, esperando = null, ocupado = false;
  var PESSOA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';

  function sem(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function hora() { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); }
  function esc(t) { var e = document.createElement('div'); e.textContent = t; return e.innerHTML; }
  function desce() { log.scrollTop = log.scrollHeight; }

  function extrai(t) {
    var s = sem(t);
    if (!d.dest) for (var i = 0; i < DEST.length; i++) if (DEST[i][1].test(s)) { d.dest = DEST[i][0]; break; }
    if (!d.quando) {
      for (var m = 0; m < tx.meses.length; m++) if (s.indexOf(sem(tx.meses[m])) > -1) { d.quando = tx.em + tx.meses[m]; break; }
      if (!d.quando && /reveillon|ano novo|new year|ano nuevo|nouvel an|capodanno/.test(s)) d.quando = tx.rev;
      if (!d.quando && /carnaval|carnevale|carnival/.test(s)) d.quando = tx.carn;
    }
    if (!d.quem) {
      if (/crianca|filhos|familia|kids|children|family|ninos|enfants|bambini|famiglia|famille/.test(s)) d.quem = tx.familia;
      else if (/amigos|galera|grupo|friends|amis|amici|gruppo|groupe/.test(s)) d.quem = tx.amigos;
      else if (/lua de mel|casal|namorad|espos|marid|honeymoon|couple|luna de miel|lune de miel|luna di miele|coppia|pareja/.test(s)) d.quem = tx.dois;
      else if (/sozinh|so eu|just me|alone|solo yo|moi seul|solo io/.test(s)) d.quem = tx.so;
      else { var n = s.match(/somos (\d+)|(\d+) (?:pessoas|people|personas|personnes|persone)/); if (n) d.quem = (n[1] || n[2]) + tx.pessoas; }
    }
    if (!d.origem) { var o = t.match(/(?:saindo d[eo]|leaving from|flying from|saliendo de|départ de|en partant de|partenza da|partendo da)\s+([A-Za-zÀ-ú ]{3,30})/i); if (o) d.origem = o[1].trim(); }
  }

  function bolha(t, eu) {
    var w = document.createElement('div');
    w.className = 'vz-w' + (eu ? ' eu' : '');
    w.innerHTML = (eu ? '' : '<img src="/assets/app/chapeu.jpg" alt="" width="28" height="28">') +
      '<p>' + esc(t) + '</p>' + (eu ? '<span class="a-u">' + PESSOA + '</span>' : '') +
      '<small>' + hora() + '</small>';
    log.appendChild(w); desce();
  }
  function digitando(fn) {
    var w = document.createElement('div');
    w.className = 'vz-w vz-dig';
    w.innerHTML = '<img src="/assets/app/chapeu.jpg" alt="" width="28" height="28"><p><i></i><i></i><i></i></p>';
    log.appendChild(w); desce(); ocupado = true;
    var ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 750;
    setTimeout(function () { w.remove(); ocupado = false; fn(); }, ms);
  }
  function opcoes(lista) {
    ops.innerHTML = '';
    lista.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t;
      b.addEventListener('click', function () { responde(t); });
      ops.appendChild(b);
    });
    desce();
  }
  function proxima(intro) {
    for (var i = 0; i < ORDEM.length; i++) if (!d[ORDEM[i]]) {
      esperando = ORDEM[i];
      var p = tx.perg[esperando];
      bolha((intro ? intro + ' ' : '') + p[0], false);
      opcoes(p[1]);
      input.placeholder = tx.ph2;
      return;
    }
    esperando = null; ops.innerHTML = '';
    bolha(tx.fim, false);
    fecha();
  }
  function fecha() {
    ['dest', 'quando', 'quem', 'origem'].forEach(function (k) { sheet.querySelector('[data-k="' + k + '"]').textContent = d[k]; });
    var w = tx.wa, msg = w[0] + '\n' + w[1] + ': ' + d.dest + '\n' + w[2] + ': ' + d.quando +
      '\n' + w[3] + ': ' + d.quem + '\n' + w[4] + ': ' + d.origem + '\n' + w[5];
    sheet.querySelector('.vz-comprar').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
    box.dataset.estado = 'roteiro';
    sheet.hidden = false; desce();
  }
  function responde(t) {
    t = (t || '').trim();
    if (!t || ocupado) return;
    if (box.dataset.estado === 'boas-vindas') box.dataset.estado = 'conversa';
    ops.innerHTML = '';
    bolha(t, true);
    var tinha = !!d.dest;
    if (esperando && esperando !== 'dest' && !d[esperando]) { extrai(t); if (!d[esperando]) d[esperando] = t; }
    else { extrai(t); if (esperando === 'dest' && !d.dest) d.dest = t.charAt(0).toUpperCase() + t.slice(1); }
    digitando(function () { proxima(!tinha && d.dest ? tx.perfeito + d.dest + '.' : ''); });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); if (ocupado) return; var t = input.value; input.value = ''; form.classList.remove('tem'); responde(t); });
  input.addEventListener('input', function () { form.classList.toggle('tem', !!input.value.trim()); });
  box.querySelectorAll('.vz-sug button').forEach(function (b) { b.addEventListener('click', function () { responde(b.textContent); }); });
  box.querySelector('.vz-mic').addEventListener('click', function () { input.focus(); });
  box.querySelector('.vz-reset').addEventListener('click', function () {
    d = {}; esperando = null; log.innerHTML = ''; ops.innerHTML = ''; sheet.hidden = true;
    input.placeholder = tx.ph1;
    box.dataset.estado = 'boas-vindas';
  });
  box.querySelectorAll('.vz-volta').forEach(function (b) { b.addEventListener('click', function () { box.querySelector('.vz-reset').click(); }); });
})();
