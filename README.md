# KURIO — NFT Marketplace Frontend Challenge

Marketplace demonstrativo em **React + TypeScript**, baseado no [Figma Frontend Challenge](https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-). O código usa **dados e operações simuladas no navegador**: nenhuma blockchain, conexão de carteira ou compra verdadeira é realizada.

> **Estado atual (19/10/2026):** catálogo, detalhes, carrinho, autenticação, perfil e carteiras em evolução. O projeto **ainda não atende ao desafio completo**: checkout/recibo, Socket.IO, cenários avançados, regressão visual e Lighthouse seguem pendentes. Consulte [PLANO_CONFORMIDADE_DESAFIO.md](docs/PLANO_CONFORMIDADE_DESAFIO.md) e o PR em rascunho.

## Executar localmente

Requer **Node.js 22.12+**, npm e um navegador moderno em contexto seguro (localhost ou HTTPS), necessário para o Web Crypto dos mocks.

```bash
npm ci
npm run dev
```

Aplicação local: http://localhost:5173

| Comando | Descrição |
| --- | --- |
| `npm run typecheck` | Verificação estática TypeScript |
| `npm run lint` | Lint |
| `npm run build` | Build otimizado |
| `npm run preview` | Preview do build |
| `npx playwright install chromium` | Instala navegador para testes locais |
| `npm run test:e2e` | Testes E2E Chromium desktop/mobile |
| `npm run test:e2e:report` | Relatório HTML Playwright |

O arquivo `src/routeTree.gen.ts` é gerado pelo TanStack Router; ao criar rotas, execute `npm run dev` para atualizá-lo.

## Contas fictícias

**Nunca reutilize uma senha pessoal** nesta demonstração. Os usuários abaixo são gerados pelo MSW na primeira operação de autenticação.

| Conta | E-mail | Senha de demonstração |
| --- | --- | --- |
| Colecionador | `colecionador@kurio.demo` | `KurioDemo123!` |
| Artista | `artista@kurio.demo` | `KurioDemo123!` |

As contas cadastradas no formulário também são fictícias. O MSW deriva hashes de senha via PBKDF2 e os guarda localmente, **não** como credenciais de produção. O token de sessão expira em uma hora; o estado é persistido apenas para a demonstração.

## Páginas atuais

| Rota | Função |
| --- | --- |
| `/` | Hero, catálogo, filtros, busca, ordenação, paginação |
| `/nft/:nftId` | Detalhe, edição, quantidade, carrinho, favoritos |
| `/cart` | Carrinho de visitante/conta e ajustes de quantidade |
| `/login` | Login com retorno ao destino solicitado |
| `/register` | Criação de conta e tratamento de conflito |
| `/profile` | Perfil protegido, avatar e atualização de senha |
| `/wallets` | Carteiras protegidas principal e secundária |

Os controles sociais Google/Facebook não realizam login real e aparecem desativados. Checkout, favoritos avançados e transações ainda não têm fluxo completo.

## Simulação REST

**Todas as chamadas** passam pelo Axios (`src/services/api.ts`) e são interceptadas pelo MSW (`src/mocks/`), sem respostas fictícias diretamente nos componentes.

- `GET /api/nfts` e `GET /api/nfts/:id`
- `GET/POST/PATCH/DELETE /api/cart...`
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/session`, `POST /api/auth/logout`
- `GET/PATCH /api/profile`, `PATCH /api/profile/password`
- `GET/PUT/DELETE /api/wallets...`
- `GET/POST/DELETE /api/favorites...`

O carrinho de visitante passa para a conta no login, respeitando a disponibilidade da edição. Carrinhos, perfis, favoritos e carteiras possuem chaves de armazenamento separadas por usuário. Ao sair, o cache de dados pessoais é limpo.

Para **zerar todos os dados simulados** durante desenvolvimento/testes:

```js
await fetch('/api/mock/reset-all', { method: 'POST' })
location.reload()
```

Para testar expiração da sessão autenticada:

```js
await fetch('/api/mock/expire-session', { method: 'POST' })
location.reload()
```

Esses endpoints são exclusividade da simulação local/MSW. `VITE_ENABLE_MOCKS=false` desativa os handlers; sem um backend real, as consultas deixarão de funcionar.

## Testes, acessibilidade e entrega

`playwright.config.ts` configura Chromium em 1440×900 (desktop) e Pixel 7 (mobile), e o CI executa `npm ci`, typecheck, lint, build e testes E2E. Os relatórios HTML/traces ficam nos artefatos do GitHub Actions quando executados.

A interface usa labels, aria-live e botões sem navegação fictícia. Mesmo assim, faltam auditorias completas de teclado, zoom, contraste e regressão visual com baselines.

**Fora do escopo até implementação futura:** eventos `nft.updated`/`order.updated` via Socket.IO, cotação/cupom, checkout, pedidos idempotentes, confirmação e Lighthouse (metas 90/95/95/90). O deploy final é obrigatório e ainda precisa ser validado em uma URL pública.

## Organização

- `src/pages/`: composição das telas React
- `src/components/`: componentes reutilizáveis, layouts e formulários
- `src/features/`: hooks Query, contratos tipados e regras
- `src/mocks/`: handlers REST, sessão, cenários e fixtures
- `src/lib/eth.ts`: conversão ETH/wei com `bigint`
- `tests/e2e/`: testes Playwright desktop/mobile
- `ARCHITECTURE.md`: decisões, cache e limitações

Não faça merge do PR enquanto os itens eliminatórios do desafio estiverem abertos.
