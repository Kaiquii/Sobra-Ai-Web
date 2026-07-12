# SobraAí Web

Aplicação web do SobraAí, criada com Next.js, React, TypeScript, Tailwind CSS, Zustand e Axios.

O projeto consome uma API externa para autenticação, despesas, rendas, categorias e relatórios financeiros.

## Requisitos

- Node.js compatível com Next.js 16.
- npm.
- URL da API configurada em variável de ambiente.

## Configuração do ambiente

Crie um arquivo `.env` local a partir do exemplo:

```bash
cp .env.example .env
```

Depois, ajuste a URL da API:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

O arquivo `.env` não deve ser enviado para o Git. Ele fica apenas na máquina local ou no ambiente de deploy.

O arquivo versionado é apenas o `.env.example`, usado como referência das variáveis necessárias.

## Scripts

Instale as dependências:

```bash
npm install
```

Rode em desenvolvimento:

```bash
npm run dev
```

Gere o build de produção:

```bash
npm run build
```

Rode o build de produção:

```bash
npm run start
```

Rode o lint:

```bash
npm run lint
```

## Deploy

### Netlify

Configure a variável de ambiente no painel do Netlify:

```env
NEXT_PUBLIC_API_BASE_URL=https://url-da-api.com
```

Como a variável usa o prefixo `NEXT_PUBLIC_`, ela entra no bundle do front-end no momento do build. Se a URL mudar no Netlify, gere um novo deploy.

### VM

Na VM, mantenha um `.env` real fora do Git ou injete a variável pelo ambiente do processo antes de executar:

```bash
npm install
npm run build
npm run start
```

## Autenticação

- O token fica salvo no cookie `app-financeiro-token`.
- O `proxy.ts` protege as rotas autenticadas pela presença do cookie.
- O Axios lê o cookie a cada request e envia `Authorization: Bearer TOKEN`.
- Se a API retornar `401`, a sessão local é limpa e o usuário volta ao fluxo de autenticação.

## Estrutura principal

```text
app/                 Rotas e layouts do Next.js.
components/layout/   Header, sidebar, page header e estrutura autenticada.
components/ui/       Componentes visuais reutilizáveis.
features/            Módulos por domínio da aplicação.
lib/                 Cliente Axios, cookies, formatadores e helpers.
store/               Stores globais compartilhadas.
docs/                Contratos e orientações do projeto.
```

## Observações

Antes de alterar código, leia:

- `AGENTS.md`
- `docs/ai-guidelines.md`
- `docs/project-architecture.md`
- `docs/backend-api-contract.md`

Esses arquivos definem as regras de arquitetura, UI, estado, consumo de API e organização do projeto.
