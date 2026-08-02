"use client";

import {
  CalendarRange,
  Download,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import {
  MonthSwitcher,
  type MonthReference,
} from "@/components/ui/month-switcher";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import {
  getReportExportErrorMessage,
  isReportExportCanceled,
  reportsApi,
} from "@/features/reports/api/reportsApi";
import type {
  ReportExportFormat,
  ReportExportParams,
  ReportExportType,
} from "@/features/reports/types/report";

type SelectableReportType = ReportExportType | "";
type SelectableExportFormat = ReportExportFormat | "";

const reportTypeOptions: Array<{
  label: string;
  value: SelectableReportType;
}> = [
  { label: "Escolha o conteúdo", value: "" },
  { label: "Relatório completo", value: "full_report" },
  { label: "Resumo do mês", value: "summary" },
  { label: "Despesas", value: "expenses" },
  { label: "Receitas", value: "incomes" },
  { label: "Categorias", value: "categories" },
  { label: "Comparação mensal", value: "month_comparison" },
  { label: "Compromissos parcelados", value: "installment_commitments" },
];

const formatOptions: Array<{
  label: string;
  value: SelectableExportFormat;
}> = [
  { label: "Escolha o formato", value: "" },
  { label: "PDF", value: "pdf" },
  { label: "Planilha Excel (.xlsx)", value: "xlsx" },
  { label: "Dados (.csv)", value: "csv" },
];

function getPreviousMonth({ month, year }: MonthReference) {
  const date = new Date(year, month - 2, 1);

  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function startBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

type ReportExportDialogProps = {
  initialMonth: number;
  initialYear: number;
  isOpen: boolean;
  onClose: () => void;
};

export function ReportExportDialog({
  initialMonth,
  initialYear,
  isOpen,
  onClose,
}: ReportExportDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ReportExportDialogContent
      initialMonth={initialMonth}
      initialYear={initialYear}
      key={`${initialMonth}-${initialYear}`}
      onClose={onClose}
    />
  );
}

type ReportExportDialogContentProps = Omit<
  ReportExportDialogProps,
  "isOpen"
>;

function ReportExportDialogContent({
  initialMonth,
  initialYear,
  onClose,
}: ReportExportDialogContentProps) {
  useLockBodyScroll();

  const controllerRef = useRef<AbortController | null>(null);
  const [reportType, setReportType] = useState<SelectableReportType>("");
  const [format, setFormat] = useState<SelectableExportFormat>("");
  const [reference, setReference] = useState<MonthReference>({
    month: initialMonth,
    year: initialYear,
  });
  const [compareWithCustomMonth, setCompareWithCustomMonth] = useState(false);
  const [compareReference, setCompareReference] = useState<MonthReference>(() =>
    getPreviousMonth({ month: initialMonth, year: initialYear }),
  );
  const [months, setMonths] = useState("12");
  const [includeCurrentMonthAsPaid, setIncludeCurrentMonthAsPaid] =
    useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supportsComparison =
    reportType === "month_comparison" || reportType === "full_report";
  const supportsInstallments =
    reportType === "installment_commitments" || reportType === "full_report";

  function closeDialog() {
    controllerRef.current?.abort();
    onClose();
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        controllerRef.current?.abort();
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!reportType) {
      setError("Escolha o conteúdo do relatório.");
      return;
    }

    if (!format) {
      setError("Escolha o formato do arquivo.");
      return;
    }

    const parsedMonths = Number(months);

    if (
      supportsInstallments &&
      (!Number.isInteger(parsedMonths) || parsedMonths < 1 || parsedMonths > 60)
    ) {
      setError("Informe uma projeção entre 1 e 60 meses.");
      return;
    }

    const params: ReportExportParams = {
      format,
      month: reference.month,
      type: reportType,
      year: reference.year,
      ...(supportsComparison && compareWithCustomMonth
        ? {
            compare_month: compareReference.month,
            compare_year: compareReference.year,
          }
        : {}),
      ...(supportsInstallments
        ? {
            include_current_month_as_paid: includeCurrentMonthAsPaid,
            months: parsedMonths,
          }
        : {}),
    };
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsGenerating(true);

    try {
      const result = await reportsApi.exportReport(params, controller.signal);
      startBrowserDownload(result.blob, result.filename);
      setSuccess(`Relatório gerado: ${result.filename}`);
    } catch (requestError) {
      if (!isReportExportCanceled(requestError)) {
        setError(await getReportExportErrorMessage(requestError));
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsGenerating(false);
      }
    }
  }

  return (
    <div
      aria-labelledby="report-export-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      role="dialog"
    >
      <form
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2
              className="text-lg font-semibold text-slate-950 dark:text-slate-50"
              id="report-export-title"
            >
              Exportar relatório
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Escolha o conteúdo, o período e o formato do arquivo.
            </p>
          </div>

          <Button
            aria-label="Fechar exportação"
            className="shrink-0"
            onClick={closeDialog}
            size="iconSm"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Conteúdo
              <DropdownSelect
                ariaLabel="Conteúdo do relatório"
                disabled={isGenerating}
                icon={FileText}
                onChange={setReportType}
                options={reportTypeOptions}
                value={reportType}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Formato
              <DropdownSelect
                ariaLabel="Formato do arquivo"
                disabled={isGenerating}
                icon={Download}
                onChange={setFormat}
                options={formatOptions}
                value={format}
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Mês de referência
            </p>
            <MonthSwitcher
              className="max-w-none"
              month={reference.month}
              onChange={(date) => {
                if (!isGenerating) {
                  setReference(date);
                }
              }}
              year={reference.year}
            />
          </div>

          {supportsComparison ? (
            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  checked={compareWithCustomMonth}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                  disabled={isGenerating}
                  onChange={(event) =>
                    setCompareWithCustomMonth(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block font-semibold">
                    Escolher outro mês para comparação
                  </strong>
                  <span className="mt-0.5 block text-slate-500 dark:text-slate-400">
                    Sem essa opção, será usado o mês anterior.
                  </span>
                </span>
              </label>

              {compareWithCustomMonth ? (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <CalendarRange aria-hidden="true" size={16} />
                    Comparar com
                  </p>
                  <MonthSwitcher
                    className="max-w-none"
                    month={compareReference.month}
                    onChange={(date) => {
                      if (!isGenerating) {
                        setCompareReference(date);
                      }
                    }}
                    year={compareReference.year}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {supportsInstallments ? (
            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 dark:border-slate-800 sm:grid-cols-2 sm:items-end">
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Meses da projeção
                <Input
                  disabled={isGenerating}
                  inputMode="numeric"
                  max={60}
                  min={1}
                  onChange={(event) => setMonths(event.target.value)}
                  type="number"
                  value={months}
                />
              </label>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <input
                  checked={includeCurrentMonthAsPaid}
                  className="h-5 w-5 shrink-0 accent-emerald-600"
                  disabled={isGenerating}
                  onChange={(event) =>
                    setIncludeCurrentMonthAsPaid(event.target.checked)
                  }
                  type="checkbox"
                />
                Considerar o mês atual como pago
              </label>
            </div>
          ) : null}

          {error ? (
            <Alert className="mt-5" variant="error">
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert className="mt-5" variant="success">
              {success}
            </Alert>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/45 sm:flex-row sm:justify-end sm:px-6">
          <Button onClick={closeDialog} type="button" variant="secondary">
            Fechar
          </Button>
          <Button disabled={isGenerating} type="submit">
            {isGenerating ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={17} />
            ) : (
              <Download aria-hidden="true" size={17} />
            )}
            {isGenerating ? "Gerando relatório..." : "Gerar e baixar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
