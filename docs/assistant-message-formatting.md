# Apresentação das respostas do Assistente

## Origem e alcance

Handoff Android/iOS recebido em 28/10/2026 para apresentar respostas do
Assistente com negrito pontual, parágrafos e listas simples. A referência do app
é o commit `6f27eb395c971c6fd25d5397f9874a50ae0f135a`, enviado à `main`, mantendo
a versão Android 1.4.9 (149).

Fontes de referência no projeto `C:/Users/kaiqu/Documents/App-Financeiro`:

- `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/assistant/AssistantMessageFormatting.kt`.
- `designSystem/src/commonMain/kotlin/com/example/appfinanceiro/feature/assistant/AssistantComponents.kt`.
- `sharedUi/src/commonTest/kotlin/br/com/sobraai/ui/AssistantMessageFormattingTest.kt`.

Segundo a confirmação e o registro de publicação do backend, o estilo foi
publicado e auditado em **28/10/2026 às 16:22:27, em São Paulo**, no commit
`d66079d`, com a imagem
`app-financeiro-api:openrouter-response-style-20261028`. Referência de origem:
`C:/Users/kaiqu/Documents/App-Financeiro-Back-End/docs/publicacao-estilo-respostas-ia.md`.
São evidências reportadas pelo backend; não constituem uma auditoria de
produção realizada por esta adaptação Web.

O servidor orienta respostas em português natural, com a informação principal
primeiro, parágrafos curtos e uso moderado de negrito, listas e emojis opcionais.
Não se presume que toda resposta de todo modelo tenha formato idêntico.
O conteúdo continua sendo uma string original. Não há integração, chamada de IA
ou mudança financeira adicional para formatar a apresentação.

O handoff inicial solicitou adaptação e validação locais. Depois da
implementação, o usuário autorizou explicitamente commit e push neste chat,
sem solicitar alteração de versão ou deploy da Web.

## Contrato de apresentação

- Aplicar o renderer somente a respostas normais do papel `assistant`. Mensagens
  do usuário e avisos reconhecidos de erro ou cota permanecem literais, inclusive
  os códigos neutros atuais e a compatibilidade histórica já documentada.
- Interpretar somente pares claros e equilibrados de `**` na mesma linha.
  Múltiplos trechos em negrito podem aparecer na mesma resposta. Delimitadores
  não atravessam linhas ou parágrafos.
- Preservar escapes, marcadores incompletos, asteriscos isolados e sequências não
  suportadas de forma legível. Não eliminar asteriscos indiscriminadamente nem
  aplicar uma interpretação completa de Markdown.
- Manter parágrafos e quebras explícitas. A normalização visual de finais de
  linha não reescreve o conteúdo mantido no estado ou no histórico.
- Reconhecer listas simples com marcadores `-` e `*` ou números seguidos de
  ponto ou parêntese de fechamento. Conservar os marcadores visíveis, a ordem e
  os valores originais, com recuo nas linhas de continuação e espaço compacto.
- Uma linha de valor negativo, como `- R$ 1.234,56`, não deve perder o sinal ao
  ser confundida com lista. Valores, separadores, sinais, anos, identificadores,
  português e emojis Unicode devem permanecer exatos. Formatação não recalcula
  moedas, não converte anos em valores nem cria dados financeiros.
- Respostas novas e mensagens carregadas do histórico usam o mesmo renderer.
  Os campos originais de mensagem e resposta permanecem intactos nos tipos,
  transporte, estado e histórico.

## Segurança e arquitetura

A transformação pertence à apresentação da feature do Assistente. Usar um
parser limitado e linear, sem expressões regulares com backtracking arriscado
em texto longo ou não confiável. Reaproveitar uma solução existente adequada,
sem adicionar uma biblioteca completa de Markdown para esse subconjunto.

Renderizar conteúdo com nós React escapados e semântica apropriada. HTML,
links, imagens e endereços com esquemas executáveis permanecem texto inerte:
não criar HTML executável, imagens remotas, navegação ativa ou anotações de
links a partir da resposta. Não usar `dangerouslySetInnerHTML`.

