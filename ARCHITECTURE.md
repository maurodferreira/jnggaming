# Arquitetura e decisões — KURIO

Este arquivo documenta os contratos implementados, as limitações atuais e as próximas integrações do desafio técnico. **Não confundir a API simulada com um backend seguro de produção.**

## Stack e responsabilidades

| Camada | Responsabilidade | Caminho |
| --- | --- | --- |
| Interface | Páginas e componentes React, Tailwind, shadcn/ui | `src/pages`, `src/components` |
| Navegação | TanStack Router e search params para filtros | `src/routes` |
| Estado remoto | TanStack Query com cache, mutations e abort signals | `src/features` |
| Transporte | Axios `baseURL=/api`, timeout e token demo | `src/services/api.ts` |
| Backend mock | MSW intercepta REST, valida contratos e gerencia persistência | `src/mocks` |
| Cálculos ETH | Strings decimais → bigint wei → string | `src/lib/eth.ts` |
| E2E | Playwright Chromium desktop/mobile | `tests/e2e`, `playwright.config.ts` |

Nenhum componente React devolve dados de negócio fake diretamente. Os mocks estão ativos por padrão (inclusive no build demonstrativo). `VITE_ENABLE_MOCKS=false` só deve ser usado com API externa compatível.

## Fluxos e rotas

- `/`: catálogo com busca, coleção, disponibilidade, ordenação e página em URL.
- `/nft/$nftId`: acesso direto, erro 404, edição, estoque e carrinho.
- `/cart`: quantidade/remoção e persistência de visitante/usuário.
- `/login` e `/register`: validação, retorno à página de origem.
- `/profile` e `/wallets`: rotas protegidas pelo `AccountGate`, renderização desktop/mobile e redirecionamento para login.
- `/checkout`: conferência de itens, cupom, carteira, taxa, cotação e envio idempotente.
- `/orders/$orderId`: consulta do status do pedido simulado e recibo apenas após confirmação do mock.

A navegação é declarativa e o arquivo `src/routeTree.gen.ts` é gerado pelo TanStack Router. Novas rotas precisam ser regeneradas e versionadas. Controles de funcionalidades fora do escopo não devem aparentar ações completas.

## Sessão demo e segurança

O MSW mantém contas locais e sessões opacas com expiração em 60 minutos. O login devolve um bearer token, que o Axios envia nos requests; os handlers validam o token em cada acesso protegido. Nenhuma senha é armazenada em texto puro: a simulação deriva um hash PBKDF2 com salt por usuário.

**Limitações intencionais:** o armazenamento fica no navegador (`localStorage`) e, portanto, não é uma arquitetura de autenticação de produção. Não utilizar dados ou senhas pessoais. Login social, blockchain e pagamentos verdadeiros não estão disponíveis.

As sessões de usuários diferentes não compartilham dados. O cache Query é limpo ao autenticar/trocar conta ou sair; as queries privadas incluem o ID do usuário na chave. Perfis, carteiras, favoritos e carrinhos usam chaves distintas por conta.

## Carrinho e reconciliação

- O carrinho visitante existe em `jnggaming:guest-cart:v1`.
- Cada conta tem um armazenamento próprio `kurio:mock:cart:<userId>:v1`.
- Ao autenticar, o carrinho visitante é incorporado ao da conta; quantidades são limitadas pelo estoque atual de cada edição. Ao terminar, o carrinho visitante é apagado.
- Mutations `useAddToCart`, `useRemoveCartItem`, `useUpdateCartItem` trabalham por REST/Query.
- Atualização de quantidade é **otimista**: há snapshot e rollback em falha.
- Nomes/preços e disponibilidade são obtidos a partir das fixtures da rede simulada.

A API mock implementa `GET /api/quote` com validação de disponibilidade, preço, desconto por cupom e taxa estimada em `bigint`. Antes de criar um pedido, valida novamente o snapshot; o recibo utiliza o snapshot salvo. **Pendente:** tratar mudanças em tempo real, reconciliação automática e todos os cenários de falha exigidos.

## Contratos REST existentes

| Categoria | Operações |
| --- | --- |
| Catálogo | `GET /api/nfts`, `GET /api/nfts/:id` |
| Carrinho | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id` |
| Sessão | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/session`, `POST /api/auth/logout` |
| Perfil | `GET/PATCH /api/profile`, `PATCH /api/profile/password` |
| Carteiras | `GET /api/wallets`, `PUT /api/wallets/:slot`, `DELETE /api/wallets/secondary` |
| Favoritos | `GET /api/favorites`, `POST/DELETE /api/favorites/:id` |
| Cotação | `GET /api/quote` (carrinho, taxa, cupom e expiração) |
| Pedido | `POST /api/orders` idempotente, `GET /api/orders/:id` para status/recibo |
| Testes | `POST /api/mock/reset-all`, `POST /api/mock/expire-session`, e o reset legado `POST /api/mock/reset` |

