# Arquitetura e decisões — KURIO

Este documento explica como o marketplace demonstrativo funciona por trás da interface. Ele complementa o [README](README.md) e a [matriz do desafio](docs/ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md).

A decisão principal do projeto foi manter as regras de negócio **fora dos componentes React**. A interface apresenta dados e ações; a API MSW valida as operações, inclusive os erros. Assim os testes exercitam um fluxo parecido com o de uma aplicação real, sem movimentar dinheiro ou NFTs.

## Mapa das responsabilidades

```text
Páginas e componentes React
    ↓ navegação
TanStack Router
    ↓ consultas, cache e mutações
TanStack Query
    ↓ requisições Axios (REST)
MSW (Service Worker no navegador)
    ├── Catálogo e disponibilidade
    ├── Sessão / contas / perfil / carteiras
    ├── Carrinhos, favoritos e cotações
    └── Pedidos e recibos simulados

socket.io-client ↔ WebSocket interceptado pelo MSW
         ↓
  Eventos versionados → invalidação do Query → reconciliação REST
```

| Parte | Local | Responsabilidade |
| --- | --- | --- |
| Telas | `src/pages/` | Conteúdo, mensagens e interações |
| Componentes | `src/components/` | Layouts, componentes UI e formulários |
| Rotas | `src/routes/` | Navegação tipada, caminhos protegidos e parâmetros da URL |
| Regras do frontend | `src/features/` | Hooks Query e contratos tipados |
| Transporte REST | `src/services/api.ts` | Axios e token da sessão simulada |
| API simulada | `src/mocks/` | Validação, estado, respostas e cenários de erro |
| Matemática monetária | `src/lib/eth.ts` | Conversões decimais em wei usando `bigint` |
| Testes | `tests/e2e/` | E2E, responsividade e screenshots |

A árvore de rotas `src/routeTree.gen.ts` é gerada pelo TanStack Router e precisa acompanhar mudanças de rotas. Há um fallback documentado no README para eventuais travamentos do arquivo gerado no Windows.

## Estado remoto e consultas

O TanStack Query gerencia listagens, detalhes, carrinho, dados da conta e pedidos. Mutações atualizam ou invalidam apenas as queries necessárias. Quando há atualização otimista, o código mantém um snapshot anterior e pode restaurá-lo se a API devolver erro.

Filtros de catálogo ficam nos parâmetros da URL: busca, coleção, disponibilidade, ordenação e página. Isso permite compartilhar, atualizar e abrir diretamente uma visualização de catálogo sem perder os filtros.

O Axios aponta para `/api`; no ambiente demonstrativo, o MSW intercepta esses requests. Não existe backend financeiro, conexão de carteira blockchain nem autenticação com terceiros.

## Contas e isolamento

O MSW fornece contas de demonstração e um token bearer opaco com prazo de uma hora. Senhas do mock são derivadas via PBKDF2 com salt, mas o armazenamento no navegador **não é uma solução para credenciais de produção**.

Os estados persistentes têm chaves distintas para visitante e usuários autenticados. Carrinhos, favoritos, perfis e carteiras não devem vazar entre contas. No login, o carrinho visitante é conciliado com a conta considerando a disponibilidade atual. Ao sair ou expirar a sessão, queries privadas são invalidadas e a interface retorna ao login quando necessário.

Se a sessão expirar durante o checkout, o destino e um cupom válido são preservados para o retorno depois de autenticar novamente.

## Carrinho, cotação e pedidos

O carrinho usa requisições REST para listar itens, adicionar, alterar quantidade e remover. `GET /api/cart/summary` fornece a prévia de subtotal, desconto, taxa e total também para visitantes.

O checkout utiliza `GET /api/quote` para emitir uma cotação simulada. As duas operações compartilham o cálculo de valores com `bigint` em wei: não fazemos contas de ETH com números de ponto flutuante. O desconto demonstrativo `KURIO10` é aplicado pela API mock.

Antes de confirmar um pedido, a API revalida cotação, edição, quantidade, estoque e versão do preço. `POST /api/orders` recebe uma chave de idempotência. Se a conexão cair depois do envio, o cliente consulta o pedido pela mesma chave em vez de gerar imediatamente uma nova compra.

