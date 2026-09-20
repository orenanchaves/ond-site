# Ofertas do grupo

Registro das ofertas que a OND publica no grupo de WhatsApp "OND: Ofertas". Cada oferta tem uma arte por
cidade de saída, porque o preço muda conforme a origem do voo.

As artes ficam nesta pasta e são as mesmas que vão para o grupo. O que gera elas é
`ond-conteudo/b2c/social-media/html/_gen-oferta.js`, que já calcula o preço final do OND a partir da cotação.
Custo, margem e a cotação de origem ficam no OND Firma, não aqui.

## Gramado, fora de temporada

- **Publicada em:** 20/09/2026
- **Viagem:** 24 a 28 de maio de 2027, 4 noites, para duas pessoas
- **Por que é barata:** maio não tem Natal Luz nem férias escolares. Hotel e aéreo caem, e a cidade fica cheia
  de charme no frio, sem fila.
- **Incluído:** aéreo ida e volta com bagagem, hotel com café da manhã, roteiro no app e suporte da equipe
  antes e durante a viagem.
- **Fica à parte:** traslado de Porto Alegre até Gramado, 115 km e cerca de 1h40. Gramado não tem aeroporto.

| Saindo de | Voo | 10x no cartão | Pix, para os dois | Arte |
|---|---|---|---|---|
| Rio de Janeiro | direto, 2h05 | R$ 395,00 | R$ 3.370 | [of-gramado-rio.jpg](of-gramado-rio.jpg) |
| São Paulo | direto, 1h45 | R$ 455,09 | R$ 3.880 | [of-gramado-sp.jpg](of-gramado-sp.jpg) |
| Natal | uma conexão | R$ 545,21 | R$ 4.650 | [of-gramado-natal.jpg](of-gramado-natal.jpg) |

Hotel da cotação: Life Hotel Infinity, 4 noites com café. Preços cotados em 20/09/2026 e sujeitos a
disponibilidade: antes de fechar, sempre recotar.

## Como registrar uma oferta nova

1. Ajustar destino, datas, origens e valores em `_gen-oferta.js` e rodar `node _gen-oferta.js`.
2. Renderizar com `node _render.js of-<id>.html` e copiar os JPG para esta pasta.
3. Acrescentar uma seção aqui, no mesmo formato, com a data de publicação e o motivo do preço.
