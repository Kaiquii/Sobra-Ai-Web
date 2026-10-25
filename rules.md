# Regras do projeto

## Cursor de elementos interativos

- Todo botão habilitado deve exibir `cursor: pointer`.
- O componente global `Button` e o helper `buttonClassName` devem manter a classe `cursor-pointer`.
- Botões nativos devem declarar `cursor-pointer` explicitamente em sua classe, além da regra base definida em `app/globals.css`.
- Gatilhos e opções habilitados de `DropdownSelect` e `SelectionDialog` devem usar `cursor: pointer` e hover visível nos dois temas, preservando o destaque da seleção. Não aplicar hover de ação a controles desabilitados.
- Botões desabilitados devem exibir `cursor: not-allowed`.
- Não usar `pointer-events: none` em botões desabilitados quando isso impedir o feedback visual do cursor.
- Novos componentes interativos devem reutilizar `Button` sempre que o comportamento visual for compatível.
