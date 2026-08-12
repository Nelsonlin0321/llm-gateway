import { Separator } from "@/components/ui/separator";

type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = "or continue with email" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={label}>
      <Separator className="flex-1" />
      <span className="shrink-0 text-xs font-medium tracking-wide text-text-tertiary uppercase">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
