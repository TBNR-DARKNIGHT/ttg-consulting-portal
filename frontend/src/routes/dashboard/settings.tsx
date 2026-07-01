import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEntitlements, useRedeemAccessCode } from '@/hooks/use-entitlements';
import { TTA_SHOP_URL } from '@/lib/tta-shop';

export const Route = createFileRoute('/dashboard/settings')({
  component: DashboardSettingsPage,
});

function DashboardSettingsPage() {
  const { user } = usePortalAuth();
  const { courses, hasCourseAccess, isLoading } = useEntitlements();
  const redeem = useRedeemAccessCode();
  const [code, setCode] = useState('');
  const demoMode = usesDemoAuthProvider(getAuthMode());

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = code.trim();
    if (!value) return;

    redeem.mutate(value, {
      onSuccess: ({ courseId }) => {
        setCode('');
        toast.success(`${courseId === 'course-2' ? 'Course 2' : courseId} unlocked`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Unable to redeem access code');
      },
    });
  };

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Account Settings
        </h1>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Details from your signed-in account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-foreground">Email: </span>
              <span className="text-muted-foreground">{user?.email ?? '—'}</span>
            </p>
          </CardContent>
        </Card>

        <Card id="course-access" className="scroll-mt-6 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Course Access</CardTitle>
            <CardDescription>
              Course 1 is included with every account. Redeem the single-use code supplied after
              purchase to unlock Course 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="text-sm">
              <span className="font-medium text-foreground">Available courses: </span>
              <span className="text-muted-foreground">
                {isLoading
                  ? 'Loading…'
                  : courses
                      .map((courseId) =>
                        courseId === 'course-1'
                          ? 'Course 1'
                          : courseId === 'course-2'
                            ? 'Course 2'
                            : courseId,
                      )
                      .join(', ')}
              </span>
            </div>

            {hasCourseAccess('course-2') ? (
              <p className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                Course 2 is unlocked for this account.
              </p>
            ) : (
              <form className="space-y-3" onSubmit={submitCode}>
                <div className="space-y-1.5">
                  <label htmlFor="access-code" className="text-sm font-medium text-foreground">
                    Redeem Access Code:
                  </label>
                  <Input
                    id="access-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="TTA-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={redeem.isPending || demoMode}
                  />
                </div>

                {redeem.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {redeem.error instanceof Error
                      ? redeem.error.message
                      : 'Unable to redeem access code'}
                  </p>
                )}

                {demoMode && (
                  <p className="text-sm text-muted-foreground">
                    Code redemption is unavailable in preview mode.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!code.trim() || redeem.isPending || demoMode}
                  >
                    {redeem.isPending ? 'Redeeming…' : 'Redeem Code'}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={TTA_SHOP_URL} target="_blank" rel="noopener noreferrer">
                      Purchase Access
                    </a>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
