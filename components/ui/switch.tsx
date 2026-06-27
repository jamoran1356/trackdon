import { cn } from '@/lib/utils';

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
};

export function Switch({ label, hint, className, id, ...props }: SwitchProps) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-center gap-3 select-none', className)}>
      <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border border-input bg-muted transition-colors",
          "peer-checked:bg-primary peer-checked:border-primary",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
          "after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform after:content-['']",
          "peer-checked:after:translate-x-5"
        )}
      />
      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium leading-none">{label}</span>}
          {hint && <span className="text-xs text-muted-foreground mt-1">{hint}</span>}
        </span>
      )}
    </label>
  );
}
