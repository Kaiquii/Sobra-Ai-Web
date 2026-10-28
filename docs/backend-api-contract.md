# Orientacoes de Integracao

Este documento registra regras de comportamento entre o front-end e o back-end sem expor caminhos, metodos HTTP, corpos de requisicao ou detalhes operacionais da API. As definicoes tecnicas de transporte devem permanecer no codigo da feature correspondente e em documentacao privada.

## Seguranca e sessao

- O cliente Axios aplica a autenticacao da sessao nas requisicoes protegidas.
- Ao receber acesso nao autorizado ou acesso revogado, o front deve limpar a sessao local e conduzir o usuario de volta ao fluxo de autenticacao, exibindo a mensagem retornada quando houver uma.
- Erros devem ser tratados pela camada de API/store, sem expor detalhes tecnicos desnecessarios na interface.

## Autenticacao

- O cadastro acontece em duas etapas: solicitacao de confirmacao por e-mail e confirmacao por codigo de seis digitos.
- Os dados temporarios do cadastro, especialmente a senha, devem existir apenas em memoria no formulario e nunca ser persistidos no navegador.
- O codigo deve ser tratado como texto para preservar zeros iniciais.
- O reenvio deve ter bloqueio visual temporario no cliente; o back-end continua sendo a autoridade para limites e expiracao.
- Quando o e-mail ja possuir cadastro, a interface deve sugerir o login.
- A recuperacao de senha tambem usa codigo temporario e deve bloquear reenvios brevemente quando houver limite de solicitacoes.
- O login normal permanece independente desse fluxo de confirmacao, mas pode receber bloqueio temporario apos tentativas repetidas. Nesse caso, manter os campos editaveis, exibir a mensagem recebida e bloquear apenas a nova tentativa localmente por alguns minutos.

## Perfil

- Foto de perfil pode ser enviada como arquivo usando `multipart/form-data`; o navegador deve definir o cabecalho multipart.
- A URL da foto pode ser relativa ou absoluta. URLs absolutas devem ser usadas diretamente; URLs relativas devem ser resolvidas pela base configurada da API.
- Sem foto, mostrar o fallback com a inicial do usuario.

## Rendas e despesas

- A referência Android 1.4.5 para VA/VR e os critérios de aceitação estão em `docs/android-parity-harness.md`. As diferenças ainda não implementadas no web estão inventariadas nesse guia; sua presença não confirma suporte já entregue. Preservar os contratos de transporte no código e na documentação privada.

- Rendas e despesas sao carregadas e filtradas pelo periodo selecionado na interface.
- Fontes de pagamento aceitas incluem salario, adiantamento e renda extra, considerando variacoes de acentuacao retornadas pelo back-end.
- Uma despesa pode distribuir seu valor entre uma ou mais fontes de pagamento. Quando a lista de divisoes estiver disponivel, ela prevalece sobre a fonte unica de compatibilidade; o total da despesa continua sendo unico e nao deve ser duplicado no front-end.
- Despesas unicas, parceladas e fixas tem regras distintas para atualizacao e exclusao de recorrencias futuras.
- Despesas unicas e parcelas podem ser adiantadas no planejamento financeiro sem serem marcadas como pagas. O adiantamento preserva a data prevista e o status de pagamento, mas faz a despesa impactar o periodo financeiro da nova data.
- A agenda de despesas usa a data prevista original. Visões de planejamento usam o periodo financeiro efetivo, que considera adiantamentos e desfazimentos.
- Despesas fixas nao podem ser adiantadas. Em despesas parceladas, o adiantamento se aplica somente a parcela selecionada.
- Categorias sao gerenciadas separadamente e usadas para classificacao local na interface.
- Observacoes de despesas sao opcionais e limitadas a 500 caracteres.

## Patrimônio

- Saldos manuais substituem os anteriores e ficam separados das finanças mensais. Totais vêm do servidor; valores usam centavos exatos e zero é válido.
- Categorias de investimentos têm catálogo próprio e identidade do servidor. Padrões são protegidos; conflito em uso conserva investimentos. Compatibilidade textual exige indisponibilidade específica do catálogo, nunca erro de rede/autorização.
- Resposta de gravação perdida exige reconciliação por consulta sem repetir a gravação; bloquear novas gravações durante consulta/erro. Cache e consultas em andamento são isolados por sessão. Critérios completos: `docs/patrimonio.md`.

## Relatórios

- A area de relatorios apresenta resumo mensal, gastos por categoria, comparacao entre periodos, tendencia anual e compromissos parcelados.
- Filtros de periodo que dependem de dados ja carregados devem ser aplicados localmente quando indicado pela feature.
- Aumento de receitas e melhora de saldo usam tom positivo; aumento de despesas usa tom de alerta.

## Assistente

- O usuário interage com o Assistente SobraAi. O backend escolhe e troca a IA; o cliente não consulta catálogo, exibe modelos ou redefine preferências antigas. Não adicionar SDK ou chave OpenRouter ao navegador/PWA.
- O histórico e o contexto são mantidos pelo backend. O cliente conserva a conversa ativa e as mensagens de apresentação da sessão; trocar a IA internamente não cria uma nova conversa nem repete ações.
- Preservar código, mensagem e atraso positivo dos erros do Assistente, inclusive em respostas controladas. Códigos atuais são neutros quanto ao provedor; manter a compatibilidade histórica. Cooldown exige erro reconhecido e atraso positivo informado, sem prazo inventado ou contorno por nova conversa.
- O rascunho só é limpo quando o envio é aceito. Bloquear envios e mudanças de conversa concorrentes, preservar reentrada durante hidratação e descartar estado/respostas antigas ao encerrar ou trocar a sessão.
- Rede, timeout ou resposta perdida não autorizam reenvio automático: a mensagem ou uma ação financeira pode já ter sido recebida. Exibir a falha e permitir conferir o histórico antes de nova tentativa manual.
- Confirmações financeiras permanecem na conversa e respeitam a resposta do backend. Critérios, origem e estado de publicação reportado pelo servidor: [assistant-automatic-routing.md](assistant-automatic-routing.md).
