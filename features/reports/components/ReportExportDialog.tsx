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
import { Switch } from "@/components/ui/switch";
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 pt-[env(safe-area-inset-top)] backdrop-blur-sm sm:items-center sm:px-5 sm:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      role="dialog"
    >
      <form
        className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-slate-950/20 dark:bg-slate-950 sm:max-h-full sm:rounded-lg sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:dark:bg-slate-900"
        onSubmit={handleSubmit}
      >
        <div aria-hidden="true" className="mx-auto mb-2 mt-3 h-1 w-8 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 py-4 sm:border-b sm:border-slate-200 sm:px-6 sm:dark:border-slate-800">
          <div>
            <h2
              className="text-lg font-semibold text-slate-950 dark:text-slate-50"
              id="report-export-title"
            >
              Exportar relatório
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="sm:hidden">Período: {String(reference.month).padStart(2, "0")}/{reference.year}</span>
              <span className="hidden sm:inline">Escolha o conteúdo, o período e o formato do arquivo.</span>
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

        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-3 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Tipo do relatório
              <DropdownSelect
                ariaLabel="Conteúdo do relatório"
                disabled={isGenerating}
                icon={FileText}
                onChange={setReportType}
                options={reportTypeOptions}
                value={reportType}
              />
            </label>

            <div className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <p>Formato</p>
              <div role="group" aria-label="Formato do arquivo" className="grid grid-cols-3 gap-2 sm:hidden">
                {(["pdf", "xlsx", "csv"] as const).map((option) => (
                  <button key={option} type="button" aria-pressed={format === option} disabled={isGenerating} onClick={() => setFormat(option)} className={`h-11 min-w-0 cursor-pointer rounded-lg border text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${format === option ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"}`}>
                    {option === "xlsx" ? "Excel" : option.toUpperCase()}
                  </button>
                ))}
              </div>
              <DropdownSelect
                className="hidden sm:block"
                ariaLabel="Formato do arquivo"
                disabled={isGenerating}
                icon={Download}
                onChange={setFormat}
                options={formatOptions}
                value={format}
              />
            </div>
          </div>

          <div className="mt-5 hidden sm:block">
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
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  aria-label="Escolher outro mês para comparação"
                  checked={compareWithCustomMonth}
                  className="hidden h-5 w-5 shrink-0 accent-emerald-600 sm:block"
                  disabled={isGenerating}
                  onChange={(event) =>
                    setCompareWithCustomMonth(event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <strong className="block font-semibold">
                    Escolher outro mês para comparação
                  </strong>
                  <span className="mt-0.5 block text-slate-500 dark:text-slate-400">
                    Sem essa opção, será usado o mês anterior.
                  </span>
                </span>
                <Switch ariaLabel="Escolher outro mês para comparação" className="sm:hidden" checked={compareWithCustomMonth} disabled={isGenerating} onCheckedChange={setCompareWithCustomMonth} />
              </div>

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
                Projeção: {months} meses
                <Input
                  className="hidden sm:block"
                  disabled={isGenerating}
                  inputMode="numeric"
                  max={60}
                  min={1}
                  onChange={(event) => setMonths(event.target.value)}
                  type="number"
                  value={months}
                />
                <input aria-label="Meses da projeção" className="h-11 w-full cursor-pointer accent-blue-600 disabled:cursor-not-allowed sm:hidden" disabled={isGenerating} min={1} max={60} step={1} type="range" value={months} onChange={(event) => setMonths(event.target.value)} />
              </label>

              <div className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 sm:rounded-md sm:border sm:border-slate-200 sm:bg-slate-50 sm:px-3 sm:dark:border-slate-700 sm:dark:bg-slate-950">
                <input
                  aria-label="Considerar o mês atual como pago"
                  checked={includeCurrentMonthAsPaid}
                  className="hidden h-5 w-5 shrink-0 accent-emerald-600 sm:block"
                  disabled={isGenerating}
                  onChange={(event) =>
                    setIncludeCurrentMonthAsPaid(event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">Considerar o mês atual como pago</span>
                <Switch ariaLabel="Considerar o mês atual como pago" className="sm:hidden" checked={includeCurrentMonthAsPaid} disabled={isGenerating} onCheckedChange={setIncludeCurrentMonthAsPaid} />
              </div>
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

        <div className="flex shrink-0 flex-col-reverse gap-3 px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:flex-row sm:justify-end sm:border-t sm:border-slate-200 sm:bg-slate-50 sm:px-6 sm:py-4 sm:dark:border-slate-800 sm:dark:bg-slate-950/45">
          <Button className="max-sm:hidden" onClick={closeDialog} type="button" variant="secondary">
            Fechar
          </Button>
          {isGenerating ? <Button className="sm:hidden" onClick={() => controllerRef.current?.abort()} type="button" variant="ghost">Cancelar operação</Button> : null}
          <Button className="max-sm:h-13 max-sm:w-full max-sm:rounded-xl max-sm:bg-blue-600 max-sm:dark:bg-blue-600 max-sm:text-white max-sm:dark:text-white max-sm:hover:bg-blue-700 max-sm:dark:hover:bg-blue-700" disabled={isGenerating || !reportType || !format} type="submit">
            {isGenerating ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={17} />
            ) : (
              <Download aria-hidden="true" size={17} />
            )}
            {isGenerating ? "Gerando relatório..." : <><span className="sm:hidden">Baixar relatório</span><span className="hidden sm:inline">Gerar e baixar</span></>}
          </Button>
        </div>
      </form>
    </div>
  );
}
