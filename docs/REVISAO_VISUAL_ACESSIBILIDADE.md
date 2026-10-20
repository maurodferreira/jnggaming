# KURIO — revisão visual, acessibilidade e desempenho

**Data:** 19/10/2026  
**Branch:** `feat/figma-kurio-ui` (Pull Request em rascunho).  
**Critério:** preservar o fluxo de compra e os contratos REST/Socket.IO, corrigindo diferenças visuais e problemas reproduzíveis.

## Referências originais do Figma

| Tela | Desktop | Mobile |
| --- | --- | --- |
| Início | `2:2` (1440 × 3668) | `14:5226` (414 × 896) |
| Detalhes do NFT | `10:244` (1440 × 2246) | `15:5536` (414 × 896) |
| Carrinho | `11:1278` | `16:360` |
| Pagamento | `11:2862` | `16:748` |
| Login | `9:115` | `16:1022` |
| Cadastro | `9:1022` | `16:1228` |
| Perfil | `9:1238` | Sem frame individual listado |
| Carteiras | `9:1670` | Sem frame individual listado |
| Confirmação | `11:4385` | Sem frame individual listado |

Arquivo: https://www.figma.com/design/HuEe6XFEtLBuMlCI8pYddf/Frontend-Challenge--c%C3%B3pia-

Os layouts são referências visuais; interações, estado e feedbacks seguem os contratos reais da API simulada. Os frames do Figma não são componentes React nem autorização para simular pagamentos verdadeiros.

## Ajustes feitos nesta rodada

- **Mobile / detalhes:** tratamento da imagem como conteúdo principal, cartão de informações sobreposto com bordas arredondadas, favorito disponível na arte e título dimensionado para telas menores. A escolha de edição, quantidade e carrinho foi preservada.
- **Tablet / navegação:** header desktop só aparece a partir de `lg`, evitando comprimir menu e ações na faixa de 768 px; navegação mobile cobre tablets compactos.
- **Mobile / checkout:** CTA respeita `safe-area-inset-bottom` acima da navegação inferior.
- **Catálogo / ordenação:** substituído o select nativo por dropdown do tema KURIO; grupo de ordenação usa `aria-pressed` em vez de tabs ARIA sem painéis de aba.
- **Acessibilidade:** link de pular ao conteúdo, alvo focalizável, foco de teclado destacado e preferência por movimento reduzido.

## Capturas e auditoria automatizada

`tests/e2e/visual-review.spec.ts` salva imagens de Home, detalhe e carrinho em **390, 768 e 1440 px**; `tests/e2e/visual-account-review.spec.ts` salva login, carteiras e pagamento em **390 e 1440 px**. Ambas verificam scroll horizontal; há ainda testes de pular navegação por teclado e de movimento reduzido.

As imagens de cada execução ficam em `test-results/` e são publicadas como artefatos do workflow `Frontend checks`. É necessário comparar manualmente as capturas com os respectivos frames do Figma para declarar fidelidade fina. Não substitua essa comparação por um simples “build passou”.

`.github/workflows/quality-audit.yml` executa `npm audit` e Lighthouse com **três execuções por página/dispositivo** para Home e detalhe, utilizando `npm run preview` da versão de produção, separando resultados desktop e mobile. O script `scripts/quality/lighthouse.mjs` calcula as medianas e registra LCP/CLS/TBT em `reports/quality/summary.md`.

**Metas do desafio:** Performance ≥90; Acessibilidade ≥95; Best Practices ≥95; SEO ≥90. Não considerar metas aprovadas sem verificar o relatório numérico do commit correspondente.

## Diferenças que ainda exigem revisão

- **Arte e fidelidade dos NFTs:** o repositório contém as quatro artes originais já integradas; itens do catálogo que reutilizam artes precisam ser confrontados com os arquivos originais específicos dos demais itens do Figma.
- **Home desktop:** revisar posicionamento fino de promos, cards e rodapé; o rodapé reutilizável atual está simplificado em comparação com a referência.
- **Detalhe desktop/mobile:** revisar dimensões da galeria, detalhes textuais e composição das edições na comparação das imagens renderizadas.
- **Formulários:** verificar estados de erro, zoom em 200%, contraste calculado e foco em todos os menus.
- **Lighthouse:** usar relatórios para otimizar imagens, CSS/fontes e o bundle antes de afirmar que as quatro metas foram cumpridas.
- **Dependências:** a auditoria npm já reportou vulnerabilidades em sessões anteriores; não executar `npm audit fix --force` sem analisar atualizações e testar regressões.
- **Deploy:** um preview local de produção não substitui a verificação de uma URL pública, HTTPS, recarga de rotas profundas e funcionamento do MSW/Socket.IO no ambiente final.

## Preservação dos fluxos

As alterações de UI não devem modificar `quote`, idempotência, status de pedido, isolamento do carrinho, sessão, ordem de registro do MSW nem invalidações do React Query. Os testes E2E já existentes são obrigatórios em cada commit que altera a interface.

O PR só poderá deixar o estado rascunho após evidências de regressão visual, acessibilidade, desempenho, segurança de dependências e URL final.
