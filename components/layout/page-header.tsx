import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";

type PageHeaderProps = {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  backHref,
  backLabel = "Voltar",
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 wrap-anywhere text-xl font-semibold text-slate-950 dark:text-slate-50 sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:items-end">
        {backHref ? (
          <Link
            className={buttonClassName({
              className: "self-start sm:self-end",
              variant: "secondary",
            })}
            href={backHref}
          >
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
            {backLabel}
          </Link>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
