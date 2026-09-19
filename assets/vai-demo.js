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
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var PERG = {
    dest: ['Pra qual destino você quer ir?', ['Maceió', 'Gramado', 'Buenos Aires', 'Paris']],
    quando: ['Quando você quer ir?', ['Nas férias de julho', 'No fim do ano', 'Num feriado', 'Ainda não sei']],
    quem: ['Quantas pessoas vão?', ['Só eu', '2 pessoas', 'Família com crianças', 'Grupo de amigos']],
    origem: ['Saindo de qual cidade?', ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília']]
  };
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
      for (var m = 0; m < MESES.length; m++) if (s.indexOf(sem(MESES[m])) > -1) { d.quando = 'Em ' + MESES[m]; break; }
      if (!d.quando && /reveillon|ano novo/.test(s)) d.quando = 'No Réveillon';
      if (!d.quando && /carnaval/.test(s)) d.quando = 'No Carnaval';
    }
    if (!d.quem) {
      if (/crianca|filhos|familia/.test(s)) d.quem = 'Família com crianças';
      else if (/amigos|galera|grupo/.test(s)) d.quem = 'Grupo de amigos';
      else if (/lua de mel|casal|namorad|espos|marid/.test(s)) d.quem = '2 pessoas';
      else if (/sozinh|so eu/.test(s)) d.quem = 'Só eu';
      else { var n = s.match(/somos (\d+)|(\d+) pessoas/); if (n) d.quem = (n[1] || n[2]) + ' pessoas'; }
    }
    if (!d.origem) { var o = t.match(/saindo d[eo]\s+([A-Za-zÀ-ú ]{3,30})/i); if (o) d.origem = o[1].trim(); }
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
      var p = PERG[esperando];
      bolha((intro ? intro + ' ' : '') + p[0], false);
      opcoes(p[1]);
      input.placeholder = 'Escreva ou toque numa opção…';
      return;
    }
    esperando = null; ops.innerHTML = '';
    bolha('Anotei tudo! Com isso uma pessoa do OND já cota voo, hotel e passeios pra você.', false);
    fecha();
  }
  function fecha() {
    ['dest', 'quando', 'quem', 'origem'].forEach(function (k) { sheet.querySelector('[data-k="' + k + '"]').textContent = d[k]; });
    var msg = 'Olá, OND! Montei minha viagem no site:\nDestino: ' + d.dest + '\nQuando: ' + d.quando +
      '\nViajantes: ' + d.quem + '\nSaindo de: ' + d.origem + '\nPode cotar pra mim?';
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
    digitando(function () { proxima(!tinha && d.dest ? 'Perfeito, ' + d.dest + '.' : ''); });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); if (ocupado) return; var t = input.value; input.value = ''; form.classList.remove('tem'); responde(t); });
  input.addEventListener('input', function () { form.classList.toggle('tem', !!input.value.trim()); });
  box.querySelectorAll('.vz-sug button').forEach(function (b) { b.addEventListener('click', function () { responde(b.textContent); }); });
  box.querySelector('.vz-mic').addEventListener('click', function () { input.focus(); });
  box.querySelector('.vz-reset').addEventListener('click', function () {
    d = {}; esperando = null; log.innerHTML = ''; ops.innerHTML = ''; sheet.hidden = true;
    input.placeholder = 'Escreva ou toque no microfone…';
    box.dataset.estado = 'boas-vindas';
  });
  box.querySelectorAll('.vz-volta').forEach(function (b) { b.addEventListener('click', function () { box.querySelector('.vz-reset').click(); }); });
})();
