import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PatrimonyError({
  message,
  stale = false,
  loading,
  onRetry,
}: {
  message: string;
  stale?: boolean;
  loading: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="grid gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      <div className="flex items-start gap-2">
        <AlertCircle aria-hidden="true" size={20} className="shrink-0" />
        <p className="min-w-0 wrap-anywhere">
          {message}
          {stale ? " Os dados exibidos podem estar desatualizados." : ""}
        </p>
      </div>
      <Button className="justify-self-start" variant="ghost" disabled={loading} onClick={onRetry}>
        {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null}
        {loading ? "Consultando…" : "Tentar novamente"}
      </Button>
    </div>
  );
}
