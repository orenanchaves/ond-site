# Arquitetura da informação do ondviajar.com.br

**Data:** 20 de setembro de 2026
**Método:** ROSENFELD, Louis; MORVILLE, Peter; ARANGO, Jorge. *Information architecture: for the web and beyond*. 4. ed. Sebastopol: O'Reilly, 2015. Os quatro sistemas (organização, rotulação, navegação e busca), mais o trio contexto, conteúdo e usuários.
**Tarefa percorrida:** comprar uma viagem, do primeiro contato até o pedido no WhatsApp.
**Escopo:** home, catálogo /viagens/, "Quando viajar", blog e posts, página de agências e as versões em inglês, espanhol, francês e italiano.

---

## 1. Retrato antes da intervenção

| O que | Número |
|---|---|
| Páginas HTML no repositório | 67 |
| Fichas de destino | 25, todas dentro de uma página só |
| Posts do blog | 23 |
| Páginas fora do índice do Google, de propósito | 16 (propostas de cliente) |
| Busca interna | não existia |
| Filtros no catálogo | 1 (Brasil ou Mundo) |
| Passos até a oferta | 3 (home, catálogo, ficha) com 1 decisão obrigatória: o destino |

### Contexto, conteúdo e usuários
- **Contexto:** agência de turismo cadastrada no Cadastur, que vende por WhatsApp, sem motor de reservas próprio, e atende dois públicos (viajante e agência parceira).
- **Conteúdo:** catálogo de 25 destinos com metadados ricos (estado, duração, época, perfil, destaques) e um blog que responde perguntas de custo e de época.
- **Usuários:** o Search Console mostra demanda real por "quanto custa viagem para…" e "quando ir". A busca por marca ("ond") domina as impressões, mas é palavra ambígua e não representa demanda.

## 2. Os quatro sistemas, como estavam

### Organização
Esquema misto: o menu agrupa por tarefa e por público; o catálogo usa geografia (Brasil e Mundo, esquema exato) e ocasião (lua de mel, família, neve, natureza, amigos, primeira internacional, esquema ambíguo). A estrutura era rasa e hipertextual, sem modelo de banco de dados: as 25 fichas viviam como âncoras de uma página só, e os metadados existiam apenas como texto. Os mesmos destinos apareciam em três recortes (geografia, ocasião e mês) que nunca se cruzavam.

### Rotulação
Menu consistente do lado do viajante e outro conjunto, correto, do lado das agências. A ação principal aparecia com nomes demais. O vocabulário é majoritariamente do usuário ("quanto custa", "quando viajar", "viaje para"), com jargão da casa em "Mundo do OND" e na categoria de blog "IA & Viagem". O topo do blog ainda dizia "Teste o app", enquanto o resto do site já dizia "Monte sua viagem".

### Navegação
Global com 5 itens, cabendo numa linha. Local só no catálogo e no blog. A navegação contextual funcionava em um sentido só: 37 páginas apontavam para o catálogo, quase todas do blog, e nem a home nem o catálogo citavam um único post. Não havia mapa do site, índice nem busca. Migalhas existiam no catálogo e nos posts, mas um destino não tinha endereço próprio.

### Busca
Não existia. Com 25 destinos e 23 posts, a navegação ainda dava conta, mas no limite.

### Metadados
Os dados estruturados para o Google já descreviam cada destino como TouristDestination, com estado, atrações e imagem. Esse material não alimentava a interface. As categorias do site e as âncoras do Firma eram dois vocabulários paralelos para a mesma coisa.

---

## 3. O que foi feito

1. **Cada destino ganhou página própria** em `/viagens/<destino>/`, 25 no total, com migalha, foto, metadados, "o que entra na viagem", quando ir, posts relacionados, outros destinos e dados estruturados. Gerador: `build-destinos.py`. O catálogo passou a linkar para elas.
2. **Filtros combináveis no catálogo:** ocasião (7 opções), duração (3 faixas) e mês (12), somados à chave Brasil e Mundo. Os dados vieram das próprias fichas, das ocasiões e da página "Quando viajar". Quando nada combina, a página oferece cotação em vez de deixar a lista vazia. A barra virou um card só, com rótulo de cada grupo alinhado em coluna, a contagem de resultados junto do título e "Limpar filtros" ao lado dela, em vez de solto na direita.
3. **Ponte de volta para o blog:** bloco "Leia antes de decidir" no catálogo e na página "Quando viajar", e posts relacionados em cada página de destino.
4. **Um vocabulário só de categorias:** Destinos, Roteiros, Orçamento e Dicas, no site e no mapeamento vindo do Firma. Saiu "IA & Viagem".
5. **Topo do blog igual ao do site:** "Monte sua viagem" no lugar de "Teste o app".
6. **Busca interna** em `/busca/`, com índice próprio (`assets/busca.json`, 53 itens: destinos, posts e páginas fixas), filtro por texto sem acento, endereço que guarda o termo e link "Buscar" no rodapé de todas as páginas. Gerador: `build-busca.py`.
7. **Versões em outros idiomas** deixaram de mandar o visitante para conteúdo que só existe em português: o Blog saiu do menu dessas versões.
8. **Páginas soltas:** "Para hotéis" no rodapé passou a apontar para a página de hotéis, que voltou a ser indexável, e a página de links saiu do índice do Google por duplicar conteúdo.

### Correções de rota encontradas no caminho
- Os quatro posts de custo (Maceió, Orlando, Buenos Aires e Gramado) tinham sumido do índice do blog porque outra sessão reescreveu o arquivo de posts do Firma e publicou por cima. Foram recolocados, aprovados e o índice foi regerado.
- A capa do post da Oktoberfest apontava para um arquivo que não existe mais na Wikimedia. Foi trocada por uma foto com licença CC BY 2.0, hospedada no próprio site.

---

## 4. O que ficou pendente

- **Catálogo e blog em outros idiomas.** Hoje só a home está traduzida.
- **Fonte Bio Sans.** O site não envia a fonte, então o público vê os títulos em Onest. Depende de confirmar a licença de uso na web.
- **Cinco páginas "rastreadas, mas não indexadas"** no Search Console, ainda sem diagnóstico.
- **Destinos sem post relacionado:** 12 dos 25. Cada post novo de custo ou de roteiro fecha uma dessas lacunas.

## 5. Como manter

Depois de mexer no catálogo ou no blog, rodar nesta ordem, de dentro de `ond-site`:

```bash
python build-blog.py
python build-destinos.py
python build-busca.py
```

O `build-blog.py` também regenera o sitemap, que já inclui as páginas de destino. As versões em outros idiomas saem de `python build-i18n-home.py`.
