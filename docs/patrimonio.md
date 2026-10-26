# Patrimônio na Web

Referência: Android **1.4.8**, versionCode **148**, commit `136a9a5`,
recebido por handoff autorizado em **26/10/2026**. Fontes consultadas em
`C:/Users/kaiqu/Documents/App-Financeiro`: `docs/patrimonio.md`, modelos,
`PatrimonyScreen.kt`, `InvestmentCategoriesDialog.kt`, `PatrimonyViewModel.kt`,
`PatrimonyAccessButton.kt`, `Typography.kt` e `Color.kt`.

## Paridade e identidade

No celular e no PWA, manter estrutura, ordem, proporções, ícones equivalentes
Lucide, espaços, estados e ações da referência. Desktop pode aproveitar duas
colunas na lista. A paleta permanece Web: fundo Slate, superfícies claras/Slate
900, azul `brand` para FGTS/ações e verde Emerald para investimentos. A fonte
padrão Web é preservada em todas as larguras, inclusive no celular/PWA, nos
painéis e no seletor de categorias. A correção direta do usuário em 26/10/2026
revoga a orientação anterior de usar Roboto: os arquivos de fonte e suas
declarações foram removidos. Não copiar a família tipográfica do Android.

Correção exigida pelo usuário em 26/10/2026: os modais desktop seguem o padrão
Web existente, centralizados, largura de formulário, campos padrão e rodapé
compacto com Cancelar/Salvar. Não têm alça nem apresentação de painel inferior.
Dropdowns desktop mantêm a lista antiga junto ao campo; no celular, conservam
o modal Android. Esses critérios também são permanentes em `rules.md` e no
harness de paridade.

No desktop, a própria página reutiliza o `Header` autenticado, `PageHeader` e
`Card`: três totais separados, bordas/raios do padrão Web e ações identificadas
como botões. O celular preserva o cabeçalho secundário e resumo Android. No
desktop, Gerenciar categorias ocupa a largura do campo, com fundo azul, borda,
ícone e hover tonal. A ação “+” cabe dentro do campo: botão de 32 px no campo
de 40 px, com hover azul discreto. Esses ajustes usam o breakpoint desktop e
preservam as dimensões e os estados mobile. A troca de tema é imediata,
protegida pelo harness.

Início tem carteira sem texto, alvo de 48 pixels, ícone de 24 e raio de 16.
A navegação mede sua área e reserva espaço para o atalho e o último conteúdo,
preservando o botão central. Perfil oferece Finanças > Patrimônio,
“FGTS e investimentos”. A tela secundária tem voltar, privacidade e indicador
compacto, sem barra inferior nem atualização permanente. Retorno limitado a
Início/Perfil conforme a origem, sem aceitar destino arbitrário.

Margens de 16, início de 8, intervalo de 12 e rodapé de 24 mais área segura.
Ordem: erro quando necessário, resumo, FGTS, Investimentos com Categorias e
Adicionar, lista/vazio e nota sobre separação do saldo mensal. Resumo com raio
20 e padding 16; cards inteiros abrem edição, com raio 16, padding 14, bloco
de ícone 32, nome/categoria, saldo e data local. Privacidade substitui números
também na árvore de acessibilidade.

Editores usam `ModalPanel`, painel inferior expandido e rolável, campos completos,
saldo com prefixo, teclado decimal, seguinte/concluir e salvar com mínimo de 52.
Excluir reutiliza `ConfirmationDialog` no modo modal nativo acima dos editores,
isolando foco e fundo. Seletor reutiliza `DropdownSelect` e busca por ID,
caixa/acentos e altura estável. Criar categoria seleciona o ID retornado sem
apagar nome/saldo. Gerenciador central limita largura a 440 e altura a 600;
cabeçalho e criar ficam fixos, somente categorias rolam. Em altura menor que
360, ocultar ajuda opcional. Pessoais precedem padrões protegidos; nomes,
IDs e quantidade não são fixados no cliente.

`ModalPanel` observa VisualViewport e foco editável, limita altura/posição e
protege descarte por alça, gesto descendente, fora, Escape e voltar
enquanto detecta teclado. X permanece explícito; salvar bloqueia fechamento.
Rotação/zoom não recriam formulário. O gesto funciona na alça e no conteúdo
com rolagem no início, fora de campos e botões. Comportamento em teclados reais
continua item de QA por navegador. Seletores e painéis compartilham pilha de retorno,
fechando o modal superior primeiro e restaurando foco.

