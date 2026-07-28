# Regras do projeto

## Cursor de elementos interativos

- Todo botão habilitado deve exibir `cursor: pointer`.
- O componente global `Button` e o helper `buttonClassName` devem manter a classe `cursor-pointer`.
- Botões nativos devem declarar `cursor-pointer` explicitamente em sua classe, além da regra base definida em `app/globals.css`.
- Gatilhos e opções do componente `DropdownSelect` são exceções e devem manter `cursor: default`.
- Botões desabilitados devem exibir `cursor: not-allowed`.
- Não usar `pointer-events: none` em botões desabilitados quando isso impedir o feedback visual do cursor.
- Novos componentes interativos devem reutilizar `Button` sempre que o comportamento visual for compatível.
