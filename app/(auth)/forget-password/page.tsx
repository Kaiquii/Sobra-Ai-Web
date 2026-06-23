import { AuthShell } from "@/features/auth/components/AuthShell";
import { PasswordRecoveryForm } from "@/features/auth/components/PasswordRecoveryForm";

export default function ForgetPasswordPage() {
  return (
    <AuthShell
      description="Receba o código de verificação e defina uma nova senha em poucos passos."
      title="Recupere seu acesso com segurança."
    >
      <PasswordRecoveryForm />
    </AuthShell>
  );
}
