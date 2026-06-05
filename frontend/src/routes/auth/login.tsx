import { SignIn } from '@clerk/react';
import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const mode = getAuthMode();
  if (usesDemoAuthProvider(mode)) {
    return <MockLoginView mode={mode} />;
  }
  return <ClerkSignInView />;
}

function MockLoginView({ mode }: { mode: 'mock' | 'public' }) {
  const { isSignedIn, signIn } = usePortalAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [isSignedIn, navigate]);

  const badge = mode === 'public' ? 'Preview' : 'Demo mode';
  const blurb =
    mode === 'public'
      ? 'This deployment has no Clerk or real accounts. Continue only for UI preview.'
      : 'This is a local prototype only. No real credentials or Clerk session.';

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="border-b border-brand-grey px-6 py-4">
        <Link to="/" className="text-sm text-brand-dark/70 hover:text-brand-indigo transition-colors">
          Back to home
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-indigo mb-3">{badge}</p>
            <h1 className="font-serif text-2xl font-bold text-brand-dark mb-2">Sign in</h1>
            <p className="text-sm text-brand-dark/70">{blurb}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border border-brand-grey bg-white/80 p-8 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-brand-dark mb-2">Course 1 (Free)</h2>
              <p className="text-sm text-brand-dark/70 mb-6">
                Free resources for signed-in users. PDFs live under{' '}
                <span className="font-mono">course-1/pdf/</span> in the{' '}
                <span className="font-mono">resources-public</span> bucket.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => void signIn('free')}
              >
                Continue (Free)
              </Button>
            </Card>

            <Card className="rounded-2xl border border-brand-grey bg-white/80 p-8 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-brand-dark mb-2">Course 2 (Paid)</h2>
              <p className="text-sm text-brand-dark/70 mb-6">
                Premium resources. PDFs live under{' '}
                <span className="font-mono">course-2/pdf/</span> in the{' '}
                <span className="font-mono">resources-paid</span> bucket.
              </p>
              <Button
                type="button"
                className="w-full h-11"
                onClick={() => void signIn('paid')}
              >
                Continue (Paid)
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClerkSignInView() {
  const { isLoaded, isSignedIn } = usePortalAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center text-brand-dark/70">
        Loading…
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="border-b border-brand-grey px-6 py-4">
        <Link to="/" className="text-sm text-brand-dark/70 hover:text-brand-indigo transition-colors">
          Back to home
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/auth/sign-up"
        />
      </div>
    </div>
  );
}
