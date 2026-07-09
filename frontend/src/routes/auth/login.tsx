import { SignIn } from '@clerk/react';
import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { BarChart3, BookOpen, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
        <div className="w-full max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-indigo mb-3">{badge}</p>
            <h1 className="font-serif text-2xl font-bold text-brand-dark mb-2">Sign In</h1>
            <p className="text-sm text-brand-dark/70">{blurb}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <DemoPersonaCard
              icon={BookOpen}
              title="Free User"
              description="Preview the default parent experience with Course 1 resources only."
              buttonLabel="Continue as Free"
              variant="outline"
              onSelect={() => void signIn('free')}
            />
            <DemoPersonaCard
              icon={Crown}
              title="Paid User"
              description="Preview a parent account with Course 1 and Course 2 unlocked."
              buttonLabel="Continue as Paid"
              onSelect={() => void signIn('paid')}
            />
            <DemoPersonaCard
              icon={BarChart3}
              title="Admin User"
              description="Preview admin tools, access-code management, uploads, and analytics."
              buttonLabel="Continue as Admin"
              onSelect={() => void signIn('admin')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoPersonaCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  variant = 'default',
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  variant?: 'default' | 'outline';
  onSelect: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-brand-grey bg-white/80 p-6 shadow-sm">
      <div className="mb-4 grid size-10 place-items-center rounded-full bg-brand-indigo/10 text-brand-indigo">
        <Icon className="size-5" aria-hidden />
      </div>
      <h2 className="font-serif text-xl font-bold text-brand-dark mb-2">{title}</h2>
      <p className="text-sm text-brand-dark/70 mb-6">{description}</p>
      <Button type="button" variant={variant} className="h-11 w-full" onClick={onSelect}>
        {buttonLabel}
      </Button>
    </Card>
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
    return <Navigate to="/auth/complete" replace />;
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
          fallbackRedirectUrl="/auth/complete"
          signUpUrl="/auth/sign-up"
        />
      </div>
    </div>
  );
}
