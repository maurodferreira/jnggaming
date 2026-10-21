# KURIO — Marketplace de NFTs

Um marketplace de NFTs desenvolvido como desafio técnico de Frontend para a **Jungle Gaming**. A ideia foi transformar o design do Figma em uma aplicação navegável, com catálogo, carrinho, contas de colecionador e uma compra inteiramente simulada — incluindo as situações em que a rede ou a sessão falham.

**[Demonstração pública](https://kurio-jungle-challenge.vercel.app/)** · [Figma original](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f) · [Regras e decisões de design](docs/REGRAS_E_LIBERDADES_DO_DESAFIO.md) · [Auditoria do desafio](docs/ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md)

> **Uma demonstração, não um marketplace financeiro.** Não há pagamentos, transferência de NFTs, conexão com blockchain ou carteira real. Os dados e as operações são simulados de ponta a ponta com MSW.

## Status da entrega — 21/10/2026

**Versão final para avaliação:** código consolidado no [PR #5](https://github.com/maurodferreira/jnggaming/pull/5), partindo da branch `feat/checkout-mobile-figma-polish`. A produção foi conferida no commit `0dae1479`. O commit `fd3d9601` corrigiu somente a sincronização de um teste Playwright; não mudou o comportamento publicado.

- **Código:** [CI aprovado — 150 testes Playwright, 12 ignorados intencionalmente, 0 falhas](https://github.com/maurodferreira/jnggaming/actions/runs/39606190433), além de typecheck, lint, build e build alternativo Windows.
- **Qualidade:** [Lighthouse — auditoria histórica de 20/10 (três execuções por página e dispositivo)](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845). Performance Home mobile **100**, NFT mobile **90**, Home desktop **98**, NFT desktop **99**; as demais categorias ficaram em **100**. **Essa medição precede os refinamentos mobile posteriores**, portanto não representa uma nova auditoria do commit entregue.
- **Dependências:** `npm audit` da mesma auditoria registrou **0 vulnerabilidades** (inclusive high/critical).
- **Figma:** nove telas implementadas, com 27 screenshots de regressão em 390, 768 e 1440 px. Esses snapshots protegem o layout do projeto, mas **não comprovam equivalência pixel a pixel** com todos os 15 frames originais.
- **Publicação:** o domínio [kurio-jungle-challenge.vercel.app](https://kurio-jungle-challenge.vercel.app/) foi confirmado na Vercel como **READY**, branch `feat/checkout-mobile-figma-polish`, commit de aplicação `0dae1479`. O smoke end-to-end em navegador contra esse deploy deve ser conferido separadamente do build da Vercel.

O relatório do Lighthouse é uma medição automatizada em preview de produção local, não uma garantia de nota idêntica em todos os celulares. Não atribuímos uma nota oficial ao desafio.


## O que você pode testar

O fluxo começa no catálogo. Você consegue procurar coleções, combinar filtros, ordenar NFTs e abrir os detalhes de cada item. Lá, é possível escolher a edição e a quantidade disponível, adicionar ao carrinho e continuar explorando.

Para concluir a compra demonstrativa, basta entrar com uma conta fictícia, cadastrar uma carteira de teste e escolher o provedor. O checkout calcula subtotal, desconto, taxa de rede e total a partir da API simulada. O recibo só aparece depois da confirmação do pedido pelo mock, e pode ser consultado novamente depois de atualizar a página.

Também é possível editar o perfil, cadastrar uma carteira secundária, favoritar NFTs e experimentar cenários de erro, sessão expirada e mudança de preço em tempo real.

### As nove telas do desafio

| Página | O que ela faz |
| --- | --- |
| `/` | Catálogo, busca, filtros, ordenação e paginação |
| `/nft/:nftId` | Arte, edição, estoque, quantidade e favoritos |
| `/cart` | Carrinho, alterações de quantidade, cupom e resumo da API |
| `/login` | Autenticação simulada e retorno à página solicitada |
| `/register` | Cadastro fictício e tratamento de validações/conflitos |
| `/profile` | Dados do colecionador, avatar e senha |
| `/wallets` | Carteira principal e secundária, rede e endereço de teste |
| `/checkout` | Cotação revalidada, provedor e confirmação simulada |
| `/orders/:orderId` | Estado do pedido e comprovante simulado |

As rotas usam **TanStack Router**, inclusive para acesso direto, refresh e parâmetros da busca. URLs inexistentes exibem uma página 404 com saída para o catálogo.

## Tecnologias e responsabilidades

| Tecnologia | Uso no projeto |
| --- | --- |
| React + TypeScript + Vite | Interface, tipagem e build |
| Tailwind CSS + componentes shadcn/ui | Design responsivo e componentes reutilizáveis |
| TanStack Router | Navegação tipada e filtros na URL |
| TanStack Query | Cache, invalidação, mutations e recuperação de falhas |
| Axios + REST | Chamadas e contratos da API simulada |
| MSW | Handlers de catálogo, sessão, carrinho, carteiras, cotação e pedidos |
| Socket.IO client + WebSocket MSW | Eventos de preço, disponibilidade e status de pedido |
| Playwright | Fluxos E2E e regressão visual desktop/mobile |
| Lighthouse | Performance, acessibilidade, boas práticas e SEO |

Os estilos do shadcn necessários ao projeto foram incorporados ao CSS com o comando oficial `shadcn eject`. Os componentes continuam no código, mas o CLI não precisa ficar como dependência de build.

## Executar na sua máquina

Requisitos: **Node.js 22.12+**, npm e navegador moderno. Use HTTPS ou localhost; os mocks dependem do Service Worker e do Web Crypto.

```bash
git clone https://github.com/maurodferreira/jnggaming.git
cd jnggaming
git checkout main
npm ci
npm run dev
```

Abra **http://localhost:5173**.

| Comando | Para que serve |
| --- | --- |
| `npm run dev` | Servidor local |
| `npm run typecheck` | Verificar os tipos |
| `npm run lint` | Conferir padrões de código |
| `npm run build` | Gerar os arquivos de produção |
| `npm run preview` | Pré-visualizar o build |
| `npx playwright install chromium` | Instalar navegador de testes |
| `npm run test:e2e` | Executar Playwright no desktop e mobile |
| `npm run test:e2e:report` | Abrir o relatório HTML |

### Contas fictícias

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Colecionador | `colecionador@kurio.demo` | `KurioDemo123!` |
| Artista | `artista@kurio.demo` | `KurioDemo123!` |

**Não use dados nem senhas pessoais.** Tudo isso existe apenas no navegador da demonstração. Contas, carrinhos e carteiras são isolados por usuário, mas `localStorage` não substitui um servidor seguro de produção.

### Windows: erro `EPERM` na árvore de rotas

Se o Windows bloquear `src/routeTree.gen.ts`, feche outros processos Vite/Node e verifique se o arquivo está em modo somente leitura. Para trabalhar temporariamente com a árvore de rotas já versionada:

```powershell
$env:KURIO_SKIP_ROUTE_GENERATION = 'true'
npm run dev
```

Esse modo também funciona com `npm run build`, mas **não** deve ser usado ao criar, renomear ou excluir rotas. Para reativar a geração normal no terminal, execute `Remove-Item Env:KURIO_SKIP_ROUTE_GENERATION -ErrorAction SilentlyContinue`. Não é necessário desativar o antivírus nem apagar arquivos gerados.

## Como a simulação funciona

O React consulta a API pelo Axios; os handlers MSW em `src/mocks/` respondem às requisições. Dados de negócio não são fabricados diretamente dentro dos componentes.

- **Catálogo e carrinho:** preços e estoque vêm dos mocks, com persistência separada para visitante e conta.
- **Cotação:** conversões ETH/wei usam `bigint`, evitando erros de ponto flutuante. O cupom `KURIO10` e a taxa são calculados pela mesma lógica no carrinho e no checkout.
- **Pedidos:** a chave de idempotência evita pedidos duplicados; o checkout revalida a cotação e só navega ao recibo após resposta do mock.
- **Sessão:** token demonstrativo com expiração e proteção de rotas. Depois de autenticar novamente, o usuário pode retomar o checkout.
- **Tempo real:** o `socket.io-client` recebe `nft.updated` e `order.updated`. Os eventos provocam reconciliação pelo REST, que continua sendo a fonte de verdade. O adaptador WebSocket do MSW demonstra o protocolo necessário, sem servidor Socket.IO real nem fallback de polling.

### Experimentar erros e rede lenta

No console do navegador, com a aplicação aberta, você pode alternar o perfil de rede do catálogo:

```js
await fetch('/api/mock/catalog-network', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'slow' }),
})
location.reload()
```

Troque `slow` por `normal`, `variable`, `http-500` ou `offline`. Os cenários são reproduzíveis e não criam requisições reais a terceiros. Para restaurar todos os dados da demonstração:

```js
await fetch('/api/mock/reset-all', { method: 'POST' })
location.reload()
```

O endpoint `/api/mock/expire-session` permite testar reautenticação e recuperação de checkout. Há testes automatizados para esses caminhos.

## Testes e qualidade

O GitHub Actions executa instalação travada pelo `package-lock.json`, TypeScript, lint, build, testes E2E e uma compilação alternativa usada no Windows. A suíte Playwright exercita o Chrome desktop e mobile, incluindo login, isolamento de dados, checkout, erros e reconexão.

Além dos fluxos funcionais, existem **27 imagens de referência versionadas** para as **9 telas**, cada uma nas larguras **390, 768 e 1440 px**. Elas ajudam a perceber quando uma mudança altera o layout sem querer; não significam, sozinhas, equivalência pixel a pixel com o Figma.

- [CI — código e Playwright](https://github.com/maurodferreira/jnggaming/actions/workflows/frontend-checks.yml)
- [Capturas e regressão visual](https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui/tests/e2e/visual-baselines.spec.ts-snapshots)
- [Lighthouse e auditoria de dependências](https://github.com/maurodferreira/jnggaming/actions/workflows/quality-audit.yml)
- [Smoke test do domínio público](https://github.com/maurodferreira/jnggaming/actions/workflows/production-smoke.yml)

A última auditoria de dependências confirmada reportou **0 vulnerabilidades no `npm audit`**. O domínio público também passou no teste de navegação, imagens, rotas profundas e API simulada.

### Resultado validado — 21/10/2026

A [suíte atual](https://github.com/maurodferreira/jnggaming/actions/runs/39606190433) encerrou com **150 testes aprovados, 12 ignorados intencionalmente e zero falhas**, incluindo checkout mobile. As notas Lighthouse abaixo são **históricas (auditoria de 20/10)** e não foram novamente medidas no commit final.

| Página | Dispositivo | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | **100** | 100 | 100 | 100 | 1,24 s | 0,000 | 43 ms |
| Início | Desktop | **98** | 100 | 100 | 100 | 0,95 s | 0,000 | 0 ms |
| Detalhe NFT | Mobile | **90** | 100 | 100 | 100 | 3,04 s | 0,000 | 67 ms |
| Detalhe NFT | Desktop | **99** | 100 | 100 | 100 | 0,94 s | 0,000 | 0 ms |

[Relatório completo, métricas individuais e artefatos](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845). Valores de Performance são medianas de três execuções por combinação. Todas as metas do enunciado foram atingidas nessa rodada, com APIs mock, MSW e Socket.IO ativos.

## Figma: fidelidade com decisões conscientes

O Figma define a identidade e a composição das telas; o enunciado define os comportamentos. Por isso, procurei preservar cores, tipografia, imagens e hierarquia, ajustando também estados que não estavam desenhados — erro, carregamento, formulário inválido, carrinho vazio e sessão expirada.

A aplicação **não finge** que funções fora do escopo funcionam. Login com Google/Facebook, assinatura de newsletter, carteira blockchain e transações financeiras reais não são implementados. Quando necessário, campos informativos aparecem somente para consulta ou desativados, em vez de armazenar dados falsos.

Os detalhes de requisitos, as diferenças justificadas e o aceite visual estão em [Regras e liberdades](docs/REGRAS_E_LIBERDADES_DO_DESAFIO.md) e [Auditoria do Figma](docs/ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md).

## Deploy

A versão de aplicação está publicada em **[kurio-jungle-challenge.vercel.app](https://kurio-jungle-challenge.vercel.app/)**. A API da Vercel confirmou o deployment de produção como `READY`, commit `0dae1479` da branch `feat/checkout-mobile-figma-polish`. O commit `fd3d9601` contém apenas uma alteração no teste Playwright e não requer redeploy para mudar o comportamento da aplicação.

- Projeto Vercel: `kurio-jungle-challenge`.
- Framework: Vite; build: `npm run build`; saída: `dist`.
- `vercel.json` redireciona rotas internas para `index.html`, preservando o acesso direto.
- Os mocks ficam habilitados por padrão. `VITE_ENABLE_MOCKS=false` só faz sentido se você configurar um backend compatível; sem isso, o catálogo e o checkout não funcionarão.
- O Service Worker é servido em `/mockServiceWorker.js`.

Uma execução anterior do smoke em Chromium verificou URL pública, MSW, API simulada, assets, deep links e refresh. **Ela não substitui uma nova execução no deployment atual.** Para reproduzir: `KURIO_DEPLOY_URL=https://kurio-jungle-challenge.vercel.app node scripts/quality/deployment-smoke.mjs`.

## Onde encontrar cada parte

```text
src/
  components/     Componentes de layout, catálogo e formulários
  features/       Hooks, contratos e estado remoto
  lib/            Funções compartilhadas e matemática ETH/wei
  mocks/          Handlers MSW, fixtures e estados simulados
  pages/          As telas da aplicação
  routes/         Rotas TanStack Router
  services/       Cliente Axios
tests/e2e/        Fluxos e imagens de referência Playwright
scripts/quality/  Lighthouse e teste público de deploy
docs/             Auditoria, regras, decisões e histórico
```

Mais detalhes técnicos: **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

Este repositório é uma entrega demonstrativa para avaliação de frontend. O foco é mostrar uma interface próxima ao Figma, comportamentos que podem ser testados e decisões técnicas que façam sentido — sem apresentar operações fictícias como se fossem reais.
