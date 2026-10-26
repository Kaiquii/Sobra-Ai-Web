# Regras do projeto

## Desktop e celular têm apresentações diferentes

Orientação permanente do usuário, reforçada em 26/10/2026:

- A versão de celular/PWA deve ser o mais parecida possível com o Android em estrutura, navegação, modais, seletores e interações, mantendo a paleta Web e as exceções expressamente documentadas.
- A versão desktop tem um padrão próprio. Reutilizar os modais existentes do desktop: centralizados, largura adequada ao formulário, campos e botões no padrão Web e ações compactas. Não transportar alça, painel inferior, dimensões ou rodapé mobile para o desktop.
- Dropdown no desktop é a lista antiga junto ao campo, abrindo abaixo ou acima conforme o espaço, sem modal de seleção ou escurecimento do fundo. Preservar a apresentação antiga, os temas, a seleção e a navegação por teclado.
- Dropdown no celular é o modal de seleção semelhante ao Android, com busca e dimensões próprias. Não trocar esse modal pela lista desktop.
- `DropdownSelect` decide a apresentação pelo breakpoint compartilhado do projeto: abaixo de 640 px, modal; a partir de 640 px, lista. `presentation="sheet"` em um consumidor não autoriza modal no desktop.
- Compartilhar estado, validação e componentes não significa unificar a apresentação entre plataformas. Conferir desktop e celular separadamente, inclusive dentro de modais e nos temas claro/escuro.
- Correções solicitadas especificamente para desktop devem limitar estilos e estados ao breakpoint desktop, inclusive hover, tamanho e alinhamento de ações auxiliares. Não alterar a apresentação mobile como consequência.
- Essas orientações prevalecem sobre descrições antigas ou genéricas de paridade. Não redesenhar o desktop ao adaptar uma tela ao Android.

## Patrimônio no celular e PWA

- Patrimônio segue estrutura, proporções, navegação e interações do Android 1.4.8, commit `136a9a5`, conforme handoff autorizado em 26/10/2026.
- Preservar a paleta e a fonte padrão da Web nos dois temas e em todas as larguras. A referência Android não autoriza copiar Roboto nem substituir a tipografia, inclusive no celular/PWA.
- Desktop pode reorganizar o conteúdo mantendo todas as ações. Critérios e limitações de validação estão em `docs/patrimonio.md`.

## Tipografia padrão em todas as plataformas

- Manter a fonte padrão já definida no `body` de `app/globals.css` em todo o projeto: desktop, celular/PWA, páginas, cabeçalhos, campos, dropdowns e modais.
- A semelhança com Android é de estrutura e comportamento; não copiar a família tipográfica Android. Esta orientação prevalece sobre handoffs e textos anteriores que sugeriam Roboto no celular.
- Não adicionar fontes locais ou remotas, arquivos de fonte, `@font-face`, carregadores de fontes ou famílias específicas por feature/breakpoint. Herdar a fonte padrão da Web.
- O harness verifica `forbidCustomFonts` para impedir a reintrodução de fontes empacotadas e carregadores próprios.

## Troca de tema imediata

- Trocar entre claro e escuro deve aplicar as cores imediatamente, sem animação, fade ou atraso.
- Não usar `transition-colors`, `transition-all`, `transition` genérico nem transições CSS de fundo, texto, borda, sombra, fill ou stroke. Durações não podem afetar a troca de tema.
- Transições estritamente geométricas, como `transition-transform` de uma seta ou switch, e indicadores de carregamento podem permanecer quando necessários.
- `npm run ai:doctor`, `ai:check:quick` e `ai:check` verificam essa regra por meio de `forbidThemeColorTransitions`. Não desabilitar a proteção para acomodar uma violação.

## Cursor de elementos interativos

- Todo botão habilitado deve exibir `cursor: pointer`.
- O componente global `Button` e o helper `buttonClassName` devem manter a classe `cursor-pointer`.
- Botões nativos devem declarar `cursor-pointer` explicitamente em sua classe, além da regra base definida em `app/globals.css`.
- Gatilhos e opções habilitados de `DropdownSelect` e `SelectionDialog` devem usar `cursor: pointer` e hover visível nos dois temas, preservando o destaque da seleção. Não aplicar hover de ação a controles desabilitados.
- Botões desabilitados devem exibir `cursor: not-allowed`.
- Não usar `pointer-events: none` em botões desabilitados quando isso impedir o feedback visual do cursor.
- Novos componentes interativos devem reutilizar `Button` sempre que o comportamento visual for compatível.
