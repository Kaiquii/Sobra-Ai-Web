import { Mail, ShieldCheck } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const lastUpdated = "6 de julho de 2026";

const policySections = [
  {
    title: "1. Quem somos",
    paragraphs: [
      "O SobraAí é um aplicativo de controle financeiro pessoal disponível no front-end web e no aplicativo Android, com dados processados pelo back-end do projeto.",
      "Esta Política de Privacidade explica quais informações podem ser tratadas ao usar o site, o aplicativo Android, as APIs e os recursos relacionados ao SobraAí.",
    ],
  },
  {
    title: "2. Dados que podemos coletar",
    paragraphs: [
      "Podemos tratar dados de cadastro, como nome, e-mail, senha criptografada, perfil de acesso, foto de perfil, status de bloqueio de acesso e informações de sessão necessárias para autenticar o usuário.",
      "Também podemos tratar dados financeiros informados pelo usuário, como rendas, despesas, categorias, datas, valores, parcelas, séries de despesas, observações e origem de pagamento.",
      "Quando o usuário usa o assistente com IA, podemos tratar mensagens enviadas, respostas geradas, identificador da conversa, histórico da conversa, chamadas de ferramentas e resultados necessários para responder ou executar a solicitação.",
      "Para recuperação de senha, podemos tratar e-mail, código de recuperação protegido por criptografia, data de expiração e status de uso do código.",
      "No Android, o aplicativo pode armazenar localmente token de acesso, nome, e-mail, perfil, URL da foto de perfil e a preferência de biometria associada ao e-mail do usuário.",
    ],
  },
  {
    title: "3. Permissões e recursos do Android",
    paragraphs: [
      "O aplicativo Android usa acesso à internet para se comunicar com a API do SobraAí e sincronizar dados da conta.",
      "A permissão de microfone pode ser solicitada para entrada por voz no assistente. Na versão atual, o recurso usa o reconhecimento de fala do próprio Android; o aplicativo recebe a transcrição e preenche o campo de mensagem para o usuário revisar antes de enviar.",
      "Quando o usuário escolhe uma foto de perfil no Android, o aplicativo lê a imagem selecionada, envia o arquivo ao back-end e exibe a foto usando cache de imagem do próprio app.",
      "A biometria, quando ativada, é validada pelo sistema do dispositivo. O SobraAí não recebe, armazena nem transmite impressão digital, rosto ou outro dado biométrico; o app mantém apenas a preferência local de uso da biometria para aquele e-mail.",
      "Como o Android pode fazer backup ou transferência de dados de aplicativos conforme as configurações do aparelho e da conta do usuário, informações locais do app podem ser incluídas nesses mecanismos do sistema operacional.",
    ],
  },
  {
    title: "4. Como usamos os dados",
    paragraphs: [
      "Usamos os dados para criar e proteger a conta, manter a sessão ativa, exibir o perfil, registrar rendas e despesas, calcular saldos, gerar relatórios e sincronizar as informações entre web, back-end e Android.",
      "Também usamos os dados para criar, listar, editar e excluir categorias, rendas, despesas, relatórios, conversas do assistente e foto de perfil conforme as ações feitas pelo usuário.",
      "Informações técnicas e operacionais podem ser usadas para manter segurança, investigar erros, prevenir abuso, aplicar bloqueios ou restaurações de acesso quando necessário e melhorar a estabilidade do serviço.",
    ],
  },
  {
    title: "5. Armazenamento e segurança",
    paragraphs: [
      "Os dados principais são armazenados no back-end do projeto e podem ser acessados pelo front-end web e pelo aplicativo Android mediante autenticação.",
      "Senhas e códigos de recuperação são armazenados em formato protegido por criptografia. As rotas protegidas usam token de autenticação, e o token pode expirar ou ser invalidado quando o acesso for revogado.",
      "Fotos de perfil são processadas pelo back-end, convertidas para imagem JPEG e armazenadas localmente no servidor ou em Oracle Object Storage, conforme a configuração de ambiente.",
      "No Android, dados de sessão são salvos em DataStore do aplicativo para manter o usuário conectado e permitir recursos como biometria local.",
      "Nenhum sistema é totalmente imune a riscos. Por isso, o usuário deve manter seus dados de acesso em segurança, proteger o dispositivo e sair da conta ao usar dispositivos compartilhados.",
    ],
  },
  {
    title: "6. Compartilhamento de dados",
    paragraphs: [
      "Não vendemos dados pessoais do usuário.",
      "Dados podem ser compartilhados com provedores técnicos necessários para hospedagem, banco de dados, armazenamento, processamento, envio de e-mail, autenticação, backup, monitoramento ou funcionamento do serviço.",
      "A foto de perfil pode ser armazenada em serviço de objeto externo, como Oracle Object Storage, quando essa opção estiver configurada no back-end.",
      "Para recuperação de senha, o e-mail do usuário e o conteúdo necessário para envio do código podem ser processados por um provedor SMTP configurado no servidor.",
      "Também poderemos compartilhar informações quando exigido por lei, ordem judicial, autoridade competente ou para proteger direitos, segurança e integridade do projeto.",
    ],
  },
  {
    title: "7. Assistente com IA",
    paragraphs: [
      "Ao usar o assistente, as mensagens podem ser enviadas ao back-end e processadas por serviços de inteligência artificial, incluindo provedores como Groq e Google Gemini, para gerar respostas e executar tarefas solicitadas pelo usuário.",
      "O back-end pode enviar ao provedor de IA a mensagem do usuário, trechos recentes da conversa, instruções de sistema e resultados financeiros necessários para responder com contexto.",
      "O histórico de conversas, mensagens, respostas, chamadas de ferramentas e resultados pode ser salvo no back-end para continuidade da conversa e consulta posterior.",
      "Evite enviar senhas, documentos, dados bancários completos ou qualquer informação sensível que não seja necessária para o uso financeiro do aplicativo.",
    ],
  },
  {
    title: "8. Retenção e exclusão",
    paragraphs: [
      "Mantemos os dados enquanto a conta estiver ativa ou enquanto forem necessários para prestar o serviço, cumprir obrigações legais, resolver disputas, prevenir fraudes ou manter registros operacionais.",
      "O usuário pode excluir conversas do assistente e remover a foto de perfil pelos recursos disponíveis no aplicativo ou no site.",
      "Quando uma conta é excluída por administração do sistema, o back-end remove dados associados, como conversas, mensagens, despesas, rendas, categorias, tokens de recuperação de senha e foto de perfil, conforme o comportamento implementado.",
      "O usuário pode solicitar correção, acesso ou exclusão de dados entrando em contato pelo canal informado nesta política. Algumas informações podem ser mantidas quando houver obrigação legal ou necessidade legítima de segurança.",
    ],
  },
  {
    title: "9. Direitos do usuário",
    paragraphs: [
      "O usuário pode solicitar informações sobre os dados tratados, pedir correção de dados incompletos ou incorretos, solicitar exclusão quando aplicável e obter orientações sobre o tratamento de suas informações.",
      "As solicitações serão analisadas conforme a legislação aplicável, a identidade do solicitante e as condições técnicas do serviço.",
    ],
  },
  {
    title: "10. Alterações nesta política",
    paragraphs: [
      "Esta política pode ser atualizada para refletir mudanças no front-end, back-end, Android, infraestrutura, recursos de IA, requisitos legais ou práticas de segurança.",
      "Quando houver mudanças relevantes, a data de atualização será revisada nesta página.",
    ],
  },
];

export function PrivacyPolicyView() {
  return (
    <main className="min-h-svh bg-slate-100 px-4 py-5 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck aria-hidden="true" size={17} strokeWidth={2.25} />
                SobraAí
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">
                Política de Privacidade
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Esta página descreve como o SobraAí trata dados no front-end web, no
                back-end e no aplicativo Android.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                Última atualização: {lastUpdated}.
              </p>
            </div>

            <ThemeToggle
              className="h-10 w-10 shrink-0 self-start border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 sm:self-end"
              iconSize={17}
            />
          </div>
        </header>

        <div className="grid gap-3">
          {policySections.map((section) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              key={section.title}
            >
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/30 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                Contato
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Para solicitar informações, correção ou exclusão de dados, entre em
                contato pelo e-mail abaixo.
              </p>
            </div>
            <a
              className={buttonClassName({
                className: "w-full sm:w-auto",
                variant: "secondary",
              })}
              href="mailto:kaiqui.lucaskaiquiluc@gmail.com"
            >
              <Mail aria-hidden="true" size={16} strokeWidth={2.25} />
              Enviar e-mail
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
