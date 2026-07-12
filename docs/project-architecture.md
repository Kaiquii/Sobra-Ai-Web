# Arquitetura do projeto

Este projeto deve manter uma arquitetura simples, previsivel e facil de evoluir. Qualquer IA deve seguir esta organizacao antes de propor ou aplicar mudancas.

## Principio principal

- Nao fugir da arquitetura existente do projeto.
- Antes de criar uma nova pasta, camada ou padrao, verifique se ja existe um local adequado.
- Mudancas estruturais devem ter um motivo claro: reduzir duplicacao, organizar uma responsabilidade real ou seguir uma convencao do Next.js.
- Evite misturar responsabilidades no mesmo arquivo.

## Estrutura atual

- `app`: rotas, layouts e paginas do Next.js App Router.
- `components/ui`: componentes visuais globais e reutilizaveis do projeto.
- `components/layout`: componentes de layout compartilhados, como sidebar, header, containers e estruturas de pagina.
- `features`: modulos por dominio/funcionalidade.
- `features/*/api`: chamadas de API e funcoes de comunicacao externa da feature.
- `features/*/components`: componentes especificos da feature.
- `features/*/store`: stores Zustand especificas da feature.
- `features/*/types`: tipos TypeScript da feature.
- `lib`: utilitarios compartilhados, configuracoes e clientes reutilizaveis.
- `store`: stores globais realmente compartilhadas pelo app inteiro.
- `public`: assets publicos.
- `docs`: documentacao e orientacoes do projeto.

## Rotas e paginas

- Criar rotas apenas dentro de `app`.
- Paginas devem montar a tela e orquestrar componentes, evitando concentrar regra de negocio complexa.
- Layouts devem cuidar de estrutura visual compartilhada.
- Route groups, como `(auth)` e `(dashboard)`, devem ser usados para organizar rotas sem alterar a URL.
- Todo arquivo especial do App Router, como `page.tsx` e `layout.tsx`, deve exportar um React Component como default export.
- O fluxo padrao de autenticacao deve conduzir o usuario para a area autenticada apos login com sucesso.
- A tela inicial autenticada e separada da tela de inicio informativa; nao tratar essas experiencias como sinonimos.
- O header da area autenticada deve manter um botao discreto para voltar para a tela inicial autenticada.

## Features

- Codigo especifico de uma funcionalidade deve ficar dentro da sua pasta em `features`.
- Uma feature deve expor componentes, tipos, stores e APIs relacionados ao proprio dominio.
- Evite importar detalhes internos de uma feature em outra sem necessidade.
- Quando uma logica passar a ser compartilhada por varias features, mover para `lib`, `components` ou `store`, conforme a responsabilidade.

## Componentes

- Componentes reutilizaveis e genericos devem ficar em `components/ui`.
- Componentes estruturais compartilhados devem ficar em `components/layout`.
- Componentes especificos de uma funcionalidade devem ficar em `features/<feature>/components`.
- Nao duplicar botoes, modais, inputs, cards ou padroes visuais que poderiam ser um componente unico.
- Preferir composicao em vez de criar muitas variacoes quase iguais.
- Icones devem usar `lucide-react`, mantendo tamanho e alinhamento consistentes.
- Em botoes de icone, preferir tamanho explicito do `lucide-react` por prop `size` para evitar icones pequenos, sumidos ou inconsistentes.
- Modais de confirmacao para acoes sensiveis devem reutilizar o componente global em `components/ui`.
- A area autenticada deve usar `components/layout/header.tsx` para topo, tema, logout e botao de abrir menu.
- A navegacao principal da area autenticada deve ficar na sidebar em `components/layout/sidebar.tsx`.
- A sidebar deve iniciar fechada por padrao e abrir pelo botao no header.

## Estado com Zustand

- Stores globais ficam em `store`.
- Stores de uma feature ficam em `features/<feature>/store`.
- Nao colocar estado compartilhado profundo apenas com `useState` em componentes distantes.
- Nao criar outra biblioteca de estado global sem decisao explicita do projeto.

## API e dados

- Este projeto deve usar Axios como padrao para consumir APIs.
- Configuracoes compartilhadas do Axios, como base URL, interceptors, headers e tratamento comum de erros, devem ficar em `lib/api.ts`.
- A base URL da API deve vir da variavel `NEXT_PUBLIC_API_BASE_URL` no arquivo `.env`.
- Manter `.env.example` atualizado com as variaveis obrigatorias do projeto.
- Chamadas HTTP e integracoes especificas devem ficar em `features/<feature>/api`.
- Regras especificas de uma feature devem ficar no `api` da propria feature.
- Regras de contrato do back-end devem seguir `docs/backend-api-contract.md`.
- Codigo de API compartilhado deve ficar em `lib`.
- Evitar chamadas HTTP diretamente dentro de componentes quando elas puderem ficar em uma camada de API.

## UI, tema e responsividade

- Usar Tailwind CSS com suporte a tema claro e escuro via classe `dark`.
- Toda nova UI deve ser responsiva por padrao.
- Antes de finalizar uma tela, revisar como ela se comporta em mobile e nos dois temas.

## Manutencao

- Arquivos devem ter responsabilidade clara.
- Evitar arquivos grandes demais quando houver responsabilidades separaveis.
- Evitar abstracoes prematuras.
- Preferir padroes locais do projeto em vez de inventar um novo estilo.
- Quando uma decisao arquitetural importante for tomada, documentar em `docs`.
