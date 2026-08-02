import axios from "axios";

import type {
  InstallmentCommitmentsParams,
  InstallmentCommitmentsResponse,
  MonthComparisonParams,
  MonthComparisonResponse,
  ReportCategory,
  ReportChartItem,
  ReportExportParams,
  ReportExportResult,
  ReportSummary,
  YearlySummary,
} from "@/features/reports/types/report";
import { apiClient } from "@/lib/api";

const exportTimeoutMs = 120_000;

function getErrorMessageFromData(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  if ("error" in data && typeof data.error === "string") {
    return data.error;
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  return null;
}

function getFilenameFromDisposition(disposition: unknown) {
  if (typeof disposition !== "string") {
    return null;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return encodedMatch[1].trim().replace(/^"|"$/g, "");
    }
  }

  return disposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? null;
}

function sanitizeFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop() ?? "";

  return basename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 160);
}

function getFallbackFilename(params: ReportExportParams) {
  return `relatorio_${params.type}_${String(params.month).padStart(2, "0")}_${params.year}.${params.format}`;
}

function normalizeArrayResponse<T>(data: T[] | null) {
  return Array.isArray(data) ? data : [];
}

export const reportsApi = {
  async exportReport(
    params: ReportExportParams,
    signal?: AbortSignal,
  ): Promise<ReportExportResult> {
    const response = await apiClient.get<Blob>("/api/reports/export", {
      params,
      responseType: "blob",
      signal,
      timeout: exportTimeoutMs,
    });
    const responseFilename = getFilenameFromDisposition(
      response.headers["content-disposition"],
    );
    const filename = sanitizeFilename(
      responseFilename ?? getFallbackFilename(params),
    );

    return {
      blob: response.data,
      filename: filename || getFallbackFilename(params),
    };
  },

  async getMonthComparison({
    compareMonth,
    compareYear,
    month,
    year,
  }: MonthComparisonParams) {
    const response = await apiClient.get<MonthComparisonResponse>(
      "/api/reports/month-comparison",
      {
        params: {
          compare_month: compareMonth,
          compare_year: compareYear,
          month,
          year,
        },
      },
    );

    return {
      ...response.data,
      categorias: normalizeArrayResponse(response.data.categorias),
      fontes_pagamento: normalizeArrayResponse(response.data.fontes_pagamento),
      insights: normalizeArrayResponse(response.data.insights),
      tipos_despesa: normalizeArrayResponse(response.data.tipos_despesa),
    };
  },

  async getInstallmentCommitments({
    includeCurrentMonthAsPaid = false,
    month,
    months,
    year,
  }: InstallmentCommitmentsParams) {
    const response = await apiClient.get<InstallmentCommitmentsResponse>(
      "/api/reports/installment-commitments",
      {
        params: {
          include_current_month_as_paid: includeCurrentMonthAsPaid,
          month,
          months,
          year,
        },
      },
    );

    return {
      ...response.data,
      compras: Array.isArray(response.data.compras) ? response.data.compras : [],
      linha_do_tempo: Array.isArray(response.data.linha_do_tempo)
        ? response.data.linha_do_tempo
        : [],
    };
  },

  async getCategories(month: number, year: number) {
    const response = await apiClient.get<ReportCategory[] | null>(
      "/api/reports/categories",
      {
        params: { month, year },
      },
    );

    return normalizeArrayResponse(response.data);
  },

  async getChart(year: number) {
    const response = await apiClient.get<ReportChartItem[] | null>(
      "/api/reports/chart",
      {
        params: { year },
      },
    );

    return normalizeArrayResponse(response.data);
  },

  async getSummary(month: number, year: number) {
    const response = await apiClient.get<ReportSummary>("/api/reports/summary", {
      params: { month, year },
    });

    return response.data;
  },

  async getYearlySummary(year: number) {
    const response = await apiClient.get<YearlySummary>(
      "/api/reports/yearly-summary",
      {
        params: { year },
      },
    );

    return response.data;
  },
};

export function isReportExportCanceled(error: unknown) {
  return axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === "ERR_CANCELED");
}

export async function getReportExportErrorMessage(error: unknown) {
  const fallback = "Não foi possível gerar o relatório. Tente novamente.";

  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (error.code === "ECONNABORTED") {
    return "A geração demorou mais que o esperado. Tente novamente.";
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  let responseData: unknown = error.response.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      responseData = text ? JSON.parse(text) : null;
    } catch {
      responseData = null;
    }
  }

  const apiMessage = getErrorMessageFromData(responseData);

  if (apiMessage) {
    return apiMessage;
  }

  if (error.response.status === 400) {
    return "Revise as opções do relatório e tente novamente.";
  }

  if (error.response.status === 401) {
    return "Sua sessão expirou. Entre novamente para exportar o relatório.";
  }

  return fallback;
}
