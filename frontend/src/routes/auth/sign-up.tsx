import { SignUp } from '@clerk/react';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  if (usesDemoAuthProvider(getAuthMode())) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="border-b border-brand-grey px-6 py-4">
        <Link to="/" className="text-sm text-brand-dark/70 hover:text-brand-indigo transition-colors">
          Back to home
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <SignUp
          routing="hash"
          fallbackRedirectUrl="/auth/complete"
          signInUrl="/auth/login"
        />
      </div>
    </div>
  );
}