O recibo (`/orders/:orderId`) exibe o snapshot retornado pela API simulada e diferencia estados pendente, confirmado e recusado. Nenhuma tela declara pagamento ou transferência real.

## Tempo real e reconciliação

O projeto usa `socket.io-client` com transporte **WebSocket-only**. O MSW v3 intercepta a conexão com uma implementação demonstrativa dos quadros necessários do Engine.IO v4/Socket.IO v4 em `src/mocks/realtimeHandlers.ts`.

Isso atende aos eventos do desafio sem introduzir um servidor extra para a demonstração, mas **não equivale ao protocolo completo em produção**: não há polling fallback, salas complexas ou gateway blockchain.

Eventos tratados:

- `nft.updated`: invalida catálogo, detalhe, carrinho e cotação para conferir preço/estoque novamente via REST.
- `order.updated`: reconcilia o pedido correspondente apenas para a conta autenticada.

A implementação mantém a maior versão recebida por recurso, ignora repetições e eventos atrasados e reconcilia dados quando há reconexão. O socket é desconectado ao trocar de conta ou sair. A inicialização do bundle de tempo real pode aguardar brevemente o conteúdo inicial; os testes aguardam a conexão antes de emitir eventos.

## Estados de erro e testes reproduzíveis

`src/mocks/networkScenario.ts` possui cenários configuráveis para listagem e detalhe de NFT: `normal`, `slow`, `variable`, `http-500` e `offline`. A simulação de falhas também cobre cupom inválido, sessão expirada, conflito de estoque, perda de resposta e pedido pendente.

`POST /api/mock/reset-all` restaura fixtures, preço, estoque, contas e cenários; esse endpoint existe apenas dentro da demonstração. Não deve ser exposto em um backend real.

O GitHub Actions executa:
- TypeScript, ESLint e build Vite normal, além do fallback de geração de rotas do Windows.
- Playwright desktop e mobile, incluindo os fluxos de compra, isolamento, reconexão e erros.
- Baselines versionadas das **nove telas em 390, 768 e 1440 px** (27 screenshots).
- Lighthouse com três medições por página/dispositivo e relatório de medianas, LCP, CLS e TBT.
- Auditoria npm e smoke test com Chromium contra o domínio publicado.

O processo de **`shadcn eject` foi validado com typecheck, lint, build, E2E e `npm audit`**, que retornou 0 vulnerabilidades na rodada de migração.

## Decisões sobre o design

O Figma é a referência para a identidade visual e a composição das telas. Há ajustes de responsividade, foco, validação, loading e mensagens de erro que não apareciam desenhados no arquivo original. Em especial, não foram criados login social, newsletter, blockchain ou pagamentos ficticiamente bem-sucedidos apenas para preencher a interface.

As screenshots Playwright são baselines de regressão da aplicação: uma comparação automática aprovada contra elas **não significa que cada pixel corresponde ao Figma**. A matriz em `docs/ESCOPO_ORIGINAL_E_AUDITORIA_FIGMA.md` registra as diferenças e o estado de aceite.

## Limites da entrega e critérios finais

- **Backend e persistência:** são mocks locais; a aplicação não substitui um serviço seguro multiusuário.
- **Socket.IO:** demonstra os fluxos necessários em WebSocket, não um servidor completo.
- **Performance:** o desktop e as demais categorias Lighthouse alcançaram as metas nas rodadas confirmadas. A Performance mobile ainda está sendo otimizada; consulte o último relatório antes de declarar aceite.
- **Fidelidade:** há 27 capturas versionadas e revisão dos frames, mas a validação humana final deve considerar também os estados não cobertos pelo desenho.
- **Publicação:** a Vercel entrega a SPA com `vercel.json`, assets e Service Worker; o smoke test público confirmou catálogo, REST, rota direta e refresh.

Todas essas limitações são intencionais ou estão explícitas para avaliação. **Não tratar dados simulados como transações reais nem usar contas pessoais na demonstração.**
