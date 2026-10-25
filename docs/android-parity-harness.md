# Harness de paridade com Android

## Origem e alcance

Referência recebida em 25/10/2026: Android **1.4.5**, versionCode **145**, commit
**78a86c6** na main de [Sobra-Ai-Android](https://github.com/Kaiquii/Sobra-Ai-Android.git).
Fonte completa local: `C:/Users/kaiqu/StudioProjects/App-Financeiro/docs/web-parity-harness.md`.
O documento de origem foi criado depois desse commit; sua presença nesse commit
não é presumida. Esta cópia adaptada mantém os critérios sem expor rotas,
métodos HTTP, corpos de requisição ou detalhes operacionais da API em Markdown.
Consultar o código das features e a documentação privada para transporte.

**No celular, o web deve ser o mais parecido possível com o Android aprovado**:
desenho, cores, fonte, hierarquia, ícones, cards, campos, botões, navegação,
modais e estados. Consultar o Android final, não versões intermediárias rejeitadas.
No desktop, aproveitar colunas e espaço horizontal com diferenças leves,
preservando identidade, regras financeiras e comportamentos.

Este guia é contexto de implementação e aceitação, não certificação de paridade.
Após a incorporação documental, o usuário autorizou implementar os requisitos e
os testes de regressão em 25/10/2026. O registro abaixo diferencia a base inicial
do código implementado e das verificações ainda dependentes de navegador/dispositivo.
Preservar avatar e melhorias existentes. Manter a exceção expressa do usuário:
login conserva seu layout web anterior em `LoginShell`. A apresentação do bloco
“Impactam o planejamento deste mês” continua preservada.

Somente o usuário inicia ou reinicia o servidor. Usar o servidor dele para QA
visual; se indisponível, registrar a limitação. Não executar Gradle como teste
do web. Não fazer commit, push, publicação ou alteração em backend/VM por
consequência deste guia.

## Invariantes financeiros de VA e VR

- Vale-alimentação e vale-refeição são fontes independentes, com a mesma regra
  mensal de Salário e Adiantamento. Não criar carteira conjunta, elegibilidade,
  acúmulo automático entre meses ou bloqueio de despesa por saldo negativo.
- Identificar cada renda pelo ID e pelo mês/ano selecionados. Não aproveitar
  registro de outro período nem permitir resposta atrasada misturar períodos.
- Recorrência pertence ao servidor: renda fixa gera 60 meses, inclusive virada
  de ano; renda única ou tipo omitido corresponde a um mês. O cadastro segue o
  padrão de Salário/Adiantamento. Nunca duplicar os registros no cliente.
- Repetição específica de Renda Extra não é mecanismo de recorrência de VA/VR.
- Edição e exclusão respeitam o registro selecionado e o escopo escolhido:
  somente o mês ou esse mês e os futuros da mesma fonte e usuário. VA não altera
  VR. Edição de valor com escopo futuro não move o período nem reenvia identidade
  ou dados desnecessários. Excluir renda não exclui despesas.
- Fontes canônicas dos benefícios são `VA` e `VR`. Nomes completos na interface:
  “Vale-alimentação (VA)” e “Vale-refeição (VR)”. Compatibilizar aliases das fontes
  antigas sem converter fontes desconhecidas silenciosamente para Salário.
- Oferecer benefícios em rendas, criação/edição de despesas Única/Fixa/Parcelada,
  divisões e filtros. A despesa usa origem única ou divisão, nunca ambas.
- Divisões somam o total, têm valores positivos e fontes não repetidas, inclusive
  por aliases. Preservar combinações com fontes antigas; contar a despesa uma vez.
- Filtro por origem encontra qualquer participante da divisão. Combinar busca,
  período, categoria, origem, status e tipo.
- Adiantamento usa o período efetivo existente, preservando pagamento. Marcar
  como paga não desconta a despesa novamente; remover adiantamento não muda status.
- O resumo inclui crédito, gasto e restante de cada benefício. Campos adicionais
  ausentes em respostas antigas admitem zero por compatibilidade, mas erro real
  de contrato não vira resumo zerado bem-sucedido.
- Totais gerais já incluem VA/VR: não somar novamente. Exibir restantes recebidos,
  inclusive negativos. Revisar comparativos, gráficos, compromissos, exportações
  CSV/XLSX e Assistente para não descartar fontes novas nem recalcular totais errados.
- Atualizar telas relacionadas depois de mutação bem-sucedida, inclusive fontes
  antigas. Falha de gravação não publica sucesso nem dispara repetição automática.

## Seletores finais aprovados

- Reutilizar componentes comuns. No celular, seleção e busca abrem modal próprio,
  sem popup comprimido acima/abaixo do campo ou lista expandida no formulário.
- Referência intermediária Android: máximo 440 dp de largura, margens de 20 dp,
  cantos de 20 dp e cerca de sete opções visíveis. Altura desejada:
  `136 + min(max(totalDeOpções, 1), 7) * 48` dp, limitada à área segura.
  Adaptar proporções para CSS/viewport, sem presumir equivalência física dp/px.
  Não retornar aos modelos rejeitados de 600 dp ou 360 dp/cinco itens.
- Título próximo de 18 sp semibold; opções em corpo padrão, aproximadamente 16 sp;
  alvos de toque de 48 dp. Desktop pode adaptar largura mantendo identidade.
- Busca discreta abaixo do título, lupa e espaço fixo para limpar. Não abrir
  teclado automaticamente. Ignorar caixa e acentos, aceitar múltiplos termos.
- Preservar IDs, ordem e seleção ao filtrar, inclusive nomes repetidos com IDs
  diferentes. Mostrar ausência de resultados e restaurar lista ao limpar.
- Altura depende da lista original, não dos resultados. Digitar não encolhe ou
  recentraliza o painel; limpar não desloca a busca. Reiniciar rolagem no primeiro
  resultado sem animação por tecla.
- Seleção tem fundo azul suave e confirmação. Escolher fecha e devolve o valor;
  X, voltar/Escape ou área externa fecham sem alterar seleção ainda não realizada.
- Garantir foco visível, nome acessível, seleção acessível, teclado e retorno de
  foco ao campo. Impedir interação do foco com o fundo e preservar modais aninhados.
- Teclado e áreas seguras têm um único responsável. Não somar deslocamento do
  navegador com correção manual concorrente. Conferir abertura e fechamento sem
  saltos ou animações sobrepostas. `decorFitsSystemWindows=false` é referência
  nativa Android, não propriedade CSS a copiar.

## Campos e padrões visuais

- Trocar seleção não autoriza redesenhar rótulos, campos ou botões. O **+ verde
  fica dentro do campo Categoria**, à direita junto da seta; não movê-lo ao título
  ou fora do campo. Preservar Dividir pagamento, salvar, calendário e parcelas.
- Editor de renda: “Criar renda”/“Editar renda”, com nome completo em hierarquia
  menor. Não deixar apenas “(va)” em outra linha. Siglas sempre maiúsculas; cards
  compactos podem usar VA/VR.
- Filtros de Despesas abrem com rascunho dos valores aplicados. Aplicar confirma
  e fecha; X/voltar/fora cancela; Limpar altera apenas rascunho e exige Aplicar.
  Destacar botão ativo. Categorias pertencem à lista/período relevante; manter
  indicação da categoria selecionada sem itens e permitir limpar ou trocar.
- Android usa Roboto, azul `#1877F2`, fundo escuro `#121212` e cards `#202934`.
  Consultar tokens e usos em `Color.kt`, `Theme.kt` e `Typography.kt`. Na orientação
  posterior de 25/10/2026, o usuário pediu preservar o fundo padrão do projeto web,
  inclusive nos seletores; a paleta Slate permanece. Roboto é servida localmente
  na área autenticada mobile. Essa diferença de paleta é intencional.
- Títulos superiores alinhados à esquerda. Cards compactos com ações no topo
  direito: pagar, adiantar, visualizar, editar, excluir; não criar rodapé de ações.
  Conferir variantes e ícones no Android atual, inclusive a variante do Início.
- Adiantar: calendário azul com seta; já adiantada: calendário com confirmação
  para alterar data. Remover adiantamento permanece nos detalhes.
- Marcador de tipo: Única azul, Parcelada roxo, Fixa verde-água. Não colorir o card
  inteiro pela fonte, categoria ou pagamento.
- Avisos transitórios compactos acima da navegação/teclado, com tema e ícone por
  tipo; nova mensagem substitui anterior. Falha de carregamento fica persistente
  com nova tentativa. Agrupar falhas de transporte equivalentes por contexto,
  preservar erros HTTP distintos e timeout; não afirmar que a internet caiu.
- Revisar todos os consumidores da mesma causa, não apenas a tela relatada.

## Mapa de fontes

Raiz Android: `C:/Users/kaiqu/StudioProjects/App-Financeiro`.

| Área | Fontes Android relativas à raiz | Consumidores web |
| --- | --- | --- |
| Regras e localização | `docs/beneficios-va-vr.md`, `docs/frontend-rules.md`, `docs/ai-project-map.md` | `docs/backend-api-contract.md`, `docs/ui-components.md`, este harness |
| Fontes e modelos | `shared/src/commonMain/kotlin/com/example/appfinanceiro/core/network/FinanceModels.kt`, `PaymentSources.kt` no mesmo diretório | `features/incomes/types/income.ts`, `features/expenses/types/expense.ts`, `features/summary/types/summary.ts` |
| Seleção e avisos | `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/core/designsystem/components/`: `AppSelectField.kt`, `SelectorDialogWindow.kt`, `AppNotification.kt` | `components/ui/dropdown-select.tsx`, `components/ui/selection-sheet.tsx`, alertas |
| Cards | `ExpenseCard.kt` no diretório de componentes acima | `features/expenses/components/CompactExpenseCard.tsx`, `ExpensesView.tsx` |
| Resumo | `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/home/components/FinanceSummaryContent.kt` | `features/summary/components/MonthlySummaryView.tsx`, `MonthlyExpensesSection.tsx` |
| Editores e campos | `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/feature/home/components/income/`, `feature/despesas/components/FormComponents.kt` na mesma raiz Kotlin | `features/incomes/components/IncomeShortcutDialog.tsx`, `IncomeSettingsView.tsx`, `features/expenses/components/ExpenseFormDialog.tsx` |
| Evidência nativa | `sharedUi/src/commonTest/kotlin/br/com/sobraai/ui/BenefitsTest.kt`, `SelectSearchTest.kt`, `shared/src/commonTest/kotlin/com/example/appfinanceiro/core/network/ApiContractTest.kt` | Verificações web abaixo; testes nativos não substituem QA de navegador |

## Diferenças observadas no web

Inventário inicial estático em 25/10/2026, base web `33232e8`, anterior à
implementação. Não representa o estado final nem validação das chamadas reais.
Consultar o registro de implementação abaixo e não presumir aprovação visual.

| Área | Evidência local | Situação |
| --- | --- | --- |
| Fontes de renda | `IncomeSource` e normalização em `features/incomes` reconhecem somente Salário, Adiantamento e Renda Extra; fallback para Salário | VA/VR e tratamento de desconhecidas pendentes |
| Despesas e resumo | `paymentSources` do formulário, fontes de `ExpenseListControls` e modelo `MonthlySummary` sem benefícios | Revisão transversal de tipos, opções, rateios, filtros e resumo pendente |
| Rendas por período | `incomesApi.getIncomes` não recebe período; `findIncomeByReference` filtra mês/ano localmente | Conferir contrato e concorrência ao implementar; não declarar defeito financeiro apenas pela assinatura |
| Seletores | `DropdownSelect` oferece popover e sheet sem busca; `SelectionSheet` inferior em largura total | Busca, tamanho intermediário e estabilidade da lista original pendentes |
| Categoria | `ExpenseFormDialog` mantém botão de adicionar separado do campo | + verde interno pendente de implementação autorizada |
| Filtros | `ExpenseListControls` já usa rascunho, Aplicar, Limpar, categoria indisponível e destaque ativo | Base existente; rever busca, benefícios e interações em navegador |
| Identidade | `docs/android-reference.md` prescrevia Slate web, divergindo do guia Android atual | Referência nova registrada; cores/fonte ainda requerem comparação e trabalho específico |
| Proteções web | Avatar relativo/absoluto, `LoginShell`, privacidade e bloco de despesas adiantadas | Preservar durante mudanças posteriores |

## Aceitação e evidências

1. Conferir instruções e Git; consultar fonte Android atual e mapear todos os
   consumidores antes de implementar. Não substituir correções locais por versões antigas.
2. Validar VA e VR independentes, fontes antigas, dezembro/janeiro, recorrência
   fixa, criação única, edição/exclusão somente mês e futuros da mesma fonte.
   Confirmar nenhum acúmulo ou duplicação no cliente e nenhuma exclusão de despesas.
3. Validar rateios positivos, soma correta, aliases duplicados, seleção de origem
   em divisões, negativos, totais recebidos, adiantamento e pagamento sem desconto
   duplicado; ausência dos campos novos em resposta antiga e erros reais de contrato.
4. Após mutações, verificar atualização cruzada e falhas sem falso sucesso.
   Trocar rapidamente mês/ano e simular resposta atrasada para confirmar isolamento.
5. Seletores: caixa/acentos, múltiplos termos, nomes iguais/IDs diferentes, ordem,
   vazio, limpar sem salto, seleção, cancelar, foco/Escape e todos os consumidores.
   Filtros: rascunho, Aplicar, Limpar, cancelamento e combinações de todos os critérios.
6. Comparar Android/web com mesmos dados sintéticos, período e estado: celular
   estreito/convencional, paisagem, fonte ampliada, temas, teclado virtual e desktop.
   Anotar navegador, viewport, dispositivo, screenshots e diferenças intencionais.
   Build não certifica paridade nem teclado real ou iPhone.
7. Executar `npm run ai:doctor` ao alterar contexto; `npm run ai:check` inclui
   `npm test`, lint e build. `npm test` reúne regressões de benefícios, concorrência,
   busca, tema e service worker em `scripts/*.test.mjs`. Testes adicionais foram
   expressamente autorizados pelo usuário; não substituem a comparação visual.

## Implementação em 25/10/2026

- `lib/payment-sources.ts` centraliza fontes, aliases, nomes completos e validação
  de rateios. Rendas, despesas, detalhes, filtros e comparativos preservam VA/VR e
  fontes desconhecidas sem classificá-las silenciosamente como Salário.
- `lib/summary-benefits.ts` valida período e totais, completa somente benefícios
  ausentes com zero e preserva totais gerais e saldos negativos. O resumo apresenta
  renda, gasto e restante de cada benefício; desktop usa três totais e cinco
  colunas de fonte. Largura e altura aumentam com moderação, sem mudar tipografia.
- Rendas são consultadas por mês/ano; mutações preservam ID e escopo; respostas
  atrasadas são descartadas. Revisões após mutações atualizam resumo/relatórios.
  As cargas de despesas e relatórios também descartam respostas ultrapassadas.
- `SelectionDialog` fornece modal com busca sem caixa/acentos, vários termos,
  opções identificadas por valor, altura estável, limpeza sem deslocar o campo,
  lista com rolagem só quando necessária e foco isolado pelo diálogo nativo.
- O + verde fica dentro de Categoria. Alterar a categoria não recarrega o
  formulário de edição apagando outros campos. Remoção de adiantamento fica nos
  detalhes; calendário no card permite criar ou alterar sua data.
- Avisos de sucesso usam `AppNotification`, mantendo falhas de carregamento
  persistentes. Timeout tem mensagem distinta de falha genérica de conexão.
- `scripts/benefits-parity.test.mjs` cobre fontes/aliases, rateios, totais,
  negativos, recorrência, períodos, concorrência, gravação falha, duplicidade de
  envio, falha no recarregamento e busca. Com as suítes anteriores, 23 testes
  passaram. TypeScript, lint e build padrão passaram em `npm run ai:check`;
  o build com webpack também passou durante o diagnóstico de cache do compilador.
  A conferência visual
  automatizada ficou bloqueada pela identificação da URL no Windows; os ajustes
  de tamanho e fundo foram conduzidos pelas capturas e correções do usuário.
- Preservados: login web, avatar, privacidade e organização do bloco de despesas
  adiantadas. Teclado real, iPhone, todos os estados de UI e integração financeira
  com backend real ainda requerem conferência; não foram gravados dados reais.

Evidência de origem informada no Android: `harnessVerify` aprovado com 230 testes
sem falhas, Lint, APK e compilação KLIB iOS, com possíveis tarefas em cache.
O usuário aprovou a interface final Android. Isso não certifica web, iPhone,
execução iOS ou build Xcode. Os testes web do registro acima validam regras e
concorrência; integração real e comparação visual completa continuam pendentes.
Não executar testes de gravação
em dados reais para cumprir a matriz. Problemas de contrato exigem evidência,
não compensação silenciosa no cliente.
