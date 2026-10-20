# KURIO — escopo original, auditoria do Figma e plano de entrega

**Revisão:** 20/10/2026 (complementada após testes e deploy)  
**Documento-base:** `Texto colado(20261019-155647).txt` — *Desafio Frontend — Marketplace de NFTs*, recebido do processo seletivo.  
**Figma:** https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-  
**Código:** https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui  
**PR:** https://github.com/maurodferreira/jnggaming/pull/1 (**rascunho**).

> **Estado validado na etapa 4:** o código final passou em **117 testes Playwright** e atingiu as metas Lighthouse (Home mobile 100, NFT mobile 90; desktop 98/99; demais categorias 100). O [checklist de entrega](CHECKLIST_ENTREGA.md) contém evidências, reprodução e bloqueadores de publicação. As seções 4–7 abaixo preservam o histórico da auditoria e não devem ser confundidas com o estado mais recente.
>
> **Fidelidade:** a existência das nove rotas e as 27 baselines internas **não** comprovam equivalência pixel a pixel com os 15 frames originais. O aceite visual humano permanece necessário; nenhuma nota oficial é atribuída ao projeto.

## 1. O que a empresa efetivamente pediu

Implementar um **marketplace de NFTs demonstrativo**, desktop e mobile, capaz de executar o ciclo de descoberta, detalhe, carrinho, autenticação, escolha de carteira, cotação e pedido. A UI segue o Figma; os comportamentos obrigatórios seguem o enunciado.

**Stack obrigatória em uso na branch:** React, TypeScript, TanStack Router, TanStack Query, Axios/REST, Socket.IO client, Tailwind, componentes shadcn/ui, MSW, Playwright e Lighthouse. O MSW v3 simula o protocolo Socket.IO em WebSocket-only; ele não é um servidor de pagamentos ou blockchain.

**Excluídos do escopo:** pagamento real, blockchain, conexão com extensão de carteira, gateways financeiros, páginas editoriais completas, suporte, ofertas, downloads, login com provedores externos e newsletter real. Ações fora do escopo não devem aparentar sucesso.

## 2. As 9 telas obrigatórias e os 15 frames do Figma

| Tela | Figma desktop | Figma mobile | Implementação da branch | Ajustes antes do aceite |
| --- | --- | --- | --- | --- |
| Início / catálogo | `2:2` | `14:5226` | `/` — hero, cards, busca, filtros, ordenação, paginação e estado URL | Conferir proporções, filtros mobile, galeria de artes, rodapé e baselines reais |
| Detalhes do NFT | `10:244` | `15:5536` | `/nft/$nftId` — artwork, edição, quantidade, preço e favoritos | Reproduzir/validar comportamento de galeria e compra mobile vs. frame, validar estoque esgotado |
| Carrinho de NFTs | `11:1278` | `16:360` | `/cart` — itens, quantidade, remoção, persistência e subtotal | Cupom, desconto, taxa de rede e total estimado agora usam `GET /api/cart/summary` compartilhando cálculo `bigint` com `/api/quote`; validação final ainda depende de E2E no commit atual |
| Pagamento | `11:2862` | `16:748` | `/checkout` — carteira, rede, provedor, cupom, cotação e pedido simulado | Comparar composição fina, campos do layout, expiração durante a compra, diálogo de revalidação |
| Confirmação | `11:4385` | não fornecido | `/orders/$orderId` — pending/confirmed/declined, ID, snapshot, taxas | Aproximar comprovante visual e testar retomada em falhas múltiplas. Manter **mensagem explícita de simulação**, sem simular transferência real |
| Login | `9:115` | `16:1022` | `/login` — validação, sessão e retorno | Testar expiração/cenários lentos e variações de erro; login Google/Facebook está fora do escopo |
| Cadastro | `9:1022` | `16:1228` | `/register` — conta demonstrativa, validação e conflito | Confirmar diferenças de layout e falhas determinísticas |
| Perfil do colecionador | `9:1238` | não fornecido | `/profile` — edição, avatar e mudança de senha | Contraste, zoom, e-mail/ENS conforme mock e estados de erro |
| Carteiras | `9:1670` | não fornecido | `/wallets` — carteira principal e secundária, rede, endereço, tipo e apelido | **Diferença visível:** Figma mostra campos complementares (nome de perfil, e-mail, ENS, código de indicação). Decidir integração aos contratos mock sem coletar dados reais |

