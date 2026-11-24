/* Personagens do OND: Edmundo, Miranda e o Ondino, que fala pela Equipe OND. São o conteúdo de
   vitrine do Guia, dos destinos e dos perfis enquanto o servidor de resenhas não existe, e cada
   perfil diz na bio que é personagem, para ninguém achar que é uma pessoa real. Avatares em
   /assets/perfil/, recortados das ilustrações oficiais do design system.
   A conta de teste (Marina) e os números de curtidas e interessados só existem no localhost. */
var OND_EXEMPLO = (function () {
  var dados = {
    people: {
      edmundo: { name: 'Edmundo', handle: 'edmundo', color: '#560fb2', initials: 'ED', photo: '/assets/perfil/edmundo.svg', personagem: true,
        base: 'Recife', since: '2024-01', style: 'Trilha, praia e mochila',
        bio: 'Personagem do OND. Mochila nas costas, trilha de manhã e praia à tarde. Viajo gastando pouco e conto onde vale cada real.' },
      miranda: { name: 'Miranda', handle: 'miranda', color: '#a0600c', initials: 'MI', photo: '/assets/perfil/miranda.svg', personagem: true,
        base: 'São Paulo', since: '2024-01', style: 'Cidade a pé e muita foto',
        bio: 'Personagem do OND. Planejo tudo antes, ando a pé pela cidade e volto com mil fotos. A Europa é a minha paixão.' },
      'equipe.ond': { name: 'Ondino', handle: 'equipe.ond', color: '#7f11f4', initials: 'ON', photo: '/assets/perfil/ondino-equipe.svg', personagem: true,
        base: 'São Paulo', since: '2024-01', style: 'Dicas da Equipe OND',
        bio: 'Personagem do OND, falando pela Equipe OND. Aqui ficam as dicas de hotel e restaurante que a gente junta montando viagens.' }
    },
    reviews: {
      PTLIS: [
        { id: 'ex1', by: 'miranda', month: '2026-10', place: 'Miradouro da Senhora do Monte', rate: 5, likes: 42, photos: 2,
          text: 'Vá no fim da tarde e leve algo pra comer. É o miradouro mais alto, dá pra ver o castelo, a Baixa e o rio de uma vez. Subi de elétrico 28 e desci a pé pela Graça.' },
        { id: 'ex2', by: 'edmundo', month: '2026-09', place: 'Time Out Market', rate: 4, likes: 18,
          text: 'Bom pra provar muita coisa num lugar só, mas no almoço de sábado vira um caos. Fui numa terça às 15h e achei mesa fácil. O bacalhau à brás vale.' },
        { id: 'ex3', by: 'miranda', month: '2026-08', place: 'Torre de Belém', rate: 3, likes: 9,
          text: 'Bonita por fora, mas a fila pra entrar levou mais de uma hora e por dentro é pequena. Eu veria de fora e gastaria o tempo no Mosteiro dos Jerónimos, ali do lado.' },
        { id: 'ex4', by: 'miranda', month: '2026-07', place: 'LX Factory', rate: 4.5, likes: 15, photos: 1,
          text: 'Domingo tem feirinha e a livraria Ler Devagar é linda. Dá pra combinar com Belém no mesmo dia, fica no caminho.' }
      ]
    },
    interest: {},
    stamps: {
      edmundo: [
        { city: 'Porto', month: '2026-09', from: 'marcado' },
        { city: 'Lisboa', month: '2026-09', from: 'marcado' },
        { city: 'Paris', month: '2026-05', from: 'marcado' },
        { city: 'Fernando de Noronha', month: '2026-03', from: 'marcado' },
        { city: 'Santiago', month: '2025-08', from: 'marcado' }
      ],
      miranda: [
        { city: 'Porto', month: '2026-10', from: 'marcado' },
        { city: 'Lisboa', month: '2026-10', from: 'marcado' },
        { city: 'Paris', month: '2026-05', from: 'marcado' },
        { city: 'Santiago', month: '2025-07', from: 'marcado' }
      ],
      'equipe.ond': [
        { city: 'Lisboa', month: '2026-10', from: 'marcado' },
        { city: 'Paris', month: '2026-05', from: 'marcado' },
        { city: 'Fernando de Noronha', month: '2026-03', from: 'marcado' },
        { city: 'Santiago', month: '2025-07', from: 'marcado' }
      ]
    }
  };
  if (IS_DEMO) {
    /* conta de teste do protótipo: só no localhost */
    dados.people['marina.viaja'] = { name: 'Marina Duarte', handle: 'marina.viaja', color: '#7f11f4', initials: 'MD', base: 'São Paulo', since: '2022-09',
      bio: 'Viajo devagar e anoto tudo. Miradouro no fim da tarde, mercado de manhã e um café em cada cidade.', instagram: 'marina.viaja',
      style: 'Devagar, mercado de manhã', followers: 312, following: 180 };
    dados.stamps['marina.viaja'] = [
      { city: 'Fernando de Noronha', month: '2027-03', from: 'roteiro', days: 6 },
      { city: 'Santiago', month: '2027-07', from: 'roteiro', days: 5 },
      { city: 'Lisboa', month: '2026-10', from: 'roteiro', days: 4 },
      { city: 'Porto', month: '2026-10', from: 'roteiro', days: 3 },
      { city: 'Paris', month: '2026-05', from: 'roteiro', days: 5 },
      { city: 'Roma', month: '2026-05', from: 'marcado' },
      { city: 'Buenos Aires', month: '2025-07', from: 'roteiro', days: 4 },
      { city: 'Bariloche', month: '2025-07', from: 'marcado' },
      { city: 'Orlando', month: '2024-12', from: 'marcado' },
      { city: 'Rio de Janeiro', month: '2024-03', from: 'marcado' },
      { city: 'Gramado', month: '2023-06', from: 'marcado' }
    ];
    dados.interest = { PTLIS: 312 };
  } else {
    /* fora do localhost, nada de número inventado: as curtidas começam do zero */
    Object.keys(dados.reviews).forEach(function (code) { dados.reviews[code].forEach(function (review) { review.likes = 0; }); });
  }
  return dados;
})();
