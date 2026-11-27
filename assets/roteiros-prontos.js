/* Roteiros prontos para começar uma viagem em /explorar/viagens/nova/. Cada parada traz a cidade,
   as noites sugeridas e um plano curto por dia (hora, tipo, título, lat, lng, minutos).
   "via" força o meio de transporte do trecho que chega nessa parada. */
var OND_PRONTOS = [
  {
    id: 'eurotour', continente: 'Europa', estilos: 'cultura gastronomia', title: 'Eurotour clássico', cover: '/assets/viagens/paris.jpg',
    stops: [
      { city: 'Paris', country: 'França', iso: 'FRA', lat: 48.8566, lng: 2.3522, nights: 4, plan: [
        [['09:00', 'mirante', 'Torre Eiffel', 48.8584, 2.2945, 120], ['12:30', 'comida', 'Almoço no Champ de Mars', 48.8556, 2.2986, 90], ['15:00', 'passeio', 'Barco pelo Sena', 48.8606, 2.2977, 60]],
        [['09:30', 'passeio', 'Museu do Louvre', 48.8606, 2.3376, 180], ['14:00', 'passeio', 'Jardim das Tulherias', 48.8635, 2.3275, 60], ['17:00', 'passeio', 'Champs-Élysées e Arco do Triunfo', 48.8738, 2.295, 90]],
        [['10:00', 'mirante', 'Montmartre e Sacré-Cœur', 48.8867, 2.3431, 120], ['15:00', 'passeio', 'Le Marais', 48.859, 2.362, 120]]
      ] },
      { city: 'Interlaken', country: 'Suíça', iso: 'CHE', lat: 46.6863, lng: 7.8632, nights: 2, plan: [
        [['08:30', 'trilha', 'Trem até Jungfraujoch', 46.5475, 7.9853, 480]]
      ] },
      { city: 'Veneza', country: 'Itália', iso: 'ITA', lat: 45.4408, lng: 12.3155, nights: 2, plan: [
        [['09:00', 'passeio', 'Praça e Basílica de São Marcos', 45.4341, 12.3388, 120], ['14:00', 'passeio', 'Ponte de Rialto', 45.438, 12.3359, 60], ['16:00', 'passeio', 'Gôndola pelos canais', 45.4371, 12.3326, 60]]
      ] },
      { city: 'Florença', country: 'Itália', iso: 'ITA', lat: 43.7696, lng: 11.2558, nights: 2, plan: [
        [['09:00', 'passeio', 'Galleria degli Uffizi', 43.7678, 11.2553, 180], ['14:30', 'passeio', 'Duomo de Florença', 43.7731, 11.256, 90], ['18:30', 'mirante', 'Pôr do sol na Piazzale Michelangelo', 43.7629, 11.265, 60]]
      ] },
      { city: 'Roma', country: 'Itália', iso: 'ITA', lat: 41.9028, lng: 12.4964, nights: 4, plan: [
        [['09:00', 'passeio', 'Coliseu e Fórum Romano', 41.8902, 12.4922, 240], ['17:00', 'passeio', 'Fontana di Trevi', 41.9009, 12.4833, 45]],
        [['08:30', 'passeio', 'Museus do Vaticano e Capela Sistina', 41.9065, 12.4536, 240], ['14:30', 'passeio', 'Basílica de São Pedro', 41.9022, 12.4539, 90]],
        [['10:00', 'passeio', 'Panteão', 41.8986, 12.4769, 60], ['12:30', 'comida', 'Almoço em Trastevere', 41.8897, 12.47, 90], ['16:00', 'passeio', 'Piazza Navona', 41.8992, 12.4731, 60]]
      ] }
    ]
  },
  {
    id: 'japao-tailandia', continente: 'Ásia', estilos: 'cultura praia', title: 'Japão e Tailândia', cover: '/assets/viagens/japao.jpg',
    stops: [
      { city: 'Tóquio', country: 'Japão', iso: 'JPN', lat: 35.6762, lng: 139.6503, nights: 4, plan: [
        [['09:00', 'passeio', 'Templo Senso-ji em Asakusa', 35.7148, 139.7967, 120], ['14:00', 'mirante', 'Tokyo Skytree', 35.7101, 139.8107, 90]],
        [['10:00', 'passeio', 'Santuário Meiji', 35.6764, 139.6993, 90], ['13:00', 'passeio', 'Harajuku e Omotesando', 35.6702, 139.7027, 120], ['18:00', 'mirante', 'Cruzamento de Shibuya', 35.6595, 139.7005, 60]],
        [['08:00', 'comida', 'Mercado de Tsukiji', 35.6654, 139.7707, 120], ['13:00', 'passeio', 'teamLab Planets', 35.6491, 139.7898, 120]]
      ] },
      { city: 'Quioto', country: 'Japão', iso: 'JPN', lat: 35.0116, lng: 135.7681, nights: 3, plan: [
        [['08:00', 'trilha', 'Fushimi Inari', 34.9671, 135.7727, 180], ['14:00', 'passeio', 'Kiyomizu-dera', 34.9949, 135.785, 120]],
        [['08:30', 'passeio', 'Bosque de bambu de Arashiyama', 35.017, 135.6713, 120], ['14:00', 'passeio', 'Kinkaku-ji, o Pavilhão Dourado', 35.0394, 135.7292, 90]]
      ] },
      { city: 'Bangkok', country: 'Tailândia', iso: 'THA', lat: 13.7563, lng: 100.5018, nights: 3, plan: [
        [['09:00', 'passeio', 'Grande Palácio', 13.75, 100.4913, 180], ['13:30', 'passeio', 'Wat Pho', 13.7465, 100.4927, 90], ['17:00', 'mirante', 'Wat Arun ao entardecer', 13.7437, 100.4888, 60]],
        [['10:00', 'passeio', 'Mercado de Chatuchak', 13.7999, 100.55, 180], ['19:00', 'comida', 'Comida de rua em Chinatown', 13.74, 100.51, 120]]
      ] },
      { city: 'Phuket', country: 'Tailândia', iso: 'THA', lat: 7.8804, lng: 98.3923, nights: 3, plan: [
        [['08:00', 'praia', 'Barco até Phi Phi', 7.7407, 98.7784, 480]],
        [['10:00', 'praia', 'Praia de Kata', 7.8206, 98.298, 240], ['17:30', 'mirante', 'Pôr do sol no Promthep Cape', 7.7619, 98.305, 60]]
      ] }
    ]
  },
  {
    id: 'iberica', continente: 'Europa', estilos: 'cultura gastronomia', title: 'Portugal e Espanha', cover: '/assets/viagens/lisboa.jpg',
    stops: [
      { city: 'Lisboa', country: 'Portugal', iso: 'PRT', lat: 38.7223, lng: -9.1393, nights: 3, plan: [
        [['09:30', 'passeio', 'Torre de Belém e Jerónimos', 38.6916, -9.216, 180], ['14:00', 'comida', 'Pastéis de Belém', 38.6975, -9.2032, 45], ['17:00', 'mirante', 'Miradouro de Santa Luzia', 38.7118, -9.1302, 45]],
        [['10:00', 'passeio', 'Alfama e Castelo de São Jorge', 38.7139, -9.1334, 180], ['15:00', 'passeio', 'Bairro Alto e Chiado', 38.7115, -9.144, 120]]
      ] },
      { city: 'Porto', country: 'Portugal', iso: 'PRT', lat: 41.1579, lng: -8.6291, nights: 2, plan: [
        [['10:00', 'passeio', 'Ribeira e Ponte Dom Luís', 41.1405, -8.611, 120], ['15:00', 'comida', 'Caves do vinho do Porto', 41.1373, -8.6133, 90], ['18:00', 'passeio', 'Livraria Lello', 41.1469, -8.615, 45]]
      ] },
      { city: 'Sevilha', country: 'Espanha', iso: 'ESP', lat: 37.3891, lng: -5.9845, nights: 2, via: 'voo', plan: [
        [['09:30', 'passeio', 'Real Alcázar', 37.3831, -5.9902, 150], ['13:00', 'passeio', 'Catedral e Giralda', 37.3858, -5.993, 90], ['18:00', 'passeio', 'Plaza de España', 37.3772, -5.9869, 60]]
      ] },
      { city: 'Madri', country: 'Espanha', iso: 'ESP', lat: 40.4168, lng: -3.7038, nights: 3, plan: [
        [['10:00', 'passeio', 'Museu do Prado', 40.4138, -3.6921, 180], ['15:00', 'passeio', 'Parque do Retiro', 40.4153, -3.6845, 90]],
        [['10:00', 'passeio', 'Palácio Real', 40.418, -3.7143, 120], ['13:00', 'comida', 'Mercado de San Miguel', 40.4154, -3.709, 60], ['15:00', 'passeio', 'Plaza Mayor e Puerta del Sol', 40.4155, -3.7074, 60]]
      ] }
    ]
  },
  {
    id: 'patagonia', continente: 'América do Sul', estilos: 'natureza', title: 'Buenos Aires e Patagônia', cover: '/assets/viagens/patagonia.jpg',
    stops: [
      { city: 'Buenos Aires', country: 'Argentina', iso: 'ARG', lat: -34.6037, lng: -58.3816, nights: 3, plan: [
        [['10:00', 'passeio', 'Caminito e La Boca', -34.6393, -58.3627, 120], ['14:00', 'passeio', 'San Telmo', -34.6212, -58.3731, 120], ['20:30', 'comida', 'Jantar com show de tango', -34.6177, -58.3712, 150]],
        [['10:00', 'passeio', 'Recoleta', -34.5875, -58.3933, 120], ['15:00', 'passeio', 'Puerto Madero', -34.6118, -58.3622, 90]]
      ] },
      { city: 'El Calafate', country: 'Argentina', iso: 'ARG', lat: -50.3379, lng: -72.2648, nights: 3, plan: [
        [['08:00', 'trilha', 'Glaciar Perito Moreno', -50.4967, -73.1377, 480]],
        [['09:00', 'passeio', 'Navegação pelo Lago Argentino', -50.25, -72.6, 420]]
      ] },
      { city: 'Bariloche', country: 'Argentina', iso: 'ARG', lat: -41.1335, lng: -71.3103, nights: 3, plan: [
        [['09:00', 'mirante', 'Cerro Campanario', -41.075, -71.47, 120], ['14:00', 'passeio', 'Circuito Chico', -41.06, -71.52, 240]],
        [['09:00', 'trilha', 'Cerro Catedral', -41.1667, -71.45, 360]]
      ] }
    ]
  },
  {
    id: 'rota-emocoes', continente: 'Brasil', estilos: 'praia natureza', title: 'Jericoacoara e Lençóis', cover: '/assets/viagens/lencois-maranhenses.jpg',
    stops: [
      { city: 'Jericoacoara', country: 'Brasil', iso: 'BRA', lat: -2.7975, lng: -40.5137, nights: 3, plan: [
        [['10:00', 'praia', 'Pedra Furada', -2.793, -40.499, 120], ['17:00', 'mirante', 'Pôr do sol na Duna', -2.795, -40.517, 60]],
        [['09:00', 'praia', 'Lagoa do Paraíso', -2.874, -40.444, 300]]
      ] },
      { city: 'Barreirinhas', country: 'Brasil', iso: 'BRA', lat: -2.7569, lng: -42.8269, nights: 3, plan: [
        [['08:00', 'passeio', 'Lençóis: Lagoa Azul', -2.605, -42.88, 300]],
        [['13:00', 'passeio', 'Lagoa Bonita', -2.66, -42.81, 300]]
      ] }
    ]
  },
  {
    id: 'noronha', continente: 'Brasil', estilos: 'praia natureza romantico', title: 'Fernando de Noronha', cover: '/assets/viagens/fernando-de-noronha.jpg',
    stops: [
      { city: 'Fernando de Noronha', country: 'Brasil', iso: 'BRA', lat: -3.854, lng: -32.424, nights: 5, plan: [
        [['09:00', 'praia', 'Baía do Sancho', -3.8546, -32.4426, 180], ['16:30', 'mirante', 'Pôr do sol no Forte do Boldró', -3.8476, -32.4256, 60]],
        [['08:00', 'trilha', 'Trilha do Atalaia', -3.878, -32.411, 180], ['14:00', 'praia', 'Praia do Leão', -3.873, -32.414, 120]],
        [['09:00', 'passeio', 'Passeio de barco', -3.834, -32.405, 180], ['16:00', 'praia', 'Praia da Conceição', -3.841, -32.415, 120]]
      ] }
    ]
  }
  ,
  {
    id: 'londres-paris', continente: 'Europa', estilos: 'cultura', title: 'Londres e Paris',
    stops: [
      { city: 'Londres', country: 'Reino Unido', iso: 'GBR', lat: 51.5074, lng: -0.1278, nights: 4, plan: [
        [['09:00', 'passeio', 'Torre de Londres', 51.5081, -0.0759, 150], ['14:00', 'passeio', 'Tower Bridge e Borough Market', 51.5055, -0.0754, 120]],
        [['10:00', 'passeio', 'British Museum', 51.5194, -0.127, 180], ['16:00', 'passeio', 'Covent Garden', 51.5117, -0.124, 90]],
        [['10:00', 'passeio', 'Palácio de Buckingham', 51.5014, -0.1419, 90], ['14:00', 'mirante', 'London Eye', 51.5033, -0.1196, 60]]
      ] },
      { city: 'Paris', country: 'França', iso: 'FRA', lat: 48.8566, lng: 2.3522, nights: 3, via: 'trem', plan: [
        [['09:00', 'mirante', 'Torre Eiffel', 48.8584, 2.2945, 120], ['15:00', 'passeio', 'Barco pelo Sena', 48.8606, 2.2977, 60]],
        [['09:30', 'passeio', 'Museu do Louvre', 48.8606, 2.3376, 180], ['16:00', 'mirante', 'Montmartre e Sacré-Cœur', 48.8867, 2.3431, 120]]
      ] }
    ]
  },
  {
    id: 'grecia', continente: 'Europa', estilos: 'praia romantico cultura', title: 'Atenas e Santorini',
    stops: [
      { city: 'Atenas', country: 'Grécia', iso: 'GRC', lat: 37.9838, lng: 23.7275, nights: 3, plan: [
        [['09:00', 'passeio', 'Acrópole e Partenon', 37.9715, 23.7257, 180], ['14:00', 'passeio', 'Bairro de Plaka', 37.9725, 23.73, 120]]
      ] },
      { city: 'Santorini', country: 'Grécia', iso: 'GRC', lat: 36.3932, lng: 25.4615, nights: 4, via: 'voo', plan: [
        [['17:30', 'mirante', 'Pôr do sol em Oia', 36.4618, 25.3753, 120]],
        [['10:00', 'praia', 'Praia Vermelha', 36.3486, 25.395, 180]],
        [['11:00', 'comida', 'Vinícola com vista da caldeira', 36.4, 25.43, 120]]
      ] }
    ]
  },
  {
    id: 'maldivas', continente: 'Ásia', estilos: 'praia romantico', title: 'Maldivas', cover: '/assets/viagens/maldivas.jpg',
    stops: [
      { city: 'Maldivas', country: 'Maldivas', iso: 'MDV', lat: 4.1755, lng: 73.5093, nights: 6, plan: [
        [['09:00', 'praia', 'Snorkel no recife', 4.18, 73.51, 180]],
        [['16:00', 'passeio', 'Barco para ver golfinhos', 4.2, 73.45, 120]],
        [['19:30', 'comida', 'Jantar na areia', 4.17, 73.5, 120]]
      ] }
    ]
  },
  {
    id: 'peru', continente: 'América do Sul', estilos: 'cultura natureza', title: 'Lima e Machu Picchu', cover: '/assets/viagens/machu-picchu.jpg',
    stops: [
      { city: 'Lima', country: 'Peru', iso: 'PER', lat: -12.0464, lng: -77.0428, nights: 2, plan: [
        [['10:00', 'passeio', 'Miraflores e o Malecón', -12.1211, -77.0297, 120], ['13:00', 'comida', 'Almoço de ceviche', -12.119, -77.035, 90]]
      ] },
      { city: 'Cusco', country: 'Peru', iso: 'PER', lat: -13.532, lng: -71.9675, nights: 4, plan: [
        [['09:00', 'passeio', 'Centro histórico de Cusco', -13.5167, -71.9781, 180]],
        [['06:00', 'trilha', 'Machu Picchu', -13.1631, -72.545, 480]],
        [['08:00', 'passeio', 'Vale Sagrado', -13.3333, -72.0833, 420]]
      ] }
    ]
  },
  {
    id: 'chile', continente: 'América do Sul', estilos: 'natureza gastronomia', title: 'Santiago e Atacama', cover: '/assets/viagens/santiago.jpg',
    stops: [
      { city: 'Santiago', country: 'Chile', iso: 'CHL', lat: -33.4489, lng: -70.6693, nights: 3, plan: [
        [['10:00', 'mirante', 'Cerro San Cristóbal', -33.4253, -70.6331, 120], ['15:00', 'passeio', 'Bairro Lastarria', -33.4378, -70.6407, 90]],
        [['09:00', 'comida', 'Vinícola no Vale do Maipo', -33.65, -70.6, 300]]
      ] },
      { city: 'San Pedro de Atacama', country: 'Chile', iso: 'CHL', lat: -22.9087, lng: -68.1997, nights: 4, plan: [
        [['16:00', 'mirante', 'Vale da Lua ao pôr do sol', -22.923, -68.27, 180]],
        [['05:00', 'passeio', 'Gêiseres del Tatio', -22.335, -68.011, 360]],
        [['09:00', 'passeio', 'Lagunas altiplânicas', -23.733, -67.783, 480]]
      ] }
    ]
  },
  {
    id: 'gramado', continente: 'Brasil', estilos: 'romantico gastronomia', title: 'Gramado e Canela', cover: '/assets/viagens/gramado.jpg',
    stops: [
      { city: 'Gramado', country: 'Brasil', iso: 'BRA', lat: -29.3746, lng: -50.8764, nights: 4, plan: [
        [['10:00', 'passeio', 'Lago Negro', -29.3888, -50.8789, 90], ['15:00', 'passeio', 'Rua Coberta', -29.3786, -50.8747, 60], ['20:00', 'comida', 'Fondue', -29.378, -50.876, 120]],
        [['09:00', 'mirante', 'Cascata do Caracol em Canela', -29.3128, -50.8586, 180], ['15:00', 'passeio', 'Catedral de Pedra', -29.3655, -50.8115, 60]],
        [['10:00', 'comida', 'Vinícolas do Vale dos Vinhedos', -29.17, -51.56, 360]]
      ] }
    ]
  },
  {
    id: 'orlando-miami', continente: 'América do Norte', estilos: 'familia praia', title: 'Orlando e Miami', cover: '/assets/viagens/orlando.jpg',
    stops: [
      { city: 'Orlando', country: 'Estados Unidos', iso: 'USA', lat: 28.5383, lng: -81.3792, nights: 5, plan: [
        [['09:00', 'passeio', 'Magic Kingdom', 28.4177, -81.5812, 600]],
        [['09:00', 'passeio', 'Universal Studios', 28.4743, -81.4678, 600]],
        [['09:00', 'passeio', 'EPCOT', 28.3747, -81.5494, 540]],
        [['10:00', 'passeio', 'Kennedy Space Center', 28.5729, -80.649, 360]]
      ] },
      { city: 'Miami', country: 'Estados Unidos', iso: 'USA', lat: 25.7617, lng: -80.1918, nights: 3, plan: [
        [['10:00', 'praia', 'South Beach', 25.7826, -80.1341, 240], ['17:00', 'passeio', 'Wynwood Walls', 25.801, -80.1994, 90]],
        [['10:00', 'passeio', 'Little Havana', 25.7656, -80.2192, 120]]
      ] }
    ]
  },
  {
    id: 'nova-york', continente: 'América do Norte', estilos: 'cultura gastronomia', title: 'Nova York', cover: '/assets/viagens/nova-york.jpg',
    stops: [
      { city: 'Nova York', country: 'Estados Unidos', iso: 'USA', lat: 40.7128, lng: -74.006, nights: 5, plan: [
        [['09:00', 'passeio', 'Central Park', 40.7829, -73.9654, 150], ['14:00', 'passeio', 'Metropolitan Museum', 40.7794, -73.9632, 150], ['19:00', 'mirante', 'Top of the Rock', 40.7593, -73.9794, 60]],
        [['09:00', 'passeio', 'Estátua da Liberdade', 40.6892, -74.0445, 240], ['15:00', 'passeio', 'Ponte do Brooklyn', 40.7061, -73.9969, 90]],
        [['10:00', 'passeio', 'High Line e Chelsea Market', 40.748, -74.0048, 180], ['20:00', 'passeio', 'Broadway', 40.759, -73.9845, 150]]
      ] }
    ]
  },
  {
    id: 'cancun-tulum', continente: 'América do Norte', estilos: 'praia cultura', title: 'Cancún e Tulum', cover: '/assets/viagens/cancun.jpg',
    stops: [
      { city: 'Cancún', country: 'México', iso: 'MEX', lat: 21.1619, lng: -86.8515, nights: 4, plan: [
        [['09:00', 'praia', 'Isla Mujeres', 21.2311, -86.731, 420]],
        [['08:00', 'passeio', 'Chichén Itzá', 20.6843, -88.5678, 540]],
        [['10:00', 'praia', 'Praia Delfines', 21.059, -86.779, 240]]
      ] },
      { city: 'Tulum', country: 'México', iso: 'MEX', lat: 20.2114, lng: -87.4654, nights: 3, plan: [
        [['08:30', 'passeio', 'Ruínas de Tulum', 20.2148, -87.429, 150], ['13:00', 'praia', 'Cenote Dos Ojos', 20.3245, -87.391, 180]]
      ] }
    ]
  },
  /* Viagens com cara de videogame: cidades reais que viraram cenário de jogo. Ficam em destaque
     na Nova viagem (tema: 'jogo'). Sem nome de jogo, editora ou marca no texto, como nas edições.
     Capas: fotos do Wikimedia Commons já usadas em /edicoes/miami/, autor e licença em edicoes/miami/creditos.json. */
  {
    id: 'jogo-miami-neon', tema: 'jogo', continente: 'América do Norte', estilos: 'praia cultura', title: 'Miami em neon e as Keys', cover: '/edicoes/miami/img/neon.webp', credito: 'neon',
    stops: [
      { city: 'Miami', country: 'Estados Unidos', iso: 'USA', lat: 25.7617, lng: -80.1918, nights: 4, plan: [
        [['10:00', 'passeio', 'Ocean Drive e o art déco', 25.781, -80.13, 150], ['13:00', 'praia', 'South Beach', 25.7826, -80.1341, 180], ['20:00', 'passeio', 'Ocean Drive à noite, com o neon aceso', 25.7787, -80.1318, 120]],
        [['09:30', 'passeio', 'Barco pela Star Island e Biscayne Bay', 25.777, -80.151, 120], ['15:00', 'passeio', 'Wynwood Walls', 25.801, -80.1994, 120]],
        [['08:30', 'trilha', 'Aerobarco nos Everglades', 25.7593, -80.6577, 300], ['18:00', 'comida', 'Calle Ocho, em Little Havana', 25.7656, -80.2195, 120]]
      ] },
      { city: 'Key West', country: 'Estados Unidos', iso: 'USA', lat: 24.5551, lng: -81.78, nights: 2, via: 'carro', plan: [
        [['10:00', 'mirante', 'Ponto mais ao sul dos Estados Unidos', 24.5465, -81.7975, 45], ['11:30', 'passeio', 'Duval Street', 24.557, -81.801, 150], ['18:30', 'mirante', 'Pôr do sol na Mallory Square', 24.5596, -81.8065, 90]]
      ] }
    ]
  },
  {
    id: 'jogo-nova-york', tema: 'jogo', continente: 'América do Norte', estilos: 'cultura', title: 'Nova York de ponta a ponta', cover: '/edicoes/miami/img/cidade-nova-york.webp', credito: 'cidade-nova-york',
    stops: [
      { city: 'Nova York', country: 'Estados Unidos', iso: 'USA', lat: 40.7128, lng: -74.006, nights: 5, plan: [
        [['09:00', 'passeio', 'Estátua da Liberdade de barco', 40.6892, -74.0445, 240], ['20:00', 'passeio', 'Times Square à noite', 40.758, -73.9855, 90]],
        [['10:00', 'passeio', 'Ponte do Brooklyn a pé', 40.7061, -73.9969, 90], ['12:00', 'mirante', 'Dumbo e a vista de Manhattan', 40.7033, -73.9881, 90], ['16:00', 'praia', 'Coney Island', 40.5755, -73.9707, 180]],
        [['10:00', 'passeio', 'Chinatown e Little Italy', 40.7158, -73.997, 150], ['18:00', 'mirante', 'Empire State no fim da tarde', 40.7484, -73.9857, 90]],
        [['13:00', 'passeio', 'Bronx e o Yankee Stadium', 40.8296, -73.9262, 180]]
      ] }
    ]
  },
  {
    id: 'jogo-california-vegas', tema: 'jogo', continente: 'América do Norte', estilos: 'cultura natureza', title: 'Califórnia e Las Vegas de carro', cover: '/edicoes/miami/img/carro.webp', credito: 'carro',
    stops: [
      { city: 'Los Angeles', country: 'Estados Unidos', iso: 'USA', lat: 34.0522, lng: -118.2437, nights: 3, plan: [
        [['10:00', 'passeio', 'Calçada da Fama', 34.1016, -118.3267, 90], ['17:00', 'mirante', 'Observatório Griffith e o letreiro', 34.1184, -118.3004, 150]],
        [['10:00', 'praia', 'Venice Beach', 33.985, -118.4695, 150], ['15:00', 'passeio', 'Píer de Santa Monica', 34.0094, -118.4973, 150]]
      ] },
      { city: 'São Francisco', country: 'Estados Unidos', iso: 'USA', lat: 37.7749, lng: -122.4194, nights: 2, via: 'carro', plan: [
        [['09:00', 'mirante', 'Golden Gate', 37.8199, -122.4783, 120], ['13:00', 'passeio', 'Lombard Street e o bondinho', 37.8021, -122.4187, 90], ['16:00', 'passeio', 'Chinatown', 37.7941, -122.4078, 120]]
      ] },
      { city: 'Las Vegas', country: 'Estados Unidos', iso: 'USA', lat: 36.1699, lng: -115.1398, nights: 2, plan: [
        [['10:00', 'trilha', 'Red Rock Canyon', 36.135, -115.427, 180], ['20:00', 'passeio', 'A Strip à noite', 36.1147, -115.1728, 180], ['23:00', 'passeio', 'Fremont Street', 36.1699, -115.1418, 90]]
      ] }
    ]
  },
  {
    id: 'jogo-los-angeles', tema: 'jogo', continente: 'América do Norte', estilos: 'praia cultura', title: 'Los Angeles de cinema', cover: '/edicoes/miami/img/cidade-los-angeles.webp', credito: 'cidade-los-angeles',
    stops: [
      { city: 'Los Angeles', country: 'Estados Unidos', iso: 'USA', lat: 34.0522, lng: -118.2437, nights: 5, plan: [
        [['09:00', 'passeio', 'Hollywood e a Calçada da Fama', 34.1016, -118.3267, 120], ['17:30', 'mirante', 'Observatório Griffith no pôr do sol', 34.1184, -118.3004, 150]],
        [['10:00', 'praia', 'Venice Beach e os canais', 33.985, -118.4695, 180], ['16:00', 'passeio', 'Píer de Santa Monica', 34.0094, -118.4973, 150]],
        [['10:00', 'passeio', 'Getty Center', 34.078, -118.4741, 180], ['15:00', 'passeio', 'Rodeo Drive', 34.0674, -118.4004, 90]],
        [['09:00', 'praia', 'Malibu e a praia El Matador', 34.0383, -118.8747, 240]]
      ] }
    ]
  },
  {
    id: 'jogo-londres-60', tema: 'jogo', continente: 'Europa', estilos: 'cultura', title: 'Londres dos anos 60', cover: '/edicoes/miami/img/cidade-londres.webp', credito: 'cidade-londres',
    stops: [
      { city: 'Londres', country: 'Reino Unido', iso: 'GBR', lat: 51.5074, lng: -0.1278, nights: 4, plan: [
        [['10:00', 'passeio', 'Carnaby Street e o Soho', 51.5133, -0.1389, 180], ['19:00', 'passeio', 'West End à noite', 51.5115, -0.1281, 150]],
        [['09:30', 'passeio', 'Faixa de pedestres da Abbey Road', 51.532, -0.1773, 60], ['13:00', 'passeio', 'Camden Market', 51.5413, -0.146, 150]],
        [['10:00', 'passeio', 'Portobello Road, em Notting Hill', 51.5153, -0.2058, 150], ['16:00', 'mirante', 'Tower Bridge', 51.5055, -0.0754, 90]]
      ] }
    ]
  }
];
var OND_ESTILOS = [['praia', 'Praia'], ['cultura', 'Cidades e cultura'], ['natureza', 'Natureza e aventura'], ['romantico', 'Romântico'], ['gastronomia', 'Comida e vinho'], ['familia', 'Em família']];
