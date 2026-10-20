# Jungle Gaming — regras do desafio e liberdade para melhorar o KURIO

Fonte primária: enunciado integral **"Desafio Frontend — Marketplace de NFTs"**, arquivo fornecido pelo candidato `Texto colado(20261019-155647).txt`. Referência de design utilizada: [Figma KURIO (cópia)](https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-). A versão original do link no enunciado: https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1.

## Respondendo à dúvida: preciso copiar exatamente?

O enunciado determina: **"O Figma define a identidade visual e a composição das telas. Este enunciado define os comportamentos e os cenários de avaliação. Estados não desenhados devem seguir o mesmo padrão visual."**

Portanto, o design **não é sugestão livre**: preserve tipografia, cores, espaçamentos, hierarquia, proporções, imagens e composição original. Não existe requisito de uma imagem idêntica em todos os pixels para todo dispositivo: use adaptações responsivas e ajustes de acessibilidade necessários. Mudanças autorais são permitidas sobretudo nos estados e interações que não estão desenhados; documente divergências justificadas.

### Pode mudar (preservando a referência)

- Componentização, organização do repositório, ferramenta de build, bibliotecas auxiliares e padrões de código.
- Mensagens de erro/validação, loading, feedback de mutações, teclado, foco e estados de reconexão.
- Layout fluido nos breakpoints intermediários, evitando overflow e atendendo zoom.
- Tratamento de estados não especificados no arquivo (vazio, erro 404, indisponível, sessão expirada).
- Substituições pontuais de assets quando necessário, desde que documentadas; prefira os assets do Figma.
- Melhorias discretas de performance e transições, respeitando `prefers-reduced-motion`.

### Não pode eliminar ou falsificar

- Qualquer uma das **9 telas** e seus fluxos: Início, NFT, Carrinho, Pagamento, Confirmação, Login, Cadastro, Perfil e Carteiras.
- Uso efetivo de React, TypeScript, TanStack Router/Query, Axios/REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright e Lighthouse.
- Fluxos reais **na simulação**, com retorno da API mock e tratamento de falhas; não basta clique decorativo.
- Eventos `nft.updated` / `order.updated` passando por `socket.io-client`.
- Idempotência de pedidos, isolamento por usuário, cotação revalidada, precisão decimal de ETH, sessão após refresh e recovery de falhas.
- Login OAuth, newsletter, conexão de carteira, pagamento ou transação blockchain aparentando funcionamento real. Esses recursos estão fora do escopo.
- Testes E2E executáveis, regressão visual com **baselines versionadas** e deploy público estável.

## Critérios de aceite

| Categoria | Peso |
| --- | ---: |
| Fidelidade visual / responsividade | 20 |
| Fluxos e UX | 20 |
| Integração e estado | 15 |
| Tempo real | 10 |
| Mocking MSW | 10 |
| Testes | 10 |
| Acessibilidade | 5 |
| Performance | 5 |
| Arquitetura/documentação | 5 |
| **Total** | **100** |

**Eliminatórios:** stack obrigatória sem uso real; fluxos principais apenas visuais; recibo confirmado sem resposta mock; exposição de dados entre contas; Socket.IO substituído por alterações locais diretas; inexistência de Playwright E2E executável.

**Lighthouse**: Home e NFT, desktop e mobile, 3 medições por combinação. Metas (mediana): Performance **≥90**, Accessibility **≥95**, Best Practices **≥95**, SEO **≥90**. Informar LCP, CLS, TBT. A auditoria precisa usar assets e funcionalidades reais da entrega.

**Responsividade**: testar pelo menos 390, 768 e 1440 px. Os frames originais incluem desktop (1440) e mobile (414); telas sem frame mobile explícito também precisam funcionar no celular.

**Entrega:** código, lockfile, assets, mocks, fixtures, relatório e traces, README, documentação de arquitetura, repositório e **URL pública funcional** com deep links e refresh. Vercel, Netlify ou Cloudflare Pages são aceitos.

## Decisões e divergências justificadas

1. **Compra e carteira são demonstrativas.** O Figma contém linguagem de compra real e links exploratórios, mas o enunciado exclui blockchain e gateways: a interface deixa a simulação explícita e não cria links Etherscan falsos.
2. **Login social e newsletter:** botões falsamente bem-sucedidos foram evitados; manter controles desativados/informativos ou omitir quando não essenciais, documentando o motivo.
3. **Página 404 e erros:** estados autorais adicionados dentro da identidade visual para cumprir contratos.
4. **Carrinho desktop:** seguir colunas compactas de NFTs, preço, edições, total e ações conforme frame `11:1278`; no mobile usar cards conforme `16:360`. O resumo (cupom/desconto/taxa/total) é baseado em API MSW, não números inventados.
5. **Tempo real:** MSW v3 intercepta o WebSocket efetivo de `socket.io-client` via adaptador limitado Engine.IO/Socket.IO. Suporta websocket-only, não polling; documentado em `ARCHITECTURE.md`.
6. **Skeleton shimmer:** ativado no loading, desativado automaticamente para quem prefere movimento reduzido.
7. **Cenários de rede:** perfil MSW determinístico para normal, lento, latência variável, HTTP 503 e offline em listagem/detalhe, sem respostas falsas na UI.

## Situação comprovada e aceite final

- [x] Nove rotas e fluxos obrigatórios implementados; API e pagamentos demonstrativos.
- [x] Suíte Playwright E2E funcional e testes de sessão, cupons, erro de rede, pedido e tempo real.
- [x] **27 baselines visuais versionadas**: nove telas em 390, 768 e 1440 px. Ainda é necessária a aprovação de fidelidade de cada uma ao Figma.
- [x] Auditoria de dependências limpa após remover o CLI shadcn pelo método oficial (`npm audit`: 0 vulnerabilidades na execução validada).
- [x] Deploy público na Vercel e smoke test de Home, MSW, API, assets, deep links e refresh (11/11).
- [ ] Confirmar o último CI depois dos ajustes de performance e telas, incluindo as novas baselines.
- [ ] Fechar **Lighthouse Performance mobile ≥90** nas medianas da Home e do NFT sem desativar funcionalidades ou alterar artificialmente a medição.
- [ ] Concluir o aceite visual humano dos **15 frames originais do Figma**, incluindo desktop e mobile, e estados não desenhados.
- [ ] Atualizar a evidência no PR e manter a `main` preservada até a entrega aprovada.

**Importante:** o CI do Lighthouse gera e arquiva relatórios, mas uma execução marcada como `success` não significa automaticamente que a meta mobile foi alcançada. A nota atribuída ao desafio pertence à avaliação da Jungle Gaming.
