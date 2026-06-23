import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      description="Entre para acompanhar saldo, despesas, salário e relatórios em um só lugar."
      title="Acesse seu painel financeiro."
    >
      <LoginForm />
    </AuthShell>
  );
}
