# Parecer independente

Revisor: Popper, agente `01a19473-f705-7ab1-bd5b-e87bbb85c2ea`. Somente leitura, fase mock em 31/10/2026. Fontes: spec, HTML temporário e componentes Web/Android ali referenciados.

## V1: reprovado

- Alterar data tinha alvo de toque de 40 px; ampliar para 48 px.
- Campo de data omitia o calendário presente nas referências; restaurar indicador.
- Fonte Web, base Slate e hierarquia principal compatíveis estaticamente.
- Fidelidade renderizada não verificável por bloqueio da abertura de arquivo local no navegador.

## V2: pendente

- Revisor confirmou a correção do alvo para 48 px e a presença do CalendarDays com layout flex sem compressão.
- Nenhum novo bloqueante estático identificado; fonte e paleta preservadas nos trechos.
- Sem captura renderizada: proporções, presença efetiva do ícone e cortes continuam pendentes. Não houve execução ou tentativa de contorno da política do navegador.
- Proposta representa tema escuro em 390 × 780. Demais viewports, temas, interações e isolamento desktop serão conferidos na implementação, não foram declarados aprovados.

O usuário aprovou a proposta com uma correção expressa: excluir Alterar data dos detalhes. Resposta real registrada em `spec.md`. O mock não comprova implementação.

## Implementação v1: reprovado

O mesmo revisor examinou o diff dos componentes reais, seus consumidores e testes. Identificou Salvar preenchido no mobile, divergindo da ação textual do mock e de `IncomeEditorDialog.kt`. Confirmou estaticamente: ausência de edição/remoção nos detalhes, geometria limitada ao mobile, separação da composição desktop, fonte Web, Slate, valores privados, rateios, parcelas e notas. Registrou lacunas preexistentes de nome/foco/Escape em diálogos antigos, não atribuídas ao diff.

## Implementação v2: pendente visual

Revisor confirmou a correção: Salvar textual somente no mobile e nos dois temas; Excluir continua preenchido, desktop e estados de envio/desabilitado preservados. Sem novos bloqueantes estáticos no trecho corrigido; mantida a análise anterior das partes inalteradas.

Evidência autenticada indisponível: navegador de teste abriu no login. Não houve contorno de autenticação, alteração de dados reais ou abertura de servidor pela IA. A revisão não certificou geometria, teclado, cortes ou comparação visual desktop. Os 94 testes e lint passaram; build padrão apresentou falha interna de processo do Turbopack. Após a última correção, a sessão principal confirmou TypeScript e build com webpack aprovados, além do check rápido. Esses resultados não substituem a revisão visual pendente.

## Incremento: informativo de adiantamento

Mesmo revisor, fase final incremental em 31/10/2026: conformidade estática aprovada, sem achados. Confirmada equivalência ao `AdvanceDetailsBlock` Android atual: somente data/texto em negrito, linha única com rolagem horizontal, fundo azul a 10%, raio 16 e espaçamento 12 × 10. Desktop, fonte e paleta preservados, sem ações novas. Parecer visual permanece pendente. A sessão principal confirmou 95 testes, lint, doctor, TypeScript e build com webpack aprovados; o build padrão continua falhando internamente no processo CSS do Turbopack.
