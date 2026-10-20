# KURIO — NFT Marketplace Frontend Challenge

> **Revisão de requisitos (20/10/2026):** [Escopo original e auditoria dos 15 frames do Figma](docs/ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md). Essa é a matriz atual de aderência ao desafio; os documentos mais antigos registram etapas históricas e não devem ser usados como status final.


Marketplace demonstrativo em **React + TypeScript**, baseado no [Figma Frontend Challenge](https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-). O código usa **dados e operações simuladas no navegador**: nenhuma blockchain, conexão de carteira ou compra verdadeira é realizada.

> **Estado atual (19/10/2026):** catálogo, carrinho, conta, checkout/recibo **simulados** e eventos Socket.IO via mock MSW implementados. O projeto **ainda está em revisão**: faltam comparar todas as capturas visuais com o Figma, auditar acessibilidade/performance, tratar advisories das dependências e validar o deploy. Consulte [PLANO_CONFORMIDADE_DESAFIO.md](docs/PLANO_CONFORMIDADE_DESAFIO.md), [REVISAO_VISUAL_ACESSIBILIDADE.md](docs/REVISAO_VISUAL_ACESSIBILIDADE.md) e o PR em rascunho.

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

O arquivo `src/routeTree.gen.ts` é gerado pelo TanStack Router. O desenvolvimento normal deve usar `npm run dev`, especialmente quando novas rotas forem adicionadas.

### Windows: `EPERM` ao atualizar `routeTree.gen.ts`

Se o terminal mostrar `EPERM: operation not permitted, rename ...routeTree.gen.ts`, o Vite pode imprimir `ready` mesmo sem conseguir atualizar a árvore de rotas. Não ignore esse erro.

Primeiro pare os processos Vite/Node que estejam executando o projeto e confira se o arquivo gerado não está marcado como **somente leitura** ou bloqueado por outro programa:

```powershell
Get-Item .\src\routeTree.gen.ts | Select-Object FullName, IsReadOnly, Attributes
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, Path
```

Se o arquivo estiver realmente como somente leitura, e você tiver permissão para editá-lo, remova **somente esse atributo** com `attrib -R .\src\routeTree.gen.ts` e tente `npm run dev` novamente. Não desative proteções do Windows nem exclua a árvore de rotas.

Para **trabalhar temporariamente com as rotas já versionadas**, incluindo build local, use o modo sem regeneração. Ele evita substituir um arquivo bloqueado pelo Windows:

```powershell
$env:KURIO_SKIP_ROUTE_GENERATION = 'true'
npm run dev
# Pare o servidor com Ctrl+C antes de criar um build:
npm run typecheck
npm run lint
npm run build
```

**Atenção:** a variável desativa a geração tanto no Vite de desenvolvimento quanto no build **somente na sessão em que estiver definida**. A compilação continua checando TypeScript e usando `src/routeTree.gen.ts` já versionado. Não adicione, renomeie ou remova rotas nesse modo: a árvore não será atualizada. O CI executa uma compilação normal sem essa variável e também valida o modo alternativo. Para voltar à geração normal no terminal atual, execute `Remove-Item Env:KURIO_SKIP_ROUTE_GENERATION -ErrorAction SilentlyContinue`.

Como resolução definitiva, considere testar o clone fora da pasta Área de Trabalho (por exemplo, `C:\dev\jnggaming`) e identificar eventuais processos bloqueando `routeTree.gen.ts`. Isso evita mexer em permissões globais do Windows e mantém o arquivo gerado íntegro.

Se o erro persistir no modo normal, compartilhe o resultado dos dois comandos de diagnóstico acima e a mensagem completa. Evite `git reset --hard` ou alterações globais de segurança como solução para esse caso.

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
| `/checkout` | Cotação, cupom, carteira e pedido simulado |
| `/orders/:orderId` | Recibo baseado no estado real da API simulada (pendente/confirmado/recusado) |

Os controles sociais Google/Facebook não realizam login real e aparecem desativados. A compra é **exclusivamente simulada**; não há transação blockchain. Cenários avançados de recusa, timeout e reconexão ainda exigem cobertura.

## Simulação REST

**Todas as chamadas** passam pelo Axios (`src/services/api.ts`) e são interceptadas pelo MSW (`src/mocks/`), sem respostas fictícias diretamente nos componentes.

- `GET /api/nfts` e `GET /api/nfts/:id`
- `GET/POST/PATCH/DELETE /api/cart...`
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/session`, `POST /api/auth/logout`
- `GET/PATCH /api/profile`, `PATCH /api/profile/password`
- `GET/PUT/DELETE /api/wallets...`
- `GET/POST/DELETE /api/favorites...`
- `GET /api/quote` (cupom `KURIO10`, desconto e taxa estimada)
- `POST /api/orders` (chave de idempotência), `GET /api/orders/:id` (estado/recibo)

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

**Tempo real da demonstração:** `socket.io-client` comunica-se por WebSocket com um adaptador limitado do MSW 3 (sem polling ou blockchain real); a API REST é a fonte de verdade após refresh ou reconexão. Os eventos `nft.updated` e `order.updated` têm versão e casos E2E. **Ainda pendente:** comparação visual completa com o Figma, revisão de WCAG/zoom/contraste, resultados e ajustes de Lighthouse (metas 90/95/95/90), atualização segura de dependências e deploy público verificado.

## Organização

- `src/pages/`: composição das telas React
- `src/components/`: componentes reutilizáveis, layouts e formulários
- `src/features/`: hooks Query, contratos tipados e regras
- `src/mocks/`: handlers REST, sessão, cenários e fixtures
- `src/lib/eth.ts`: conversão ETH/wei com `bigint`
- `tests/e2e/`: testes Playwright desktop/mobile
- `ARCHITECTURE.md`: decisões, cache e limitações

Não faça merge do PR enquanto os itens eliminatórios do desafio estiverem abertos.