**Resultado:** existem rotas/componentes para **todas as 9 telas** do enunciado e versões responsivas para todas. Existem **15 frames explícitos** (9 desktop e 6 mobile). A presença das rotas é comprovável, porém ainda NÃO existe prova de equivalência pixel a pixel em todas as 15 combinações. A suíte `visual-baselines.spec.ts` agora versiona **27 snapshots** das 9 telas em 390, 768 e 1440 px; isso é regressão visual da implementação, **não** equivalência automática com o Figma.

## 3. Funcionalidades e integração

| Requisito | Situação verificada | Pendência |
| --- | --- | --- |
| Catálogo + estado URL + filtros combinados | Implementado | Validar filtros, paginação e respostas fora de ordem na matriz completa |
| Detalhe, edição, quantidade, favorito | Implementado no código | Validação da galeria frente ao Figma e cenários de estoque |
| Carrinho visitante, merge e isolamento entre contas | Implementado, com testes E2E | Prévia por API e passagem do cupom verificadas por E2E; validar último commit |
| Login, cadastro, perfil, avatar, senha e carteiras | Implementado via API mock | Expiração, autenticação em múltiplas abas e erros específicos |
| Quote, cupom, rede, taxa e precisão ETH em `bigint` | Implementado no checkout | Confirmar mudanças de valor mediante revalidação clara ao usuário |
| Pedido idempotente, snapshot e recuperação após falha de rede | Implementado na API MSW e no recibo | Completar testes de perda de resposta múltipla, clique repetido e pendência |
| `nft.updated` / `order.updated`, versões e reconexão | Implementado com `socket.io-client` + adaptador WebSocket MSW | Cobrir eventos e cenários extremos, documentar WebSocket-only |
| Skeleton e reduced-motion | Presente | Garantir shimmer obrigatório e baselines de todos os estados |
| Rotas inválidas | Página 404 adicionada nesta revisão | Implementada e coberta por testes E2E |
| Testes Playwright desktop/mobile | Presentes, com execuções aprovadas e 27 screenshots versionadas | Revalidar no último commit após ajustes |
| Lighthouse (3 execuções/página/dispositivo) | Implementado, com relatórios | Auditorias anteriores: desktop 98–99, mobile abaixo de 90; a mediana final precisa ser conferida após os últimos ajustes |
| Dependências e build | Build local Windows com fallback passou, CI validou ambos os modos | A migração oficial `shadcn eject` eliminou os 7 avisos altos (auditoria npm retornou zero); fallback `EPERM` documentado e testado |
| Deploy público | Configuração `vercel.json` presente | Domínio publicado e teste Chromium público aprovado (11/11, incluindo Service Worker, rotas profundas e refresh) |

## 4. Pontuação oficial (não é nota obtida)

- Fidelidade visual e responsividade **20 pontos**
- Fluxos e experiência **20**
- Integração e estado **15**
- Tempo real **10**
- Mocking **10**
- Testes **10**
- Acessibilidade **5**
- Performance **5**
- Arquitetura/documentação **5**

**Total: 100 pontos.** Nenhuma pontuação estimada é atribuída ao projeto, pois a empresa é quem avalia.

**Riscos eliminatórios:** stack apenas instalada sem funcionar; fluxos apenas visuais; recibo emitido sem confirmação da API; exposição de dados entre usuários; eventos atualizando estado sem passar pelo Socket.IO; falta de Playwright E2E executável.

