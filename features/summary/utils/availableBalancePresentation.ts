import type { MonthlySummary } from "@/features/summary/types/summary";

type BalanceSnapshot = Pick<
  MonthlySummary,
  "total_geral_disponivel" | "exclude_va_from_available" | "exclude_vr_from_available"
>;

export function getBalanceExclusionLabel(snapshot: BalanceSnapshot) {
  const va = snapshot.exclude_va_from_available === true;
  const vr = snapshot.exclude_vr_from_available === true;
  if (va && vr) return "sem VA e VR";
  if (va) return "sem VA";
  if (vr) return "sem VR";
  return null;
}

export function getAvailableBalanceHint(snapshot: BalanceSnapshot) {
  const hint =
    snapshot.total_geral_disponivel < 0 ? "Atenção: saldo negativo no mês" : "Saldo livre no mês";
  const exclusion = getBalanceExclusionLabel(snapshot);
  return exclusion ? `${hint} · ${exclusion}` : `${hint}.`;
}
