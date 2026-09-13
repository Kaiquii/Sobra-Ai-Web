import { cn } from "@/lib/utils";

type SwitchProps = {
  ariaLabel: string;
  checked: boolean;
  className?: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({
  ariaLabel,
  checked,
  className,
  disabled,
  onCheckedChange,
}: SwitchProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-checked={checked}
      className={cn(
        "flex h-11 w-12 shrink-0 cursor-pointer items-center disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-7 w-12 items-center rounded-full p-1 transition-colors",
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
