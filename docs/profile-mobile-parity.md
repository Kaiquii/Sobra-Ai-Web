# Perfil mobile: referência Android e escopo

## Autorização em 04/11/2026

O usuário solicitou alinhar apenas a tela principal de Perfil e o modal de
visualização da foto no celular/PWA ao Android, usando as duas capturas enviadas
e a implementação nativa como referência. O escopo visual é inferior a 640 px.
Desktop, paleta Web e fonte padrão Web devem ser preservados. A comparação das
demais telas serve somente para informar diferenças; não autoriza modificá-las.

As regras de `rules.md`, `docs/android-reference.md` e
`docs/android-parity-harness.md` continuam obrigatórias. Não copiar Roboto,
introduzir fontes, animar a troca de tema ou transportar o padrão mobile ao desktop.

## Fontes consultadas

Raiz Android disponível nesta comparação:
`C:/Users/kaiqu/Documents/App-Financeiro`. Os caminhos abaixo são relativos a ela.
Não se atribui a comparação a um commit Android não verificado.

- `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/PerfilScreen.kt`:
  cabeçalho, ordem das seções, ações e modal da foto.
- `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/ProfileComponents.kt`:
  card de identidade, avatar, ações, selo e itens de configuração.
- `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/components/ProfileSettingsComponents.kt`:
  componentes das subtelas de configuração, consultados como contexto.

Consumidores Web afetados: `features/profile/components/ProfileView.tsx`,
`components/layout/header.tsx`, `components/layout/dashboard-shell.tsx` e
`components/ui/profile-photo-preview-dialog.tsx`.
O cabeçalho é compartilhado; a adaptação deve ficar restrita ao perfil mobile.
O visualizador é compartilhado; preservar a apresentação desktop e os demais fluxos.

## Composição de referência

As dimensões Android em dp/sp orientam proporções CSS, sem presumir equivalência
física entre dispositivos. Todos os textos herdam a família tipográfica Web.

| Bloco | Referência para a apresentação mobile |
| --- | --- |
| Topo | “Meu perfil” à esquerda, título de 24; saída da conta à direita com confirmação existente |
| Card de identidade | Cantos de 16 e padding de 14; foto à esquerda e nome/e-mail/selo à direita |
| Avatar | Círculo de 76 dentro de área de 92 × 96; nome de 20 e e-mail de 13 |
| Ações da foto | Controles circulares de 32 junto à base do avatar; alterar e remover, com nomes acessíveis |
| Editar perfil | Botão preenchido em largura total, altura de 44 e cantos de 12 |
| Finanças | Rendas, Patrimônio e Categorias, nessa ordem, com ícone, título, descrição e seta |
| Suporte | Seção “Suporte” e item “Ajuda e suporte”, com descrição “Dúvidas frequentes e contato” |

A biometria exibida no Android depende de recursos nativos que não existem no
fluxo Web atual. Esta correção visual não cria autenticação biométrica nem um
switch sem funcionalidade. Essa diferença deve ser informada ao usuário.

## Visualizador da foto

- Modal centralizado com 92% da largura disponível, máximo de 480 e cantos de 20.
- Padding interno de 12; título “Foto de perfil” de 18 e nome de 12 abaixo.
- Fechamento por botão com alvo de 48, além do comportamento acessível existente.
- Área de imagem quadrada, cantos de 14 e imagem inteira com `contain`.
- Preservar a paleta Web e o tratamento existente para foto ausente, URL,
  carregamento, foco e fechamento. Remover foto continua exigindo confirmação.
- Não alterar upload, dados pessoais, regras de sessão ou a apresentação desktop
  como consequência da adaptação visual.

## Outras diferenças identificadas, sem edição

Inventário estático em 04/11/2026, inicialmente na base Web `c23e9a7`.
As fontes comprovam diferenças de composição;
esta tabela não representa comparação executada em navegador ou dispositivo.
Os caminhos Android são relativos à raiz indicada acima.

