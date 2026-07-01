import { Link } from '@tanstack/react-router';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LockedCourseAccess({ title = 'Unlock Course 2' }: { title?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-brand-indigo/10 p-2 text-brand-indigo">
          <LockKeyhole className="size-5" aria-hidden />
        </div>
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Redeem the single-use code supplied with your purchase to access these materials.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard/settings" hash="course-access">
              Redeem Access Code
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
