# Assistente com roteamento automático

## Decisão e escopo

Handoff Android/iOS recebido em 28/10/2026: o usuário interage com o
**Assistente SobraAi**. Escolher e substituir modelos é responsabilidade do
backend. A decisão final substitui a proposta anterior de seleção manual.

O chat não apresenta seletor, nome de modelo, selo “Recomendado”, diálogo de
informações ou logos de provedores. A abertura e o envio não dependem de
catálogo, preferência ou configuração de IA. O cliente não consulta nem redefine
preferências antigas. A tarefa de logos foi encerrada; não criar catálogo manual,
endereços deduzidos, buscas de marcas ou infraestrutura para essas imagens.

Esta adaptação é local. Não autoriza commit, push, publicação, alteração de
versão ou deploy da Web, nem mudanças no backend.

## Responsabilidade do servidor

O navegador/PWA continua usando exclusivamente o backend SobraAi e a sessão
existente. Não adicionar SDK, chave ou integração direta de OpenRouter ao
cliente. O contexto e o histórico pertencem ao servidor; o cliente mantém a
conversa ativa e não reconstrói o histórico para escolher ou trocar a IA.
Os detalhes de transporte permanecem no código da feature.

Segundo a confirmação definitiva enviada pelo backend, o roteamento automático
foi publicado em **28/10/2026 às 15:36:50, em São Paulo**, com os commits
`08a611e` (implementação) e `dbeba5f` (registro da publicação) enviados à `main`
do servidor. Essa confirmação substitui os avisos anteriores de implementação
apenas local. O commit anterior `db24565` não comprova essa evolução posterior.

O backend informou que o fluxo automático ignora preferências manuais antigas
sem apagar seus registros ou alterar suas datas. Também informou validações de
continuidade da conversa, ausência de mensagens e ações duplicadas, isolamento
de contas, integração PostgreSQL e smoke autenticado em produção. São evidências
reportadas pelo backend; esta adaptação Web não repetiu essa auditoria e elas
não certificam o navegador, o PWA ou um dispositivo móvel.

Referências de origem, consultadas somente como documentação:

- `C:/Users/kaiqu/Documents/App-Financeiro/docs/assistant-models.md`.
- `C:/Users/kaiqu/Documents/App-Financeiro-Back-End/docs/publicacao-roteamento-automatico-ia.md`.
- `AssistantScreen.kt`, `AssistantViewModel.kt`, `AssistantErrors.kt` e os testes
  de roteamento automático e sessão no projeto Android/iOS indicado no handoff.

A rotação depende dos sinais reais de limite e indisponibilidade recebidos pelo
servidor. Limites globais e pessoais continuam válidos. Não prometer uso
ilimitado ou previsão confiável de esgotamento por modelo. Trocar a IA não
reinicia cotas, não solicita uma nova conversa e não autoriza repetir uma ação.

## Estado, rascunho e concorrência

- Preservar histórico, nova conversa, exclusão e confirmações financeiras. A
  troca interna de IA mantém a identidade da conversa, suas mensagens e contexto.
- Conservar o rascunho em memória ao fechar e reabrir o chat na mesma sessão.
  Limpar o texto somente quando o envio for aceito. Recusas por cota, envio ou
  leitura em andamento não podem apagar a mensagem digitada.
- Bloquear envio duplicado e alterações concorrentes da conversa durante envio,
  leitura de mensagens ou exclusão. Atualizar o histórico não deve criar uma
  dependência de configuração de modelo para enviar mensagens.
- O estado inicial de autenticação ainda não hidratado não é uma notificação de
  logout. Reentrar na tela não pode limpar uma conversa retida por essa condição.
- Logout e troca de conta descartam conversa, mensagens, histórico, rascunho e
  bloqueios da sessão anterior. Respostas atrasadas, inclusive erros de acesso,
  não podem publicar dados nem encerrar a sessão da conta nova.
- Uma resposta perdida pode corresponder a uma mensagem recebida ou ação já
  executada. Não repetir o envio automaticamente em falha de rede, timeout ou
  resposta inválida. Exibir a falha e permitir conferir o histórico antes de uma
  nova tentativa manual; não simular confirmação financeira no cliente.

## Erros e tempo de espera

Preservar o código, a mensagem recebida e o atraso positivo informado pelo
servidor, tanto em resposta controlada quanto em erro HTTP. Os avisos atuais são
neutros quanto ao provedor: códigos `assistant_*`, incluindo
`assistant_quota_exceeded`, `assistant_user_limit` e `assistant_unavailable`.
Reconhecer também `gemini_quota_exceeded` por compatibilidade histórica, sem
atribuir os avisos atuais ao Gemini.

Iniciar cooldown somente para erro reconhecido do Assistente com atraso positivo
informado pelo servidor. Ausência, zero ou valor negativo não autorizam inventar
um prazo. Um atraso em uma resposta bem-sucedida ou erro não reconhecido não
inicia esse bloqueio. Nova conversa e exclusão não podem reiniciar ou contornar
um cooldown válido da conta. Exibir a contagem restante e liberar o envio ao
final do prazo.

