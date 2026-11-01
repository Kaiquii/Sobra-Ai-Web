# Catálogo do recorte

| Finalidade | Componente Web | Uso e limites |
| --- | --- | --- |
| Modal compartilhado | `components/ui/modal-panel.tsx`, `ModalPanel` | Patrimônio e confirmações nativas; foco, histórico, teclado, variante `sheet` |
| Confirmação | `components/ui/confirmation-dialog.tsx` | Despesas e demais consumidores; preservar ações e bloqueio durante envio |
| Renda | `features/incomes/components/IncomeShortcutDialog.tsx` | Criar, editar e excluir com escopo futuro |
| Adiantamento | `features/expenses/components/ExpenseAdvanceDialog.tsx` | Data e remoção; confirmação pertence a `ExpensesView` |
| Detalhes | `features/expenses/components/ExpenseDetailsDialog.tsx` | Despesas e Início; informações, rateios, privacidade e parcelas |
| Formulário de despesa | `features/expenses/components/ExpenseFormDialog.tsx` | Tela cheia mobile intencional; desktop centralizado |
| Exportação | `features/reports/components/ReportExportDialog.tsx` | Painel mobile e modal desktop distintos |
| Seletor | `components/ui/dropdown-select.tsx`, `SelectionDialog`, `DesktopSelectMenu` | Busca/seleção compartilhadas, apresentações distintas por breakpoint |

Não criar um segundo sistema de modais. Extensões compatíveis dependem do escopo aprovado e da skill `componente-reutilizavel`.

## Densidade mobile

`mobile-compact-dialog` e `mobile-compact-dialog-actions`, em `app/globals.css`, aplicam geometria e ações somente abaixo de 640 px. Consumidores: renda, adiantamento, detalhes da despesa, confirmação padrão e exclusão da despesa. Sem API ou estado novos; desktop conserva os estilos próprios. Limite de altura pela viewport e áreas seguras, ações de pelo menos 48 px e conteúdo rolável quando necessário.
