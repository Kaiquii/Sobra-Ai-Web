"use client";

import { ArrowLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

const helpSections = [
  {
    text: "Use o app para acompanhar suas entradas, despesas, categorias e relatorios mensais. Mantenha os cadastros atualizados para que os saldos fiquem corretos.",
    title: "Como usar o app",
  },
  {
    text: "A tela inicial mostra um resumo do mes selecionado, com entradas, gastos e saldo disponivel para ajudar na leitura rapida da sua situacao financeira.",
    title: "Tela inicial",
  },
  {
    text: "Na area de despesas, informe valor, descricao, categoria, origem de pagamento, data e tipo. Despesas parceladas tambem precisam da quantidade de parcelas.",
    title: "Cadastrar despesas",
  },
  {
    text: "Edite ou exclua despesas pela listagem. Em despesas parceladas ou fixas, o app pode perguntar se a mudanca vale apenas para o registro atual ou tambem para os proximos.",
    title: "Gerenciar despesas",
  },
  {
    text: "Na area de Perfil, acesse Configuracoes de Renda para cadastrar salario, adiantamento e renda extra. Cada renda pode ser criada, atualizada ou removida por mes.",
    title: "Rendas",
  },
  {
    text: "Em Perfil, acesse Categorias para criar, editar ou excluir categorias. Se uma categoria estiver em uso, o servidor pode bloquear a exclusao e mostrar uma mensagem.",
    title: "Categorias",
  },
  {
    text: "A tela de Relatorios mostra gastos por categoria, comparativo de renda versus despesas e resumo anual com base nos dados cadastrados.",
    title: "Relatorios",
  },
  {
    text: "No web, o acesso protegido usa sua sessao salva no navegador. Sempre saia da conta quando estiver usando um dispositivo compartilhado.",
    title: "Biometria",
  },
];

type ContactItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function ContactItem({ icon, label, value }: ContactItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
          {value}
        </span>
      </span>
    </div>
  );
}

type HelpSectionProps = {
  text: string;
  title: string;
};

function HelpSection({ text, title }: HelpSectionProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {text}
      </p>
    </article>
  );
}

export function HelpView() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Central de Ajuda
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            Duvidas frequentes e suporte
          </h2>
        </div>
        <Link
          className={buttonClassName({ className: "self-start", variant: "secondary" })}
          href="/perfil"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
          Voltar
        </Link>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-950 dark:text-slate-50">Contato</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ContactItem
            icon={<Phone aria-hidden="true" size={19} strokeWidth={2.25} />}
            label="WhatsApp"
            value="11 93367-3435"
          />
          <ContactItem
            icon={<Mail aria-hidden="true" size={19} strokeWidth={2.25} />}
            label="E-mail"
            value="kaiqui.lucaskaiquiluc@gmail.com"
          />
        </div>
      </article>

      <div className="grid gap-3">
        {helpSections.map((section) => (
          <HelpSection key={section.title} text={section.text} title={section.title} />
        ))}
      </div>
    </section>
  );
}
