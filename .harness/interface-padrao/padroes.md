# Padrões confirmados

Pedido de 31/10/2026: reduzir o espaço ocupado pelos modais do Web mobile para acompanhar o Android. Desktop permanece como está. Preservar paleta e fonte Web.

| Situação | Apresentação de referência | Fechamento/retorno | Fonte |
| --- | --- | --- | --- |
| Renda, adiantamento, confirmação | Diálogo centralizado, altura pelo conteúdo | Cancelar volta sem gravação; ação confirma | `IncomeEditorDialog.kt`, `AdvanceExpenseDialogs.kt` |
| Detalhes | Diálogo com resumo e linhas compactas | Fechar retorna à lista; alteração abre editor | `ExpenseDetailsDialog.kt` Android |
| Adicionar/editar despesa | Tela cheia no celular | Voltar sem gravação; salvar conclui | `NovaDespesaScreen.kt`, `EditarDespesaScreen.kt` |
| Exportação | Painel inferior ajustado ao conteúdo | Fechar/cancelar conforme operação | `ReportExportSheet.kt` |
| Seleção | Modal de seleção somente no celular | Selecionar confirma; cancelar preserva | `DropdownSelect` e `SelectionDialog` Web |

As medidas concretas da proposta ainda dependem de aprovação do mock; não há aprovação registrada.