## Dados e recuperação

`features/patrimony` contém API Axios, tipos, centavos exatos, store Zustand e
componentes. Não usa stores, categorias ou revisões de rendas/despesas;
patrimônio não participa de saldo mensal, fontes, relatórios, exportação ou IA.
Transporte técnico permanece exclusivamente no código.

- Valores são centavos inteiros em string convertidos com BigInt, inclusive
  totais acima do limite individual. Leitura preserva tokens numéricos antes
  da conversão JSON; escrita gera literal decimal validado, sem expoente,
  aspas monetárias ou cálculo flutuante. Entrada pt-BR, zero e limite de
  9.999.999.999,99; nomes aparados com limites Unicode de 120/80 caracteres.
- Totais vêm do servidor. Antes da primeira resposta, mostrar indisponível;
  atualização preserva dados; erro persistente tem retry e desatualização.
  Catálogo carrega independentemente.
- Leituras concorrentes são reutilizadas e têm cache em memória de 60 segundos
  isolado por sessão. Somente conexão transitória em leitura repete após
  500/1500/3000 ms; erro HTTP, timeout e gravação não repetem automaticamente.
- Resposta de gravação perdida exige reconciliação por consulta e aviso;
  novas gravações ficam bloqueadas durante consulta/erro. Mudança de categoria
  recarrega catálogo/patrimônio. Conflito em uso preserva investimentos e
  orienta trocar categoria. Autorização revogada/troca de conta limpa dados e
  invalida respostas atrasadas.
- Só catálogo não encontrado permite categoria legada por texto. Reentrar na
  tela/editor verifica novamente; catálogo publicado reativa IDs. Rede e
  autorização não simulam catálogo vazio/legado.

## Verificações e pendências

`scripts/patrimony.test.mjs` usa transporte e sessão simulados: centavos/limites,
totais grandes, Unicode, serialização, contratos de operações, cache/concorrência,
retry, fallback/reentrada, proteção/conflito de categorias, resposta perdida e
isolamento entre contas. Não altera dados reais.

Verificação registrada: 17 testes específicos de Patrimônio, dois testes da
proteção de tema e dois da proteção de tipografia (44 no conjunto),
lint, TypeScript e build de produção com Webpack. O comando obrigatório
`npm run ai:check` foi executado: testes/lint passaram, mas o build padrão
Turbopack falhou ao iniciar seu subprocesso CSS, inclusive fora do sandbox.
`next build --webpack` concluiu compilação, tipos e geração das páginas fora
do sandbox. Não foi alterado o bundler padrão do projeto.

O usuário iniciou o servidor na porta 3001 em 26/10/2026. A ferramenta de
navegador integrada falhou ao inicializar; a alternativa foi Chrome headless
com perfil temporário e APIs interceptadas, sem gravações reais. Conferidas
larguras 1440 e 390, temas claro/escuro, posição/dimensões do modal desktop,
ausência de alça, ações compactas, lista desktop ancorada ao campo dentro de
modal, seleção por ID e seletor modal mobile. Capturas e medidas foram salvas
nos artefatos locais da tarefa. Essa evidência não certifica API real nem PWA
instalado. Build não certifica paridade visual.
Também conferidos o cabeçalho padrão desktop, os três cards de totais, botão
de gerenciar categorias com fundo, borda, ícone e largura do campo, ausência de
animação de cor e o filtro de categorias de Despesas como lista desktop com
Escape e retorno de foco. A correção desktop foi conferida com hover nos dois
temas: “+” de 32 px contido no campo e abertura dos dois diálogos de categorias.
O alvo mobile de 48 px foi preservado. A família computada de páginas, painéis,
campos e seletores foi comparada com a do `body` em desktop e celular, sem
substituições por fontes próprias da aplicação.
Conferir em navegador/PWA: temas, larguras estreitas, fonte ampliada, safe-area,
FGTS zero, CRUD, seleção automática, proteção, conflito em uso, privacidade com
leitor de tela, voltar à origem, teclado e gestos. Verificar falhas/retry e
reconciliação com transporte controlado. Catálogo real/CDI dependem do servidor
autenticado; nenhum dado real foi criado, alterado ou removido.
