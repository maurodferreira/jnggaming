# KURIO — checklist de entrega e revisão final

**Revisão:** 21/10/2026 · **Entrega acumulada:** [PR #5](https://github.com/maurodferreira/jnggaming/pull/5) para a branch `main`.

Este é um roteiro curto para reproduzir o desafio, inspecionar o código e concluir a publicação. Os resultados abaixo são de uma **demonstração frontend**, sem dinheiro, blockchain, carteiras ou NFT reais.

## 1. Evidências automatizadas

| Verificação | Resultado comprovado | Evidência |
| --- | --- | --- |
| Instalação, TypeScript, ESLint e builds | Aprovados, incluindo fallback Windows | [CI 39606190433](https://github.com/maurodferreira/jnggaming/actions/runs/39606190433) |
| Playwright desktop/mobile | **150 passed, 12 skipped intencionalmente, 0 failed** | [Mesmo CI](https://github.com/maurodferreira/jnggaming/actions/runs/39606190433) |
| Lighthouse Home mobile | **100/100/100/100** (Perf/A11y/BP/SEO) | [Relatório 39483283845](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse NFT mobile | **90/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse Home desktop | **98/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse NFT desktop | **99/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Dependências | **0 vulnerabilidades** no `npm audit` dessa execução | [Relatório/artefato](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Regressão visual | **27 snapshots versionadas**, 9 páginas × 390/768/1440 px | [Baselines Playwright](https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui/tests/e2e/visual-baselines.spec.ts-snapshots) |
| Domínio público | Smoke de Home, MSW, API, assets, deep links e refresh **aprovado anteriormente** | [Smoke 39428035215](https://github.com/maurodferreira/jnggaming/actions/runs/39428035215) |

As notas Lighthouse são **medianas de três execuções por página e dispositivo**, feitas sobre o build local de produção. O relatório de qualidade foi feito no commit `7ea96bf1`, **anterior** aos refinamentos mobile posteriores. Essas notas são históricas e não equivalem a uma nova auditoria do commit entregue. A nota real pode variar conforme o dispositivo. Esses resultados não são a pontuação oficial da Jungle Gaming.

## 2. Reproduzir em uma máquina nova

Use **Node.js 22.12+**, npm e um navegador Chromium atualizado.

```bash
git clone https://github.com/maurodferreira/jnggaming.git
cd jnggaming
git switch main
npm ci
npx playwright install chromium
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run dev
```

Abrir `http://localhost:5173`. Para testar os arquivos finais: `npm run preview` (porta padrão `4173`). Não é preciso configurar um backend externo para a demo: `VITE_ENABLE_MOCKS=true` é o modo padrão.

**Credenciais exclusivamente fictícias:** `colecionador@kurio.demo` / `KurioDemo123!` e `artista@kurio.demo` / `KurioDemo123!`. Não inserir dados ou carteiras reais. A sessão e os dados demonstrativos ficam no navegador.

**Cupom de teste:** `KURIO10`. Para reiniciar totalmente a demo:

```js
await fetch('/api/mock/reset-all', { method: 'POST' })
location.reload()
```

No Windows, o eventual bloqueio de `src/routeTree.gen.ts` tem uma solução documentada no [README](../README.md#Windows-erro-eperm-na-árvore-de-rotas). Não use o fallback quando estiver alterando rotas.

## 3. Revisão funcional e visual (9 telas)

| Caminho | Principal verificação humana |
| --- | --- |
| `/` | Hero, grid, busca, filtros, ordenação, paginação, URL e navegação mobile |
| `/nft/1` | Galeria, zoom, edições, quantidade, estoque, favorito, atualização de preço |
| `/cart` | Carrinho de visitante, alterar/remover, cupom, taxa, total, recomendações |
| `/login` | Conta demo, erros e retorno à página de origem |
| `/register` | Cadastro, validações e conflito de e-mail |
| `/profile` | Nome, avatar, senha e isolamento entre usuários |
| `/wallets` | Carteiras demonstrativas, rede, endereço e mudança da principal |
| `/checkout` | Quote e validade, provedor, estoque, falhas e pedido idempotente |
| `/orders/:orderId` | Recibo **somente da API mock**, pendente/confirmado/recusado |

O Figma original possui **15 frames explícitos** (9 desktop, 6 mobile). As telas sem frame mobile específico também foram adaptadas para celular. **Snapshots Playwright não significam comparação pixel a pixel com o Figma**; confira manualmente os frames de referência em [auditoria do escopo](ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md). Diferenças funcionais justificadas: feedback de erro, 404, acessibilidade, login social não funcional, e linguagem explícita de simulação.

## 4. Arquitetura, segurança e limites

- React/TypeScript/Vite, Tailwind e componentes UI, TanStack Router/Query, Axios, MSW, `socket.io-client`, Playwright e Lighthouse estão integrados.
- O MSW valida e guarda os dados de sessão, favoritos, carrinho, cotações e pedidos; `bigint` evita arredondamentos no cálculo ETH/wei.
- `nft.updated` e `order.updated` passam pelo **cliente Socket.IO verdadeiro** e pelo adaptador WebSocket-only do MSW. Eventos duplicados/antigos são ignorados e a reconexão reconcilia via REST.
- Autenticação, preços, estoque, carteiras, transações e recibos são **apenas simulação**, não uma solução pronta para produção ou armazenamento de dados sensíveis.

Ler também [ARCHITECTURE.md](../ARCHITECTURE.md) e [regras e liberdades](REGRAS_E_LIBERDADES_DO_DESAFIO.md).

## 5. Estado da publicação e aceite

- [x] Nove telas navegáveis, API simulada, testes E2E e documentação.
- [x] CI final da branch de entrega: **150 passed, 12 skipped, 0 failed** no commit `fd3d9601`.
- [x] Deploy público da aplicação: [kurio-jungle-challenge.vercel.app](https://kurio-jungle-challenge.vercel.app/), **READY** na Vercel no commit `0dae1479` da branch `feat/checkout-mobile-figma-polish`. O commit posterior `fd3d9601` alterou somente um teste e não o código da aplicação.
- [ ] Conferir manualmente o visual nos principais frames do Figma no dispositivo de avaliação; snapshots não substituem aceite pixel a pixel.
- [ ] Reexecutar o smoke da produção no Chromium após a consolidação na `main`: `KURIO_DEPLOY_URL=https://kurio-jungle-challenge.vercel.app node scripts/quality/deployment-smoke.mjs`.
- [ ] Confirmar na Vercel o commit e a integridade do domínio **após** o merge do [PR #5](https://github.com/maurodferreira/jnggaming/pull/5). Não confundir links de Preview com produção.

O site é uma demonstração com MSW: não há pagamento real, blockchain ou transferência de ativos. A documentação registra o comportamento e os limites deliberados.
