import { apiClient } from "@/lib/api";
import type { InvestmentCategory, Patrimony, PatrimonyAction } from "../types/patrimony";
import {
  centsDecimal,
  decimalToCents,
  jsonNumberToken,
  parseAmount,
  parseExactJson,
  validatedName,
} from "../utils/patrimonyMoney";

const base = "/api/patrimony";
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Resposta de patrimônio inválida.");
  return value as RecordValue;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Resposta de patrimônio inválida.");
  return value;
}
function id(value: unknown) {
  if (value && typeof value === "object") value = jsonNumberToken(value);
  const number = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(number) || number <= 0)
    throw new Error("Identificador inválido.");
  return number;
}
function date(value: unknown) {
  const result = text(value);
  if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(result) || Number.isNaN(Date.parse(result)))
    throw new Error("Data recebida inválida.");
  return result;
}
function balance(value: unknown) {
  const data = record(value);
  return {
    amount: decimalToCents(jsonNumberToken(data.amount)),
    updated_at: date(data.updated_at),
  };
}
function category(value: unknown): InvestmentCategory {
  const data = record(value);
  if (typeof data.is_default !== "boolean") throw new Error("Categoria recebida inválida.");
  return { id: id(data.id), name: text(data.name), is_default: data.is_default };
}
const exact = { timeout: 30000, transformResponse: [(data: string) => parseExactJson(data)] };

function confirmedResponse<T>(response: { data: unknown }, decode: (value: RecordValue) => T) {
  try {
    return decode(record(response.data));
  } catch {
    throw Object.assign(new Error("A resposta da alteração não pôde ser confirmada."), {
      unconfirmedWrite: true,
    });
  }
}
function written(response: { data: unknown }) {
  confirmedResponse(response, (body) => record(body.data));
}
function deleted(response: { data: unknown }) {
  confirmedResponse(response, (body) => text(body.message));
}

export const patrimonyApi = {
  async read(): Promise<Patrimony> {
    const response = await apiClient.get(`${base}/`, exact);
    const data = record(response.data);
    if (!Array.isArray(data.investments)) throw new Error("Lista de investimentos inválida.");
    return {
      fgts: data.fgts === null ? null : balance(data.fgts),
      investments: data.investments.map((value) => {
        const item = record(value);
        return {
          ...balance(item),
          id: id(item.id),
          name: text(item.name),
          category: text(item.category),
          category_id: item.category_id == null ? null : id(item.category_id),
          created_at: date(item.created_at),
        };
      }),
      total_fgts: decimalToCents(jsonNumberToken(data.total_fgts)),
      total_investments: decimalToCents(jsonNumberToken(data.total_investments)),
      total_patrimony: decimalToCents(jsonNumberToken(data.total_patrimony)),
    };
  },
  async categories(): Promise<InvestmentCategory[]> {
    const response = await apiClient.get(`${base}/investment-categories`, exact);
    const data = record(response.data);
    if (!Array.isArray(data.categories) || !/^\d+$/.test(jsonNumberToken(data.total)))
      throw new Error("Catálogo inválido.");
    return data.categories.map(category);
  },
  async write(action: PatrimonyAction): Promise<InvestmentCategory | null> {
    const config = { timeout: 90000 };
    if (action.kind === "fgts") {
      written(
        await apiClient.put(
          `${base}/fgts`,
          `{"amount":${centsDecimal(parseAmount(action.amount))}}`,
          config,
        ),
      );
    } else if (action.kind === "deleteFgts") {
      deleted(await apiClient.delete(`${base}/fgts`, config));
    } else if (action.kind === "deleteInvestment") {
      deleted(await apiClient.delete(`${base}/investments/${id(action.id)}`, config));
    } else if (action.kind === "investment") {
      const draft = action.draft;
      const name = validatedName(draft.name, 120);
      const selection =
        draft.categoryId !== undefined
          ? `"category_id":${id(draft.categoryId)}`
          : `"category":${JSON.stringify(validatedName(draft.category ?? "", 80))}`;
      const body = `{"name":${JSON.stringify(name)},${selection},"amount":${centsDecimal(parseAmount(draft.amount))}}`;
      if (action.id !== undefined)
        written(await apiClient.patch(`${base}/investments/${id(action.id)}`, body, config));
      else written(await apiClient.post(`${base}/investments`, body, config));
    } else if (action.kind === "deleteCategory") {
      deleted(await apiClient.delete(`${base}/investment-categories/${id(action.id)}`, config));
    } else {
      const body = { name: validatedName(action.name, 80) };
      const response =
        action.id !== undefined
          ? await apiClient.patch(`${base}/investment-categories/${id(action.id)}`, body, config)
          : await apiClient.post(`${base}/investment-categories`, body, config);
      return confirmedResponse(response, (body) => category(body.data));
    }
    return null;
  },
};
