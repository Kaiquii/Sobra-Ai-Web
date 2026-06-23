import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      description="Crie sua conta para começar a organizar entradas, gastos e metas do mês."
      title="Comece com uma conta segura."
    >
      <RegisterForm />
    </AuthShell>
  );
}
