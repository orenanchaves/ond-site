---
name: chegada-do-destino
description: Como o viajante chega a destinos que não têm aeroporto (Porto de Galinhas, Gramado, Trancoso, Jericoacoara, Costa Amalfitana, Machu Picchu, Maldivas e mais 30). Diz o aeroporto de entrada, a distância, o tempo e o meio do último trecho (carro, balsa, trem, barco, 4x4, hidroavião). Use ao montar proposta, cotar aéreo, escrever página de destino, post ou resposta a cliente.
when_to_use: 'Cotar ou montar proposta de viagem, escolher o aeroporto de um destino, escrever nota de traslado, responder "como chego em X", criar post ou página de destino, revisar texto que promete voo para um lugar que não tem aeroporto.'
---

# Chegada do destino

Muito destino vendido não tem aeroporto. O cliente compra "Porto de Galinhas" e o voo chega em Recife, a 60 km.
Se a proposta não disser isso, o traslado vira surpresa no dia da viagem.

**A ficha está em [`reference/chegadas.json`](./reference/chegadas.json)**: 37 destinos com `aeroporto`, `km`,
`tempo`, `meio` e `obs`. Leia o arquivo antes de responder; não chute distância nem tempo.

## Regras

1. **Aéreo vai para o aeroporto da ficha.** Cotar voo para uma cidade que não recebe voo é o erro mais comum.
   Quando há dois aeroportos parecidos (Maragogi por Maceió ou Recife, Balneário por Navegantes ou Florianópolis),
   cotar os dois e escolher pelo preço.
2. **O último trecho sempre aparece na proposta**, com distância e tempo, como item a combinar. Frase padrão:
   "Porto de Galinhas não tem aeroporto: o voo chega em Recife (REC), a 60 km, cerca de 1h10 de carro. O traslado
   fica a combinar com a nossa equipe."
3. **Quando o trecho final depende de horário, isso muda a escolha do voo:**
   - **Maldivas:** hidroavião só voa de dia. Voo que chega à noite costuma exigir uma noite em Malé.
   - **Jericoacoara e Jalapão:** último trecho na areia ou em estrada de terra, de 4x4. Evitar chegada à noite.
   - **Morro de São Paulo e Ilhabela:** catamarã e balsa têm horário e dependem do mar e da fila.
   - **Trancoso e Arraial d'Ajuda:** a balsa de Porto Seguro forma fila em alta temporada.
   - **Bonito, Caldas Novas e Lençóis (BA):** têm aeroporto, mas com voo sazonal. Confirmar antes de prometer.
4. **Vilas sem carro** (Cinque Terre, Zermatt, Morro de São Paulo) pedem trem ou barco, e isso limita bagagem
   e horário. Diga isso na proposta.
5. **Roteiros que só fecham com carro alugado** (Toscana, Dolomitas) precisam do aluguel na cotação, com aviso
   sobre as zonas de trânsito restrito nas cidades italianas.

## Na prática

- **Página de proposta:** o gerador `landing-proposta.js` (repo ond-conteudo) lê essa mesma ficha. Basta pôr
  `"chegada": ["porto-de-galinhas"]` no JSON da proposta que a nota entra sozinha no fim das notas da página.
- **Conteúdo:** a ficha serve de base para post e página de destino ("como chegar em X"), que é justamente a
  dúvida que o viajante pesquisa. Sempre em português, sem emoji e sem travessão, no tom do OND.
- **Faltou o destino na ficha?** Descubra o aeroporto mais próximo com voo regular, a distância, o tempo e o meio
  do último trecho, acrescente a entrada em `reference/chegadas.json` e diga na resposta que é uma estimativa até
  alguém confirmar.

Distâncias e tempos são aproximados, de carro e fora de horário de pico. Atualizado em 19/09/2026.
