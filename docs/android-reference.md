# Referência visual Android

O web é a versão para navegador do SobraAí Android. A identidade e os fluxos devem ser reconhecíveis nas duas plataformas, com adaptação de espaço para desktop.

- Repositório: https://github.com/Kaiquii/Sobra-Ai-Android.git
- Projeto local: `C:\Users\kaiqu\Documents\App-Financeiro`
- Referências consultadas: `core/designsystem/theme/Color.kt`, `StandardBottomBar.kt` e as telas de início, despesas, relatórios, perfil e autenticação.

## Direção visual

### Paridade obrigatória no celular

Exceção: a tela de login mantém o layout web anterior à adaptação Android, tanto no celular quanto no desktop. Não simplificar ou adaptar esse layout. `LoginShell` preserva essa composição separadamente do `AuthShell` usado em cadastro e recuperação de senha; autenticação e destino após entrar continuam inalterados.

A versão mobile do site deve reproduzir a interface e os fluxos do Android, não apenas lembrar suas cores. Antes de alterar uma tela, consultar sua implementação Android e comparar hierarquia, ordem dos campos, navegação, controles e comportamento de abertura. Desktop pode ter uma composição própria; celular não deve herdar um modal desktop reduzido.

- Celular abre diretamente no Início após autenticar. A tela Home de escolha de áreas é exclusiva do desktop; acesso direto a ela no celular também deve seguir para o Início.
- Adicionar e editar despesa ocupam a tela inteira no celular, com cabeçalho próprio, fechamento, valor em destaque e formulário rolável. Respeitar teclado e áreas seguras sem cortar campos ou ações.
- Exportação acompanha `ReportExportSheet.kt`: painel inferior, tipo em largura total, formatos lado a lado, projeção por slider e opções condicionais.
- Compromissos Parcelados usa apenas o voltar do cabeçalho no celular, sem repetir título, voltar ou botão de atualização no conteúdo.
- Somente no celular, o Início acompanha o Android atual: resumo em cards pareados, despesas do mês com filtros e detalhes e controle compartilhado para ocultar valores. Preservar a apresentação do bloco de despesas adiantadas na tela de Despesas.
- Na seção de despesas do Início, seguir `DespesasSection.kt`, `FilterOptionItem.kt` e a variante compacta de `ExpenseCard.kt`: filtros em pílulas sem seta, seleção por painel inferior, chips individuais para limpar filtros, data curta e badge colorido de origem. O cartão compacto e o painel de seleção devem ser compartilhados.

- Preservar a paleta existente do web. A adaptação deve reproduzir a estrutura e os fluxos do Android; não fazer uma troca global de cores.
- Verde para valores positivos, vermelho para gastos e alertas, violeta para saldos por origem e Premium; administrador mantém destaque dourado.
- No celular, navegação inferior com Início, Despesas, Relatórios e Perfil, com criação de despesa no centro.
- No celular, Início e visão mensal usam o resumo financeiro do Android, seguido da lista de despesas. No desktop, preservar a composição anterior, sem a lista de despesas. O botão de privacidade oculta os valores e bloqueia as ações de renda enquanto estiver ativo. Exibir o botão somente nas telas de resumo, despesas, relatórios e rendas; não exibir na Home, no Perfil ou em suas subtelas.
- Despesas no celular: busca no topo, abas de tipos, filtros adicionais recolhíveis e cartões com ícone, descrição e valor na mesma linha.
- Formulários de autenticação diretamente acessíveis e modais limitados à altura disponível da tela.
- Na visão mensal do celular, o seletor segue `MonthSelector.kt`: largura total, centro alinhado ao meio da tela, calendário acima do mês por extenso e sublinhado azul de 40 por 2. As setas e os meses vizinhos ficam nas extremidades, sem cápsula. No desktop, preservar o seletor original do web.
- No desktop, preservar largura de leitura, espaço para filtros e acesso ao menu lateral.

## Elemento preservado

O bloco “Impactam o planejamento deste mês” mantém sua organização, conteúdo, datas e comportamento. Ajustes de identidade podem afetar cores, mas não devem transformar sua apresentação ou regras financeiras.

## Validação

Comparar celular e desktop, temas claro e escuro, estados vazios e com dados. Nenhuma mudança visual deve alterar contratos de integração ou regras de cálculo.
