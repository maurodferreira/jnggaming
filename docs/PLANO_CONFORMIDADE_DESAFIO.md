# Plano de conformidade — Desafio Frontend KURIO

**Data da auditoria:** 19/10/2026  
**Fonte:** enunciado integral *Desafio Frontend — Marketplace de NFTs* (arquivo fornecido pelo responsável); Figma `HuEe6XFEtLBuMlCI8pYddf`; código da branch `feat/figma-kurio-ui`.  
**Status:** EM DESENVOLVIMENTO. **NÃO PRONTO PARA ENTREGA**.

## Atualização de implementação — 19/10/2026

> A matriz de nove telas abaixo registra a auditoria **inicial**. Status atualizado nesta revisão:
>
> - **Catalogo, NFT e carrinho:** telas e REST operacionais, com favoritos, login/merge e botão de checkout; revisão de casos extremos e regressão visual ainda necessária.
> - **Login, cadastro, perfil e carteiras:** implementados em React + MSW, com rotas protegidas, sessão demo, avatar, senha e carteiras por usuário.
> - **Pagamento e confirmação:** telas e endpoints REST mock de quote, cupom, taxa em ETH, chave idempotente, revalidação, pedido pendente e recibo condicionado à confirmação. Não há transações reais.
> - **Playwright:** Chromium desktop/mobile ativo no CI, cobrindo também checkout e refresh; exigir execução verde no commit final.
> - **Ainda bloqueadores:** Socket.IO efetivo e eventos/reconciliação, falhas avançadas (timeout/recusa/alteração de preço), baselines visuais, acessibilidade completa, Lighthouse e deploy final.

**Próxima prioridade:** terminar estabilização E2E, ampliar mocks de falhas e implementar o fluxo Socket.IO. A `main` segue intocada e o PR permanece em rascunho.

---

## Como interpretar o status
- **Implementado:** há funcionalidade comprovável no código, dentro do escopo indicado.
- **Parcial:** só parte do requisito, sem cumprir toda a especificação.
- **Pendente:** implementação ausente ou sem evidência.
- **A validar:** sem testes/medições de conformidade.

## Nove telas/fluxos exigidos
| Tela | Status | Pendências principais |
| --- | --- | --- |
| Início/catálogo | Parcial | Revisão de fidelidade, cenários de rede, shimmer e E2E |
| Detalhe do NFT | Parcial | Galeria com troca real, favoritos, eventos e E2E |
| Carrinho | Parcial | Cupom, cotação, taxas, total API, merge no login e preço alterado |
| Pagamento | Pendente | Formulários, carteira/rede, quote/revalidação, pedido idempotente |
| Confirmação | Pendente | Recibo de pedido confirmado, estado pendente/recusado e snapshot |
| Login | Pendente | Sessão, validação, expiração, retorno ao fluxo |
| Cadastro | Pendente | Registro, validação, conflito, contas fictícias |
| Perfil | Pendente | Dados/avatar/senha persistentes |
| Carteiras | Pendente | Principal/secundária, validação e escolha no checkout |

## Stack obrigatória — situação
- **Em uso:** React, TypeScript, Tailwind, Axios; Router, Query, shadcn/ui, MSW e REST parcialmente integrados ao escopo.
- **Ainda sem uso efetivo:** Socket.IO (instalado, mas sem eventos reais), Playwright e Lighthouse.
- **CI atual:** `npm ci`, `typecheck`, `lint`, `build` aprovados no commit `f2d0016`. Isso **não** constitui evidência de E2E, visual ou Lighthouse.

## Critérios eliminatórios a evitar
- Uso apenas nominal de tecnologias exigidas.
- Fluxos principais apenas visuais.
- Sucesso de compra exibido sem confirmação de pedido pela API simulada.
- Exposição de dados privados entre usuários.
- Eventos disparados diretamente no estado de UI (sem Socket.IO real).
- Ausência de testes Playwright E2E executáveis.

## Contratos a completar
- `/auth`: signup, login, session, logout, expiração.
- `/favorites`: consulta/inclusão/remoção por usuário.
- `/cart`: manter guest cart, merge no login, estoque e correção de preços.
- `/quote`: cupom, disponibilidade, desconto, network fee, total e validade.
- `/orders`: criação **idempotente**, busca de status/recibo e recuperação de timeout.
- `/profile`: dados, avatar e senha.
- `/wallets`: carteira principal/secundária e rede.
- Eventos com versões: `nft.updated` e `order.updated`; deduplicação, reconexão e REST reconcile.

## Roadmap prioritário com aceite
1. **P0 - Testes base e MSW**: reset determinístico integral, cenários com 2 usuários, Playwright smoke desktop/mobile. Aceite: `test:e2e` verde via CI, sem setup privado.
2. **P0 - Auth/sessão**: conta fictícia, guards, expiração/refresh, cache isolado, merge do carrinho. Aceite: troca de conta sem vazamento.
3. **P0 - Favoritos/perfil/carteiras**: UI Figma, APIs, erro de validação, persistência. Aceite: CRUD + refresh.
4. **P0 - Checkout**: quote/cupom/taxas/revalidação/idempotência/recibo. Aceite: compra, recusa, timeout, clique repetido sem pedido duplicado.
5. **P0 - Socket.IO**: mock socket compatível com client, versionamento e reconciliação REST. Aceite: atualização de NFT durante checkout exige revalidação; pedido pendente se recupera.
6. **P1 - UX/responsividade/a11y**: 390, 768, 1440 px; shimmer e motion; galeria real, teclado/foco, sem overflow. Aceite: regressão visual e testes de teclado.
7. **P1 - Qualidade & entrega**: 12 cenários E2E, Lighthouse 3 rodadas por perfil/página, deploy público, docs finais. Aceite: relatórios HTML/JSON, traces, URLs e checkout limpo reprodutível.

## Qualidade & entregáveis oficiais
- Lighthouse para Home e Detalhe, desktop/mobile: **Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90**; informar medianas de 3 medições, LCP, CLS, TBT.
- Playwright Chromium desktop/mobile, regressão visual Home/Detalhe/Carrinho/Checkout, baselines e traces.
- Deploy obrigatório com SPA fallback, MSW e tempo real funcionando no build.
- `README.md` com setup, credenciais demo, cenários/reset, falhas, comandos e URL.
- `ARCHITECTURE.md` com contratos, políticas de sessão/cache, ordem de eventos, decisões e divergências Figma.

## Riscos específicos encontrados
- `README.md` e `ARCHITECTURE.md` da branch ainda afirmam que o layout do Figma não foi aplicado: **atualizar**.
- Miniaturas do detalhe reutilizam a mesma imagem e não são galeria interativa.
- Apenas 4 artes originais distintas; vários NFTs usam os mesmos retratos, documentar o uso.
- Fonte Roboto Mono ainda remota: preferível disponibilizar localmente.
- `npm ci` local reportou 7 vulnerabilidades altas; auditar antes da entrega (não usar `npm audit fix --force` automaticamente).

**Não atribuir nota estimada:** pesos oficiais 20 visual, 20 fluxos, 15 integração, 10 tempo real, 10 mocking, 10 testes, 5 acessibilidade, 5 performance, 5 documentação = **100 pontos**. Sem avaliação executada, não existe pontuação confiável.

**Foco para a próxima sessão:** começar pelo P0 (infra de teste + cenários MSW), então autenticação/sessão. Preservar a branch e evitar merge na `main` antes do aceite.
