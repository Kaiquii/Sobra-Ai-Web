import { LoginShell } from "@/features/auth/components/LoginShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <LoginShell
      description="Entre para acompanhar saldo, despesas, salário e relatórios em um só lugar."
      title="Acesse seu painel financeiro."
    >
      <LoginForm />
    </LoginShell>
  );
}