As respostas cobrem validações 400, não autorizado 401, recursos inexistentes 404 e conflitos 409 onde aplicável. `/api/mock/reset-all` apaga contas/carrinhos/estado da demonstração para restaurar um cenário inicial determinístico.

## Pipeline e testes

O GitHub Actions executa `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, instalação do Chromium e `npm run test:e2e` em 1440 px e Pixel 7.

Artefatos do Playwright (HTML e traces) são anexados ao CI. Os cenários cobrem busca/filtro/refresh, detalhe inexistente, carrinho, sessão, conflito de cadastro, isolamento de usuários, bloqueio de checkout sem carteira e confirmação com refresh. **Esses cenários não substituem a cobertura completa de 12 conjuntos exigidos**; também faltam baselines visuais versionadas. Não declarar a suíte aprovada sem consultar o resultado de CI da revisão atual.

## Validações e lacunas do desafio — revisão 20/10/2026

**Implementações existentes e em validação pelo CI:** cotação `GET /api/quote` com controle de versão, eventos Socket.IO/REST, criação idempotente de pedidos, descontos, recuperação de rede, cenários de falha, 404, skeleton shimmer, carrinho com `GET /api/cart/summary` e retorno ao checkout após expiração da sessão (mantendo o cupom).

**Ainda sem aceite:** capturas visuais comparadas contra os 15 frames e baselines versionadas `toHaveScreenshot`; todos os cenários avançados da matriz de Playwright; zoom/foco/acessibilidade manual; Lighthouse Performance mobile ≥90; resolução/justificativa das vulnerabilidades do `npm audit`; deploy público acessível e funcionando com MSW, WebSocket e deep links.

**Auditoria de segurança (20/10):** sete advisories altos afetam a cadeia de desenvolvimento de `shadcn` CLI (`braces` → `micromatch` → `fast-glob`, `ts-morph` e `@ts-morph/common`). A inspeção dos advisories não identificou esses pacotes como dependências de runtime da aplicação React. Não fazer `npm audit fix --force` nem atualizar versões major sem repetir CI e visual. O pacote `shadcn` também fornece CSS importado no build.

**Performance antes da otimização da latência padrão:** desktop Home/NFT 99/99; mobile Home/NFT 87/87. Os relatórios apontaram LCP ~3,5 s e grande atraso até renderizar dados; o perfil normal de catálogo foi reduzido para 150 ms mantendo cenários lentos reproduzíveis. É necessária nova medição, não declarar ≥90 sem relatório.

**Configuração MSW:** `POST /api/mock/catalog-network` alterna entre `normal`, `slow`, `variable`, `http-500` e `offline` para catalogação/detalhes; `POST /api/mock/reset-all` restaura também o perfil normal. A lógica de simulação reside em `src/mocks/networkScenario.ts`; componentes não possuem branches de negócio falsos.

**Decisões de Figma:** ver `docs/REGRAS_E_LIBERDADES_DO_DESAFIO.md`.

## Tempo real (implementação inicial; validar com Playwright)

O cliente utiliza **`socket.io-client` de verdade**, carregado por import dinâmico após o `worker.start()`, para que o MSW consiga interceptar o WebSocket. A implementação demonstrativa `src/mocks/realtimeHandlers.ts` usa `ws.link()` do **MSW v3** e uma adaptação limitada de pacotes textuais Engine.IO v4/Socket.IO v4 (`0`, `40` e `42`), em transporte **WebSocket-only**. Não existem salas, polling, binários ou backend separado.

Essa escolha evita instalar `@mswjs/socket.io-binding@0.2.0` com peer dependency de MSW v2, que não corresponde ao MSW v3 já usado no repositório. Esta limitação precisa ser mencionada na entrega, junto aos resultados E2E comprovando o protocolo.

- `nft.updated`: evento com `resourceId`, `version`, `priceEth`, `available`; a UI invalida catálogo, detalhes, carrinho e cotação e confirma os valores via REST.
- `order.updated`: contém `resourceId`, `userId`, `version`, `status`; listeners só reconciliam eventos do usuário autenticado.
- O hook mantém versão máxima por recurso para descartar duplicatas ou eventos atrasados, reconcilia consultas REST após reconexão e remove o socket no logout/troca de sessão.
- `POST /api/mock/nfts/:id/update` altera a fixture do NFT para testes de tempo real; `GET /api/mock/socket-status` serve somente ao Playwright para aguardar a conexão real.
- O reset da demo restaura a fixture de preços/estoque e os contadores de versões.
- Os pedidos em estado pendente são resolvidos com um temporizador mock e consulta REST; após refresh o REST continua responsável pela recuperação.

**Status de qualidade:** o fluxo está em verificação. Testes E2E que aguardam a conexão Socket.IO e um evento `nft.updated` precisam passar no CI antes de declarar esta implementação concluída. Seguimos sem transactions reais.