| Área | Diferença observada | Fontes Web e Android |
| --- | --- | --- |
| Relatórios | Web usa dropdown para o intervalo e caixa separada com renda/despesa/saldo; Android destaca saldo e usa três segmentos de período | `features/reports/components/ReportsView.tsx`; `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/relatorios/components/IncomeVsExpenseCard.kt` e `ReportRangeSelector.kt` no mesmo diretório |
| Rendas | A ordem das rendas mobile passou a Salário, Adiantamento, VA, VR e Renda Extra. Na primeira implementação, as preferências ficaram entre VR e Renda Extra; o pedido posterior no Web coloca Saldo disponível como última seção após Renda Extra em todas as larguras, com explicação completa em modal de ajuda. Desktop preserva os formulários de renda anteriores | `features/incomes/components/IncomeSettingsView.tsx`; `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/components/ConfiguracoesRendaScreen.kt`; `docs/balance-preferences.md` |
| Categorias | Web empilha campo e botão no celular e agrupa a lista com divisores; Android põe campo e + lado a lado e usa cards individuais com ícone e contagem | `features/profile/components/CategoriesManagerView.tsx`; `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/components/CategoriasScreen.kt` |
| Ajuda | Web mostra todos os textos abertos; Android tem introdução, agrupamento e tópicos recolhíveis | `features/profile/components/HelpView.tsx`; `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/perfil/components/AjudaScreen.kt` |
| Histórico do Assistente | Web abre painel abaixo do cabeçalho; Android abre painel inferior | `features/assistant/components/AssistantChatView.tsx`; `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/feature/assistant/AssistantScreen.kt` |
| Detalhes da despesa | A diferença inicial de cabeçalho, agrupamento e fechamento foi corrigida no trabalho remoto `8379cde`, integrado antes do push do perfil; o mobile já usa título fixo, resumo agrupado e “Fechar” no rodapé | `features/expenses/components/ExpenseDetailsDialog.tsx`; `sharedUi/src/commonMain/kotlin/com/example/appfinanceiro/core/designsystem/components/ExpenseDetailsDialog.kt` |
| Navegação inferior | Web usa ícones contornados e gráfico de barras; Android usa ícones preenchidos e gráfico de pizza, com proporções próprias do botão central | `components/layout/mobile-navigation.tsx`, `components/layout/navigation.ts`; `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/core/designsystem/components/StandardBottomBar.kt` |

Ícones Lucide fazem parte das regras Web; a diferença do desenho dos ícones não
autoriza trocar a biblioteca. Fonte, cores e login com composição Web própria são
exceções intencionais. Patrimônio já tem sequência próxima à referência; Início
e Despesas possuem adaptações registradas. Não se certifica igualdade visual
dessas telas apenas pela inspeção de código.

Antes do push do perfil, foram integrados sem conflitos os commits remotos
`8379cde`, `34fd7ef` e `00ab4d1`, que tratam de modais mobile, aviso de
adiantamento e indicador de observações. Essas correções pertencem ao trabalho
remoto preexistente; não ampliam o escopo desta implementação do perfil.
Após essa integração, os 99 testes e `ai:check:quick` passaram novamente.

## Verificação

- Os 89 testes existentes e o lint passaram. `ai:check:quick` e `ai:doctor`
  passaram, incluindo as proteções de fonte e de troca imediata de tema.
- `ai:check` executou os testes e o lint, mas falhou na criação do subprocesso
  de CSS do Turbopack. A compilação alternativa com `next build --webpack`
  terminou com sucesso, incluindo TypeScript e a geração das 22 páginas.
  O compilador padrão do projeto não foi alterado.
- A revisão independente conferiu a separação mobile/desktop, as proporções,
  foco e leituras de refs. O corte no anel inferior das ações da foto foi
  corrigido limitando o `overflow-hidden` da linha ao desktop. A ordem do CSS
  compilado também foi conferida para fundo, texto e hover das ações; o raio
  circular usa a variante mobile para prevalecer sobre o raio base do `Button`.
- Após a consulta inicial encontrar conexão recusada, o usuário iniciou o
  servidor na porta 3001 e entrou na própria conta no navegador de conferência.
  A IA não iniciou servidores, enviou fotos, removeu dados ou alterou o perfil.
- Conferência em navegador Chromium integrado: perfil e foto em 390 × 844 nos
  temas claro/escuro; foto em 320 × 720 e paisagem 639 × 360; composição desktop
  em 1440 × 1000. A foto mobile permaneceu quadrada com `contain`; em paisagem
  havia rolagem e o botão fechar permaneceu acessível, sem excesso horizontal.
- Verificados foco inicial no fechar, isolamento nativo, Escape, botão voltar
  fechando a foto e foco retornando ao avatar. A fonte computada permaneceu a
  fonte padrão Web. O tema original escuro e o tamanho normal do navegador
  foram restaurados depois da conferência.
- A inspeção visual encontrou a saída desktop ainda aparecendo no rodapé
  mobile por precedência de classes do `Button`; corrigido com `max-sm:hidden`.
  A saída mobile permanece somente no topo, como na referência Android.

Capturas de evidência ficam fora do repositório: `profile-mobile-dark-final.jpg`
e `profile-photo-mobile-dark-final.jpg`, no diretório de artefatos da sessão.
A comparação das outras telas continua estática. Foto ausente, falhas de upload,
nomes excepcionalmente longos, fonte ampliada, dispositivo físico e instalação
PWA não foram exercitados nesta conferência; os fluxos de dados existentes foram
preservados. Não se certifica paridade completa de todos esses estados.
