/* Avaliações do Guia, assinadas pelos personagens do OND (Edmundo, Miranda e o Ondino pela Equipe OND,
   ver comunidade-exemplo.js). Ficam no ar até o servidor de resenhas existir. Cidades batem com as
   viagens de exemplo (roteiros-exemplo.js) e as coordenadas são aproximadas. Precisa de comunidade.js
   e comunidade-exemplo.js antes. Fora do localhost as curtidas começam do zero.
   cat: lugar | passeio | restaurante | hotel. type: o tipo de item do roteiro (roteiro.js).
   meal (restaurante): almoco | jantar, para sugerir o horário. */
var OND_AVALIACOES = (function () {
  var NORONHA = '/assets/viagens/fernando-de-noronha.jpg';
  var list = [
    /* Fernando de Noronha */
    { id: 'av-fen-0', cat: 'lugar', type: 'praia', title: 'Baía dos Porcos', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8513, lng: -32.4413, rate: 5, by: 'edmundo', month: '2026-03', likes: 58, photo: NORONHA, minutes: 120,
      text: 'A vista do Morro Dois Irmãos é essa da foto. Vá na maré baixa, quando as piscinas naturais aparecem, e leve sapatilha porque o caminho é pelas pedras.' },
    { id: 'av-fen-1', cat: 'lugar', type: 'praia', title: 'Baía do Sancho', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8545, lng: -32.445, rate: 5, by: 'edmundo', month: '2026-03', likes: 51, minutes: 150,
      text: 'A descida é por uma escada dentro da fenda da rocha, então vá de mãos livres. Chegue cedo: até as 10h a praia fica quase vazia e a água está parada.' },
    { id: 'av-fen-2', cat: 'lugar', type: 'mirante', title: 'Forte dos Remédios', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8378, lng: -32.4085, rate: 4, by: 'edmundo', month: '2025-11', likes: 12, minutes: 60,
      text: 'Subida curta a partir da Vila. A vista do Morro do Pico e da Praia do Cachorro no fim da tarde compensa. Leve água, não tem nada lá em cima.' },
    { id: 'av-fen-3', cat: 'passeio', type: 'trilha', title: 'Trilha do Capim-Açu', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8693, lng: -32.4386, rate: 5, by: 'edmundo', month: '2026-01', likes: 22, minutes: 240,
      text: 'É a trilha mais longa da ilha e só sai com guia do parque. Termina num mirante sobre a Baía dos Golfinhos. Tênis fechado e saída cedo, antes do sol forte.' },
    { id: 'av-fen-4', cat: 'passeio', type: 'passeio', title: 'Mergulho de batismo', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8338, lng: -32.4002, rate: 4.5, by: 'edmundo', month: '2026-03', likes: 17, minutes: 180,
      text: 'Nunca tinha mergulhado e o instrutor ficou o tempo todo do meu lado. Vi tartaruga e raia a poucos metros. Marque para os primeiros dias, porque não pode voar logo depois.' },
    { id: 'av-fen-5', cat: 'restaurante', type: 'comida', meal: 'almoco', title: 'Cacimba Bistrô', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8404, lng: -32.411, rate: 4.5, by: 'equipe.ond', month: '2026-03', likes: 19,
      text: 'Na Vila dos Remédios, bom para almoçar entre uma praia e outra. O peixe do dia com purê de macaxeira é o pedido certo. Mesa rápida antes das 12h30.' },
    { id: 'av-fen-6', cat: 'restaurante', type: 'comida', meal: 'jantar', title: 'Mergulhão', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8333, lng: -32.4024, rate: 5, by: 'edmundo', month: '2025-11', likes: 34,
      text: 'Fica de frente para o Porto e o pôr do sol daqui é o mais bonito da ilha. Reserve para o começo da noite e peça a moqueca para dividir.' },
    { id: 'av-fen-7', cat: 'restaurante', type: 'comida', meal: 'jantar', title: 'Restaurante Varanda', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8467, lng: -32.4229, rate: 4, by: 'equipe.ond', month: '2026-03', likes: 8,
      text: 'Comida caseira bem feita, sem pressa. Precisa de reserva na alta temporada. Fica fora da Vila, então combine o táxi da volta antes.' },
    { id: 'av-fen-8', cat: 'hotel', type: 'hotel', title: 'Pousada Maravilha', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8653, lng: -32.4247, rate: 5, by: 'equipe.ond', month: '2026-01', likes: 14,
      text: 'Bangalôs com vista para a Baía do Sueste e café da manhã longo. Fica longe da Vila, então vale alugar um buggy.' },
    { id: 'av-fen-9', cat: 'hotel', type: 'hotel', title: 'Pousada Zé Maria', city: 'Fernando de Noronha', iso: 'BRA', lat: -3.8444, lng: -32.4206, rate: 4.5, by: 'equipe.ond', month: '2025-11', likes: 11,
      text: 'Perto da Praia da Conceição e do Boldró, dá para fazer muita coisa a pé. O festival gastronômico de quarta e sábado é conhecido na ilha.' },

    /* Porto */
    { id: 'av-opo-1', cat: 'lugar', type: 'passeio', title: 'Livraria Lello', city: 'Porto', iso: 'PRT', lat: 41.1469, lng: -8.6149, rate: 3.5, by: 'miranda', month: '2026-08', likes: 10, minutes: 45,
      text: 'A escada é linda, mas lota. Compre o ingresso antes e vá na primeira hora. Em 30 minutos você vê tudo.' },
    { id: 'av-opo-2', cat: 'passeio', type: 'passeio', title: 'Cruzeiro das Seis Pontes', city: 'Porto', iso: 'PRT', lat: 41.1406, lng: -8.6128, rate: 4, by: 'miranda', month: '2026-10', likes: 13, minutes: 60,
      text: 'Cinquenta minutos pelo Douro, saindo da Ribeira. Bom para descansar as pernas e entender a cidade vista do rio.' },
    { id: 'av-opo-3', cat: 'restaurante', type: 'comida', meal: 'almoco', title: 'Café Santiago', city: 'Porto', iso: 'PRT', lat: 41.1468, lng: -8.607, rate: 4.5, by: 'edmundo', month: '2026-09', likes: 21,
      text: 'A francesinha mais pedida da cidade. Vai com fome e chega antes do meio-dia, depois forma fila na calçada.' },

    /* Paris */
    { id: 'av-par-1', cat: 'lugar', type: 'passeio', title: 'Musée d\'Orsay', city: 'Paris', iso: 'FRA', lat: 48.86, lng: 2.3266, rate: 5, by: 'miranda', month: '2026-05', likes: 29, minutes: 180,
      text: 'Mais fácil de encarar que o Louvre e com os impressionistas todos no quinto andar. O relógio gigante dá a melhor foto. Quinta tem horário estendido.' },
    { id: 'av-par-2', cat: 'lugar', type: 'mirante', title: 'Sacré-Cœur no fim da tarde', city: 'Paris', iso: 'FRA', lat: 48.8867, lng: 2.3431, rate: 4.5, by: 'miranda', month: '2026-05', likes: 18, minutes: 90,
      text: 'Suba a escadaria uma hora antes do pôr do sol e sente nos degraus. Depois desça por Montmartre pelas ruas de trás, longe da praça dos pintores.' },
    { id: 'av-par-3', cat: 'passeio', type: 'passeio', title: 'Barco no Sena', city: 'Paris', iso: 'FRA', lat: 48.8622, lng: 2.2966, rate: 4, by: 'miranda', month: '2026-04', likes: 9, photo: '/assets/viagens/paris.jpg', minutes: 60,
      text: 'Uma hora de barco saindo do pé da Torre. Pegue o fim da tarde: na ida ainda é dia e na volta a Torre está acesa e pisca na hora cheia.' },
    { id: 'av-par-4', cat: 'restaurante', type: 'comida', meal: 'jantar', title: 'Le Relais de l\'Entrecôte', city: 'Paris', iso: 'FRA', lat: 48.8547, lng: 2.333, rate: 4, by: 'edmundo', month: '2026-05', likes: 16,
      text: 'Só tem um prato, bife com fritas e o molho da casa, e é isso que você quer. Não aceita reserva: chegue antes das 19h.' },
    { id: 'av-par-5', cat: 'hotel', type: 'hotel', title: 'Hôtel des Grands Boulevards', city: 'Paris', iso: 'FRA', lat: 48.8712, lng: 2.3486, rate: 4.5, by: 'equipe.ond', month: '2026-05', likes: 7,
      text: 'Quartos pequenos, como quase tudo em Paris, mas silenciosos. O metrô fica na porta e dá para ir a pé até o Marais.' },

    /* Santiago */
    { id: 'av-scl-1', cat: 'lugar', type: 'mirante', title: 'Cerro San Cristóbal', city: 'Santiago', iso: 'CHL', lat: -33.4255, lng: -70.6334, rate: 4.5, by: 'edmundo', month: '2025-07', likes: 20, minutes: 120,
      text: 'Suba de funicular e desça de teleférico. Em dia limpo de inverno a cordilheira aparece nevada atrás dos prédios.' },
    { id: 'av-scl-2', cat: 'passeio', type: 'passeio', title: 'Vinícola Concha y Toro', city: 'Santiago', iso: 'CHL', lat: -33.6345, lng: -70.5743, rate: 4, by: 'miranda', month: '2025-07', likes: 15, minutes: 180,
      text: 'Dá para ir de metrô e táxi, sem excursão. A visita clássica é boa para quem nunca foi a uma vinícola. Reserve o horário da manhã.' },
    { id: 'av-scl-3', cat: 'passeio', type: 'passeio', title: 'Dia de neve no Valle Nevado', city: 'Santiago', iso: 'CHL', lat: -33.3569, lng: -70.2489, rate: 5, by: 'edmundo', month: '2025-08', likes: 26, minutes: 480,
      text: 'A estrada tem muitas curvas, então tome café leve. Vale alugar a roupa na cidade na véspera. Volta no fim da tarde, cansado e feliz.' },
    { id: 'av-scl-4', cat: 'restaurante', type: 'comida', meal: 'almoco', title: 'Mercado Central', city: 'Santiago', iso: 'CHL', lat: -33.4335, lng: -70.6513, rate: 3.5, by: 'edmundo', month: '2025-07', likes: 6,
      text: 'Os restaurantes do meio do mercado chamam na porta. Os das bordas são mais simples e melhores. Peça o caldo de mariscos no almoço.' },
    { id: 'av-scl-5', cat: 'hotel', type: 'hotel', title: 'The Singular Santiago', city: 'Santiago', iso: 'CHL', lat: -33.4367, lng: -70.638, rate: 4.5, by: 'equipe.ond', month: '2025-07', likes: 9,
      text: 'No Lastarria, um bairro bom para andar a pé à noite. Piscina no terraço com vista para o Cerro Santa Lucía.' }
  ];

  /* Lisboa: as mesmas resenhas que aparecem em /explorar/destino/?cidade=PTLIS, com tipo e coordenadas */
  var LISBOA = {
    ex1: { cat: 'lugar', type: 'mirante', lat: 38.719, lng: -9.1328, minutes: 60 },
    ex2: { cat: 'restaurante', type: 'comida', meal: 'almoco', lat: 38.7069, lng: -9.1458 },
    ex3: { cat: 'lugar', type: 'passeio', lat: 38.6916, lng: -9.216, minutes: 60 },
    ex4: { cat: 'passeio', type: 'passeio', lat: 38.7036, lng: -9.1783, minutes: 120 }
  };
  var lisboa = ((OND_EXEMPLO && OND_EXEMPLO.reviews.PTLIS) || []).filter(function (review) { return LISBOA[review.id]; }).map(function (review) {
    return Object.assign({ id: 'av-lis-' + review.id, title: review.place, city: 'Lisboa', iso: 'PRT', rate: review.rate, by: review.by, month: review.month, likes: review.likes, text: review.text, review: review.id }, LISBOA[review.id]);
  });
  lisboa.push(
    { id: 'av-lis-5', cat: 'restaurante', type: 'comida', meal: 'jantar', title: 'Cervejaria Ramiro', city: 'Lisboa', iso: 'PRT', lat: 38.7206, lng: -9.1356, rate: 5, by: 'edmundo', month: '2026-07', likes: 37,
      text: 'Marisco fresco, cerveja gelada e prego no pão de sobremesa, como manda a casa. Não aceita reserva: vá cedo ou espere na fila, que anda rápido.' },
    { id: 'av-lis-8', cat: 'passeio', type: 'passeio', title: 'Elétrico 28', city: 'Lisboa', iso: 'PRT', lat: 38.7105, lng: -9.1365, rate: 4, by: 'miranda', month: '2026-10', likes: 18, photo: '/assets/viagens/lisboa.jpg', minutes: 60,
      text: 'Pegue no Martim Moniz, no começo da linha, para ir sentado na janela. Antes das 9h ou depois das 18h, senão vira fila de turista.' },
    { id: 'av-lis-6', cat: 'passeio', type: 'passeio', title: 'Bate-volta a Sintra', city: 'Lisboa', iso: 'PRT', lat: 38.7876, lng: -9.3905, rate: 4.5, by: 'miranda', month: '2026-08', likes: 24, minutes: 480,
      text: 'Trem do Rossio até Sintra e, de lá, ônibus até a Pena. Escolha dois palácios no máximo, senão vira maratona. A Quinta da Regaleira vale a manhã.' },
    { id: 'av-lis-7', cat: 'hotel', type: 'hotel', title: 'Memmo Alfama', city: 'Lisboa', iso: 'PRT', lat: 38.711, lng: -9.1307, rate: 4.5, by: 'equipe.ond', month: '2026-10', likes: 12,
      text: 'Escondido numa ruela de Alfama, com terraço sobre o Tejo. Subir com mala é puxado, peça o transfer até a porta.' }
  );
  var todas = list.concat(lisboa);
  if (!IS_DEMO) todas.forEach(function (item) { item.likes = 0; });
  return todas;
})();
