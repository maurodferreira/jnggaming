# KURIO — escopo original, auditoria do Figma e plano de entrega

**Revisão:** 20/10/2026  
**Documento-base:** `Texto colado(20261019-155647).txt` — *Desafio Frontend — Marketplace de NFTs*, recebido do processo seletivo.  
**Figma:** https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-  
**Código:** https://github.com/maurodferreira/jnggaming/tree/feat/figma-kurio-ui  
**PR:** https://github.com/maurodferreira/jnggaming/pull/1 (**rascunho**).

> Esta matriz substitui os estados históricos do documento `PLANO_CONFORMIDADE_DESAFIO.md`, criado antes da implementação de autenticação, checkout e Socket.IO. **Existência da tela/rota não significa fidelidade visual pixel a pixel nem encerramento dos testes.** Não atribuímos nota estimada à entrega.

## 1. O que a empresa efetivamente pediu

Implementar um **marketplace de NFTs demonstrativo**, desktop e mobile, capaz de executar o ciclo de descoberta, detalhe, carrinho, autenticação, escolha de carteira, cotação e pedido. A UI segue o Figma; os comportamentos obrigatórios seguem o enunciado.

**Stack obrigatória em uso na branch:** React, TypeScript, TanStack Router, TanStack Query, Axios/REST, Socket.IO client, Tailwind, componentes shadcn/ui, MSW, Playwright e Lighthouse. O MSW v3 simula o protocolo Socket.IO em WebSocket-only; ele não é um servidor de pagamentos ou blockchain.

**Excluídos do escopo:** pagamento real, blockchain, conexão com extensão de carteira, gateways financeiros, páginas editoriais completas, suporte, ofertas, downloads, login com provedores externos e newsletter real. Ações fora do escopo não devem aparentar sucesso.

## 2. As 9 telas obrigatórias e os 15 frames do Figma

| Tela | Figma desktop | Figma mobile | Implementação da branch | Ajustes antes do aceite |
| --- | --- | --- | --- | --- |
| Início / catálogo | `2:2` | `14:5226` | `/` — hero, cards, busca, filtros, ordenação, paginação e estado URL | Conferir proporções, filtros mobile, galeria de artes, rodapé e baselines reais |
| Detalhes do NFT | `10:244` | `15:5536` | `/nft/$nftId` — artwork, edição, quantidade, preço e favoritos | Reproduzir/validar comportamento de galeria e compra mobile vs. frame, validar estoque esgotado |
| Carrinho de NFTs | `11:1278` | `16:360` | `/cart` — itens, quantidade, remoção, persistência e subtotal | **Lacuna:** campo de cupom, desconto, taxa e total da API ficam no checkout, não no resumo do carrinho, como pede o enunciado |
| Pagamento | `11:2862` | `16:748` | `/checkout` — carteira, rede, provedor, cupom, cotação e pedido simulado | Comparar composição fina, campos do layout, expiração durante a compra, diálogo de revalidação |
| Confirmação | `11:4385` | não fornecido | `/orders/$orderId` — pending/confirmed/declined, ID, snapshot, taxas | Aproximar comprovante visual e testar retomada em falhas múltiplas. Manter **mensagem explícita de simulação**, sem simular transferência real |
| Login | `9:115` | `16:1022` | `/login` — validação, sessão e retorno | Testar expiração/cenários lentos e variações de erro; login Google/Facebook está fora do escopo |
| Cadastro | `9:1022` | `16:1228` | `/register` — conta demonstrativa, validação e conflito | Confirmar diferenças de layout e falhas determinísticas |
| Perfil do colecionador | `9:1238` | não fornecido | `/profile` — edição, avatar e mudança de senha | Contraste, zoom, e-mail/ENS conforme mock e estados de erro |
| Carteiras | `9:1670` | não fornecido | `/wallets` — carteira principal e secundária, rede, endereço, tipo e apelido | **Diferença visível:** Figma mostra campos complementares (nome de perfil, e-mail, ENS, código de indicação). Decidir integração aos contratos mock sem coletar dados reais |

**Resultado:** existem rotas/componentes para **todas as 9 telas** do enunciado e versões responsivas para todas. Existem **15 frames explícitos** (9 desktop e 6 mobile). A presença das rotas é comprovável, porém ainda NÃO existe prova de equivalência pixel a pixel em todas as 15 combinações. Os testes `visual-review` e `visual-account-review` guardam capturas, mas ainda não versionam baselines com `toHaveScreenshot`.

## 3. Funcionalidades e integração

| Requisito | Situação verificada | Pendência |
| --- | --- | --- |
| Catálogo + estado URL + filtros combinados | Implementado | Validar filtros, paginação e respostas fora de ordem na matriz completa |
| Detalhe, edição, quantidade, favorito | Implementado no código | Validação da galeria frente ao Figma e cenários de estoque |
| Carrinho visitante, merge e isolamento entre contas | Implementado, com testes E2E | Completar UI do cupom e resumo por API no carrinho |
| Login, cadastro, perfil, avatar, senha e carteiras | Implementado via API mock | Expiração, autenticação em múltiplas abas e erros específicos |
| Quote, cupom, rede, taxa e precisão ETH em `bigint` | Implementado no checkout | Confirmar mudanças de valor mediante revalidação clara ao usuário |
| Pedido idempotente, snapshot e recuperação após falha de rede | Implementado na API MSW e no recibo | Completar testes de perda de resposta múltipla, clique repetido e pendência |
| `nft.updated` / `order.updated`, versões e reconexão | Implementado com `socket.io-client` + adaptador WebSocket MSW | Cobrir eventos e cenários extremos, documentar WebSocket-only |
| Skeleton e reduced-motion | Presente | Garantir shimmer obrigatório e baselines de todos os estados |
| Rotas inválidas | Página 404 adicionada nesta revisão | Aguardar execução CI do commit atual |
| Testes Playwright desktop/mobile | Presentes, resultados aprovados em commits anteriores | Validar **todos** os testes no commit final; baselines de screenshot obrigatórios |
| Lighthouse (3 execuções/página/dispositivo) | Implementado, com relatórios | Última versão confiável: desktop 99; mobile Home 86, NFT 88. Meta de Performance mobile é 90 |
| Dependências e build | Build local Windows com fallback passou, CI validou ambos os modos | Analisar e corrigir 7 avisos altos da cadeia de desenvolvimento; investigar `EPERM` definitivamente |
| Deploy público | Configuração `vercel.json` presente | **URL pública e refresh profundo não verificados**. Deploy é obrigatório |

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

1. Confirmar o CI da branch após as últimas mudanças de rodapé e rota 404; corrigir regressões antes de novo recurso.
2. Corrigir o **resumo de cupom/taxas/total no carrinho** por cotação REST e validar mudança de preço/estoque.
3. Revisar fidelidade dos **15 frames** usando screenshot real e Figma nas larguras originais; produzir baselines Playwright versionadas, sem comparar loading skeleton.
4. Completar testes de expiração, falha 5xx, offline, latency/out-of-order, confirmação e estado de pedido pendente; revisar formulários conforme layout.
5. Otimizar Performance mobile até mediana ≥90 sem falsear o Lighthouse ou desativar funcionalidades.
6. Resolver advisories npm, validar imagem/fontes, deep-links e preview/deploy público com MSW e Socket.IO; atualizar documentação final e encerrar PR somente após aceite.

**Condição de entrega:** código, lockfile, assets, mocks, fixtures, testes, traces, baselines de regressão, relatórios Lighthouse HTML/JSON, README, ARCHITECTURE, link do GitHub e **URL pública funcional**. A `main` permanece sem receber merge prematuro.
