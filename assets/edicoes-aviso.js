(function () {
  var bloco = document.getElementById('ed-avise');
  if (!bloco || document.querySelector('.ed-so-ativa:not([hidden])')) return;
  var api = bloco.getAttribute('data-api');
  var slug = bloco.getAttribute('data-slug');
  var rota = api + '/api/themed-editions/' + encodeURIComponent(slug) + '/premiere-notice';
  var CHAVE_APARELHO = 'ond-site-aparelho';
  var MIN_DIGITOS = 10;
  var MAX_DIGITOS = 15;
  var DDI_BRASIL = '55';
  var CELULAR_ANTIGO_DIGITOS = 10;
  var CELULAR_PRIMEIRO_DIGITO = '6789';
  var BIBLIOTECA = '/assets/vendor/intl-tel-input-29.5.3/';
  var campoTelefone = null;
  var carregandoTelefone = null;

  var pedir = bloco.querySelector('[data-acao="abrir"]');
  var formulario = bloco.querySelector('form');
  var confirmado = bloco.querySelector('.ed-ok');
  var sair = bloco.querySelector('[data-acao="sair"]');
  var erro = bloco.querySelector('.ed-erro');
  var enviar = formulario.querySelector('button[type="submit"]');

  function novoAparelho() {
    var bytes = new Uint8Array(12);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return 'site-' + Array.prototype.map.call(bytes, function (byte) {
      return ('0' + byte.toString(16)).slice(-2);
    }).join('');
  }

  function aparelho() {
    try {
      var guardado = localStorage.getItem(CHAVE_APARELHO);
      if (guardado) return guardado;
      var criado = novoAparelho();
      localStorage.setItem(CHAVE_APARELHO, criado);
      return criado;
    } catch (falha) {
      return novoAparelho();
    }
  }

  var deviceId = aparelho();

  function mostra(estado) {
    bloco.hidden = false;
    pedir.hidden = estado !== 'pedir';
    formulario.hidden = estado !== 'formulario';
    confirmado.hidden = estado !== 'confirmado';
    erro.hidden = true;
  }

  function falhou() {
    erro.hidden = false;
    enviar.disabled = false;
    sair.disabled = false;
  }

  function digitos(telefone) {
    return (telefone || '').replace(/\D+/g, '');
  }

  function comNonoDigito(internacional) {
    var numero = digitos(internacional);
    if (numero.indexOf(DDI_BRASIL) !== 0) return internacional;
    var nacional = numero.slice(DDI_BRASIL.length);
    var celularAntigo = nacional.length === CELULAR_ANTIGO_DIGITOS
      && CELULAR_PRIMEIRO_DIGITO.indexOf(nacional.charAt(2)) !== -1;
    return celularAntigo ? '+' + DDI_BRASIL + nacional.slice(0, 2) + '9' + nacional.slice(2) : internacional;
  }

  function carregaScript(endereco) {
    return new Promise(function (resolve, rejeita) {
      var script = document.createElement('script');
      script.src = endereco;
      script.onload = resolve;
      script.onerror = rejeita;
      document.head.appendChild(script);
    });
  }

  function preparaTelefone() {
    if (carregandoTelefone) return carregandoTelefone;
    var estilo = document.createElement('link');
    estilo.rel = 'stylesheet';
    estilo.href = BIBLIOTECA + 'css/intlTelInput.min.css';
    document.head.appendChild(estilo);
    carregandoTelefone = Promise.all([
      carregaScript(BIBLIOTECA + 'js/intlTelInputWithUtils.min.js'),
      carregaScript(BIBLIOTECA + 'js/pt.js')
    ]).then(function () {
      campoTelefone = window.intlTelInput(formulario.telefone, {
        initialCountry: 'br',
        countryOrder: ['br', 'pt', 'us'],
        countryNameLocale: 'pt-BR',
        uiTranslations: window.intlTelInputTraducoesPt,
        separateDialCode: true,
        countrySearch: true,
        formatAsYouType: true,
        strictMode: true
      });
    }).catch(function () {});
    return carregandoTelefone;
  }

  function telefoneInternacional() {
    if (campoTelefone) {
      var pais = (campoTelefone.getSelectedCountry() || {}).iso2;
      var numero = comNonoDigito(campoTelefone.getNumber());
      return window.intlTelInput.utils.isValidNumber(numero, pais) ? numero : null;
    }
    var bruto = formulario.telefone.value.trim();
    var numeroDigitado = digitos(bruto);
    var completo = bruto.charAt(0) === '+' ? numeroDigitado : DDI_BRASIL + numeroDigitado;
    if (completo.length < MIN_DIGITOS || completo.length > MAX_DIGITOS) return null;
    return comNonoDigito('+' + completo);
  }

  function postJson(url, corpo) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
  }

  function cadastra(nome, email, telefone) {
    return postJson(api + '/api/users?lang=pt&themedEdition=' + encodeURIComponent(slug) + '&themedEditionReason=premiere-notice', {
      user: { name: nome, email: email, authProvider: 'INTERNAL' },
      name: nome,
      email: email,
      phoneNumber: telefone,
      deviceId: deviceId,
      type: 'MAIN'
    }).then(function (resposta) {
      if (!resposta.ok && resposta.status !== 401) throw new Error('cadastro ' + resposta.status);
    });
  }

  function registraAviso(email) {
    return postJson(rota, { deviceId: deviceId, email: email, language: 'pt' }).then(function (resposta) {
      if (!resposta.ok) throw new Error('aviso ' + resposta.status);
    });
  }

  pedir.addEventListener('click', function () {
    mostra('formulario');
    preparaTelefone();
    formulario.querySelector('input[name="nome"]').focus();
  });

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (enviar.disabled) return;
    if (formulario.querySelector('input[name="site"]').value) return;
    var nome = formulario.nome.value.trim();
    var email = formulario.email.value.trim();
    var telefone = telefoneInternacional();
    var emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nome || !emailValido || !telefone) {
      erro.hidden = false;
      return;
    }
    enviar.disabled = true;
    erro.hidden = true;
    cadastra(nome, email, telefone)
      .then(function () { return registraAviso(email); })
      .then(function () {
        enviar.disabled = false;
        mostra('confirmado');
      })
      .catch(falhou);
  });

  sair.addEventListener('click', function () {
    sair.disabled = true;
    fetch(rota + '?deviceId=' + encodeURIComponent(deviceId), { method: 'DELETE' })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('saida ' + resposta.status);
        sair.disabled = false;
        mostra('pedir');
      })
      .catch(falhou);
  });

  fetch(rota + '?deviceId=' + encodeURIComponent(deviceId))
    .then(function (resposta) { return resposta.ok ? resposta.json() : null; })
    .then(function (estado) {
      if (!estado) return;
      mostra(estado.requested ? 'confirmado' : 'pedir');
    })
    .catch(function () {});
})();
