# Referência visual Android

O web é a versão para navegador do SobraAí Android. A identidade e os fluxos devem ser reconhecíveis nas duas plataformas, com adaptação de espaço para desktop.

Atualização em 26/10/2026: Patrimônio segue Android 1.4.8 (`136a9a5`) no
celular/PWA, com exceção da paleta oficial Web. Essa autorização acrescenta a
feature ao escopo anterior de Dropdowns/VA/VR; não autoriza redesenhar outras
telas. A orientação posterior do usuário em 26/10/2026 preserva também a fonte
padrão Web em todas as larguras, inclusive no celular/PWA e em seus modais;
não copiar Roboto. Critérios, referências, testes e pendências:
[patrimonio.md](patrimonio.md).

- Repositório: https://github.com/Kaiquii/Sobra-Ai-Android.git
- Projeto local: `C:\Users\kaiqu\StudioProjects\App-Financeiro`
- Referência aprovada atual: Android 1.4.5, versionCode 145, commit `78a86c6`, conforme guia recebido em 25/10/2026. Critérios completos, fontes atuais e diferenças web estão em [android-parity-harness.md](android-parity-harness.md).
- Referências consultadas: `core/designsystem/theme/Color.kt`, `StandardBottomBar.kt` e as telas de início, despesas, relatórios, perfil e autenticação.

## Direção visual

### Padrão próprio do desktop

Orientação permanente do usuário em 26/10/2026: dropdown desktop é a lista antiga
junto ao campo, sem modal; formulários desktop usam os modais centralizados e
ações do padrão Web, sem alça ou painel inferior. A semelhança máxima com Android
é objetivo do celular/PWA. Reutilizar dados e lógica não autoriza unificar essas
apresentações. Critérios obrigatórios: `rules.md` e `android-parity-harness.md`.

### Paridade obrigatória no celular

Exceção: a tela de login mantém o layout web anterior à adaptação Android, tanto no celular quanto no desktop. Não simplificar ou adaptar esse layout. `LoginShell` preserva essa composição separadamente do `AuthShell` usado em cadastro e recuperação de senha; autenticação e destino após entrar continuam inalterados.

A versão mobile do site deve reproduzir a interface e os fluxos do Android, não apenas lembrar suas cores. Antes de alterar uma tela, consultar sua implementação Android e comparar hierarquia, ordem dos campos, navegação, controles e comportamento de abertura. Desktop pode ter uma composição própria; celular não deve herdar um modal desktop reduzido.

- Celular abre diretamente no Início após autenticar. A tela Home de escolha de áreas é exclusiva do desktop; acesso direto a ela no celular também deve seguir para o Início.
- Adicionar e editar despesa ocupam a tela inteira no celular, com cabeçalho próprio, fechamento, valor em destaque e formulário rolável. Respeitar teclado e áreas seguras sem cortar campos ou ações.
- Exportação acompanha `ReportExportSheet.kt`: painel inferior, tipo em largura total, formatos lado a lado, projeção por slider e opções condicionais.
- Compromissos Parcelados usa apenas o voltar do cabeçalho no celular, sem repetir título, voltar ou botão de atualização no conteúdo.
- Somente no celular, o Início acompanha o Android atual: resumo em cards pareados, despesas do mês com filtros e detalhes e controle compartilhado para ocultar valores. Preservar a apresentação do bloco de despesas adiantadas na tela de Despesas.
- Na seção de despesas do Início, seguir `DespesasSection.kt`, `FilterOptionItem.kt` e a variante compacta de `ExpenseCard.kt`: filtros em pílulas sem seta, seleção por painel inferior, chips individuais para limpar filtros, data curta e badge colorido de origem. O cartão compacto não possui ícone de categoria à esquerda. O cartão compacto e o painel de seleção devem ser compartilhados.

- A orientação mais recente do usuário em 25/10/2026 limita esta adaptação aos Dropdowns e a VA/VR. Preservar as cores e a fonte originais do web também no celular: fundo azul-escuro Slate, cards Slate e destaques existentes. Não copiar a paleta neutra ou a fonte do Android, nem redesenhar outras telas como consequência desta adaptação. Login mantém o layout web próprio.
- Verde para valores positivos, vermelho para gastos e alertas, violeta para saldos por origem e Premium; administrador mantém destaque dourado.
- No celular, navegação inferior com Início, Despesas, Relatórios e Perfil, com criação de despesa no centro.
- No celular, Início e visão mensal usam o resumo financeiro do Android, seguido da lista de despesas. No desktop, os três totais ficam no topo e as cinco fontes em colunas, cada uma com renda, restante e gasto. Aumentar com moderação, preservar a tipografia e evitar rolagem desnecessária; não esticar os cards até ocupar toda a altura. O botão de privacidade oculta os valores e bloqueia as ações de renda enquanto estiver ativo. Exibir o botão somente nas telas de resumo, despesas, relatórios e rendas; não exibir na Home, no Perfil ou em suas subtelas.
- Despesas no celular acompanha `ExpenseListControls.kt`: seletor de mês, card azul com total do planejamento filtrado e quantidade de lançamentos, busca com botão de filtros e pílulas de tipos com rolagem horizontal. O painel inferior edita categoria, origem e status em rascunho; somente “Aplicar filtros” confirma, fechar descarta e “Limpar filtros” limpa o rascunho. As categorias disponíveis são as presentes nas despesas do mês.
- Os cartões detalhados de despesas no celular não possuem ícone lateral: descrição, categoria, tipo e data ficam à esquerda; ações, valor e origem ficam à direita. Preservar o acesso às ações de adiantamento existentes no web.
- Em celular e desktop, `ExpenseTypeStyle.kt` orienta as cores de únicas (azul), parceladas (violeta) e fixas (verde-petróleo), com tons próprios para cada tema. O valor de cada despesa usa a cor principal do texto e sinal separado da moeda, como `- R$ 100,00`. O total é positivo e seu rótulo acompanha o filtro de tipo, como no Android. A composição do desktop permanece preservada.
- Formulários de autenticação diretamente acessíveis e modais limitados à altura disponível da tela.
- Na visão mensal do celular, o seletor segue `MonthSelector.kt`: largura total, centro alinhado ao meio da tela, calendário acima do mês por extenso e sublinhado azul de 40 por 2. As setas e os meses vizinhos ficam nas extremidades, sem cápsula. No desktop, preservar o seletor original do web.
- No desktop, preservar largura de leitura, espaço para filtros e acesso ao menu lateral.

## Elemento preservado

O bloco “Impactam o planejamento deste mês” mantém sua organização, conteúdo, datas e comportamento. Ajustes de identidade podem afetar cores, mas não devem transformar sua apresentação ou regras financeiras.

## Validação

Comparar celular e desktop, temas claro e escuro, estados vazios e com dados. Nenhuma mudança visual deve alterar contratos de integração ou regras de cálculo.
