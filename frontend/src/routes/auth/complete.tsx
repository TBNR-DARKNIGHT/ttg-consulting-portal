import { createFileRoute, Navigate } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';
import { useCurrentUser } from '@/hooks/use-current-user';

export const Route = createFileRoute('/auth/complete')({
  component: CompleteSignInPage,
});

function CompleteSignInPage() {
  const { isLoaded, isSignedIn } = usePortalAuth();
  const currentUser = useCurrentUser();

  if (!isLoaded || (isSignedIn && currentUser.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-muted-foreground">
        Preparing your account…
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/auth/login" replace />;
  if (currentUser.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <div>
          <p className="font-medium text-foreground">We couldn’t load your account.</p>
          <button
            className="mt-3 text-sm text-brand-indigo underline"
            onClick={() => void currentUser.refetch()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  return <Navigate to={currentUser.data?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
}

