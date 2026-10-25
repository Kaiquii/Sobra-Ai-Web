export function filterSelectOptions<T extends { label: string }>(options: readonly T[], query: string): readonly T[] {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return terms.length ? options.filter((option) => terms.every((term) => normalize(option.label).includes(term))) : options;
}

export function selectorHeight(optionCount: number) {
  return 136 + Math.min(Math.max(optionCount, 1), 7) * 48;
}
