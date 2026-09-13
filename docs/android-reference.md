# Referência visual Android

O web é a versão para navegador do SobraAí Android. A identidade e os fluxos devem ser reconhecíveis nas duas plataformas, com adaptação de espaço para desktop.

- Repositório: https://github.com/Kaiquii/Sobra-Ai-Android.git
- Projeto local: `C:\Users\kaiqu\StudioProjects\App-Financeiro`
- Referências consultadas: `core/designsystem/theme/Color.kt`, `StandardBottomBar.kt` e as telas de início, despesas, relatórios, perfil e autenticação.

## Direção visual

### Paridade obrigatória no celular

Exceção: a tela de login mantém o layout web anterior à adaptação Android, tanto no celular quanto no desktop. Não simplificar ou adaptar esse layout. `LoginShell` preserva essa composição separadamente do `AuthShell` usado em cadastro e recuperação de senha; autenticação e destino após entrar continuam inalterados.

A versão mobile do site deve reproduzir a interface e os fluxos do Android, não apenas lembrar suas cores. Antes de alterar uma tela, consultar sua implementação Android e comparar hierarquia, ordem dos campos, navegação, controles e comportamento de abertura. Desktop pode ter uma composição própria; celular não deve herdar um modal desktop reduzido.

- Celular abre diretamente no Início após autenticar. A tela Home de escolha de áreas é exclusiva do desktop; acesso direto a ela no celular também deve seguir para o Início.
- Adicionar e editar despesa ocupam a tela inteira no celular, com cabeçalho próprio, fechamento, valor em destaque e formulário rolável. Respeitar teclado e áreas seguras sem cortar campos ou ações.
- Exportação acompanha `ReportExportSheet.kt`: painel inferior, tipo em largura total, formatos lado a lado, projeção por slider e opções condicionais.
- Compromissos Parcelados usa apenas o voltar do cabeçalho no celular, sem repetir título, voltar ou botão de atualização no conteúdo.
- Preservar as exceções expressamente solicitadas: composição do Início sem lista de despesas e apresentação do bloco de despesas adiantadas.

- Preservar a paleta existente do web. A adaptação deve reproduzir a estrutura e os fluxos do Android; não fazer uma troca global de cores.
- Verde para valores positivos, vermelho para gastos e alertas, violeta para saldos por origem e Premium; administrador mantém destaque dourado.
- No celular, navegação inferior com Início, Despesas, Relatórios e Perfil, com criação de despesa no centro.
- Início e visão mensal mantêm sua composição anterior, sem adicionar lista de despesas ou altura extra. A adaptação estrutural se concentra nas demais telas.
- Despesas no celular: busca no topo, abas de tipos, filtros adicionais recolhíveis e cartões com ícone, descrição e valor na mesma linha.
- Formulários de autenticação diretamente acessíveis e modais limitados à altura disponível da tela.
- No desktop, preservar largura de leitura, espaço para filtros e acesso ao menu lateral.

## Elemento preservado

O bloco “Impactam o planejamento deste mês” mantém sua organização, conteúdo, datas e comportamento. Ajustes de identidade podem afetar cores, mas não devem transformar sua apresentação ou regras financeiras.

## Validação

Comparar celular e desktop, temas claro e escuro, estados vazios e com dados. Nenhuma mudança visual deve alterar contratos de integração ou regras de cálculo.
