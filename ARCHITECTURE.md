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

**Pendente:** revalidação de preço pelo quote antes da compra, descontos, taxas de rede, eventos de alteração de preço, merge com tratamento explícito de divergências e snapshot financeiro do pedido.

## Contratos REST existentes

| Categoria | Operações |
| --- | --- |
| Catálogo | `GET /api/nfts`, `GET /api/nfts/:id` |
| Carrinho | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id` |
| Sessão | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/session`, `POST /api/auth/logout` |
| Perfil | `GET/PATCH /api/profile`, `PATCH /api/profile/password` |
| Carteiras | `GET /api/wallets`, `PUT /api/wallets/:slot`, `DELETE /api/wallets/secondary` |
| Favoritos | `GET /api/favorites`, `POST/DELETE /api/favorites/:id` |
| Testes | `POST /api/mock/reset-all`, `POST /api/mock/expire-session`, e o reset legado `POST /api/mock/reset` |

As respostas cobrem validações 400, não autorizado 401, recursos inexistentes 404 e conflitos 409 onde aplicável. `/api/mock/reset-all` apaga contas/carrinhos/estado da demonstração para restaurar um cenário inicial determinístico.

## Pipeline e testes

O GitHub Actions executa `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, instalação do Chromium e `npm run test:e2e` em 1440 px e Pixel 7.

Artefatos do Playwright (HTML e traces) são anexados ao CI. Os primeiros cenários cobrem busca/filtro/refresh, detalhe inexistente, carrinho, sessão, conflito de cadastro e isolamento entre dois usuários. **Esses cenários não substituem a cobertura completa de 12 conjuntos exigidos**; também faltam baselines visuais versionadas. Não declarar a suíte aprovada sem consultar o resultado de CI da revisão atual.

## Ainda não implementado: checklist eliminatório

- Cotação, cupons, taxa de rede e recálculo financeiro validado pelo backend mock.
- Pedidos idempotentes, pending/confirmed/declined, timeout e recuperação após refresh.
- Tela de pagamento e recibo de confirmação condicionado ao status real do pedido simulado.
- Socket.IO com `nft.updated` e `order.updated`, versões monotônicas, deduplicação, reconexão e reconciliação via REST.
- MSW com cenários parametrizáveis de latência variável, conexões offline e HTTP 500.
- Todos os testes E2E do enunciado, regressão visual baseline e acessibilidade por teclado/foco/zoom.
- Lighthouse home/detalhe em desktop/mobile: 3 execuções e mediana Performance ≥90, A11y ≥95, BP ≥95, SEO ≥90; LCP/CLS/TBT documentados.
- URL pública de deploy final e inspeção de refresh nas rotas profundas.

O código da branch `feat/figma-kurio-ui` só será considerado pronto quando estas pendências forem tratadas, os relatórios existirem e a versão publicada corresponder à versão do GitHub.