Preservar seleção e cópia contínuas, ordem de leitura, acessibilidade e quebra
de texto em largura estreita ou fonte ampliada. Não transformar cada trecho em
um controle separado nem introduzir ações ao selecionar texto.

Manter a fonte padrão, paleta, temas e estrutura dos balões Web. Celular/PWA
acompanha a apresentação Android; desktop mantém a disposição própria da Web.
Não importar a tipografia Android, acrescentar transições de tema ou alterar
modais e dimensões de outras telas por consequência desta formatação.

O roteamento automático, limites, sessão, identidade da conversa, histórico e
confirmações financeiras permanecem conforme
[assistant-automatic-routing.md](assistant-automatic-routing.md). Não reabrir
seleção de modelos, catálogo ou logos de provedores.

## Matriz de aceitação Web

Usar textos sintéticos e transporte controlado. A publicação reportada pelo
backend e os 12 testes nativos informados no handoff não certificam a Web.
Não repetir chamadas reais de IA apenas para reproduzir o smoke do servidor.

| Área | Critério |
| --- | --- |
| Negrito | Um ou vários trechos equilibrados por linha, preservando o texto fora dos delimitadores. |
| Degradação literal | Escapes, asteriscos isolados, pares incompletos, espaços ambíguos e sequências não suportadas sem perda de conteúdo. |
| Quebras e listas | Parágrafos, finais de linha diferentes, listas numeradas e bullets, marcadores visíveis e recuo de continuação. |
| Exatidão | Valores negativos e positivos, separadores, anos, IDs, português e emojis Unicode sem alteração. |
| Elegibilidade | Usuário, sistema e avisos reconhecidos literais; respostas normais novas e do histórico com a mesma apresentação. |
| Segurança | HTML, imagens, URLs e esquemas executáveis como texto inerte; nenhum carregamento remoto ou nó executável. |
| Conteúdo original | Nenhuma alteração dos textos mantidos em estado, transporte ou histórico. |
| Leitura e cópia | Seleção contínua, ordem de leitura, cópia, fonte ampliada e boa quebra em tela estreita. |
| Temas e plataformas | Desktop e largura mobile nos dois temas, preservando fonte, cores e estrutura dos balões. |

## Evidências e pendências

Em 28/10/2026, os 89 testes do projeto passaram, incluindo 15 novas regressões
do parser e da renderização React. Conferidos negrito, escapes e malformados,
parágrafos e finais de linha, listas e sinais monetários, anos e IDs, português
e Unicode, avisos literais por ambos os campos de código, igualdade entre
mensagens novas/histórico e preservação do conteúdo original. Textos longos e
adversariais também foram processados; a renderização escapada não criou nós
de links, imagens ou conteúdo executável.

Lint e TypeScript passaram. O comando obrigatório `ai:check` executou testes e
lint com sucesso; seu build padrão voltou a falhar no subprocesso CSS interno
do Turbopack. O build de produção com Webpack passou, incluindo tipos e geração
das páginas. A configuração do bundler padrão foi preservada.

A tentativa de conferência em `localhost:3001` não alcançou o aplicativo: o
servidor estava recusando conexões. O usuário dispensou explicitamente a
validação visual antes do commit e push. Portanto, seleção/cópia no navegador,
recuo e quebra visual em tela estreita/fonte ampliada, temas, leitor de tela e
PWA instalado permanecem sem validação visual nesta alteração. Os testes de
parser e markup não certificam esses comportamentos físicos ou visuais.

O harness Android informado no handoff passou em JVM, APK de debug, Lint,
guarda de apresentação comum e compilação de fontes/testes KLIB para iOS.
Isso não substitui build/link Xcode, validação física, navegador ou PWA.
Verificações em dispositivo e a comparação visual continuam exigindo
evidências próprias, separadas da validação automatizada registrada acima.
