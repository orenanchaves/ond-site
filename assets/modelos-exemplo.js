/* EXEMPLO PARA APROVAR O DESENHO. Só carrega no localhost (IS_DEMO). Não publicar como conteúdo real:
   são roteiros à venda de viajantes de exemplo (assets/comunidade-exemplo.js). Quando a loja de
   roteiros existir no servidor, este arquivo sai. Formato igual ao de assets/roteiros-prontos.js. */
var OND_MODELOS_COMUNIDADE = [
  {
    id: 'comunidade-lisboa-sem-pressa', autor: 'Miranda', handle: 'miranda', preco: '19,90', publicado: true,
    title: 'Lisboa sem pressa', cover: '/assets/viagens/lisboa.jpg', continente: 'Europa', estilos: 'cultura gastronomia',
    resumo: 'Quatro dias a pé, com miradouro no fim da tarde, Belém cedo antes da fila e um dia em Sintra.',
    stops: [
      { city: 'Lisboa', country: 'Portugal', iso: 'PRT', lat: 38.7223, lng: -9.1393, nights: 4, plan: [
        [['10:00', 'passeio', 'Alfama e Castelo de São Jorge', 38.7139, -9.1334, 180], ['18:30', 'mirante', 'Miradouro da Senhora do Monte', 38.7193, -9.1328, 60]],
        [['08:30', 'passeio', 'Mosteiro dos Jerónimos', 38.6979, -9.2068, 90], ['10:30', 'comida', 'Pastéis de Belém', 38.6975, -9.2032, 45], ['11:30', 'passeio', 'Torre de Belém', 38.6916, -9.2160, 60], ['16:00', 'passeio', 'LX Factory', 38.7036, -9.1784, 120]],
        [['09:00', 'passeio', 'Palácio da Pena, em Sintra', 38.7876, -9.3906, 240]]
      ] }
    ]
  },
  {
    id: 'comunidade-noronha-mergulho', autor: 'Edmundo', handle: 'edmundo', preco: '29,90', publicado: true,
    title: 'Noronha de mergulho', cover: '/assets/viagens/fernando-de-noronha.jpg', continente: 'Brasil', estilos: 'praia natureza',
    resumo: 'Cinco dias pensados pela maré: baías de manhã, mirante no pôr do sol e o mergulho de batismo no meio da viagem.',
    stops: [
      { city: 'Fernando de Noronha', country: 'Brasil', iso: 'BRA', lat: -3.8547, lng: -32.4245, nights: 5, plan: [
        [['08:00', 'praia', 'Baía do Sancho', -3.8547, -32.4433, 180], ['17:00', 'mirante', 'Mirante do Boldró', -3.8612, -32.4301, 60]],
        [['07:30', 'praia', 'Baía dos Porcos', -3.8511, -32.4400, 150], ['16:30', 'mirante', 'Mirante dos Golfinhos', -3.8576, -32.4467, 60]],
        [['08:00', 'praia', 'Mergulho de batismo no Porto de Santo Antônio', -3.8325, -32.4040, 180]],
        [['08:30', 'trilha', 'Trilha do Atalaia', -3.8680, -32.4170, 150]]
      ] }
    ]
  }
];
