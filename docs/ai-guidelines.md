# Orientacoes para IAs

Este arquivo define regras permanentes para qualquer IA ou pessoa que trabalhar neste projeto.

## Antes de alterar codigo

- Leia o `AGENTS.md` da raiz.
- Leia este arquivo.
- Leia `docs/project-architecture.md`.
- Leia `docs/backend-api-contract.md` antes de implementar ou alterar chamadas de API.
- Como este projeto usa Next.js 16, consulte a documentacao local em `node_modules/next/dist/docs/` antes de usar APIs, convencoes ou estruturas do Next.js.
- Entenda a estrutura atual antes de criar arquivos, pastas, componentes ou stores.

## Componentes visuais

- Sempre reutilizar componentes visuais existentes antes de criar novos.
- Nao criar varios botoes, modais, inputs, cards ou elementos repetidos quando for possivel ter um componente global reutilizavel.
- Preferir componentes compartilhados em `components/ui` ou `components/layout`.
- Usar `components/ui/dropdown-select.tsx` como dropdown padrao do projeto; nao usar `<select>` nativo em telas ou modais sem justificativa tecnica registrada.
- Usar `components/ui/date-picker.tsx` como seletor de data padrao do projeto; nao usar `<input type="date">` em telas ou modais sem justificativa tecnica registrada.
- Seguir os padroes de componentes em `docs/ui-components.md`.
- Antes de criar um componente novo, procure se ja existe algo equivalente no projeto.
- Novos componentes devem seguir o padrao visual existente do projeto.
- Acoes sensiveis, como sair da conta, excluir despesa ou remover dados, devem usar modal de confirmacao reutilizavel antes de executar a acao.
- Manter header e sidebar reutilizaveis na area autenticada; nao duplicar botao de menu, logout ou troca de tema dentro das paginas.
- A tela inicial autenticada e a tela de inicio informativa sao experiencias separadas.
- O header da area autenticada deve ter um botao discreto para voltar para a tela inicial autenticada.

## Icones

- Este projeto deve usar `lucide-react` para icones.
- Nao criar SVG manual para icones comuns quando existir um icone equivalente no `lucide-react`.
- Manter tamanho, stroke e alinhamento dos icones consistentes com os componentes visuais.
- Em botoes de icone, passar o tamanho pelo prop `size` do icone para evitar icones pequenos, sumidos ou inconsistentes.

## Tema claro e escuro

- Toda interface deve funcionar bem em tema claro e escuro.
- O projeto deve usar tema claro/escuro com Tailwind CSS usando a classe `dark`.
- Preferir classes Tailwind explicitas para tema, por exemplo: `bg-slate-100 dark:bg-slate-800`, `text-slate-900 dark:text-slate-100`.
- Sempre verificar contraste, legibilidade, bordas, backgrounds, hover/focus e estados desabilitados nos dois temas.
- Nada visual deve ficar quebrado, ilegivel ou sem contraste em qualquer tema.

## Textos, mensagens e documentação

- Todo texto exibido ao usuário deve ser revisado com cuidado antes de finalizar a alteração.
- Frases completas devem ter pontuação adequada, incluindo ponto final, interrogação ou exclamação quando fizer sentido.
- Textos em português devem usar acentuação correta, como `não`, `mês`, `descrição`, `configuração`, `relatórios`, `usuário` e `salário`.
- Evitar textos sem acabamento, abreviações confusas ou misturas de português sem acento com português acentuado.
- Documentação em Markdown também deve seguir esse cuidado: revisar títulos, parágrafos, listas e instruções antes de entregar.
- Labels curtos, nomes de botões, itens de menu e placeholders podem ficar sem ponto final quando isso for mais natural na interface.
- Não alterar valores técnicos, contratos de API, nomes de variáveis, rotas ou enums apenas para acentuar texto. Exemplo: manter `Salario` quando esse for o valor esperado pelo back-end.

## Estado

- Estados globais ou compartilhados devem ser organizados com Zustand.
- Sempre respeitar a arquitetura de stores existente.
- Evitar espalhar estados globais em componentes quando eles pertencem a uma store.
- Estados locais simples podem ficar no componente quando nao precisam ser compartilhados.

## Consumo de APIs

- Este projeto deve usar Axios para consumir APIs.
- Nao usar `fetch` diretamente para chamadas HTTP da aplicacao, salvo quando houver uma justificativa tecnica clara.
- Configuracoes compartilhadas do Axios devem ficar em `lib/api.ts`.
- A base URL da API deve ser lida de `NEXT_PUBLIC_API_BASE_URL` no `.env`.
- Chamadas especificas de uma feature devem ficar em `features/<feature>/api`.
- As regras de comportamento da integracao ficam em `docs/backend-api-contract.md`; detalhes de transporte nao devem ser registrados em Markdown publico.
- Evitar espalhar URLs, headers e tratamento de erro diretamente em componentes.

## Responsividade

- Toda tela deve ser pensada para mobile, tablet e desktop.
- O site precisa ser flexivel e responsivo, mesmo existindo um app Android.
- Evitar layouts fixos que quebrem em telas pequenas.
- Validar espacos, tamanhos de texto, botoes, formularios e navegacao em mobile.

## Manutencao

- O codigo deve ser facil de entender, alterar e evoluir.
- Evitar duplicacao desnecessaria.
- Preferir nomes claros e organizacao por responsabilidade.
- Criar abstracoes apenas quando elas simplificam o projeto de verdade.
- Manter arquivos, pastas e componentes coerentes com a estrutura atual do projeto.
