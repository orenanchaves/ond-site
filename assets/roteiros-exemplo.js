/* Roteiros da conta de teste (só no localhost). Conteúdo inventado para mostrar a experiência
   de quem está logado. NÃO publicar como real: sai junto com comunidade-exemplo.js. */
var OND_ROTEIROS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? [
  {
    id: 'noronha-2027',
    title: 'Fernando de Noronha',
    country: 'Brasil', iso: 'BRA', city: 'Fernando de Noronha',
    cover: '/assets/viagens/fernando-de-noronha.jpg',
    start: '2027-03-12', end: '2027-03-17',
    status: 'marcada',
    people: [
      { name: 'Marina Duarte', initials: 'MD', color: '#7f11f4', role: 'Dona do roteiro' },
      { name: 'Rafael Lima', initials: 'RL', color: '#085e20', role: 'Pode editar' }
    ],
    center: [-3.852, -32.425], zoom: 13,
    transports: [
      { kind: 'voo', label: 'Ida', from: 'São Paulo (GRU)', to: 'Fernando de Noronha (FEN)', date: '2027-03-12', time: '06:10', arrive: '13:40', detail: 'Conexão em Recife (REC)', code: 'Localizador XK7Q2P' },
      { kind: 'voo', label: 'Volta', from: 'Fernando de Noronha (FEN)', to: 'São Paulo (GRU)', date: '2027-03-17', time: '14:20', arrive: '21:55', detail: 'Conexão em Recife (REC)', code: 'Localizador XK7Q2P' }
    ],
    stays: [
      { name: 'Pousada na Vila dos Remédios', checkIn: '2027-03-12', checkOut: '2027-03-17', nights: 5, detail: 'Quarto casal com café da manhã', lat: -3.841, lng: -32.412 }
    ],
    weather: [
      { day: '2027-03-12', min: 25, max: 30, sky: 'sol' }, { day: '2027-03-13', min: 25, max: 30, sky: 'nuvens' },
      { day: '2027-03-14', min: 25, max: 29, sky: 'chuva' }, { day: '2027-03-15', min: 25, max: 30, sky: 'sol' },
      { day: '2027-03-16', min: 26, max: 31, sky: 'sol' }, { day: '2027-03-17', min: 25, max: 30, sky: 'nuvens' }
    ],
    days: [
      { date: '2027-03-12', title: 'Chegada e a Vila', items: [
        { time: '13:40', type: 'voo', title: 'Chegada no aeroporto', lat: -3.8547, lng: -32.4227, minutes: 30 },
        { time: '15:00', type: 'hotel', title: 'Check-in na pousada', lat: -3.841, lng: -32.412, minutes: 60 },
        { time: '16:30', type: 'passeio', title: 'Vila dos Remédios e o Forte', lat: -3.8386, lng: -32.4097, minutes: 60, note: 'Subida curta, leve água.' },
        { time: '17:30', type: 'praia', title: 'Pôr do sol na Praia do Cachorro', lat: -3.839, lng: -32.4109, minutes: 60 },
        { time: '20:00', type: 'comida', title: 'Jantar na Vila', lat: -3.8405, lng: -32.4112, minutes: 90 }
      ] },
      { date: '2027-03-13', title: 'Mar de dentro', items: [
        { time: '09:00', type: 'passeio', title: 'Passeio de barco com golfinhos', lat: -3.8338, lng: -32.4002, minutes: 180, note: 'Saída do Porto de Santo Antônio. Reservado.', booked: true },
        { time: '13:00', type: 'praia', title: 'Praia do Porto', lat: -3.8346, lng: -32.4011, minutes: 120 },
        { time: '20:00', type: 'passeio', title: 'Palestra do Projeto Tamar', lat: -3.8452, lng: -32.4262, minutes: 60 }
      ] },
      { date: '2027-03-14', title: 'As baías', items: [
        { time: '08:00', type: 'praia', title: 'Baía dos Porcos na maré baixa', lat: -3.8513, lng: -32.4413, minutes: 120, note: 'Ir na maré baixa para as piscinas naturais.' },
        { time: '10:30', type: 'praia', title: 'Cacimba do Padre', lat: -3.8498, lng: -32.439, minutes: 90 },
        { time: '13:00', type: 'praia', title: 'Baía do Sancho', lat: -3.8545, lng: -32.445, minutes: 150, note: 'Acesso por escada na fenda da rocha.' },
        { time: '16:00', type: 'mirante', title: 'Mirante dos Golfinhos', lat: -3.8566, lng: -32.4467, minutes: 45 }
      ] },
      { date: '2027-03-15', title: 'Trilha e tartarugas', items: [
        { time: '08:30', type: 'trilha', title: 'Trilha do Atalaia', lat: -3.857, lng: -32.4092, minutes: 150, note: 'Agendar com antecedência, vagas limitadas.', booked: true },
        { time: '12:00', type: 'praia', title: 'Praia do Sueste, snorkel com tartarugas', lat: -3.8662, lng: -32.4256, minutes: 150 },
        { time: '15:30', type: 'praia', title: 'Praia do Leão', lat: -3.864, lng: -32.418, minutes: 90 },
        { time: '17:20', type: 'mirante', title: 'Pôr do sol no Mirante do Boldró', lat: -3.844, lng: -32.428, minutes: 60 }
      ] },
      { date: '2027-03-16', title: 'A ilha inteira', items: [
        { time: '09:00', type: 'passeio', title: 'Volta na ilha de buggy', lat: -3.8452, lng: -32.4195, minutes: 180 },
        { time: '12:30', type: 'passeio', title: 'Museu do Tubarão', lat: -3.8352, lng: -32.402, minutes: 60 },
        { time: '15:00', type: 'praia', title: 'Praia da Conceição', lat: -3.8425, lng: -32.42, minutes: 150 },
        { time: '17:30', type: 'mirante', title: 'Morro do Pico no fim da tarde', lat: -3.8448, lng: -32.4215, minutes: 45 }
      ] },
      { date: '2027-03-17', title: 'Volta', items: [
        { time: '09:00', type: 'comida', title: 'Último café da manhã', lat: -3.841, lng: -32.412, minutes: 60 },
        { time: '11:00', type: 'hotel', title: 'Check-out', lat: -3.841, lng: -32.412, minutes: 30 },
        { time: '14:20', type: 'voo', title: 'Voo de volta', lat: -3.8547, lng: -32.4227, minutes: 0 }
      ] }
    ],
    saved: [
      { title: 'Praia do Americano', type: 'praia', lat: -3.8468, lng: -32.4322 },
      { title: 'Mergulho de cilindro', type: 'passeio', lat: -3.8338, lng: -32.4002 },
      { title: 'Praia do Bode', type: 'praia', lat: -3.8482, lng: -32.4346 }
    ],
    expenses: [
      { cat: 'Aéreo', planned: 4380, paid: 4380, by: 'Marina Duarte' },
      { cat: 'Hospedagem', planned: 6250, paid: 3125, by: 'Rafael Lima' },
      { cat: 'Passeios', planned: 1640, paid: 980, by: 'Marina Duarte' },
      { cat: 'Taxas da ilha', planned: 1150, paid: 0, by: '' },
      { cat: 'Comida', planned: 2200, paid: 0, by: '' }
    ],
    onTrip: [
      { cat: 'Passeios e atrações', icon: 'passeio', value: 640 },
      { cat: 'Transporte local', icon: 'carro', value: 480 },
      { cat: 'Alimentação', icon: 'comida', value: 2200 },
      { cat: 'Outros', icon: 'mais', value: 300 }
    ],
    checklist: [
      { text: 'Protetor solar que não agride o mar', done: true },
      { text: 'Máscara de snorkel', done: true },
      { text: 'Comprovante da taxa da ilha', done: false },
      { text: 'Ingresso do parque nacional', done: false },
      { text: 'Tênis de trilha', done: false },
      { text: 'Dinheiro em espécie', done: false }
    ],
    destino: {
      tagline: 'Um arquipélago no meio do Atlântico, a 350 km da costa.',
      fatos: [
        ['Fuso', 'Uma hora a mais que Brasília'], ['Moeda', 'Real (R$)'], ['Idioma', 'Português'],
        ['Tomada', 'Padrão brasileiro, 220 V'], ['Melhor época', 'Agosto a dezembro, com o mar mais calmo'],
        ['Taxas', 'Taxa de preservação por dia e ingresso do parque nacional']
      ],
      destaques: ['Baía do Sancho', 'Baía dos Porcos', 'Praia do Leão', 'Mirante dos Golfinhos'],
      dicas: ['Agende as trilhas do parque com antecedência', 'Leve dinheiro em espécie', 'Confira a tábua de marés antes das piscinas naturais'],
      telefones: [['Emergência', '192'], ['Polícia', '190'], ['Bombeiros', '193']],
      trilha: { clima: 'Praia, pôr do sol e fim de tarde na Vila', estilos: ['MPB', 'Forró pé de serra', 'Reggae', 'Bossa nova', 'Frevo'] }
    },
    transfers: [
      { label: 'Aeroporto → pousada', detail: 'Transfer da pousada ou táxi, cerca de 10 min' },
      { label: 'Na ilha', detail: 'Buggy alugado, táxi ou o ônibus que cruza a ilha pela BR-363' }
    ],
    notas_prefs: { checklist: true, voos: true, clima: true, resumo: false },
    notes: 'Atalaia e passeio de barco já agendados. Ver a tábua de marés antes da Baía dos Porcos.',
    documents: [
      { name: 'Passagens ida e volta.pdf', kind: 'voo' },
      { name: 'Reserva da pousada.pdf', kind: 'hotel' },
      { name: 'Agendamento Atalaia.pdf', kind: 'passeio' }
    ]
  },
  { id: 'santiago-2027', title: 'Santiago', country: 'Chile', iso: 'CHL', city: 'Santiago', cover: '/assets/viagens/santiago.jpg', center: [-33.45, -70.66], zoom: 12, start: '2027-07-08', end: '2027-07-12', status: 'planejando', people: [{ name: 'Marina Duarte', initials: 'MD', color: '#7f11f4' }], days: [] },
  { id: 'lisboa-porto-2026', title: 'Lisboa e Porto', country: 'Portugal', iso: 'PRT', city: 'Lisboa', cover: '/assets/viagens/lisboa.jpg', center: [38.72, -9.14], zoom: 12, start: '2026-10-03', end: '2026-10-09', status: 'concluida', people: [{ name: 'Marina Duarte', initials: 'MD', color: '#7f11f4' }], days: [] }
] : [];
