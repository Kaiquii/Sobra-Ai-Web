# Componentes de UI

Este arquivo registra padroes visuais obrigatorios para componentes globais do projeto.

## DropdownSelect

O componente `components/ui/dropdown-select.tsx` e o dropdown padrao do projeto.

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
