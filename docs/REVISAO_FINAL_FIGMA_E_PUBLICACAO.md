# Revisão final — Figma, experiência e publicação

**Data:** 20/10/2026 · [PR #1](https://github.com/maurodferreira/jnggaming/pull/1) · [Checklist geral](CHECKLIST_ENTREGA.md)

## O que foi realmente revisado

- Referência original Figma: **15 frames**, sendo **9 desktop** e **6 mobile**. Todos os 15 foram visualizados no Figma.
- Implementação: capturas reais do **CI Playwright aprovado** (117 testes / 9 skips), incluindo Home, detalhe NFT e carrinho em 390/768/1440 px, login, carteira e checkout em 390/1440 px.
- **27 imagens de regressão versionadas** confirmadas no GitHub para 9 telas × 3 larguras. O CI valida regressões da implementação, mas essa comparação **não é um teste automatizado de igualdade com o Figma**.
- Lighthouse validado: Home mobile **100**, NFT mobile **90**, desktop **98/99**; acessibilidade, boas práticas e SEO **100**. [Três execuções por combinação](https://github.com/maurodferreira/jnggaming/actions/runs/39483283845).
- CI final da documentação [39486555632](https://github.com/maurodferreira/jnggaming/actions/runs/39486555632) passou: **117 E2E aprovados / 9 ignorados / 0 falhas**. O código de runtime não foi modificado desde a medição de Lighthouse.

As observações abaixo são uma **comparação humana de representatividade e comportamento**, não uma afirmação de equivalência pixel a pixel. Alguns estados do Figma mostram carrinhos e contas preenchidos, enquanto outras capturas Playwright foram feitas em estado vazio ou com dados de teste diferentes.

## Resultado da comparação visual

| Referência | O que acompanha o Figma | Divergência ou adaptação consciente |
| --- | --- | --- |
| Home desktop `2:2`; mobile `14:5226` | Paleta, identidade Kurio, hero com imagem, abas e cards do catálogo, busca e navegação mobile | Proporções e espaçamentos não são idênticos em todos os breakpoints. Controles extras de favoritos e feedback da API servem à funcionalidade |
| NFT desktop `10:244`; mobile `15:5536` | Arte, título/preço, galeria, quantidade, favorito, metadados e NFTs relacionados | O Figma ilustra edições como `1/10`, `1/50` e `ABERTA`; a API demonstrativa expõe nomes de edições próprios. CTA principal diz **Adicionar ao carrinho**, em vez de prometer compra direta, porque a confirmação real do desafio depende do checkout mock |
| Carrinho desktop `11:1278`; mobile `16:360` | Itens, preços, quantidades, cupom, taxa e resumo | A captura de revisão rápida pode estar no estado vazio; a regressão versionada inclui carrinho preenchido. Totais seguem a API e podem diferir dos números estáticos do Figma |
| Checkout desktop `11:2862`; mobile `16:748` | Carteiras, redes, provedores, cotação e CTA em tons correspondentes | A implementação expõe dados da conta e cupom simulados e troca a linguagem de compra real por **Confirmar compra simulada**. Quantidades/valores dependem do carrinho da execução, não da ilustração |
| Login desktop `9:115`; mobile `16:1022` | Logo, tipografia monoespaçada, campos e ações principais | **Desktop:** Figma usa modal sobre a Home; implementação oferece rota `/login`, para permitir acesso direto e retorno ao checkout. Botões sociais são informativos/indisponíveis: não há OAuth falso |
| Cadastro desktop `9:1022`; mobile `16:1228` | Identidade, campos e CTA da conta | Rota independente `/register` em vez de modal desktop. Validação de senha, erro e conflito de conta são estados adicionais |
| Perfil desktop `9:1238` | Sidebar, formulário, avatar e troca de senha | Responsividade foi criada sem frame mobile original; o preenchimento vem da conta demo, sem pedir dados pessoais reais |
| Carteiras desktop `9:1670` | Sidebar, edição da carteira principal/secundária, rede, endereço e apelido | Campos relacionados a ENS, indicação e identidade são limitados ou informativos conforme API mock. Não conecta wallet blockchain real |
| Confirmação desktop `11:4385` | Recibo com identificação, itens, totais e status | Figma afirma transferência Ethereum e oferece Etherscan; ambos seriam **enganosos** nesta demo. O recibo só informa resposta do pedido simulado e não apresenta transferência real |

**Conclusão de design:** a identidade, a hierarquia geral e os fluxos centrais estão representados e foram exercitados no CI. **Não é pixel-perfect**: as diferenças descritas existem e são relevantes para a avaliação de fidelidade visual (20 pontos possíveis, atribuídos pela empresa). Foi priorizado preservar os requisitos funcionais, a acessibilidade e a honestidade da simulação. Ajustes cosméticos adicionais poderiam ser feitos após feedback do avaliador, com novos baselines e testes.

## Funcionalidade e riscos

**Comprovado no CI:** autenticação, isolamento de conta, favoritos, carrinho com merge, cupom, cotação com `bigint`, recusa/revalidação, idempotência e recuperação de pedidos, websocket versionado, reconexão, rotas profundas, formulários, responsividade e screenshots. Os mocks e o socket continuam ligados durante Lighthouse. `npm audit` da auditoria final registrou **0 vulnerabilidades**.

**Limites:** MSW, carteiras, provedores, pedidos e token são demonstrativos; não existe backend seguro externo, transferência NFT, blockchain ou pagamento verdadeiro. Não inserir dados reais.

**Ponto ainda bloqueante de publicação:** no momento desta revisão, `kurio-jungle-challenge.vercel.app` está associado à implantação de produção do commit **`9a2289a9`**, anterior ao PR. Há previews `READY` da branch, mas o preview pode exigir autenticação Vercel. **Uma execução verde do CI não faz o domínio antigo atualizar sozinho.**

## Como colocar no ar pelo painel da Vercel (sem mexer na main)

1. Abra o [projeto KURIO na Vercel](https://vercel.com/maurodiogo56-1572s-projects/kurio-jungle-challenge/deployments) e selecione o escopo **maurodiogo56-1572s-projects**.
2. Em **Deployments**, escolha **Create Deployment**. Informe a referência de branch **`feat/figma-kurio-ui`** (ou informe o SHA exato do HEAD do PR para uma revisão fixa). Confira que o Git é `maurodferreira/jnggaming`, não outro repositório.
3. Aguarde o deploy de **Preview** ficar **READY**. Verifique o SHA, abra a URL de preview estando autenticado na Vercel, e teste Home, `/nft/1`, carrinho, login e o checkout com dados fictícios. Um preview com autenticação Vercel **não é** evidência de um site público.
4. No menu de três pontos (`...`) **do deployment READY correto**, escolha **Promote to Production** e confirme o domínio. **Isso cria um novo build de produção** a partir do código do preview e utiliza variáveis do ambiente Production; confira a variável `VITE_ENABLE_MOCKS` (se definida, deve ser `true` para esta demo). Não escolha um preview antigo por engano.
5. Após o build ficar **READY**, abra [kurio-jungle-challenge.vercel.app](https://kurio-jungle-challenge.vercel.app/), confirme no deployment **Production** o SHA e faça hard refresh de `/nft/1`. O domínio precisa servir a revisão escolhida.
6. Execute novamente o smoke Chromium do domínio de produção, localmente ou em um workflow manual da GitHub Actions (o arquivo `.github/workflows/production-smoke.yml` possui `workflow_dispatch`). Ele deve confirmar **11/11** verificações; consulte também os logs Vercel.

Documentação oficial: [Criar deployment de Git na Vercel](https://vercel.com/docs/git) · [Promover Preview para Production](https://vercel.com/docs/deployments/promoting-a-deployment).

**Segurança de processo:** este documento não inicia deploy, não altera a `main`, nem muda o PR de Draft. Se o preview ou a produção falhar, **não** promover uma versão desconhecida; inspecione os logs e compare SHA/ambiente com o commit aprovado.
