# Arquitetura

A interface usa TanStack Router para navegação, TanStack Query para dados remotos e Axios para as requisições. O MSW atende a essas requisições no navegador. Nenhum componente precisa acessar diretamente as fixtures ou o localStorage.

## Organização

- src/routes: mapeamento das rotas; routeTree.gen.ts é gerado pelo plugin.
- src/pages: composição das telas.
- src/features: hooks, tipos e regras de catálogo e carrinho.
- src/services/api.ts: Axios com base /api e timeout de 10 segundos.
- src/mocks: handlers, fixtures e armazenamento.
- src/lib/eth.ts: cálculos de ETH com bigint, mantendo valores decimais como strings.

## Estado e sincronização

O catálogo inclui filtros na chave de cache. O detalhe usa o ID do NFT. As consultas usam AbortSignal e têm staleTime de 30 segundos; por padrão, ocorre uma tentativa adicional de retry. O detalhe 404 não é repetido.

O carrinho atual é somente de visitante, persistido no localStorage. O MSW refaz a consulta de preço e disponibilidade a cada leitura. Adição e remoção atualizam e invalidam o cache. A alteração de quantidade atualiza o cache de forma otimista; se a API falhar, o cache anterior é restaurado e a consulta é refeita.

Itens, quantidades, valores e total são tipados. A conversão para bigint evita usar ponto flutuante nos cálculos de ETH. O endpoint POST /api/mock/reset limpa apenas o carrinho de visitante para recuperar o cenário inicial.

## Contratos de erros

- 400: corpo ou quantidade inválidos
- 404: NFT, edição ou item do carrinho não encontrado
- 409: quantidade maior que a disponibilidade
- 200/201: operação realizada na simulação

Os mocks ainda não simulam todos os cenários de latência, timeout e falha previstos no desafio.

## Falta implementar

Ainda não existe sessão autenticada, isolamento de cache por usuário, favoritos, perfil ou carteiras. O login deverá preservar os itens do visitante ao vinculá-los ao usuário. O checkout terá de consultar a cotação atual, validar cupom e taxas e criar pedidos idempotentes. A confirmação só poderá aparecer após a resposta de pedido confirmado.

Socket.IO Client está instalado, mas sem eventos nft.updated e order.updated. A reconexão e a comparação de versões de eventos ainda faltam.

O layout e os assets do Figma não foram aplicados. Os skeletons, estados de erro e a interface responsiva ainda precisam ser ajustados ao design. Não existem testes Playwright, snapshots visuais nem relatórios Lighthouse no repositório. Nenhuma cobertura ou nota de performance está sendo presumida.

O deploy deverá incluir os mocks; vercel.json prepara o fallback das rotas SPA, mas não significa que a aplicação já tenha sido publicada.
