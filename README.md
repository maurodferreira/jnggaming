# NFT Marketplace — Frontend Challenge

Marketplace de NFTs em React e TypeScript, desenvolvido para um desafio técnico. As operações são simuladas no navegador; não existe blockchain nem pagamento real.

**Status: em desenvolvimento.** O catálogo, os detalhes e o carrinho de visitante estão disponíveis. Autenticação, checkout, perfil, carteiras, favoritos, pedidos, tempo real, testes E2E e layout definitivo ainda faltam.

## Como rodar

Requer Node.js 22.12+ e npm.

~~~bash
npm ci
npm run dev
~~~

O endereço local costuma ser http://localhost:5173.

~~~bash
npm run typecheck
npm run lint
npm run build
npm run preview
~~~

Ao criar uma nova rota, inicie o Vite para atualizar src/routeTree.gen.ts antes da verificação de tipos.

## API simulada

MSW intercepta as requisições REST feitas pelo Axios. Os mocks ficam ativados por padrão, inclusive no build de demonstração. A variável VITE_ENABLE_MOCKS=false os desativa, mas nesse caso a aplicação precisa de uma API externa.

- GET /api/nfts: busca, filtros, ordenação e paginação
- GET /api/nfts/:id: detalhes e edições
- GET /api/cart: consulta do carrinho de visitante
- POST /api/cart/items: adiciona edição e quantidade
- PATCH /api/cart/items/:id: atualiza quantidade
- DELETE /api/cart/items/:id: remove item
- POST /api/mock/reset: limpa os itens do carrinho de visitante

O carrinho é persistido no localStorage. Para restaurar o cenário inicial, execute no console da página:

~~~js
await fetch('/api/mock/reset', { method: 'POST' })
location.reload()
~~~

O reset afeta somente o carrinho: catálogo e edições já são fixtures fixas. Não há credenciais fictícias ainda porque login não foi implementado.

## Como conferir o que já funciona

1. Filtre e ordene o catálogo, alterne páginas e atualize a URL; voltar/avançar deve restaurar os filtros.
2. Abra um NFT e selecione edição e quantidade. A API limita a compra ao estoque da edição.
3. Adicione ao carrinho, altere a quantidade e remova um item. Atualize a página para testar a persistência.
4. Teste /nft/999 para ver o estado de item inexistente.
5. Tente adicionar quantidades acima do estoque para conferir o erro 409.

## Tecnologias

React, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Tailwind CSS, shadcn/ui com Base UI e MSW. Socket.IO Client está instalado, porém ainda não há eventos implementados.

A arquitetura e os contratos existentes estão descritos em [ARCHITECTURE.md](./ARCHITECTURE.md). O visual ainda é provisório; o objetivo é reproduzir o Figma na etapa de interface.

Não há relatórios Playwright ou Lighthouse publicados nesta versão. Eles fazem parte da entrega exigida, junto com autenticação, cotação, pedidos idempotentes, reconexão e deploy.
