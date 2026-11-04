# Preferências de VA e VR no saldo disponível

## Escopo e localização

Orientação mais recente do usuário no Web, em 04/11/2026: **Saldo disponível é
a última seção de Configurações de Renda, após Renda Extra, em todas as larguras**.
Não inserir o bloco entre os benefícios e Renda Extra. A tela mantém uma
explicação resumida; um botão de ajuda com ícone e nome acessível abre o modal
com a explicação completa, o exemplo e as instruções para ativar e desativar.
Preservar componentes, fonte, paleta Web e os padrões próprios de cada largura.
Não acrescentar atalhos nem reorganizar a visão mensal por consequência.

### Histórico da localização

O pedido anterior no Android definiu Configurações de Renda, junto de VA e VR.
Essa escolha da tela foi mantida; a posição final no Web foi alterada pelo
pedido mais recente acima. Não presumir que a implementação Android já mudou.

A proposta visual Android consultada está em
`C:/Users/kaiqu/Documents/App-Financeiro/.harness/interface-padrao/trabalhos/preferencias-saldo-va-vr/spec.md`.
O usuário aprovou a proposta v1 em 04/11/2026: “Ficou legal, deixa embaixo de VA
e VR essas opções e tem que ter um texto explicando o que essa funcionalidade
faz, está no caminho certo”. A fonte Android consultada passou a implementar o
bloco após VR e antes de Renda Extra em `ConfiguracoesRendaScreen.kt`, com a
legenda do Início em `AvailableBalancePresentation.kt`. Esse registro preserva
a evidência da primeira implementação; a posição intermediária foi substituída
na Web pela orientação posterior. A aprovação não autoriza copiar fontes, cores
ou formatos mobile para desktop.

Na primeira adaptação Web, o celular colocou as preferências entre VR e Renda
Extra, enquanto o desktop já usava o fim da grade. A ordem atual do celular
passa a ser Salário, Adiantamento, VA, VR, Renda Extra e Saldo disponível.
O desktop conserva a ordem e os formulários de renda anteriores, também com
Saldo disponível ao final. Chaves estáveis mantêm os rascunhos ao mudar de
largura. O `Switch` compartilhado aceita `id` para associação explícita da linha
inteira ao controle nativo.

Após o usuário apontar que a explicação estava vaga, o texto passou a descrever
ativar e desativar, citar o Total Geral Disponível, esclarecer que os registros
e cartões não mudam e mostrar VA de R$ 725 com R$ 600 gastos: somente R$ 125
restantes ficam fora do disponível. O mesmo pedido foi encaminhado ao chat do
Android por autorização explícita do usuário. O novo pedido de colocar a seção
ao final e mover a explicação para ajuda em modal foi feito no Web; não se
registra aqui um novo encaminhamento ou alteração já realizada no Android.

### Ajuda sobre Saldo disponível

O botão de ajuda abre um modal centralizado com `ModalPanel`, com dimensões,
ações e comportamento responsivo próprios da Web para mobile e desktop.
Preservar foco, fechamento, retorno ao botão, rolagem e áreas seguras existentes.
O modal é explicativo e não grava ou altera as preferências ao abrir ou fechar.

O conteúdo deve esclarecer que ativar a exclusão de VA ou VR retira somente o
restante daquela fonte do Total Geral Disponível; desativar volta a incluí-lo.
As opções são independentes e valem para todos os meses. Manter o exemplo de
VA de R$ 725 com R$ 600 gastos, restando R$ 125, e explicar que cartões, rendas,
despesas e registros permanecem iguais. O texto completo fica na ajuda; a seção
na página permanece resumida.

## Origem do contrato

O backend registra publicação em **04/11/2026 às 14:47 de São Paulo**, fonte
`ad3d2d8`, schema **10**. Essa informação é evidência relatada pelo projeto de
origem, não uma nova publicação ou validação de produção feita pelo cliente Web.

Fontes consultadas no projeto local
`C:/Users/kaiqu/Documents/App-Financeiro-Back-End`:

- `docs/handoffs/preferencias-saldo-va-vr.md`.
- `docs/preferencias-saldo-va-vr.md`.
- `docs/publicacao-preferencias-saldo-va-vr.md`.
- `internal/users/balance_preferences.go` e `internal/reports/handler.go`, apenas
  para confirmar o comportamento declarado.

Detalhes de transporte permanecem no código da feature; este documento registra
apenas comportamento funcional. Não executar alterações de backend, migrations,
publicação, inferências reais ou gravações em contas reais para validar a Web.

## Comportamento funcional

- Existem duas preferências independentes: excluir o restante de VA e excluir o
  restante de VR do disponível geral. Ambas começam desativadas.
- A escolha pertence à conta e vale para todos os meses, anteriores e futuros,
  e para seus dispositivos. Não é uma preferência mensal ou somente local.
- Conta sem registro recebe os dois valores desativados na leitura, sem uma
  gravação automática. Não inferir escolhas a partir dos benefícios cadastrados.
