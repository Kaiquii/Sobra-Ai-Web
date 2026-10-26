# Componentes de UI

Todos os componentes herdam a fonte padrão Web, inclusive modais, seletores,
campos e cabeçalhos no celular/PWA. Não adicionar fontes próprias ou trocar a
família tipográfica para imitar Android. Essa regra é permanente em `rules.md`
e verificada pelo harness.

Troca de tema é imediata. Componentes não devem usar transições de cor, de todas
as propriedades ou `transition` genérico. Somente transformações geométricas
podem ter transição quando necessárias. O harness verifica essa regra.

## ModalPanel

`components/ui/modal-panel.tsx` usa diálogo nativo para isolar foco e fundo,
restaurar foco e compartilhar uma pilha de voltar com `SelectionDialog`.
Variante `sheet` tem rolagem, VisualViewport, proteção do teclado para descarte
implícito e bloqueio durante salvamento. `ConfirmationDialog` oferece
`nativeModal` para confirmações acima de painéis. Patrimônio usa esses
componentes; critérios de teclado/gestos e QA pendente: `docs/patrimonio.md`.

O painel inferior e sua alça existem somente abaixo de 640 px. No desktop,
`ModalPanel` deve seguir os modais Web existentes: centro da viewport, largura
adequada ao formulário, borda, raio, padding e ações compactas. Não manter um
painel mobile preso ao topo no desktop. Os editores de Patrimônio usam o rodapé
desktop com Cancelar/Salvar à direita; o celular mantém Salvar em largura total.

Este arquivo registra padroes visuais obrigatorios para componentes globais do projeto.

## DropdownSelect

O componente `components/ui/dropdown-select.tsx` e o dropdown padrao do projeto.

Apresentação obrigatória, definida pelo breakpoint:

- Desktop (640 px ou mais): lista antiga ao lado do campo, abaixo/acima conforme
  espaço. `DesktopSelectMenu` conserva largura do gatilho, opções compactas,
  seleção, hover, Escape e setas. Usa popover não modal para funcionar acima de
  diálogos nativos sem escurecer o fundo.
- Celular/PWA (abaixo de 640 px): `SelectionDialog`, modal semelhante ao Android
  com busca, altura estável e foco isolado. Nunca usar a lista desktop como
  substituto dessa experiência.
- O prop legado `presentation` não sobrepõe essa regra. Compartilhar o mesmo
  dropdown entre telas deve preservar as duas apresentações.

No desktop, ações auxiliares dentro do campo devem caber na sua altura, com
hover discreto e foco visível no padrão Web. Não usar um alvo mobile de 48 px
dentro de um campo desktop de 40 px. Ajustes exclusivos do desktop devem usar
o breakpoint correspondente, preservando os estados mobile.

Use `DropdownSelect` sempre que a interface precisar escolher uma opcao em lista, incluindo:

- filtros;
- categorias;
- origens de pagamento;
- tipos;
- seletores em formularios.

Nao use `<select>` nativo em telas e modais da aplicacao, salvo por uma limitacao tecnica clara e registrada no codigo ou documentacao.

Exemplo:

```tsx
<DropdownSelect
  ariaLabel="Filtrar por origem"
  icon={WalletCards}
  onChange={setPaymentSourceFilter}
  options={[
    { label: "Todas origens", value: "Todas" },
    { label: "Salario", value: "Salario" },
  ]}
  value={paymentSourceFilter}
/>
```

Para formularios, mantenha o `Label` associado pelo `id`:

```tsx
<Label htmlFor="expense-source">Origem</Label>
<DropdownSelect
  ariaLabel="Selecionar origem"
  id="expense-source"
  onChange={setPaymentSource}
  options={options}
  value={paymentSource}
/>
```

O componente ja cuida de:

- tema claro e escuro;
- popup visual proprio;
- item selecionado;
- fechamento ao clicar fora;
- fechamento com `Esc`;
- estado desabilitado.

## Seleção e filtros no celular

- Referência final de busca, dimensão intermediária, estabilidade da lista e teclado: `docs/android-parity-harness.md`. `DropdownSelect` delega a lista a `SelectionDialog`, um modal nativo com busca normalizada e altura estável pela lista original, limitado à viewport. O fundo acompanha os demais modais do web. Evoluir o componente compartilhado sem redesenhar os campos consumidores.

- Reutilizar `DropdownSelect` com `variant="filter"` e `presentation="sheet"` nos filtros compactos que seguem o Android. A variante usa pílulas sem seta. Gatilhos e opções habilitados usam cursor de mão e hover nos dois temas; o item selecionado preserva seu destaque azul.
- `triggerLabel` mantém o rótulo compacto; `sheetTitle` define o título do painel. As opções continuam usando o mesmo contrato de valores e seleção do dropdown.
- `SelectionSheet` mantém o painel de rascunho dos filtros. `SelectionDialog` centraliza a escolha de opções com busca, foco isolado pelo diálogo nativo, fechamento por área externa/Escape e retorno ao gatilho. O título e a geometria não devem deslocar ao filtrar. Ajustar a caixa para bordas e espaçamentos não criarem rolagem quando as opções cabem.
- `CompactExpenseCard`, em `features/expenses/components`, centraliza a apresentação de despesa do Início: categoria, parcelas, pagamento, adiantamento, observações, valor privado e origem. Ações de detalhes continuam usando o diálogo compartilhado existente.

## Faixas compactas com rolagem

Usar a classe compartilhada `scrollbar-none` em faixas internas que precisam de rolagem por toque sem exibir a barra, como os indicadores do cartão compacto de despesa. Ela cobre tanto navegadores com `scrollbar-width` quanto os que usam o pseudo-elemento WebKit. Não ocultar globalmente as barras das páginas ou dos painéis.

## DatePicker

O componente `components/ui/date-picker.tsx` e o seletor de data padrao do projeto.

Use `DatePicker` em formularios e modais no lugar de `<input type="date">`, para evitar o calendario nativo do navegador.

O valor continua sendo armazenado em `yyyy-mm-dd`, igual o formato usado pelo front antes de enviar para a API.

Exemplo:

```tsx
<Label htmlFor="expense-date">Data de pagamento</Label>
<DatePicker
  id="expense-date"
  onChange={setDate}
  value={date}
/>
```
