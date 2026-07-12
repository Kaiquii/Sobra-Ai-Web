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

- Rendas e despesas sao carregadas e filtradas pelo periodo selecionado na interface.
- Fontes de pagamento aceitas incluem salario, adiantamento e renda extra, considerando variacoes de acentuacao retornadas pelo back-end.
- Despesas unicas, parceladas e fixas tem regras distintas para atualizacao e exclusao de recorrencias futuras.
- Categorias sao gerenciadas separadamente e usadas para classificacao local na interface.
- Observacoes de despesas sao opcionais e limitadas a 500 caracteres.

## Relatorios

- A area de relatorios apresenta resumo mensal, gastos por categoria, comparacao entre periodos, tendencia anual e compromissos parcelados.
- Filtros de periodo que dependem de dados ja carregados devem ser aplicados localmente quando indicado pela feature.
- Aumento de receitas e melhora de saldo usam tom positivo; aumento de despesas usa tom de alerta.

## Assistente

- O historico da conversa e mantido pelo back-end; o front conserva apenas o identificador da conversa ativa enquanto ela estiver em uso.
- Quando a resposta indicar tempo de espera, a interface pode desabilitar temporariamente o campo de mensagem e mostrar a contagem restante.
- Confirmacoes de acoes identificadas pelo assistente devem ser exibidas como parte da conversa, respeitando a resposta do back-end.