## 5. Melhorias de autoria permitidas

**Podemos melhorar a solução**, pois o enunciado deixa organização, bibliotecas complementares e tratamento dos estados não desenhados a critério do candidato, desde que a stack funcione e não se abandone a fidelidade visual.

**Melhorias seguras dentro da entrega:** transições discretas, foco/teclado melhor, imagens WebP a partir de PNGs originais, fonte local, legibilidade mobile, 404, feedback de erros, placeholders e textos acessíveis, código modular, performance, controles de segurança do mock. Documentar divergências do Figma no `ARCHITECTURE.md`.

**Melhorias para DEPOIS do aceite:** histórico completo de pedidos, coleção pessoal, favoritos como página separada, filtro avançado, comparação de NFTs, criadores reais e recursos sociais. Elas não devem substituir critérios obrigatórios nem desviar o prazo de entrega.

**Nunca simular como real:** carteiras conectadas, compras blockchain, Etherscan, newsletter enviada, OAuth Google/Facebook, downloads, contato com suporte.

## 6. Próximas etapas em ordem

1. Confirmar o CI da branch após as últimas mudanças. A execução `39417467756` mostrou 62/64 Playwright (falha por seletor duplicado no rodapé e espera curta de evento em tempo real); foram corrigidos os testes, e a nova rodada precisa aprovar antes do aceite.
2. Confirmar via Playwright a **prévia de cupom/taxa/total no carrinho**, a consistência com `/api/quote` e alterações de preço/estoque; a UI/API já foram adicionadas.
3. Revisar fidelidade dos **15 frames** usando screenshot real e Figma nas larguras originais; produzir baselines Playwright versionadas, sem comparar loading skeleton.
4. Completar testes de expiração, falha 5xx, offline, latency/out-of-order, confirmação e estado de pedido pendente; revisar formulários conforme layout.
5. Otimizar Performance mobile até mediana ≥90 sem falsear o Lighthouse ou desativar funcionalidades.
6. Resolver advisories npm, validar imagem/fontes, deep-links e preview/deploy público com MSW e Socket.IO; atualizar documentação final e encerrar PR somente após aceite.

**Condição de entrega:** código, lockfile, assets, mocks, fixtures, testes, traces, baselines de regressão, relatórios Lighthouse HTML/JSON, README, ARCHITECTURE, link do GitHub e **URL pública funcional**. A `main` permanece sem receber merge prematuro.

## 7. Continuação da revisão — 20/10/2026

