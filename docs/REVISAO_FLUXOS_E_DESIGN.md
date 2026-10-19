# Revisão de fluxo e fidelidade ao Figma — KURIO

**Base de revisão:** Figma `HuEe6XFEtLBuMlCI8pYddf`, desktop `11:2862` (pagamento), mobile `16:748` (pagamento) e desktop `11:4385` (confirmação).  
**Branch:** `feat/figma-kurio-ui`. **Escopo:** desafio técnico primeiro; melhorias opcionais somente depois de concluir os critérios eliminatórios.

## Fluxo de compra e critérios verificados no código

| Etapa | Estado atual | Aceite restante |
| --- | --- | --- |
| Catálogo → NFT → carrinho | Rotas, filtros e ações MSW presentes | Regressão visual, acessibilidade e estados de falha |
| Visitante → login | Merge e cache por conta; retornos protegidos | Expiração durante compra e recarga com sessão inválida |
| Carteira principal/secundária | CRUD REST e validação de rede/endereço | Teste de conflito de rede em checkout |
| Cotação de compra | `GET /api/quote`, TTL, cupom, taxa em wei; cotação idêntica é reutilizada | Testes com item esgotado, alteração de preço e vencimento |
| Criação de pedido | `POST /api/orders`, snapshot, revalidação e chave idempotente | Concorrência entre abas e alterações de carteira |
| Recibo | `GET /api/orders/:id`, pendente/confirmado/recusado, refresh | Socket.IO `order.updated` e reconciliação |
| Resposta perdida | Recuperação com `GET /api/orders/:id` pela mesma chave | Teste de perda simultânea da recuperação e estado offline |

### Cenários de falha demonstrativos

O MSW oferece `POST /api/mock/next-order`, apenas para testes da aplicação demonstrativa autenticada, com `{ "outcome": "declined" }` ou `{ "outcome": "network-drop" }`. O primeiro cenário preserva o carrinho em uma recusa; o segundo armazena o pedido e derruba a resposta, exigindo recuperação do mesmo ID. Ambos são limpos pelo `POST /api/mock/reset-all`.

No checkout nenhum título ou recibo deve declarar blockchain, transferência de NFT, Etherscan ou compra real. A confirmação se refere **exclusivamente à API simulada**.

## Inspeção visual baseada no Figma

| Tela | Referência de design | Adaptação funcional |
| --- | --- | --- |
| Pagamento desktop | Perfil e carteira à esquerda; NFTs, total e provedor à direita | Os dados do perfil são obtidos da API mock; wallet CRUD em rota dedicada |
| Pagamento mobile | Primeiro carteiras selecionáveis; depois provedores, total e CTA na área inferior | Hierarquia mobile reorganizada sem campos de perfil extensos antes da carteira; CTA sticky acima da navegação mobile |
| Confirmação desktop | Comprovante centralizado e tabela detalhada | Status visível antes do recibo, mensagem explícita de demonstração e nenhuma URL blockchain fictícia |

**Ainda a comparar com capturas reais do aplicativo:** tipografia, medidas exatas, espaçamento, ícones específicos, rodapé e posição da ação em 390/768/1440 px. Uma correspondência visual pixel-a-pixel **não está atestada** até essa comparação. Os quatro arquivos PNG originais dos NFTs estão no repositório; artes substitutas e miniaturas repetidas em outras telas precisam de revisão.

## Próximas entregas obrigatórias (P0/P1)

1. **Tempo real de verdade:** infraestrutura Socket.IO disponível em desenvolvimento e no deploy; eventos `nft.updated`/`order.updated`, versão sequencial, reconexão, deduplicação e fallback REST. Não tratar o cliente instalado como integração funcional.
2. **E2E completo:** cases de expiração, mudança de preço/estoque durante checkout, offline/timeout, acesso entre usuários, idempotência, mobile e teclado. Expandir de smoke para a matriz do enunciado.
3. **Design e acessibilidade:** revisão visual assistida por screenshots do app e do Figma, navegação teclado, foco, contraste, responsividade e baselines.
4. **Performance e deploy:** Lighthouse nas duas páginas e viewports exigidos, 3 execuções por combinação, metas oficiais; correção das dependências com vulnerabilidades; URL pública e refresh de deep links.

## Melhorias opcionais (P2 — depois do desafio)

Não introduzir no escopo obrigatório antes da validação: histórico de pedidos, página de coleção do usuário, favoritos avançados, animações decorativas, modo de comparação de NFTs ou autenticação social real. Todas adicionariam trabalho e risco sem cumprir itens eliminatórios.
