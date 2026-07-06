import { createFileRoute } from '@tanstack/react-router';
import { usePortalAuth } from '@/auth/auth-context';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const { user } = usePortalAuth();
  const first =
    user?.firstName?.trim() ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'there';
  const wave = String.fromCodePoint(0x1f44b);

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Welcome Back, {first} {wave}
        </h1>
      </div>
    </main>
  );
}