- Salvar uma opção envia apenas a opção alterada; desativá-la explicitamente
  deve ser preservado. A confirmação devolve as duas escolhas atuais.
- A exclusão usa o **restante** do benefício, inclusive se negativo. Não retirar
  todo o crédito, zerar negativos nem descontar novamente no cliente.
- O disponível exibido vem de `total_geral_disponivel`, calculado pelo backend.
  As flags aplicadas ao resumo acompanham esse mesmo snapshot.
- Os cartões de VA/VR continuam mostrando seus créditos, gastos e restantes.
  Total Recebido, Total Gasto, percentuais, gráficos, categorias, comparativos,
  totais anuais e exportações mantêm os valores integrais existentes.
- Uma legenda deve explicar exclusões ativas junto ao disponível. Com exclusão,
  ele pode diferir de recebido menos gasto. A legenda deve usar as escolhas do
  mesmo resumo que forneceu o valor, inclusive durante recarregamento.

Exemplo de referência: salário de R$ 1.000 com gasto de R$ 200, VA de R$ 725 com
gasto de R$ 600 e VR de R$ 300 com gasto de R$ 100.

| Excluir VA | Excluir VR | Disponível informado pelo backend |
| --- | --- | ---: |
| Não | Não | R$ 1.125,00 |
| Sim | Não | R$ 1.000,00 |
| Não | Sim | R$ 925,00 |
| Sim | Sim | R$ 800,00 |

O restante de VA permanece R$ 125 e o de VR permanece R$ 200 nos quatro casos.
Esses exemplos são critérios de aceitação; a Web não implementa a fórmula.

## Estado, concorrência e sessão

- Preferências ficam em store de memória da feature de rendas, sem persistência
  paralela no navegador. Antes de leitura confirmada, o estado é desconhecido.
- Desabilitar alterações enquanto carrega, salva, apresenta falha de leitura ou
  precisa reconciliar uma gravação incerta. Falha de leitura não vira dois
  controles confirmadamente desligados e não pode disparar gravação de defaults.
- Reutilizar a leitura em andamento quando houver chamadas concorrentes e
  revalidar ao entrar novamente na tela. Não enviar alteração para valor já
  confirmado nem permitir gravações simultâneas dos dois controles.
- Aplicar o estado completo apenas após confirmação válida. Uma preferência
  nunca pode apagar a outra por enviar um snapshot antigo como gravação completa.
- Resposta perdida, falha ou confirmação malformada de gravação exige uma única
  leitura de reconciliação, sem repetir automaticamente a gravação. Conservar
  a mensagem de falha; leitura bem-sucedida pode revelar que a escolha foi salva.
- Se a reconciliação falhar, manter bloqueio e tentativa de leitura explícita.
  Não declarar sucesso nem afirmar que a alteração não ocorreu.
- Isolar operações e resultados por token, época de sessão e geração. Logout ou
  substituição da conta limpa preferências, erros e bloqueios. Resultado tardio
  ou falha de autenticação da conta anterior não pode alterar a sessão atual.
- Hidratação ainda não resolvida não equivale a logout. Não limpar uma sessão
  válida apenas por observar um estado transitório de restauração.
- Revisões de leitura alterada, confirmação e reconciliação invalidam o resumo.
  Troca de mês ou sessão descarta respostas antigas; preservar dados durante
  atualização só é permitido para o mesmo período e conta.
- Revalidar ao entrar na tela, mudar a referência ou confirmar uma alteração.
  As preferências também são lidas ao entrar na sua tela e após troca de sessão.
  Após relato de pulos de rolagem, foram removidas as recargas por foco e
  visibilidade dessa implementação: Alt+Tab não inicia consultas em Rendas,
  Resumo ou Relatórios. A configuração é compartilhada pelo servidor; uma
  escolha feita em outro dispositivo aparece na próxima leitura, sem promessa
  de atualização instantânea numa tela que permaneceu aberta.
- Atualização com preferências já conhecidas conserva os controles e a geometria
  do bloco, sem inserir mensagem ou spinners no fluxo. Carregamento inicial não
  simula valores desligados. Relatórios conservam o snapshot do mesmo mês e
  sessão durante atualização, inclusive em falha, com erro persistente; novo
  período ou conta não reutilizam esse snapshot.
- Flags ausentes de um resumo legado correspondem a desativadas, sem escrita.
  Flags presentes com tipo inválido são erro de contrato. A leitura específica
  das preferências exige os dois booleanos e não aceita defaults silenciosos.

## Matriz de aceitação

