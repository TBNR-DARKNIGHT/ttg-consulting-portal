import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResourceLoadingState({
  label = 'Loading resources…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-5 shrink-0 animate-spin text-brand-indigo" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
