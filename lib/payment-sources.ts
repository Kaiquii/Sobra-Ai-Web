export const paymentSources = ["Salario", "Adiantamento", "Renda Extra", "VA", "VR"] as const;
export type CanonicalPaymentSource = (typeof paymentSources)[number];

export function normalizeSource(source: string): string {
  return source.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function canonicalPaymentSource(source: string): CanonicalPaymentSource | null {
  switch (normalizeSource(source).replace(/[^a-z0-9]/g, "")) {
    case "salario": return "Salario";
    case "adiantamento": return "Adiantamento";
    case "rendaextra": return "Renda Extra";
    case "va": case "valealimentacao": case "valealimentacaova": return "VA";
    case "vr": case "valerefeicao": case "valerefeicaovr": return "VR";
    default: return null;
  }
}

const labels: Record<CanonicalPaymentSource, string> = {
  Salario: "Salário",
  Adiantamento: "Adiantamento",
  "Renda Extra": "Renda Extra",
  VA: "Vale-alimentação (VA)",
  VR: "Vale-refeição (VR)",
};

export function paymentSourceLabel(source: string, compact = false) {
  const canonical = canonicalPaymentSource(source);
  return canonical ? (compact && (canonical === "VA" || canonical === "VR") ? canonical : labels[canonical]) : source.trim();
}

export const paymentSourceOptions = paymentSources.map((value) => ({ value, label: labels[value] }));

export function paymentSourcesMatch(left: string, right: string) {
  return (canonicalPaymentSource(left) ?? normalizeSource(left)) === (canonicalPaymentSource(right) ?? normalizeSource(right));
}

export function validPaymentDistribution(total: number, splits: ReadonlyArray<{ amount: number; payment_source: string }>) {
  const identities = splits.map((split) => canonicalPaymentSource(split.payment_source) ?? normalizeSource(split.payment_source));
  return Number.isFinite(total) && total > 0 && splits.length >= 2 &&
    splits.every((split) => Number.isFinite(split.amount) && split.amount > 0) &&
    identities.every(Boolean) && new Set(identities).size === splits.length &&
    Math.abs(splits.reduce((sum, split) => sum + split.amount, 0) - total) < 0.005;
}
