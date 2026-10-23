export function expenseTypeAccent(type: string) {
  switch (type.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) {
    case "unica":
      return "[--expense-accent:#1565C0] dark:[--expense-accent:#60A5FA]";
    case "parcelada":
      return "[--expense-accent:#6D28D9] dark:[--expense-accent:#B49AFF]";
    case "fixa":
      return "[--expense-accent:#00695C] dark:[--expense-accent:#5EDAC8]";
    default:
      return "[--expense-accent:#475569] dark:[--expense-accent:#A0AEC0]";
  }
}

export function expenseTotalLabel(type: string) {
  return type === "Todas" ? "Total das despesas" : `Total em ${type}`;
}
