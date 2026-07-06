import { Link } from '@tanstack/react-router';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TTA_SHOP_URL } from '@/lib/tta-shop';

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
              Purchase the full course to unlock every module, video, and downloadable resource.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={TTA_SHOP_URL} target="_blank" rel="noopener noreferrer">
                Purchase Access
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/settings" hash="course-access">
                Already purchased? Redeem code
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
