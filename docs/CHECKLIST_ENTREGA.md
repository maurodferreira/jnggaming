# KURIO — checklist de entrega e revisão final

**Revisão:** 20/10/2026 · **Branch:** `feat/figma-kurio-ui` · **PR:** [#1](https://github.com/maurodferreira/jnggaming/pull/1)

Este é um roteiro curto para reproduzir o desafio, inspecionar o código e concluir a publicação. Os resultados abaixo são de uma **demonstração frontend**, sem dinheiro, blockchain, carteiras ou NFT reais.

## 1. Evidências automatizadas

| Verificação | Resultado comprovado | Evidência |
| --- | --- | --- |
| Instalação, TypeScript, ESLint e builds | Aprovados, incluindo fallback Windows | [CI 39483364599](https://github.com/maurodferreira/jnggaming/actions/runs/39483364599) |
| Playwright desktop/mobile | **117 passed, 9 skipped intencionalmente, 0 failed** | [Mesmo CI](https://github.com/maurodferreira/jnggaming/actions/runs/39483364599) |
| Lighthouse Home mobile | **100/100/100/100** (Perf/A11y/BP/SEO) | [Relatório 39483283845](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse NFT mobile | **90/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse Home desktop | **98/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Lighthouse NFT desktop | **99/100/100/100** | [Mesmo relatório](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Dependências | **0 vulnerabilidades** no `npm audit` dessa execução | [Relatório/artefato](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| Regressão visual | **27 snapshots versionadas**, 9 páginas × 390/768/1440 px | [Baselines Playwright](https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui/tests/e2e/visual-baselines.spec.ts-snapshots) |
| Domínio público | Smoke de Home, MSW, API, assets, deep links e refresh **aprovado anteriormente** | [Smoke 39428035215](https://github.com/maurodferreira/jnggaming/actions/runs/39428035215) |

As notas Lighthouse são **medianas de três execuções por página e dispositivo**, feitas sobre o build local de produção. O relatório de qualidade foi feito no commit `7ea96bf1`; a mudança posterior `114fa5d4` acrescentou **somente um teste**, sem alterar o código que roda no navegador. A nota real pode variar conforme o dispositivo. Esses resultados não são a pontuação oficial da Jungle Gaming.

## 2. Reproduzir em uma máquina nova

Use **Node.js 22.12+**, npm e um navegador Chromium atualizado.

```bash
git clone https://github.com/maurodferreira/jnggaming.git
cd jnggaming
git switch feat/figma-kurio-ui
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

## 5. Publicação e aceite pendentes

> **Revisão visual e roteiro de Vercel:** veja [Revisão final — Figma e publicação](REVISAO_FINAL_FIGMA_E_PUBLICACAO.md), com a comparação dos 15 frames, as adaptações conscientes, os links de CI e os passos de **Create Deployment → Promote to Production** no painel correto. O preview antigo não deve ser promovido sem conferir o SHA.



- [x] Nove telas navegáveis com demonstração funcional, testes e documentação.
- [x] Medianas Lighthouse dentro das metas **na rodada registrada** e CI verde.
- [x] Regressão visual automatizada com 27 screenshots.
- [ ] **Confirmar manualmente a fidelidade final aos 15 frames do Figma** e aprovar eventuais divergências documentadas.
- [ ] **Publicar/promover exatamente a revisão aceita** em um domínio acessível ao avaliador. Na inspeção de 20/10/2026, `kurio-jungle-challenge.vercel.app` ainda apontava para o commit `9a2289a9` (antigo); o último preview identificado era do `7ea96bf1`, anterior ao commit que apenas acrescentou o teste final.
- [ ] **Reexecutar o smoke no domínio definitivo** e registrar o commit publicado, incluindo deep links e refresh: `KURIO_DEPLOY_URL=https://SEU-DOMINIO node scripts/quality/deployment-smoke.mjs`.
- [ ] Revisar o [PR #1](https://github.com/maurodferreira/jnggaming/pull/1), seu diff e os links de evidência; só alterar o estado Draft ou fazer merge após aprovação explícita.

**Importante:** não confundir uma URL de preview da Vercel que exige autenticação com o domínio público. Não promover automaticamente a build, nem modificar a `main`, enquanto faltar o aceite da entrega.
