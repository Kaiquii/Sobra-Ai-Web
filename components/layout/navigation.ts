import {
  BarChart3,
  Home,
  TrendingDown,
  UserRound,
} from "lucide-react";

export const dashboardNavigation = [
  {
    href: "/inicio",
    icon: Home,
    label: "Início",
    text: "Resumo principal.",
  },
  {
    href: "/despesas",
    icon: TrendingDown,
    label: "Despesas",
    text: "Organize seus gastos.",
  },
  {
    href: "/relatorios",
    icon: BarChart3,
    label: "Relatórios",
    text: "Analise resultados.",
  },
  {
    href: "/perfil",
    icon: UserRound,
    label: "Perfil",
    text: "Gerencie seus dados.",
  },
];