| Cenário | Resultado esperado |
| --- | --- |
| Posição e ajuda | Saldo disponível é a última seção após Renda Extra em mobile e desktop; resumo curto e botão acessível abrem explicação completa em modal |
| Abrir e fechar a ajuda | Nenhuma alteração financeira; foco retorna ao botão e o conteúdo cabe na área disponível |
| Conta nova ou antiga sem escolha | Ambos desligados após leitura; nenhuma gravação automática |
| Quatro combinações | Disponível corresponde ao backend; cartões e totais integrais preservados |
| Desligar somente uma opção | Valor falso explícito confirmado e outra opção preservada |
| VA de R$ 725 com gasto de R$ 600 | Restante de R$ 125 preservado no cartão e excluído somente do disponível quando escolhido |
| Benefício zerado, totalmente gasto ou negativo | Sem clamp, desconto duplo ou exclusão do crédito inteiro |
| Pagamento dividido e adiantamento | Fontes e período efetivo preservados; servidor calcula o disponível |
| Mudar mês, sair e entrar, abrir outro dispositivo | Escolhas da conta conservadas e resumo recarregado |
| Cliques rápidos ou nos dois controles | Somente uma gravação em andamento; sem sobrescrever a outra escolha |
| Falha de leitura | Erro visível, tentativa explícita e controles sem gravação de defaults |
| Falha ou confirmação perdida de gravação | Uma leitura de reconciliação, sem reenvio; ausência de falso sucesso |
| Falha de reconciliação | Bloqueio até nova leitura válida; valores confirmados e erro conservados |
| Conta trocada durante requisição | Nenhuma resposta ou erro antigo afeta a nova conta |
| Resumo ou preferência alterada em outro dispositivo | Atualização na próxima entrada ou leitura explícita; sem promessa de push ou recarga por Alt+Tab |
| Claro/escuro, mobile e desktop | Paleta/fonte Web preservadas, sem animação de tema, corte ou overflow |

## Verificação e pendências

A correção final de posição e ajuda foi conferida em 04/11/2026: a seção é o
último elemento da grade, imediatamente depois de Renda Extra, no mobile e no
desktop. A página mostra uma única frase curta; os detalhes e o exemplo ficam
somente no modal aberto pelo botão de ajuda. Abrir ou fechar não consulta nem
grava preferências, conforme teste da interação com a fronteira simulada.

O navegador integrado confirmou o modal desktop de 448 px, o mobile em
390 × 844 nos dois temas e a viewport estreita de 320 × 640, com rolagem
interna quando necessária e sem corte horizontal. Foram exercitados Entendi,
Escape e voltar, com o foco retornando ao botão de ajuda. As duas preferências
reais continuaram desligadas; nenhuma delas foi alterada na conferência.

Passaram os 132 testes da suíte, lint e o build de produção com Webpack,
incluindo TypeScript e 22 páginas. O build padrão continua encontrando a falha
do subprocesso CSS do Turbopack. A revisão independente não encontrou novos
bloqueadores. As capturas finais são `balance-last-section-mobile-dark.jpg`,
`balance-help-mobile-dark.jpg`, `balance-help-mobile-light.jpg` e
`balance-help-desktop-light.jpg`, no diretório de artefatos da sessão.

Os registros seguintes incluem a validação anterior dos controles e a
investigação dos pulos de rolagem; não certificam o Alt+Tab real do sistema.

Os testes da feature usam API simulada para as quatro combinações, escrita
parcial, desativação explícita, erros, reconciliação, concorrência, troca de
sessão e de período, compatibilidade de flags, legendas e privacidade. Incluem
regressões para a árvore estável durante leitura com dados conhecidos, ausência
de consultas por foco/visibilidade e preservação do snapshot de Relatórios na
atualização do mesmo período, inclusive em falha. A revisão independente dos
controles foi concluída; o carregamento não remove o botão focado e uma linha
tem um único controle associado explicitamente por `id`.

No navegador Chromium integrado foram conferidos os controles em 1440 × 1000,
390 × 844 e 320 × 720, nos temas claro e escuro, com fonte Web herdada, alvos de
48 px e sem excesso horizontal. Um rascunho temporário foi preservado ao mudar
de largura e depois restaurado ao valor anterior, sem salvar. As preferências
reais foram apenas consultadas: os dois controles estavam desligados e não
foram alterados. Falhas e gravações foram testadas somente com dados simulados.

Depois do relato de pulos, foram removidos os gatilhos de consulta por foco e
visibilidade de Rendas, Resumo e Relatórios. A alternância de apresentação do
navegador integrado manteve `scrollY`, altura da página e altura do bloco
constantes em três ciclos. Esse recurso manteve `visibilityState=visible` e
não certifica o Alt+Tab real do sistema operacional no navegador do usuário.

`ai:check` executou testes e lint, mas encontrou a falha de criação do subprocesso
de CSS do Turbopack. O build alternativo com Webpack passou, incluindo TypeScript
e a geração das 22 páginas. O compilador padrão não foi alterado. A contagem
final da suíte e verificações posteriores ficam no relato da entrega.

As capturas e medições ficam no diretório de artefatos da sessão, fora do
repositório. Fonte ampliada, dispositivo físico, PWA instalado, propagação em
dois dispositivos reais e retorno de foco após uma gravação real não foram
certificados nesta conferência.

Somente o usuário inicia ou reinicia o servidor. Testes do cliente devem usar
dados simulados para falhas, concorrência e sessão, sem gravar em contas reais.
Build e inspeção estática não certificam paridade visual nem experiência em
dispositivo físico/PWA instalado. A publicação relatada do backend não substitui
a verificação separada da Web.
