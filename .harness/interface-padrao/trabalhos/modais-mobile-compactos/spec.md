# Modais mobile compactos

## Escopo e estado

Pedido em 31/10/2026: acompanhar dimensões e composição dos modais Android somente abaixo de 640 px. Desktop intocado. Proposta v2 aprovada pelo usuário com uma correção: detalhes não têm “Alterar data”. Implementação concluída com verificações de código; comparação visual autenticada pendente.

Preservar mudanças anteriores ainda não commitadas de remoção de adiantamento. Não alterar cálculos, contratos, paleta, fonte ou organização do bloco de despesas adiantadas.

## Mapeamento visual

| Bloco | Referência existente | Reuso previsto | Preservar | Diferença proposta |
| --- | --- | --- | --- | --- |
| Contêiner | `ModalPanel`, `IncomeShortcutDialog`, `ExpenseAdvanceDialog` | Extensão compatível, sem outro kit | Slate e fonte Web; foco, teclado, estado e ações | Margens mobile de 24 px, máximo de 360 px para diálogos simples, altura pelo conteúdo, limite pela viewport |
| Renda | Android `IncomeEditorDialog.kt`; Web `IncomeShortcutDialog` | Formulário, Input e ações existentes | Valor, recorrência e validação | Espaçamentos de 12–16 px entre blocos; ações compactas na mesma linha, alvos de toque preservados |
| Adiantamento | Android `AdvanceExpenseDialogs.kt`; Web `ExpenseAdvanceDialog` | DatePicker, Button e confirmação existentes | Datas, pagamento e remoção com confirmação | Texto contextual sem cabeçalho decorativo alto; remoção junto da data; rolagem apenas quando necessária |
| Detalhes | Android `core/designsystem/components/ExpenseDetailsDialog.kt`; Web `ExpenseDetailsDialog` | Diálogo e apresentação financeira existentes | Campos, rateios, notas, pagamento e privacidade | Resumo compacto com categoria/tipo, linhas de origem/data/pagamento, bloco de adiantamento; sem ícones grandes por linha |
| Outros diálogos e painéis | Confirmações, `ModalPanel`, exportação e seletores | Componentes compartilhados atuais | Distinção diálogo/painel/tela | Conferir altura pelo conteúdo e evitar expansão vazia; não forçar altura única em todos |
| Telas de edição | Android `NovaDespesaScreen.kt` e `EditarDespesaScreen.kt` | `ExpenseFormDialog` | Tela cheia mobile e teclado | Não reduzir a modal centralizado: o Android também usa tela cheia |

Raiz Android: `C:/Users/kaiqu/StudioProjects/App-Financeiro/sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/`.

## Proposta v2

Mock representativo de renda, alteração de adiantamento e detalhes em viewport 390 × 780. É simulação HTML isolada, não captura da implementação. Local temporário fora do checkout, na área de visualizações desta sessão. Tipografia Web e paleta Slate preservadas; medidas CSS propostas não presumem equivalência física com dp Android.

Artefato: `C:/Users/kaiqu/.codex/visualizations/2026/06/10/019eaef1-a0bd-7652-906d-dca4c2b05ec8/modais-mobile-v1.html` (nome mantido, conteúdo v2 com a correção autorizada). A abertura automática foi bloqueada por restrição ao protocolo de arquivo; nenhuma tentativa de contorno. Renderização automática permaneceu pendente.

A revisão v1 apontou alvo de toque de 40 px e calendário ausente. A v2 corrigiu ambos; depois, o usuário excluiu Alterar data dos detalhes. O campo de data do editor inclui CalendarDays e as ações compactas mantêm mínimo de 48 px.

## Aceite e contrato da implementação

Resposta do usuário em 31/10/2026: “só o de detalhes das despesas que acabamos de mexer e não entra mais alterar data ai né, de restante está perfeito, pode fazer”. Depois reforçou: “vc não mudou nada, pode fazer!!”. O aceite exclui Alterar data dos detalhes; alteração e remoção ficam no modal de adiantamento.

Reuso: `mobile-compact-dialog` e `mobile-compact-dialog-actions` são estilos compartilhados em `app/globals.css`, exclusivamente na media query abaixo de 640 px, sem props ou estado novos. Aplicados em renda, adiantamento, detalhes, confirmação padrão e exclusão de despesa. Não alteram apresentação desktop, fonte ou tokens. O conteúdo mobile dos detalhes reutiliza formatação, rateios e `FinancialValue` da feature; a composição desktop continua separada e preservada. Seletores, Patrimônio, exportação e edição de despesa mantêm as apresentações próprias existentes.

O servidor do usuário está acessível, mas a aba de teste abriu no login. Não alterar autenticação nem gravar dados para obter evidência visual; continuar verificações de código sem depender de credenciais.

Verificações: 94 testes passaram, lint e doctor aprovados, TypeScript e build com webpack concluídos na versão final. O build padrão do ai:check falhou por erro interno do Turbopack ao criar o processo de CSS. Revisão independente sem bloqueantes estáticos após corrigir Salvar textual; não certifica os critérios visuais ainda pendentes.

## Aceitação

- Aprovação explícita do mock antes de editar produção.
- Somente estilos mobile; comparar desktop antes/depois sem diferenças.
- Não cortar textos, campos ou ações em 320, 390 e 430 px, paisagem, teclado e texto ampliado.
- Notas longas, rateios e parcelas continuam acessíveis com rolagem quando realmente necessária.
- Preservar temas, ações, cancelamento, foco e estados de envio/erro; não diminuir áreas de toque para economizar espaço.
- Revisão independente e validação visual da implementação após aceite; build isolado não certifica geometria.
