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
- `docs/android-reference.md`
- `docs/android-parity-harness.md`

As regras desses arquivos fazem parte do contrato do projeto. Nao fuja da arquitetura existente sem motivo forte e sem registrar a decisao.

## Harness de IA

- Respeite a separação visual registrada em `rules.md` e `docs/android-parity-harness.md`: desktop tem modais Web próprios e dropdowns em lista junto ao campo; celular/PWA usa modais e seletores semelhantes ao Android. Não transportar o padrão mobile ao desktop.

- Somente o usuário inicia o projeto. IAs não devem iniciar ou reiniciar servidores, nem executar `npm run dev`, `next dev`, `npm start` ou equivalentes, inclusive em outra porta ou em segundo plano. Para validação visual, usar o servidor iniciado pelo usuário; se não houver, solicitar que ele o inicie.

- Execute `npm run ai:context` antes de analisar ou alterar o projeto.
- Execute `npm run ai:doctor` ao modificar estrutura, configuração ou documentação.
- Execute `npm run ai:check` antes de concluir alterações de código.
- Para uma verificação rápida durante o desenvolvimento, use `npm run ai:check:quick`.
- Nunca leia, imprima ou altere arquivos `.env`; consulte somente `.env.example` para conhecer os nomes das variáveis.
- Não registre métodos e caminhos internos da API em arquivos Markdown.
- Preserve alterações existentes do usuário e mantenha o trabalho dentro da arquitetura declarada.
