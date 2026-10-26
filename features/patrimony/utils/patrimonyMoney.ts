import type { Cents } from "../types/patrimony";

const MAX_ENTRY = BigInt("999999999999");

export function decimalToCents(value: string): Cents {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error("Saldo recebido inválido.");
  const [units, fraction = ""] = value.split(".");
  return (BigInt(units) * BigInt(100) + BigInt(fraction.padEnd(2, "0"))).toString();
}

export function parseAmount(input: string): Cents {
  const text = input.trim().replace(/^R\$\s*/, "");
  const grouped = /^[1-9]\d{0,2}(?:\.\d{3})+$/;
  let normalized = text;
  if (text.includes(",")) {
    const parts = text.split(",");
    if (parts.length !== 2 || !/^(?:\d+|[1-9]\d{0,2}(?:\.\d{3})+)$/.test(parts[0]))
      throw new Error("Informe um saldo válido com até duas casas decimais.");
    normalized = parts[0].replaceAll(".", "") + "." + parts[1];
  } else if (grouped.test(text)) normalized = text.replaceAll(".", "");
  let cents: Cents;
  try {
    cents = decimalToCents(normalized);
  } catch {
    throw new Error(
      "Informe um saldo válido, de zero a R$ 9.999.999.999,99, com até duas casas decimais.",
    );
  }
  if (BigInt(cents) > MAX_ENTRY) throw new Error("O saldo deve ser de até R$ 9.999.999.999,99.");
  return cents;
}

export function centsDecimal(cents: Cents) {
  const value = BigInt(cents);
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`;
}
export function amountInput(cents: Cents) {
  return centsDecimal(cents).replace(".", ",");
}
export function formatCents(cents: Cents) {
  const [units, fraction] = centsDecimal(cents).split(".");
  return `R$ ${units.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
}
export function validatedName(value: string, limit: number) {
  const name = value.trim();
  if (!name || [...name].length > limit)
    throw new Error(`Informe um nome com até ${limit} caracteres.`);
  return name;
}

export function jsonNumberToken(value: unknown): string {
  if (
    !value ||
    typeof value !== "object" ||
    !("decimalToken" in value) ||
    typeof value.decimalToken !== "string"
  )
    throw new Error("Saldo deve ser um número JSON.");
  return value.decimalToken;
}

/** Tag number tokens before JSON.parse, retaining their exact spelling and type. */
export function parseExactJson(text: string): unknown {
  return JSON.parse(
    text.replace(/"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token) =>
      token.startsWith('"') ? token : `{"decimalToken":${JSON.stringify(token)}}`,
    ),
  );
}