Sessão expirada e acesso revogado mantêm o fluxo existente de autenticação e a
mensagem da API. Falhas de transporte não devem ser apresentadas como sucesso,
nova conversa automática ou autorização para repetir uma operação financeira.

## Apresentação preservada

O celular/PWA acompanha a composição e o comportamento Android do chat,
respeitando teclado, espaçamentos e áreas seguras. O desktop mantém seu padrão
Web e pode usar a disposição adaptada ao espaço disponível. Não transportar
modais ou dimensões mobile ao desktop como consequência do roteamento.

Preservar a fonte padrão e a paleta Web nas duas apresentações, inclusive em
modais, histórico e campos. A semelhança com Android não autoriza importar sua
tipografia, alterar fontes ou adicionar transições à troca de tema. A entrada
de texto e o ditado disponível no teclado do dispositivo não devem ser
interrompidos por alterações de estado ou submissão durante composição.

O histórico carrega ao abrir o chat e é atualizado após um envio confirmado.
Conforme correção direta do usuário, não há botão permanente de atualizar ou
recarregar junto da ação de nova conversa.

## Matriz de aceitação Web

Os cenários abaixo usam dados sintéticos e transporte controlado, sem gravações
financeiras em contas reais. O registro abaixo distingue os resultados locais
das verificações que ainda dependem de dispositivos ou de integração real.

| Área | Critério |
| --- | --- |
| Abertura e envio | Entrar e enviar diretamente, sem seletor, logos, consulta de catálogo ou reconciliação de preferência; continuar a mesma conversa. |
| Conta legada | Usar o fluxo automático com preferência antiga, sem redefini-la no cliente; separar a evidência do servidor da validação Web. |
| Rascunho | Conservar texto após recusa, cooldown, falha de envio e fechamento/reabertura; limpar somente após aceitação. |
| Erros | Conferir respostas controladas e erros HTTP com código, mensagem e atraso preservados, incluindo compatibilidade histórica. |
| Cooldown | Conferir atraso positivo, ausência, zero, negativo, erro não reconhecido, contagem e tentativa de contorno por nova conversa. |
| Concorrência | Conferir envio duplo, leitura, seleção, nova conversa e exclusão concorrentes, sem duplicar mensagens ou ações. |
| Sessão | Conferir reentrada com hidratação inicial, logout, troca de conta e respostas atrasadas, inclusive falha antiga de acesso. |
| Resposta perdida | Conferir rede, timeout e resposta inválida, com falha visível e nenhum reenvio automático. |
| Histórico e ações | Conferir atualização, seleção, exclusão e confirmações financeiras mantendo a conversa e respeitando o resultado do servidor. |
| Apresentação | Conferir desktop e celular nos dois temas, teclado, composição/ditado do dispositivo, fonte ampliada, leitor de tela e PWA instalado separadamente. |

Executar os comandos de validação obrigatórios do projeto e registrar suas
limitações reais. Build e testes de estado não certificam teclado móvel real,
ditado, paridade visual ou execução do PWA instalado.

## Evidência local em 28/10/2026

Os 74 testes do projeto passaram, incluindo 22 regressões do chat e oito do
interceptor real de sessão com Axios e transporte simulado. Foram conferidos
contrato sem seleção de modelo, continuidade e confirmação financeira, erros
controlados/HTTP, cooldown, rascunho, concorrência, hidratação e respostas tardias.
A revisão financeira só avança após confirmação válida de despesa criada.

`ai:doctor`, lint e TypeScript passaram. O comando obrigatório `ai:check` foi
executado: seus testes e lint passaram, mas o build padrão encontrou novamente
a falha interna do Turbopack ao iniciar o subprocesso CSS. O build de produção
com Webpack concluiu compilação, tipos e geração das páginas; o bundler padrão
permanece inalterado. A última remoção do botão de atualizar também foi
conferida no navegador e por lint, sem alterar o fluxo do histórico.

O interceptor global também verifica a identidade da sessão capturada na
requisição, além do token atual. Sua época existe somente em memória e não é
enviada ao servidor. A regressão cobre troca de conta e logout seguido de login
que reutiliza o mesmo token: uma falha antiga não encerra a sessão nova. As
mensagens de acesso recusado da sessão atual são preservadas.

No servidor iniciado pelo usuário em `localhost:3001`, Chrome headless com
perfil temporário e respostas interceptadas conferiu desktop de 1440 × 1000 e
celular de 390 × 844 nos dois temas. Passaram fechamento/reabertura com rascunho,
envio novo/continuação, bloqueio de duplicidade, erros e contagem de espera,
falha de rede sem reenvio, seleção de histórico, exclusão cancelada e confirmada
e ausência de submissão ao pressionar Enter durante composição simulada.
O campo permaneceu visível em viewport compacta de 390 × 544, sem rolagem
horizontal ou substituição da fonte padrão. Capturas e medidas estão nos
artefatos locais da tarefa, incluindo `assistant-qa-results.json`.

Essa conferência não usou dados nem executou ações financeiras reais. A conta
com preferência antiga e a rotação em produção têm a evidência reportada pelo
backend, sem uma nova chamada autenticada real desta adaptação Web. Teclado e
ditado reais, leitor de tela, fonte ampliada e PWA instalado continuam como
verificações separadas em dispositivo.
