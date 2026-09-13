<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Orientacoes para IAs

Antes de alterar codigo neste projeto, leia e siga:

- `rules.md`
- `docs/ai-guidelines.md`
- `docs/project-architecture.md`
- `docs/backend-api-contract.md`

As regras desses arquivos fazem parte do contrato do projeto. Nao fuja da arquitetura existente sem motivo forte e sem registrar a decisao.

## Harness de IA

- Execute `npm run ai:context` antes de analisar ou alterar o projeto.
- Execute `npm run ai:doctor` ao modificar estrutura, configuração ou documentação.
- Execute `npm run ai:check` antes de concluir alterações de código.
- Para uma verificação rápida durante o desenvolvimento, use `npm run ai:check:quick`.
- Nunca leia, imprima ou altere arquivos `.env`; consulte somente `.env.example` para conhecer os nomes das variáveis.
- Não registre métodos e caminhos internos da API em arquivos Markdown.
- Preserve alterações existentes do usuário e mantenha o trabalho dentro da arquitetura declarada.