- Identificamos nos logs da execução [39417467756](https://github.com/maurodferreira/jnggaming/actions/runs/39417467756) **62 testes Playwright aprovados e dois reprovados**: seletor `Meu perfil` agora ambíguo com o rodapé, e atualização Socket.IO assíncrona que não ficou visível nos 5 segundos anteriores. O seletor foi restringido a `h1`; a espera do segundo foi ampliada sem remover a verificação de tempo real. **É necessário CI verde para comprovar correção.**
- Conferidos no Figma, de forma direta, os 15 frames originais: nove desktop (1440 px) e seis mobile (414 px). As capturas E2E próprias usam também 390 e 768 px, mas ainda faltam baselines versionadas e comparação visual aprovada.
- Adicionado resumo de carrinho por API que atende visitantes e usuários autenticados, com subtotal, cupom `KURIO10`, desconto, taxa e total; usa o **mesmo cálculo de precisão `bigint`** das cotações autenticadas. Há feedback explícito de cupom inválido/expirado; o cupom aplicado é transportado para o checkout por parâmetro de URL.
- Adicionados E2E em `tests/e2e/cart-summary.spec.ts`: valores do subtotal/total, aplicação/remoção de cupom, erro da API e passagem do desconto para o checkout. **Ainda aguardam o CI da versão final.**
- O checkout continua simulando operações, sem conectar carteiras nem processar transações financeiras reais. A `main` não recebeu merge.

**Foco restante:** CI final, fidelidade visual e baselines das 15 telas, acessibilidade, 3× Lighthouse por página/dispositivo (mobile ≥90), dependências vulneráveis, rotas profundas e URL de deploy público. Não confundir implementação com aceite.


## 8. Evidências consolidadas para a entrega — 20/10/2026

Esta seção substitui os status provisórios e números antigos do histórico acima.

| Critério | Resultado validado | Evidência |
| --- | --- | --- |
| 9 rotas e telas | Implementadas em desktop/mobile; dados e transações inteiramente simulados | [README](../README.md) e [arquitetura](../ARCHITECTURE.md) |
| Integração e estado | REST mock com sessão, carrinho, favoritos, cotação, pedido idempotente e recuperação | [CI](https://github.com/maurodferreira/jnggaming/actions/runs/39483364599) |
| Socket.IO | Cliente verdadeiro com MSW WebSocket-only, eventos versionados e reconciliação na reconexão | [CI — 117 testes](https://github.com/maurodferreira/jnggaming/actions/runs/39483364599) |
| Testes | **117 passed / 9 skipped / 0 failed**; build, TypeScript e lint aprovados | [CI 39483364599](https://github.com/maurodferreira/jnggaming/actions/runs/39483364599) |
| Figma/responsivo | **15 frames** auditados, 27 baselines versionadas em 390, 768 e 1440 px | [Capturas](https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui/tests/e2e/visual-baselines.spec.ts-snapshots) |
| Home mobile | Performance **100**, LCP **1,238s**, TBT **43ms**, CLS **0** | [Lighthouse 39483283845](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845) |
| NFT mobile | Performance **90**, LCP **3,043s**, TBT **67ms**, CLS **0** | Mesmo relatório |
| Home / NFT desktop | Performance **98 / 99**, CLS **0** | Mesmo relatório |
| A11y / boas práticas / SEO | **100 / 100 / 100** nas quatro combinações | Mesmo relatório |
| Dependências | **0 vulnerabilidades** no `npm audit` registrado | Mesmo relatório |
| URL pública | Smoke anterior Chromium **11/11**; não corresponde ainda ao código final | [Smoke histórico](https://github.com/maurodferreira/jnggaming/actions/runs/39428035215) |

O Lighthouse registra medianas de **três execuções por página e dispositivo** em preview do build real (sem desligar MSW, Socket.IO ou as interfaces). O código de runtime foi medido no commit `7ea96bf1`; o HEAD `114fa5d4` acrescentou somente o teste `realtime-initial-load.spec.ts`, sem mudança da aplicação. As pontuações variam conforme máquina/rede e **não são a nota oficial**.

### Pendências de aceite antes de enviar à empresa

1. **Aprovação visual humana:** comparar os **15 frames explícitos do Figma** com as telas finais; validar os estados sem frame mobile exclusivo e registrar divergências justificadas.
2. **Implantação correta:** em 20/10/2026 a alias pública `kurio-jungle-challenge.vercel.app` ainda servia o commit antigo `9a2289a9`, não a branch aprovada. Publicar/promover a revisão aceita sem contornar proteção de preview, depois reexecutar o smoke Chromium nesse domínio.
3. **Revisão do PR:** conferir arquivos, artefatos e segurança antes de mudar Draft, fazer merge ou apresentar como entrega definitiva.

A arquitetura WebSocket-only e os dados de demo são **limitações deliberadas**, não funcionalidades reais de blockchain/pagamentos. Requisitos extra fora do desafio (integração financeira, carteiras reais, newsletter, OAuth) permanecem excluídos. Não estimar pontuação final em 100 pontos: o avaliador oficial é quem a atribui.

Resumo operacional: [checklist final](CHECKLIST_ENTREGA.md) · [PR #1](https://github.com/maurodferreira/jnggaming/pull/1).
