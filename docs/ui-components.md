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

- Reutilizar `DropdownSelect` com `variant="filter"` e `presentation="sheet"` nos filtros compactos que seguem o Android. A variante usa pílulas sem seta, mantendo o cursor padrão do dropdown.
- `triggerLabel` mantém o rótulo compacto; `sheetTitle` define o título do painel. As opções continuam usando o mesmo contrato de valores e seleção do dropdown.
- `SelectionSheet` centraliza o painel inferior, bloqueio de rolagem, foco, fechamento pela área externa e tecla Esc. As listas de seleção suportam navegação pelo teclado e devolvem o foco ao gatilho ao fechar.
- `CompactExpenseCard`, em `features/expenses/components`, centraliza a apresentação de despesa do Início: categoria, parcelas, pagamento, adiantamento, observações, valor privado e origem. Ações de detalhes continuam usando o diálogo compartilhado existente.

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
